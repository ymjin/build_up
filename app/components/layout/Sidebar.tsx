'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Settings, LogOut, FlaskConical, ChevronLeft, ChevronRight, Mail } from 'lucide-react'
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
  // 접기/펼치기 상태 (localStorage로 유지)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
    // 저장된 상태 불러오기
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [supabase])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  async function handleLogout() {
    try {
      // API가 /auth/login으로 리다이렉트 응답을 주므로 window.location으로 따라감
      const res = await fetch('/api/auth/logout', { method: 'POST', redirect: 'follow' })
      window.location.href = res.url || '/auth/login'
    } catch (err) {
      console.error('Logout failed:', err)
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
    }
  }

  // 관리자 계정: aira@aira.kr 만 허용
  const isAdmin = user?.email === 'aira@aira.kr'

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
    { href: '/projects', icon: FolderKanban, label: '프로젝트' },
    { href: '/rd', icon: FlaskConical, label: 'R&D 사업' },
  ]

  const adminItems = [
    { href: '/admin/settings', icon: Settings, label: '시스템 설정' },
    { href: '/settings/email', icon: Mail, label: '이메일 설정' },
  ]

  return (
    <aside
      className={cn(
        'h-screen bg-white/60 glass border-r border-white/30 flex flex-col transition-all duration-300 relative flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* 로고 */}
      <div className={cn(
        'flex items-center border-b border-white/30 flex-shrink-0 overflow-hidden transition-all duration-300',
        collapsed ? 'p-4 justify-center' : 'p-6 gap-3'
      )}>
        <Image src="/design/build_up_icon.png" alt="빌드업" width={36} height={36} className="flex-shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-black uppercase italic tracking-tight text-orange-text leading-none whitespace-nowrap">빌드업</h1>
            <span className="text-[9px] font-black opacity-30 uppercase tracking-[0.3em]">Build-Up</span>
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center rounded-2xl text-sm font-bold transition-all',
                collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3',
                active
                  ? 'bg-gradient-to-r from-orange-primary to-orange-secondary text-white shadow-lg shadow-orange-primary/20'
                  : 'text-orange-text/60 hover:bg-white/50 hover:text-orange-text'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* 하단 고정 영역 */}
      <div className="p-3 border-t border-white/30 space-y-1 flex-shrink-0">
        {isAdmin && adminItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center rounded-2xl text-sm font-bold transition-all',
                collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3',
                active
                  ? 'bg-orange-primary text-white shadow-lg shadow-orange-primary/20'
                  : 'text-orange-text/60 hover:bg-white/50 hover:text-orange-text border border-transparent hover:border-white/50'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}

        <button
          onClick={handleLogout}
          title={collapsed ? '로그아웃' : undefined}
          className={cn(
            'w-full flex items-center rounded-2xl text-sm font-bold text-orange-text/50 hover:bg-red-50 hover:text-red-500 transition-all',
            collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>로그아웃</span>}
        </button>
      </div>

      {/* 접기/펼치기 버튼 */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-white/50 rounded-full shadow-md flex items-center justify-center text-orange-text/50 hover:text-orange-primary hover:shadow-lg transition-all z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
