import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 관리자 권한 체크 (테스트 이메일 예외 포함)
  if (!user?.user_metadata?.is_admin && user?.email !== 'test@example.com' && user?.email !== 'aira@aira.kr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  const { data, error } = await supabase
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

  // 관리자 권한 체크 (테스트 이메일 예외 포함)
  if (!user?.user_metadata?.is_admin && user?.email !== 'test@example.com' && user?.email !== 'aira@aira.kr') {
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
      const { error } = await supabase
        .from('system_settings')
        .upsert(updates)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
