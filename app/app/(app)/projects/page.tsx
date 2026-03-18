'use client'

import { useState } from 'react'
import { useProjects, useDeleteProject } from '@/lib/queries'
import { STATUS_COLORS, PROJECT_STATUS_LABELS, CONCLUSION_COLORS, CONCLUSION_LABELS, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Trash2, Users, CheckSquare, Search } from 'lucide-react'
import type { ProjectStatus, ProjectCategory, ProjectConclusion } from '@/types'

const CATEGORY_OPTIONS: { label: string; value: ProjectCategory }[] = [
  { label: 'R&D 과제', value: 'rnd' },
  { label: '개발 프로젝트', value: 'development' },
]

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const deleteProject = useDeleteProject()
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory>('rnd')
  const [conclusionFilter, setConclusionFilter] = useState<ProjectConclusion | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const statusOptions: { label: string; value: ProjectStatus | 'all' }[] = [
    { label: '전체', value: 'all' },
    ...Object.entries(PROJECT_STATUS_LABELS[categoryFilter]).map(([value, label]) => ({
      label,
      value: value as ProjectStatus,
    })),
  ]

  const filtered = projects?.filter(p => {
    const matchesStatus = filter === 'all' || p.status === filter
    const matchesCategory = p.category === categoryFilter
    
    // R&D 검토 단계인 경우 결론 필터 적용
    const matchesConclusion = 
      categoryFilter === 'rnd' && filter === 'planning' 
        ? (conclusionFilter === 'all' || p.conclusion === conclusionFilter)
        : true

    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    
    return matchesStatus && matchesCategory && matchesConclusion && matchesSearch
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-orange-text">프로젝트</h1>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">Project Management</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-primary to-orange-secondary text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-primary/20 hover:scale-105 transition-transform"
        >
          <Plus size={16} />
          새 프로젝트
        </Link>
      </div>

      <div className="space-y-6 mb-10">
        {/* Category Tabs */}
        <div className="flex border-b border-orange-primary/10">
          {CATEGORY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                setCategoryFilter(opt.value)
                setFilter('all') // 카테고리 변경 시 상태 필터 초기화
              }}
              className={`px-8 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${
                categoryFilter === opt.value
                  ? 'text-orange-primary'
                  : 'text-orange-text/30 hover:text-orange-text/50'
              }`}
            >
              {opt.label}
              {categoryFilter === opt.value && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-primary rounded-t-full shadow-[0_-4px_10px_rgba(251,146,60,0.3)]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-text/30" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`${categoryFilter === 'rnd' ? 'R&D 과제' : '개발 프로젝트'} 검색...`}
              className="w-full pl-12 pr-4 py-3 bg-white/50 glass rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/20 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-1 p-1 bg-white/30 glass rounded-2xl overflow-x-auto scrollbar-hide">
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setFilter(opt.value)
                  setConclusionFilter('all') // 상태 변경 시 결론 필터 초기화
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  filter === opt.value
                    ? 'bg-orange-primary text-white shadow-md'
                    : 'text-orange-text/40 hover:text-orange-text/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conclusion Sub-Filter (Only for R&D Planning) */}
        {categoryFilter === 'rnd' && filter === 'planning' && (
          <div className="flex items-center gap-3 p-4 bg-orange-50/50 rounded-2xl border border-orange-100 animate-in fade-in slide-in-from-top-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-text/40 mr-2">검토 결론</span>
            <div className="flex gap-2">
              {[
                { value: 'all', label: '전체' },
                { value: 'ongoing', label: '진행' },
                { value: 'pending', label: '보류' },
                { value: 'dropped', label: '중단' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setConclusionFilter(opt.value as ProjectConclusion | 'all')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    conclusionFilter === opt.value
                      ? 'bg-white text-orange-primary shadow-sm border border-orange-200'
                      : 'text-orange-text/40 hover:text-orange-text/60 hover:bg-white/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-white/30 glass rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-24 text-orange-text/40">
          <div className="text-5xl mb-4">📋</div>
          <p className="font-black text-lg">프로젝트가 없습니다</p>
          <Link href="/projects/new" className="text-orange-secondary font-black text-sm mt-3 inline-block hover:underline">
            새 프로젝트 만들기 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered?.map(project => (
            <div key={project.id} className="group p-6 bg-white/50 glass rounded-3xl hover:shadow-lg transition-all relative">
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
                <div className="flex items-start justify-between mb-3 pr-8">
                  <h3 className="font-black text-orange-text text-lg leading-tight line-clamp-1">
                    {project.name}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                    project.category === 'rnd' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {project.category === 'rnd' ? 'R&D 과제' : '개발'}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${STATUS_COLORS[project.status]}`}>
                    {PROJECT_STATUS_LABELS[project.category][project.status]}
                  </span>
                  {project.category === 'rnd' && project.status === 'planning' && project.conclusion && (
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${CONCLUSION_COLORS[project.conclusion]}`}>
                      {CONCLUSION_LABELS[project.conclusion]}
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold opacity-50 line-clamp-2 mb-4">{project.description}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black opacity-40 uppercase tracking-widest">
                    <span>진행률</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-primary to-orange-secondary rounded-full transition-all duration-1000"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 text-[10px] font-black opacity-40 uppercase">
                  <span className="flex items-center gap-1">
                    <Users size={10} />
                    {(project.member_count as unknown as { count: number }[])?.[0]?.count ?? 0}명
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckSquare size={10} />
                    {(project.task_count as unknown as { count: number }[])?.[0]?.count ?? 0}개
                  </span>
                  <span>{formatRelativeTime(project.updated_at)}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
