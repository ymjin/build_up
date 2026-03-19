'use client'

import { useState, useEffect, useMemo } from 'react'
import { useProjects } from '@/lib/queries'
import { createClient } from '@/lib/supabase/client'
import { STATUS_COLORS, PROJECT_STATUS_LABELS, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { Plus, TrendingUp, Users, CheckSquare, Activity } from 'lucide-react'

// 날짜를 YYYY-MM-DD 형식으로 변환
function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// 최근 182일 날짜 배열 생성 (오래된 날짜 → 최근 날짜 순)
function getLast182Days(): string[] {
  const days: string[] = []
  const today = new Date()
  for (let i = 181; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(toDateStr(d))
  }
  return days
}

// 활동 수에 따른 오렌지 색상 강도 반환
function getHeatColor(count: number, max: number): string {
  if (count === 0) return 'rgba(251, 146, 60, 0.07)'
  const ratio = Math.min(count / Math.max(max, 1), 1)
  // 비선형 스케일로 적은 활동도 잘 보이게
  const intensity = 0.15 + ratio * 0.85
  return `rgba(251, 146, 60, ${intensity})`
}

// 날짜 포맷 (툴팁용)
function formatDateKr(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

// 요일 레이블 (월~일)
const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export default function DashboardPage() {
  const { data: projects, isLoading } = useProjects()
  const [mounted, setMounted] = useState(false)
  // 날짜별 활동 수 맵 { 'YYYY-MM-DD': count }
  const [activityMap, setActivityMap] = useState<Record<string, number>>({})
  const [heatLoading, setHeatLoading] = useState(true)
  // 툴팁 상태
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 활동 데이터 fetch
  useEffect(() => {
    async function fetchActivity() {
      const supabase = createClient()
      const since = new Date()
      since.setDate(since.getDate() - 181)
      const sinceStr = since.toISOString()

      // activities 테이블 (프로젝트 일반 활동)
      const { data: acts } = await supabase
        .from('activities')
        .select('created_at')
        .gte('created_at', sinceStr)

      // dev_features 완료/업데이트 활동
      const { data: feats } = await supabase
        .from('dev_features')
        .select('updated_at')
        .gte('updated_at', sinceStr)

      const map: Record<string, number> = {}

      acts?.forEach(a => {
        const d = toDateStr(new Date(a.created_at))
        map[d] = (map[d] ?? 0) + 1
      })

      feats?.forEach(f => {
        const d = toDateStr(new Date(f.updated_at))
        map[d] = (map[d] ?? 0) + 1
      })

      setActivityMap(map)
      setHeatLoading(false)
    }

    fetchActivity()
  }, [])

  const totalProjects = projects?.length ?? 0
  const totalProgress = projects
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / Math.max(projects.length, 1))
    : 0
  const completedProjects = projects?.filter(p => p.status === 'completed').length ?? 0
  const activeProjects = projects?.filter(p => p.status !== 'completed').length ?? 0

  // 182일 날짜 배열
  const days = useMemo(() => getLast182Days(), [])
  // 최대 활동 수 (색상 스케일 기준)
  const maxCount = useMemo(() => Math.max(...Object.values(activityMap), 1), [activityMap])
  // 첫 번째 날의 요일 오프셋 (월=0 기준)
  const firstDayOffset = useMemo(() => {
    const d = new Date(days[0])
    // getDay(): 0=일, 1=월 ... 6=토 → 월=0으로 변환
    return (d.getDay() + 6) % 7
  }, [days])

  return (
    <div className="p-8">
      {/* 헤더 */}
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

      {/* 통계 카드 */}
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

      {/* 빌드 점수 + 히트맵 */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* 글로벌 빌드 점수 */}
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

        {/* 멤버 활동 히트맵 */}
        <div className="col-span-12 lg:col-span-8 p-8 bg-white/50 glass rounded-3xl relative">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-sm font-black uppercase tracking-widest opacity-50">멤버 활동 히트맵</h2>
            <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">최근 26주</span>
          </div>

          {/* 요일 레이블 */}
          <div className="flex gap-1 mb-1 ml-0">
            <div className="flex flex-col gap-1 mr-1">
              {WEEKDAY_LABELS.map((day, i) => (
                <div
                  key={day}
                  className="text-[8px] font-black opacity-30 uppercase tracking-widest"
                  style={{ height: '10px', lineHeight: '10px' }}
                >
                  {/* 월·수·금만 표시 (짝수 인덱스) */}
                  {i % 2 === 0 ? day : ''}
                </div>
              ))}
            </div>

            {/* 히트맵 그리드 (주 단위 세로 배열) */}
            <div className="flex gap-1 flex-1 overflow-hidden" style={{ position: 'relative' }}>
              {heatLoading ? (
                // 로딩 스켈레톤
                <div className="flex gap-1">
                  {Array.from({ length: 26 }).map((_, w) => (
                    <div key={w} className="flex flex-col gap-1">
                      {Array.from({ length: 7 }).map((_, d) => (
                        <div
                          key={d}
                          className="w-3 h-3 rounded-sm animate-pulse bg-orange-100"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                (() => {
                  // 첫 주 offset 채우기 + 날짜 배열을 주 단위로 분할
                  const cells: (string | null)[] = [
                    ...Array(firstDayOffset).fill(null),
                    ...days,
                  ]
                  // 26주 = 182칸으로 자르기
                  const weeks: (string | null)[][] = []
                  for (let w = 0; w < Math.ceil(cells.length / 7); w++) {
                    weeks.push(cells.slice(w * 7, w * 7 + 7))
                  }
                  // 최대 26주만 표시
                  const displayWeeks = weeks.slice(-26)

                  return displayWeeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {week.map((dateStr, di) => {
                        if (!dateStr) {
                          return <div key={di} className="w-3 h-3 rounded-sm" />
                        }
                        const count = activityMap[dateStr] ?? 0
                        return (
                          <div
                            key={di}
                            className="w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-125"
                            style={{ backgroundColor: getHeatColor(count, maxCount) }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              const parent = e.currentTarget.closest('.relative')!.getBoundingClientRect()
                              setTooltip({
                                date: dateStr,
                                count,
                                x: rect.left - parent.left + rect.width / 2,
                                y: rect.top - parent.top - 8,
                              })
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          />
                        )
                      })}
                    </div>
                  ))
                })()
              )}

              {/* 툴팁 */}
              {tooltip && (
                <div
                  className="absolute z-10 pointer-events-none px-3 py-2 bg-orange-text text-white text-[10px] font-black rounded-xl shadow-lg whitespace-nowrap"
                  style={{
                    left: tooltip.x,
                    top: tooltip.y,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  {formatDateKr(tooltip.date)}
                  <br />
                  <span className="text-orange-300">
                    {tooltip.count === 0 ? '활동 없음' : `활동 ${tooltip.count}건`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 범례 */}
          <div className="mt-3 flex items-center justify-end gap-2">
            <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">적음</span>
            {[0.07, 0.25, 0.45, 0.65, 0.9].map((op, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: `rgba(251, 146, 60, ${op})` }}
              />
            ))}
            <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">많음</span>
          </div>
        </div>
      </div>

      {/* 프로젝트 그리드 */}
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
