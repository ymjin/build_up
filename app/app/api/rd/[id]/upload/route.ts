import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { naverDrive } from '@/lib/naver-drive'

/**
 * POST /api/rd/[id]/upload
 * R&D 사업 문서 파일 업로드
 *
 * FormData 필드:
 *   file         - 업로드할 파일 (binary)
 *   categoryId   - rd_document_categories.id (DB UUID)
 *   categoryName - 카테고리명 (= Naver Drive 폴더명)
 *   projectName  - R&D 사업명 (첫 폴더 생성 시 사용)
 *
 * 흐름:
 *   1. rd_drive_folders에서 프로젝트 Drive 폴더 ID 조회
 *   2. 없으면 생성 → rd_drive_folders에 저장
 *   3. rd_document_categories에서 카테고리 Drive 폴더 ID 조회
 *   4. 없으면 생성 → rd_document_categories 업데이트
 *   5. 파일 업로드
 *   6. rd_document_files에 메타데이터 저장
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rdProjectId } = await params

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const categoryId = formData.get('categoryId') as string
    const categoryName = formData.get('categoryName') as string
    const projectName = formData.get('projectName') as string

    if (!file || !categoryId || !categoryName || !projectName) {
      return NextResponse.json(
        { error: 'file, categoryId, categoryName, projectName 은 필수입니다' },
        { status: 400 }
      )
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── 시스템 설정(공유드라이브 ID, 루트 폴더 ID) 로드 ──────────
    const { data: settingsRows } = await admin
      .from('system_settings')
      .select('key, value')

    const settings = (settingsRows ?? []).reduce((acc: Record<string, string>, row: any) => {
      acc[row.key] = row.value
      return acc
    }, {})

    const sharedDriveId: string = settings.drive_shared_drive_id || process.env.NAVER_WORKS_SHARED_DRIVE_ID || ''
    const rootFolderId: string = settings.drive_root_folder_id || process.env.NAVER_WORKS_ROOT_FOLDER_ID || ''

    if (!rootFolderId || !sharedDriveId) {
      return NextResponse.json(
        { error: '스토리지 루트 폴더가 설정되지 않았습니다.\n시스템 설정 > 스토리지에서 업로드 기본 폴더를 지정해주세요.' },
        { status: 400 }
      )
    }

    const driveType = sharedDriveId === 'personal' ? 'personal' : 'shared'
    const driveId = sharedDriveId === 'personal' ? undefined : sharedDriveId

    // ── 1. 프로젝트 Drive 폴더 ID 조회 (DB 캐시) ─────────────────
    let projectFolderId: string

    const { data: cached } = await admin
      .from('rd_drive_folders')
      .select('drive_folder_id')
      .eq('rd_project_id', rdProjectId)
      .single()

    if (cached?.drive_folder_id) {
      // DB에 저장된 폴더 ID 사용 → 폴더 생성 시도 없음 (409 원천 차단)
      projectFolderId = cached.drive_folder_id
      console.log(`[upload] 프로젝트 폴더 ID DB에서 로드: ${projectFolderId}`)
    } else {
      // 처음 업로드: 폴더 생성 후 DB 저장
      console.log(`[upload] 사업 폴더 생성: "${projectName}" in root=${rootFolderId}`)
      projectFolderId = await naverDrive.createFolder(
        user.id, projectName, rootFolderId, driveType, driveId
      )
      await admin.from('rd_drive_folders').insert({
        rd_project_id: rdProjectId,
        drive_folder_id: projectFolderId,
        drive_shared_drive_id: sharedDriveId,
      })
      console.log(`[upload] 사업 폴더 DB 저장 완료: ${projectFolderId}`)
    }

    // ── 2. 카테고리 Drive 폴더 ID 조회 (DB) ──────────────────────
    const { data: catRow } = await admin
      .from('rd_document_categories')
      .select('drive_folder_id')
      .eq('id', categoryId)
      .single()

    let categoryFolderId: string

    if (catRow?.drive_folder_id) {
      // DB에 저장된 카테고리 폴더 ID 사용
      categoryFolderId = catRow.drive_folder_id
      console.log(`[upload] 카테고리 폴더 ID DB에서 로드: ${categoryFolderId}`)
    } else {
      // 처음 업로드: 카테고리 폴더 생성 후 DB 업데이트
      console.log(`[upload] 카테고리 폴더 생성: "${categoryName}" in project=${projectFolderId}`)
      categoryFolderId = await naverDrive.createFolder(
        user.id, categoryName, projectFolderId, driveType, driveId
      )
      await admin
        .from('rd_document_categories')
        .update({
          drive_folder_id: categoryFolderId,
          drive_shared_drive_id: sharedDriveId,
        })
        .eq('id', categoryId)
      console.log(`[upload] 카테고리 폴더 DB 저장 완료: ${categoryFolderId}`)
    }

    // ── 3. 파일 업로드 ────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log(`[upload] 파일 업로드: "${file.name}" (${file.size} bytes) → folder=${categoryFolderId}`)

    const driveFileId = await naverDrive.uploadFile(
      user.id, buffer, file.name, categoryFolderId, driveType, driveId
    )

    // ── 4. 파일 메타데이터 DB 저장 ────────────────────────────────
    const { data: newFile, error: insertErr } = await admin
      .from('rd_document_files')
      .insert({
        category_id: categoryId,
        rd_project_id: rdProjectId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        drive_file_id: driveFileId,
        drive_shared_drive_id: sharedDriveId,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[upload] 파일 메타데이터 저장 실패:', insertErr)
    }

    return NextResponse.json({
      success: true,
      file: newFile,
    })
  } catch (err: any) {
    console.error('[upload] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
