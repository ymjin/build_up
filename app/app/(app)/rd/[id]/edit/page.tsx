'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, X, Link as LinkIcon, Building2, CalendarDays, Wallet, FileText } from 'lucide-react'
import Link from 'next/link'
import { getRdProject, updateRdProject } from '@/lib/rd-store'
import {
  MINISTRIES, AGENCIES, PROJECT_TYPES, STATUSES,
  type RdProjectType, type RdProjectStatus,
} from '@/lib/rd-form-constants'

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-orange-primary/10 rounded-xl text-orange-primary">
        <Icon size={16} />
      </div>
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-orange-text/50">{title}</h2>
      <div className="flex-1 h-px bg-orange-text/10" />
    </div>
  )
}

export default function EditRdProjectPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState<RdProjectType>('rnd')
  const [status, setStatus] = useState<RdProjectStatus>('reviewing')
  const [ministry, setMinistry] = useState('')
  const [agency, setAgency] = useState('')
  const [hostOrg, setHostOrg] = useState('')
  const [partners, setPartners] = useState<string[]>([''])
  const [announcedAt, setAnnouncedAt] = useState('')
  const [deadlineAt, setDeadlineAt] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [govAmount, setGovAmount] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [govRatio, setGovRatio] = useState('')
  const [selfRatio, setSelfRatio] = useState('')
  const [announcementUrl, setAnnouncementUrl] = useState('')
  const [memo, setMemo] = useState('')
  const [notFound, setNotFound] = useState(false)

  // 기존 데이터 로드
  useEffect(() => {
    const project = getRdProject(id)
    if (!project) { setNotFound(true); return }
    setProjectName(project.name)
    setProjectType(project.project_type)
    setStatus(project.status)
    setMinistry(project.ministry || '')
    setAgency(project.agency || '')
    setHostOrg(project.host_org || '')
    setPartners(project.partners.length > 0 ? project.partners : [''])
    setAnnouncedAt(project.announced_at || '')
    setDeadlineAt(project.deadline_at || '')
    setPeriodStart(project.period_start || '')
    setPeriodEnd(project.period_end || '')
    setGovAmount(project.gov_amount ? String(project.gov_amount) : '')
    setTotalAmount(project.total_amount ? String(project.total_amount) : '')
    setGovRatio(project.gov_ratio ? String(project.gov_ratio) : '')
    setSelfRatio(project.self_ratio ? String(project.self_ratio) : '')
    setAnnouncementUrl(project.announcement_url || '')
    setMemo(project.memo || '')
  }, [id])

  const addPartner = () => setPartners(prev => [...prev, ''])
  const removePartner = (i: number) => setPartners(prev => prev.filter((_, idx) => idx !== i))
  const updatePartner = (i: number, val: string) => setPartners(prev => prev.map((p, idx) => idx === i ? val : p))

  const handleGovRatioChange = (val: string) => {
    setGovRatio(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num >= 0 && num <= 100) setSelfRatio(String(100 - num))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateRdProject(id, {
      name: projectName,
      project_type: projectType,
      status,
      ministry,
      agency,
      host_org: hostOrg,
      partners: partners.filter(p => p.trim()),
      announced_at: announcedAt || undefined,
      deadline_at: deadlineAt,
      period_start: periodStart || undefined,
      period_end: periodEnd || undefined,
      gov_amount: govAmount ? Number(govAmount) : undefined,
      total_amount: totalAmount ? Number(totalAmount) : undefined,
      gov_ratio: govRatio ? Number(govRatio) : undefined,
      self_ratio: selfRatio ? Number(selfRatio) : undefined,
      announcement_url: announcementUrl || undefined,
      memo: memo || undefined,
    })
    router.push('/rd')
  }

  if (notFound) {
    return (
      <div className="p-8 text-center">
        <p className="text-orange-text/40 font-bold">사업을 찾을 수 없습니다.</p>
        <Link href="/rd" className="text-orange-primary text-sm font-black mt-4 inline-block">← 목록으로</Link>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-orange-base">

      {/* ── 고정 헤더 ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/rd/${id}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
          >
            <ArrowLeft size={16} />
            상세보기
          </Link>
          <span className="text-gray-300">/</span>
          <div>
            <h1 className="text-base font-black text-orange-text">사업 수정</h1>
            <p className="text-[10px] text-orange-text/40 font-bold uppercase tracking-widest">Edit R&amp;D Project</p>
          </div>
        </div>
      </div>

      {/* ── 스크롤 콘텐츠 영역 ────────────────────────────────────── */}
      <form id="edit-rd-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8 space-y-8">

        {/* 기본 정보 */}
        <div className="p-8 bg-white/60 glass rounded-3xl">
          <SectionHeader icon={FileText} title="기본 정보" />

          <div className="mb-5">
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">사업명 *</label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-3">사업 구분 *</label>
            <div className="grid grid-cols-4 gap-2">
              {PROJECT_TYPES.map(opt => (
                <button key={opt.value} type="button" onClick={() => setProjectType(opt.value as RdProjectType)}
                  className={`py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-all ${
                    projectType === opt.value
                      ? 'bg-gradient-to-r from-orange-primary to-orange-secondary text-white shadow-lg'
                      : 'bg-white/50 text-orange-text/50 hover:bg-white/80'
                  }`}>{opt.label}</button>
              ))}
            </div>
          </div>

          {/* 지원 상태 — 가장 중요한 필드 강조 */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-3">지원 상태 *</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(opt => (
                <button key={opt.value} type="button" onClick={() => setStatus(opt.value as RdProjectStatus)}
                  className={`px-4 py-2 rounded-2xl text-[11px] font-black transition-all ${
                    status === opt.value
                      ? 'bg-gradient-to-r from-orange-primary to-orange-secondary text-white shadow-lg scale-105'
                      : 'bg-white/50 text-orange-text/50 hover:bg-white/80'
                  }`}>{opt.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* 기관 정보 */}
        <div className="p-8 bg-white/60 glass rounded-3xl">
          <SectionHeader icon={Building2} title="기관 정보" />
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">부처</label>
              <select value={ministry} onChange={e => setMinistry(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 appearance-none">
                <option value="">선택하세요</option>
                {MINISTRIES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">운영기관</label>
              <select value={agency} onChange={e => setAgency(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 appearance-none">
                <option value="">선택하세요</option>
                {AGENCIES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">주관기관</label>
            <input type="text" value={hostOrg} onChange={e => setHostOrg(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">공동기관</label>
            <div className="space-y-2">
              {partners.map((partner, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={partner} onChange={e => updatePartner(i, e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
                    placeholder={`공동기관 ${i + 1}`} />
                  {partners.length > 1 && (
                    <button type="button" onClick={() => removePartner(i)} className="p-3 text-orange-text/30 hover:text-red-400 transition-colors"><X size={16} /></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPartner} className="flex items-center gap-2 text-xs font-black text-orange-primary/60 hover:text-orange-primary transition-colors mt-1">
                <Plus size={14} />공동기관 추가
              </button>
            </div>
          </div>
        </div>

        {/* 일정 */}
        <div className="p-8 bg-white/60 glass rounded-3xl">
          <SectionHeader icon={CalendarDays} title="일정" />
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '공고일', value: announcedAt, onChange: setAnnouncedAt },
              { label: '접수 마감일 *', value: deadlineAt, onChange: setDeadlineAt },
              { label: '사업 시작일', value: periodStart, onChange: setPeriodStart },
              { label: '사업 종료일', value: periodEnd, onChange: setPeriodEnd },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">{f.label}</label>
                <input type="date" value={f.value} onChange={e => f.onChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30" />
              </div>
            ))}
          </div>
        </div>

        {/* 금액 */}
        <div className="p-8 bg-white/60 glass rounded-3xl">
          <SectionHeader icon={Wallet} title="금액" />
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '정부지원금 (원)', value: govAmount, onChange: setGovAmount },
              { label: '총 사업비 (원)', value: totalAmount, onChange: setTotalAmount },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">{f.label}</label>
                <input type="number" value={f.value} onChange={e => f.onChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">정부지원 비율 (%)</label>
              <input type="number" min="0" max="100" value={govRatio} onChange={e => handleGovRatioChange(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">자부담 비율 (%)</label>
              <input type="number" min="0" max="100" value={selfRatio} onChange={e => setSelfRatio(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30" />
            </div>
          </div>
        </div>

        {/* 참고 */}
        <div className="p-8 bg-white/60 glass rounded-3xl">
          <SectionHeader icon={LinkIcon} title="참고" />
          <div className="mb-5">
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">공고 URL</label>
            <input type="url" value={announcementUrl} onChange={e => setAnnouncementUrl(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">메모</label>
            <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={3}
              className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 resize-none" />
          </div>
        </div>

        </div>{/* end max-w-2xl */}
      </form>

      {/* ── 고정 푸터 — 저장 버튼 ─────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Link
            href={`/rd/${id}`}
            className="px-6 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-600 transition"
          >
            취소
          </Link>
          <button
            type="submit"
            form="edit-rd-form"
            className="flex-1 py-3 bg-gradient-to-r from-orange-primary to-orange-secondary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg hover:opacity-90 transition"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  )
}
