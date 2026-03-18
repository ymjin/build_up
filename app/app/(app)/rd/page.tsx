'use client'

import Link from 'next/link'
import { Plus, CalendarDays, Building2, Users, ExternalLink, FlaskConical, Pencil, ChevronDown } from 'lucide-react'
import { STATUS_CONFIG, TYPE_CONFIG, type RdProjectStatus, type RdProject } from '@/lib/rd-data'
import { loadRdProjects, updateRdProject } from '@/lib/rd-store'
import { STATUSES } from '@/lib/rd-form-constants'
import { useState, useEffect, useRef } from 'react'

// D-Day 계산
function getDDay(deadline: string) {
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (diff < 0) return { label: '마감', color: 'text-gray-400' }
  if (diff === 0) return { label: 'D-Day', color: 'text-red-600' }
  if (diff <= 7) return { label: `D-${diff}`, color: 'text-red-500' }
  return { label: `D-${diff}`, color: 'text-orange-primary' }
}

// 금액 포맷
function formatAmount(amount?: number) {
  if (!amount) return null
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(0)}억원`
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(0)}천만원`
  return `${(amount / 10000).toFixed(0)}만원`
}

// 상태 변경 드롭다운
function StatusDropdown({ project, onUpdate }: { project: RdProject; onUpdate: (id: string, status: RdProjectStatus) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const status = STATUS_CONFIG[project.status]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:opacity-80 transition-opacity ${status.bg} ${status.color}`}
      >
        {status.label}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-2xl shadow-xl border border-white/50 py-1.5 min-w-[110px]">
          {STATUSES.map(opt => (
            <button
              key={opt.value}
              onClick={e => {
                e.stopPropagation()
                onUpdate(project.id, opt.value as RdProjectStatus)
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-[11px] font-black hover:bg-orange-50 transition-colors ${
                project.status === opt.value ? 'text-orange-primary' : 'text-orange-text/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const STATUS_FILTER_OPTIONS: { value: 'all' | RdProjectStatus; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'reviewing', label: '검토중' },
  { value: 'planned', label: '지원예정' },
  { value: 'submitted', label: '제출완료' },
  { value: 'failed_submit', label: '제출못함' },
  { value: 'skipped', label: '지원안함' },
  { value: 'selected', label: '선정' },
  { value: 'rejected', label: '탈락' },
]

export default function RdProjectsPage() {
  const [projects, setProjects] = useState<RdProject[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | RdProjectStatus>('all')

  useEffect(() => {
    setProjects(loadRdProjects())
  }, [])

  // 상태 변경 핸들러
  const handleStatusUpdate = (id: string, status: RdProjectStatus) => {
    const updated = updateRdProject(id, { status })
    setProjects(updated)
  }

  const filtered = statusFilter === 'all' ? projects : projects.filter(p => p.status === statusFilter)

  const counts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tight text-orange-text">R&D 사업</h1>
          <p className="text-xs text-orange-text/40 font-bold uppercase tracking-widest mt-1">2026년 지원 사업 관리</p>
        </div>
        <Link href="/rd/new"
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-primary to-orange-secondary text-white text-sm font-black rounded-2xl shadow-lg hover:scale-[1.02] transition-transform">
          <Plus size={16} />사업 등록
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: '전체', value: projects.length, color: 'text-orange-text' },
          { label: '지원예정', value: counts['planned'] || 0, color: 'text-blue-600' },
          { label: '제출완료', value: counts['submitted'] || 0, color: 'text-green-600' },
          { label: '제출못함', value: counts['failed_submit'] || 0, color: 'text-red-500' },
        ].map(card => (
          <div key={card.label} className="p-5 bg-white/60 glass rounded-2xl">
            <div className="text-xs font-black uppercase tracking-widest opacity-50 mb-1">{card.label}</div>
            <div className={`text-3xl font-black ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 상태 필터 탭 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTER_OPTIONS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              statusFilter === f.value
                ? 'bg-gradient-to-r from-orange-primary to-orange-secondary text-white shadow-lg'
                : 'bg-white/60 glass text-orange-text/50 hover:text-orange-text'
            }`}>
            {f.label}
            {f.value !== 'all' && counts[f.value] ? <span className="ml-1.5 opacity-60">{counts[f.value]}</span> : null}
          </button>
        ))}
      </div>

      {/* 사업 목록 */}
      <div className="space-y-4">
        {filtered.map(project => {
          const type = TYPE_CONFIG[project.project_type]
          const dday = getDDay(project.deadline_at)
          const amount = formatAmount(project.gov_amount)

          return (
            <div key={project.id} className="p-6 bg-white/60 glass rounded-3xl hover:bg-white/80 transition-all">
              <div className="flex items-start justify-between gap-4">
                {/* 왼쪽 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {/* 상태 — 클릭하면 드롭다운으로 변경 가능 */}
                    <StatusDropdown project={project} onUpdate={handleStatusUpdate} />
                    <span className={`text-[10px] font-black uppercase tracking-wide ${type.color} opacity-70`}>{type.label}</span>
                  </div>

                  <Link href={`/rd/${project.id}`}>
                    <h3 className="text-sm font-black text-orange-text leading-snug mb-3 hover:text-orange-primary transition-colors cursor-pointer">{project.name}</h3>
                  </Link>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5 text-[11px] text-orange-text/50">
                      <Building2 size={12} />
                      <span className="font-bold">{project.ministry}</span>
                      <span className="opacity-50">·</span>
                      <span>{project.agency}</span>
                    </div>
                    {(project.host_org || project.partners.length > 0) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-orange-text/50">
                        <Users size={12} />
                        <span className="font-bold">{project.host_org}</span>
                        {project.partners.length > 0 && <span className="opacity-60">+ {project.partners.length}개 기관</span>}
                      </div>
                    )}
                  </div>

                  {project.memo && <p className="text-[11px] text-orange-text/40 mt-2 line-clamp-1">{project.memo}</p>}
                </div>

                {/* 오른쪽 */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className={`text-xl font-black ${dday.color}`}>{dday.label}</div>
                    <div className="flex items-center gap-1 text-[10px] text-orange-text/40 font-bold justify-end">
                      <CalendarDays size={10} />{project.deadline_at}
                    </div>
                  </div>

                  {amount && (
                    <div className="text-right">
                      <div className="text-xs font-black text-orange-primary">{amount}</div>
                      <div className="text-[9px] text-orange-text/30 uppercase tracking-widest">정부지원금</div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {project.announcement_url && (
                      <a href={project.announcement_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-orange-primary/60 hover:text-orange-primary transition-colors">
                        <ExternalLink size={10} />공고보기
                      </a>
                    )}
                    {/* 수정 버튼 */}
                    <Link href={`/rd/${project.id}/edit`}
                      className="flex items-center gap-1 text-[10px] text-orange-text/40 hover:text-orange-primary transition-colors">
                      <Pencil size={10} />수정
                    </Link>
                  </div>
                </div>
              </div>

              {project.partners.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  <span className="text-[9px] font-black text-orange-text/30 uppercase tracking-widest self-center">공동</span>
                  {project.partners.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 bg-orange-primary/8 text-orange-text/50 rounded-lg text-[10px] font-bold">{p}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FlaskConical size={32} className="text-orange-primary/30 mb-3" />
          <p className="text-sm font-black text-orange-text/30">해당 상태의 사업이 없습니다</p>
        </div>
      )}
    </div>
  )
}
