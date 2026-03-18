import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { naverDrive } from '@/lib/naver-drive'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const projectId = formData.get('projectId') as string
    const files = formData.getAll('files') as File[]

    if (!projectId || files.length === 0) {
      return NextResponse.json({ error: 'Missing projectId or files' }, { status: 400 })
    }

    // 1. 프로젝트 정보 및 드라이브 폴더 확인
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('name, drive_folder_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      throw new Error('Project not found')
    }

    // 2. 시스템 설정에서 글로벌 루트 및 공용폴더 ID 가져오기
    const { data: settingsData } = await supabase.from('system_settings').select('key, value')
    const settings = (settingsData || []).reduce((acc: any, item: any) => {
      acc[item.key] = item.value
      return acc
    }, {})

    let folderId = project.drive_folder_id
    const sharedDriveId = settings.drive_shared_drive_id || process.env.NAVER_WORKS_SHARED_DRIVE_ID
    const rootFolderId = settings.drive_root_folder_id || process.env.NAVER_WORKS_ROOT_FOLDER_ID || 'root'

    // 3. 드라이브 폴더가 없으면 생성
    if (!folderId) {
      folderId = await naverDrive.createFolder(
        user.id, 
        `Project_${project.name}_${projectId.slice(0, 8)}`,
        rootFolderId,
        'shared',
        sharedDriveId
      )
      await supabase
        .from('projects')
        .update({ drive_folder_id: folderId })
        .eq('id', projectId)
    }

    // 4. 파일 순차 업로드
    const attachments = []
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const fileId = await naverDrive.uploadFile(
        user.id, 
        buffer, 
        file.name, 
        folderId,
        'shared',
        sharedDriveId
      )

      // 4. DB에 첨부 파일 기록
      const { data: attachment, error: attachError } = await supabase
        .from('project_attachments')
        .insert({
          project_id: projectId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_id: fileId
        })
        .select()
        .single()

      if (!attachError) {
        attachments.push(attachment)
      }
    }

    return NextResponse.json({ success: true, attachments })
  } catch (err: any) {
    console.error('Upload API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
