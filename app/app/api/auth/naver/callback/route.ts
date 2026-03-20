import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
  const code = searchParams.get('code')
  const client_id = process.env.NEXT_PUBLIC_NAVER_WORKS_CLIENT_ID || process.env.NAVER_WORKS_CLIENT_ID
  const client_secret = process.env.NEXT_PUBLIC_NAVER_WORKS_CLIENT_SECRET || process.env.NAVER_WORKS_CLIENT_SECRET

  if (!code) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=no_code`)
  }

  try {
    console.log('--- Naver Callback Debug ---')
    console.log('Code received:', !!code)

    // 1. 네이버웍스 토큰 교환
    const tokenParams = new URLSearchParams({
      code,
      client_id: client_id!,
      client_secret: client_secret!,
      grant_type: 'authorization_code',
      redirect_uri: `${appUrl}/api/auth/naver/callback`
    })

    const tokenResponse = await fetch('https://auth.worksmobile.com/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams
    })

    console.log('Token response status:', tokenResponse.status)
    const responseText = await tokenResponse.text()
    
    let tokens: any
    try {
      tokens = JSON.parse(responseText)
      console.log('Token data keys:', Object.keys(tokens))
    } catch (e) {
      console.error('Failed to parse token response as JSON:', responseText.substring(0, 500))
      throw new Error(`Naver returned non-JSON response (Status ${tokenResponse.status}). Please check server logs.`)
    }
    
    if (tokens.error || (!tokens.id_token && !tokens.access_token)) {
      console.error('Token error object:', tokens)
      throw new Error(tokens.error_description || tokens.error || 'Failed to get tokens from Naver')
    }

    console.log('ID Token present:', !!tokens.id_token)
    console.log('Access Token present:', !!tokens.access_token)

    // 2. 사용자 정보 가져오기 (ID Token 또는 Profile API)
    let userEmail: string = ''
    let fullName: string = ''
    let avatarUrl: string = ''
    let isAdmin: boolean = false

    if (tokens.id_token) {
      const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64').toString())
      userEmail = payload.email
      fullName = payload.name || payload.nickname || userEmail.split('@')[0]
      avatarUrl = payload.picture
      // ID Token에는 domainAdmin 정보가 없을 수 있으므로 Profile API 호출 보강 권장
    }
    
    // 무조건 프로필 API를 호출하여 최신 권한 정보를 가져옵니다
    const profileRes = await fetch('https://www.worksapis.com/v1.0/users/me', {
      headers: { 
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json'
      }
    })
    
    if (profileRes.ok) {
      const profile = await profileRes.json()
      console.log('Profile Data Keys:', Object.keys(profile))
      console.log('Profile Domain Admin Info:', { 
        domainAdmin: profile.domainAdmin, 
        isDomainAdmin: profile.isDomainAdmin,
        levelId: profile.levelId
      })
      
      userEmail = profile.email || userEmail
      fullName = profile.userName || profile.name || fullName
      avatarUrl = profile.profileImage || profile.avatarUrl || avatarUrl
      
      // 여러 필드명을 체크하여 관리자 여부 판단
      isAdmin = !!(profile.domainAdmin || profile.isDomainAdmin || profile.isDomainAdministrator)
    }
    
    // 환경 변수 기반 관리자 강제 지정 (Fallback)
    const adminEmails = (process.env.NAVER_WORKS_ADMIN_EMAILS || '').split(',').map(e => e.trim())
    if (userEmail && adminEmails.includes(userEmail)) {
      isAdmin = true
    }
    
    console.log('Authenticated user:', userEmail, 'Admin:', isAdmin)

    // 3. 수파베이스 어드민 클라이언트 생성
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 4. 유저 확인 및 생성
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      email_confirm: true,
      user_metadata: { 
        full_name: fullName, 
        avatar_url: avatarUrl,
        is_admin: isAdmin 
      },
      password: Math.random().toString(36).slice(-16)
    })

    // 이미 등록된 이메일인 경우 에러를 무시하고 다음 단계(인증 링크 생성)로 넘어갑니다.
    if (userError) {
      const isAlreadyRegistered = 
        userError.message.includes('already been registered') || 
        userError.message.includes('already registered') ||
        userError.status === 422;
        
      if (!isAlreadyRegistered) {
        console.error('Supabase User Creation Error:', userError)
        throw userError
      }
      console.log('User already exists, proceeding to generate login link.')
    }
    
    // 5. 로그인 세션 생성 (매직 링크 방식)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
      options: { redirectTo: `${appUrl}/dashboard` }
    })

    if (linkError) {
      console.error('Link generation error:', linkError)
      throw linkError
    }

    // 6. 네이버웍스 토큰 DB 저장 (유저 ID 획득 후)
    let identifiedUserId = userData?.user?.id
    
    console.log('Step 6: Identifying user for token storage...')

    if (!identifiedUserId) {
      console.log('User already exists, searching for existing user ID in Auth...')
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) {
        console.error('Failed to list users for identification:', listError)
      } else {
        identifiedUserId = users.find(u => u.email === userEmail)?.id
        console.log('Found ID in Auth.users:', identifiedUserId)
      }
    }
    
    if (identifiedUserId) {
      // 6.1 profiles 테이블에 유저가 있는지 확인 및 생성 (FK 제약 조건 해결)
      console.log('Ensuring profile exists for user_id:', identifiedUserId)
      const { error: profileUpsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: identifiedUserId,
          email: userEmail,
          full_name: fullName,
          avatar_url: avatarUrl
        })

      if (profileUpsertError) {
        console.error('Failed to upsert profile:', profileUpsertError)
      }

      // 6.2 토큰 저장
      if (tokens.access_token) {
        const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()
        
        console.log('Upserting tokens for user:', identifiedUserId)
        const { error: tokenSaveError } = await supabaseAdmin
          .from('naver_tokens')
          .upsert({
            user_id: identifiedUserId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })

        if (tokenSaveError) {
          console.error('CRITICAL: Failed to save Naver tokens:', tokenSaveError)
        } else {
          console.log('Naver tokens successfully saved/updated for user:', identifiedUserId)
        }
      }
    } else {
      console.warn('Could not identify user ID. Token save skipped.')
    }

    return NextResponse.redirect(linkData.properties.action_link)
  } catch (err: any) {
    console.error('Callback error:', err)
    return NextResponse.redirect(`${appUrl}/auth/login?error=${encodeURIComponent(err.message)}`)
  }
}
