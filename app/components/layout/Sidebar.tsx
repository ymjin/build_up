'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Settings, LogOut, HardDrive } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { StorageSettingsModal } from '@/components/admin/StorageSettingsModal'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase])

  async function handleLogout() {
    try {
      // 1. 서버 사이드 로그아웃 호출 (토큰 삭제 및 세션 종료)
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // 2. 로그인 페이지로 이동 및 리프레시
      router.push('/auth/login')
      router.refresh()
    } catch (err) {
      console.error('Logout failed:', err)
      // 실패하더라도 클라이언트 세션은 날려줌
      await supabase.auth.signOut()
      router.push('/auth/login')
    }
  }

  const isAdmin = user?.user_metadata?.is_admin === true || user?.email === 'test@example.com' || user?.email === 'aira@aira.kr'

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
    { href: '/projects', icon: FolderKanban, label: '프로젝트' },
  ]
  
  const adminItems = [
    { href: '/admin/settings', icon: Settings, label: '시스템 설정' },
  ]

  return (
    <aside className="w-64 h-screen bg-white/60 glass border-r border-white/30 flex flex-col">
      {/* 로고 */}
      <div className="p-6 flex items-center gap-3 border-b border-white/30 flex-shrink-0">
        <Image src="/design/build_up_icon.png" alt="빌드업" width={36} height={36} />
        <div>
          <h1 className="text-base font-black uppercase italic tracking-tight text-orange-text leading-none">빌드업</h1>
          <span className="text-[9px] font-black opacity-30 uppercase tracking-[0.3em]">Build-Up</span>
        </div>
      </div>

      {/* 스크롤 가능한 네비게이션 영역 */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all',
                active
                  ? 'bg-gradient-to-r from-orange-primary to-orange-secondary text-white shadow-lg shadow-orange-primary/20'
                  : 'text-orange-text/60 hover:bg-white/50 hover:text-orange-text'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* 하단 고정 영역: 시스템 설정 + 로그아웃 */}
      <div className="p-4 border-t border-white/30 space-y-1 flex-shrink-0">
        {isAdmin && adminItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all',
                active
                  ? 'bg-orange-primary text-white shadow-lg shadow-orange-primary/20'
                  : 'text-orange-text/60 hover:bg-white/50 hover:text-orange-text border border-transparent hover:border-white/50'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-orange-text/50 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut size={18} />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
