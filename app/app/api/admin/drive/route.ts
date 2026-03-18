import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { naverDrive } from '@/lib/naver-drive'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 테스트 이메일 또는 관리자 권한 체크
  if (!user?.user_metadata?.is_admin && user?.email !== 'test@example.com' && user?.email !== 'aira@aira.kr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') // 'drives' or 'folders'
  const sharedDriveId = searchParams.get('sharedDriveId')
  const parentId = searchParams.get('parentId') || 'root'

  try {
    if (mode === 'drives') {
      const drives = await naverDrive.listSharedDrives(user.id)
      return NextResponse.json(drives)
    }

    if (mode === 'folders' && sharedDriveId) {
      const folders = await naverDrive.listFolders(user.id, sharedDriveId, parentId)
      return NextResponse.json(folders)
    }

    if (mode === 'fileInfo' && (sharedDriveId || searchParams.get('driveType') === 'personal')) {
      const fileId = searchParams.get('fileId')
      if (!fileId) throw new Error('File ID is required')
      const driveType = (searchParams.get('driveType') || (sharedDriveId === 'personal' ? 'personal' : 'shared')) as 'personal' | 'shared'
      const info = await naverDrive.getFileInfo(user.id, fileId, driveType, sharedDriveId || undefined)
      return NextResponse.json(info)
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.user_metadata?.is_admin && user?.email !== 'test@example.com' && user?.email !== 'aira@aira.kr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { sharedDriveId, parentId, folderName } = await request.json()
    if (!sharedDriveId || !folderName) {
      throw new Error('Missing parameters')
    }

    const driveType = sharedDriveId === 'personal' ? 'personal' : 'shared'
    console.log(`API [POST /drive]: Creating folder '${folderName}' in ${driveType} drive (${sharedDriveId}), parent: ${parentId}`)

    const fileId = await naverDrive.createFolder(
      user.id,
      folderName,
      parentId || 'root',
      driveType,
      sharedDriveId === 'personal' ? undefined : sharedDriveId
    )

    return NextResponse.json({ fileId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
