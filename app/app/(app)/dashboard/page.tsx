'use client'

import { useState, useEffect } from 'react'
import { useProjects } from '@/lib/queries'
import { STATUS_COLORS, PROJECT_STATUS_LABELS, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { Plus, TrendingUp, Users, CheckSquare, Activity } from 'lucide-react'

export default function DashboardPage() {
  const { data: projects, isLoading } = useProjects()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const totalProjects = projects?.length ?? 0
  const totalProgress = projects
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / Math.max(projects.length, 1))
    : 0
  const completedProjects = projects?.filter(p => p.status === 'completed').length ?? 0
  const activeProjects = projects?.filter(p => p.status !== 'completed').length ?? 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-orange-text">대시보드</h1>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">Build-Up Dashboard</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-primary to-orange-secondary text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-primary/20 hover:scale-105 transition-transform"
        >
          <Plus size={16} />
          새 프로젝트
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          { label: '전체 진행률', value: `${totalProgress}%`, icon: TrendingUp, color: 'text-orange-primary' },
          { label: '총 프로젝트', value: totalProjects, icon: CheckSquare, color: 'text-blue-primary' },
          { label: '진행 중', value: activeProjects, icon: Activity, color: 'text-yellow-500' },
          { label: '완료', value: completedProjects, icon: CheckSquare, color: 'text-green-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-6 bg-white/50 glass rounded-3xl">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-black opacity-40 uppercase tracking-widest">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <div className="text-3xl font-black text-orange-text">{value}</div>
          </div>
        ))}
      </div>

      {/* Global Build Score */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-12 lg:col-span-4 p-8 bg-white/50 glass rounded-3xl">
          <h2 className="text-sm font-black uppercase tracking-widest opacity-50 mb-6">글로벌 빌드 점수</h2>
          <div className="text-center">
            <div className="text-7xl font-black text-orange-primary italic mb-2">{totalProgress}</div>
            <div className="text-xs font-black opacity-30 uppercase tracking-widest mb-6">통합 등급</div>
            <div className="h-3 bg-orange-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-primary to-orange-secondary rounded-full transition-all duration-1000"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="col-span-12 lg:col-span-8 p-8 bg-white/50 glass rounded-3xl">
          <h2 className="text-sm font-black uppercase tracking-widest opacity-50 mb-6">활동 히트맵</h2>
          <div className="grid grid-cols-26 gap-1" style={{ gridTemplateColumns: 'repeat(26, 1fr)' }}>
            {Array.from({ length: 182 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-sm transition-all hover:scale-125 cursor-help"
                style={{ 
                  backgroundColor: mounted 
                    ? `rgba(251, 146, 60, ${Math.random() * 0.85 + 0.05})` 
                    : `rgba(251, 146, 60, 0.1)` 
                }}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-between text-[9px] font-black opacity-30 uppercase tracking-widest">
            <span>활동 낮음</span>
            <span>활동 높음</span>
          </div>
        </div>
      </div>

      {/* Project Grid */}
      <div>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-black uppercase tracking-tight text-orange-text">프로젝트 (Project Grid)</h2>
          <Link href="/projects" className="text-xs font-black text-orange-secondary uppercase tracking-widest hover:underline">
            전체 보기 →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-white/30 glass rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : projects?.length === 0 ? (
          <div className="text-center py-16 text-orange-text/40">
            <div className="text-4xl mb-4">📋</div>
            <p className="font-bold">아직 프로젝트가 없습니다</p>
            <Link href="/projects/new" className="text-orange-secondary font-black text-sm mt-2 inline-block hover:underline">
              첫 프로젝트 만들기 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects?.slice(0, 6).map(project => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="p-6 bg-white/50 glass rounded-3xl hover:scale-[1.02] transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-black text-orange-text group-hover:text-orange-secondary transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${STATUS_COLORS[project.status]}`}>
                    {PROJECT_STATUS_LABELS[project.category][project.status]}
                  </span>
                </div>
                <p className="text-xs font-bold opacity-50 line-clamp-2 mb-4">{project.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black opacity-40 uppercase">
                    <span>진행률</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-primary to-orange-secondary rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 text-[10px] font-black opacity-40">
                  <span className="flex items-center gap-1">
                    <Users size={10} />
                    {(project.member_count as unknown as { count: number }[])?.[0]?.count ?? 0}명
                  </span>
                  <span>{formatRelativeTime(project.updated_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
