import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** GET /api/rd/[id]/categories — 카테고리 목록 + 소속 파일 목록 반환 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rdProjectId } = await params
  const admin = getAdmin()

  // 카테고리 목록
  const { data: categories, error: catErr } = await admin
    .from('rd_document_categories')
    .select('*')
    .eq('rd_project_id', rdProjectId)
    .order('position', { ascending: true })

  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 })

  // 파일 목록
  const { data: files, error: fileErr } = await admin
    .from('rd_document_files')
    .select('*')
    .eq('rd_project_id', rdProjectId)
    .order('uploaded_at', { ascending: false })

  if (fileErr) return NextResponse.json({ error: fileErr.message }, { status: 500 })

  // 프로젝트 Drive 폴더 ID 조회
  const { data: driveFolder } = await admin
    .from('rd_drive_folders')
    .select('drive_folder_id, drive_shared_drive_id')
    .eq('rd_project_id', rdProjectId)
    .single()

  return NextResponse.json({
    categories: categories ?? [],
    files: files ?? [],
    projectDriveFolderId: driveFolder?.drive_folder_id ?? null,
    projectDriveSharedDriveId: driveFolder?.drive_shared_drive_id ?? null,
  })
}

/** POST /api/rd/[id]/categories — 새 카테고리 추가 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rdProjectId } = await params
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: '카테고리 이름을 입력하세요' }, { status: 400 })

  const admin = getAdmin()

  // 중복 이름 확인
  const { data: existing } = await admin
    .from('rd_document_categories')
    .select('id')
    .eq('rd_project_id', rdProjectId)
    .eq('name', name.trim())
    .single()

  if (existing) return NextResponse.json({ error: '같은 이름의 카테고리가 이미 있습니다' }, { status: 409 })

  // 현재 최대 position 조회
  const { data: lastCat } = await admin
    .from('rd_document_categories')
    .select('position')
    .eq('rd_project_id', rdProjectId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const { data: newCat, error } = await admin
    .from('rd_document_categories')
    .insert({
      rd_project_id: rdProjectId,
      name: name.trim(),
      position: (lastCat?.position ?? -1) + 1,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(newCat, { status: 201 })
}

/** DELETE /api/rd/[id]/categories?categoryId=xxx — 카테고리 + 소속 파일 삭제 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('categoryId')
  if (!categoryId) return NextResponse.json({ error: 'categoryId 필요' }, { status: 400 })

  const admin = getAdmin()
  // rd_document_files는 ON DELETE CASCADE로 자동 삭제됨
  const { error } = await admin
    .from('rd_document_categories')
    .delete()
    .eq('id', categoryId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
