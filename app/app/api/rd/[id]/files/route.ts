import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { naverDrive } from '@/lib/naver-drive'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * DELETE /api/rd/[id]/files?fileId=xxx
 * Drive 파일 삭제 + DB 메타데이터 삭제 (2안: 완전 삭제)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fileId = searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ error: 'fileId 필요' }, { status: 400 })

  const admin = getAdmin()

  // DB에서 Drive 파일 정보 조회
  const { data: fileRow, error: fetchErr } = await admin
    .from('rd_document_files')
    .select('drive_file_id, drive_shared_drive_id')
    .eq('id', fileId)
    .single()

  if (fetchErr || !fileRow) {
    return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 })
  }

  // Drive에서 실제 파일 삭제
  if (fileRow.drive_file_id) {
    const driveType = fileRow.drive_shared_drive_id === 'personal' ? 'personal' : 'shared'
    const sharedDriveId = driveType === 'shared' ? fileRow.drive_shared_drive_id : undefined

    try {
      await naverDrive.deleteFile(user.id, fileRow.drive_file_id, driveType, sharedDriveId)
    } catch (driveErr: any) {
      console.error('[files] Drive 파일 삭제 실패:', driveErr.message)
      // Drive 삭제 실패해도 DB 레코드는 삭제 진행 (파일이 이미 없을 수도 있음)
    }
  }

  // DB 메타데이터 삭제
  const { error: deleteErr } = await admin
    .from('rd_document_files')
    .delete()
    .eq('id', fileId)

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
