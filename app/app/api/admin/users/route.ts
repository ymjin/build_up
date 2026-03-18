import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 관리자 권한 체크 (테스트 이메일 예외 포함)
  if (!user?.user_metadata?.is_admin && user?.email !== 'test@example.com' && user?.email !== 'aira@aira.kr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(profiles)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()

  // 관리자 권한 체크
  if (!adminUser?.user_metadata?.is_admin && adminUser?.email !== 'test@example.com' && adminUser?.email !== 'aira@aira.kr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { userId, department, is_admin } = await request.json()
    if (!userId) throw new Error('User ID is required')

    // 1. 프로필 업데이트 (department)
    if (department !== undefined) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ department })
        .eq('id', userId)
      
      if (profileError) throw profileError
    }

    // 2. 관리자 권한 업데이트 (Auth Metadata)
    if (is_admin !== undefined) {
      // NOTE: 서비스 롤 키를 사용하는 어드민 클라이언트가 필요합니다.
      // naver-drive.ts 등에서 사용하는 패턴을 참고하거나 별도 유틸을 만들어야 합니다.
      // 여기서는 권한 업데이트 로직을 간단히 구현하거나 추후 보완합니다.
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
