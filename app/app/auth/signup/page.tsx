'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-orange-base flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center p-8 bg-white/60 glass rounded-[2.5rem]">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-xl font-black uppercase">이메일을 확인하세요</h2>
          <p className="text-sm font-bold opacity-50 mt-2">
            {email}로 인증 링크를 보냈습니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/design/build_up_icon.png" alt="빌드업" width={64} height={64} className="mx-auto mb-4" />
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-orange-text">빌드업</h1>
          <p className="text-sm font-bold opacity-40 uppercase tracking-widest mt-1">Build-Up Dashboard</p>
        </div>

        <form onSubmit={handleSignup} className="p-8 bg-white/60 glass rounded-[2.5rem] shadow-sm space-y-5">
          <h2 className="text-xl font-black uppercase tracking-tight text-orange-text mb-6">회원가입</h2>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              placeholder="6자 이상"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-primary to-orange-secondary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100"
          >
            {loading ? '처리 중...' : '계정 만들기'}
          </button>

          <p className="text-center text-xs font-bold opacity-50">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-orange-secondary hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
