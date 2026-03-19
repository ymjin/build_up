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

  // 3. 쿠키 강제 삭제 후 로그인 페이지로 리다이렉트
  const response = NextResponse.redirect(
    new URL('/auth/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    { status: 302 }
  )

  // Supabase 세션 쿠키 삭제
  const cookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
  ]
  cookieNames.forEach(name => {
    response.cookies.set(name, '', { maxAge: 0, path: '/' })
  })

  return response
}
