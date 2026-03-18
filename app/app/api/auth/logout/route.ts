import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // 1. 네이버웍스 토큰 정보 삭제
    await supabase
      .from('naver_tokens')
      .delete()
      .eq('user_id', user.id)

    // 2. 수파베이스 로그아웃
    await supabase.auth.signOut()
  }

  return NextResponse.json({ success: true })
}
