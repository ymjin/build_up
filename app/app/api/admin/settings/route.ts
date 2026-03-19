import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 관리자 권한 체크
  if (user?.email !== 'aira@aira.kr' && !user?.user_metadata?.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // RLS 우회: Service Role Key로 읽기
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await adminClient
    .from('system_settings')
    .select('*')

  if (error) {
    // 테이블이 없는 경우 빈 객체 반환 (에러 방지)
    if (error.code === 'PGRST116' || error.message.includes('not found')) {
      return NextResponse.json({})
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const settings = data?.reduce((acc: any, item: any) => {
    acc[item.key] = item.value
    return acc
  }, {}) || {}

  return NextResponse.json(settings)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 관리자 권한 체크
  if (user?.email !== 'aira@aira.kr' && !user?.user_metadata?.is_admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { drive_root_folder_id, drive_shared_drive_id } = body

    const updates = []
    if (drive_root_folder_id !== undefined) {
      updates.push({ key: 'drive_root_folder_id', value: drive_root_folder_id, updated_by: user!.id })
    }
    if (drive_shared_drive_id !== undefined) {
      updates.push({ key: 'drive_shared_drive_id', value: drive_shared_drive_id, updated_by: user!.id })
    }

    if (updates.length > 0) {
      // RLS 우회: 관리자 권한 체크는 위에서 완료했으므로 service role로 직접 write
      const adminClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { error } = await adminClient
        .from('system_settings')
        .upsert(updates, { onConflict: 'key' })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
