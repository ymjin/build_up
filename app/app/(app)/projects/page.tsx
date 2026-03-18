'use client'

import { useState } from 'react'
import { useProjects, useDeleteProject } from '@/lib/queries'
import { DEV_STATUS_COLORS, PROJECT_STATUS_LABELS, DEV_TYPE_LABELS, calcDday, formatShortDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Trash2, Search, Calendar, User, Building2 } from 'lucide-react'
import type { ProjectStatus } from '@/types'

// 개발 프로젝트 상태 필터 옵션
const STATUS_OPTIONS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: '전체', value: 'all' },
  { label: '계약협의', value: 'contract_pending' },
  { label: '진행중', value: 'in_progress' },
  { label: '검수', value: 'review' },
  { label: '운영중', value: 'operating' },
  { label: '완료', value: 'completed' },
  { label: '보류', value: 'on_hold' },
]

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const deleteProject = useDeleteProject()
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 개발 프로젝트만 필터링
  const filtered = projects?.filter(p => {
    if (p.category !== 'development') return false
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-orange-text">개발 프로젝트</h1>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">Development Project Management</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-primary to-orange-secondary text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-primary/20 hover:scale-105 transition-transform"
        >
          <Plus size={16} />
          새 프로젝트
        </Link>
      </div>

      {/* 검색 + 상태 필터 */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-text/30" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="프로젝트명, 클라이언트 검색..."
            className="w-full pl-12 pr-4 py-3 bg-white/50 glass rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/20 transition-all"
          />
        </div>
        <div className="flex gap-1 p-1 bg-white/30 glass rounded-2xl overflow-x-auto scrollbar-hide">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                statusFilter === opt.value
                  ? 'bg-orange-primary text-white shadow-md'
                  : 'text-orange-text/40 hover:text-orange-text/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 프로젝트 목록 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-56 bg-white/30 glass rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-24 text-orange-text/40">
          <div className="text-5xl mb-4">💻</div>
          <p className="font-black text-lg">개발 프로젝트가 없습니다</p>
          <Link href="/projects/new" className="text-orange-secondary font-black text-sm mt-3 inline-block hover:underline">
            새 프로젝트 만들기 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered?.map(project => {
            const statusLabel = PROJECT_STATUS_LABELS.development[project.status] ?? project.status
            const statusColor = DEV_STATUS_COLORS[project.status] ?? 'bg-slate-100 text-slate-600'

            return (
              <div key={project.id} className="group p-6 bg-white/50 glass rounded-3xl hover:shadow-lg transition-all relative">
                {/* 삭제 버튼 */}
                <button
                  onClick={() => {
                    if (confirm(`"${project.name}" 프로젝트를 삭제할까요?`)) {
                      deleteProject.mutate(project.id)
                    }
                  }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all text-orange-text/30"
                >
                  <Trash2 size={14} />
                </button>

                <Link href={`/projects/${project.id}`} className="block">
                  {/* 상태 + 유형 뱃지 */}
                  <div className="flex flex-wrap gap-2 mb-3 pr-8">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${statusColor}`}>
                      {statusLabel}
                    </span>
                    {project.dev_type && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-100 text-purple-600">
                        {DEV_TYPE_LABELS[project.dev_type]}
                      </span>
                    )}
                  </div>

                  {/* 프로젝트명 */}
                  <h3 className="font-black text-orange-text text-lg leading-tight mb-1 line-clamp-1">
                    {project.name}
                  </h3>

                  {/* 클라이언트 */}
                  {project.client_name && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-text/50 mb-3">
                      <Building2 size={11} />
                      {project.client_name}
                    </div>
                  )}

                  {/* 진행률 바 */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-black opacity-40 uppercase tracking-widest mb-1.5">
                      <span>진행률</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-primary to-orange-secondary rounded-full transition-all duration-1000"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 하단 메타 정보 */}
                  <div className="flex items-center justify-between text-[10px] font-black opacity-40 uppercase">
                    <div className="flex items-center gap-3">
                      {project.pm_name && (
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          {project.pm_name}
                        </span>
                      )}
                    </div>
                    {project.deadline && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${
                        calcDday(project.deadline).startsWith('D+')
                          ? 'bg-red-50 text-red-500'
                          : calcDday(project.deadline) === 'D-Day'
                          ? 'bg-orange-50 text-orange-500'
                          : 'bg-slate-50 text-slate-500'
                      }`}>
                        <Calendar size={10} />
                        {calcDday(project.deadline)}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
