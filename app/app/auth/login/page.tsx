'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    const handleAuth = async () => {
      // 1. URL 해시에서 토큰 직접 추출 시도 (가장 확실한 방법)
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        setIsVerifying(true)
        console.log('Detecting tokens in URL hash...')
        
        try {
          // #을 제거하고 파라미터 파싱
          const params = new URLSearchParams(hash.substring(1))
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            })
            
            if (!error) {
              console.log('Session set successfully, redirecting...')
              window.location.href = '/dashboard'
              return
            }
            console.error('Error setting session:', error)
          }
        } catch (e) {
          console.error('Failed to parse hash params:', e)
        }
      }

      // 2. 기존 세션 확인
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        window.location.href = '/dashboard'
      }
    }
    
    handleAuth()

    // 3. 인증 상태 변화 감지 (실시간 대응)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, !!session)
      if (session) {
        setIsVerifying(true)
        window.location.href = '/dashboard'
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    <div className="min-h-screen bg-orange-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Image src="/design/build_up_icon.png" alt="빌드업" width={80} height={80} className="mx-auto mb-6 drop-shadow-xl" />
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-orange-text">빌드업</h1>
          <p className="text-sm font-bold opacity-40 uppercase tracking-[0.3em] mt-2">Build-Up Dashboard</p>
        </div>

        <div className="p-10 bg-white/60 glass rounded-[3rem] shadow-2xl border border-white/40 backdrop-blur-md">
          {isVerifying ? (
            <div className="text-center py-10">
              <div className="inline-block w-12 h-12 border-4 border-orange-primary/30 border-t-orange-primary rounded-full animate-spin mb-6"></div>
              <h2 className="text-lg font-black uppercase tracking-widest text-orange-text/60">인증 처리 중...</h2>
              <p className="text-xs font-bold text-orange-text/30 mt-2">잠시만 기다려주세요</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-lg font-black uppercase tracking-widest text-orange-text/60">환영합니다</h2>
                <div className="h-1 w-12 bg-orange-primary/30 mx-auto mt-4 rounded-full"></div>
              </div>
              
              <div className="space-y-6">
                <p className="text-center text-sm font-bold text-orange-text/40 leading-relaxed px-4">
                  본 시스템은 사내 보안 정책에 따라 <br/>
                  <span className="text-orange-text/80 font-black">네이버웍스(Naver Works)</span>를 통해서만 <br/>
                  접속이 가능합니다.
                </p>

                <a
                  href="/api/auth/naver/login"
                  className="group relative w-full py-4 bg-[#00C73C] hover:bg-[#00b336] text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_8px_20px_rgba(0,199,60,0.3)] hover:shadow-[0_12px_24px_rgba(0,199,60,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95"
                >
                  <span className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-[12px] text-[#00C73C] font-black group-hover:scale-110 transition-transform">N</span>
                  네이버웍스로 로그인
                </a>
              </div>
            </>
          )}

          <div className="mt-12 pt-8 border-t border-orange-text/5 text-center">
            <p className="text-[10px] font-bold text-orange-text/20 uppercase tracking-[0.2em]">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
