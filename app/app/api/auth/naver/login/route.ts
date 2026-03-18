import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const client_id = process.env.NAVER_WORKS_CLIENT_ID
  const redirect_uri = `${new URL(request.url).origin}/api/auth/naver/callback`
  const state = Math.random().toString(36).substring(7)
  
  // 네이버웍스 인증 URL 생성
  const authUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize')
  authUrl.searchParams.append('client_id', client_id!)
  authUrl.searchParams.append('redirect_uri', redirect_uri)
  authUrl.searchParams.append('scope', 'openid profile email directory file') 
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('state', state)
  authUrl.searchParams.append('prompt', 'login consent') // 로그인 및 권한 동의 창 강제 노출

  console.log('Redirecting to Naver Works:', authUrl.toString())

  return NextResponse.redirect(authUrl.toString())
}
