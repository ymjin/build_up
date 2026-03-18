'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, Link as LinkIcon, Building2, CalendarDays, Wallet, FileText } from 'lucide-react'
import Link from 'next/link'
import { MINISTRIES, AGENCIES, PROJECT_TYPES, STATUSES } from '@/lib/rd-form-constants'

// 섹션 헤더 컴포넌트
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

export default function NewRdProjectPage() {
  const router = useRouter()

  // 기본 정보
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState('rnd')
  const [status, setStatus] = useState('reviewing')
  const [memo, setMemo] = useState('')

  // 기관 정보
  const [ministry, setMinistry] = useState('')
  const [agency, setAgency] = useState('')
  const [hostOrg, setHostOrg] = useState('') // 주관기관
  const [partners, setPartners] = useState<string[]>(['']) // 공동기관

  // 일정
  const [announcedAt, setAnnouncedAt] = useState('')
  const [deadlineAt, setDeadlineAt] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')

  // 금액
  const [govAmount, setGovAmount] = useState('')
  const [govRatio, setGovRatio] = useState('')
  const [selfRatio, setSelfRatio] = useState('')
  const [totalAmount, setTotalAmount] = useState('')

  // 공고 URL
  const [announcementUrl, setAnnouncementUrl] = useState('')

  // 공동기관 추가/삭제
  const addPartner = () => setPartners(prev => [...prev, ''])
  const removePartner = (i: number) => setPartners(prev => prev.filter((_, idx) => idx !== i))
  const updatePartner = (i: number, val: string) => setPartners(prev => prev.map((p, idx) => idx === i ? val : p))

  // 정부지원금 비율 자동 계산: 자부담 = 100 - 정부지원 비율
  const handleGovRatioChange = (val: string) => {
    setGovRatio(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setSelfRatio(String(100 - num))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Supabase 연동 후 실제 저장 구현
    alert('사업이 등록되었습니다. (Supabase 연동 후 실제 저장)')
    router.push('/rd')
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* 뒤로가기 */}
      <Link
        href="/rd"
        className="flex items-center gap-2 text-xs font-black opacity-40 uppercase tracking-widest hover:opacity-70 transition-opacity mb-8"
      >
        <ArrowLeft size={14} />
        R&D 사업 목록
      </Link>

      <h1 className="text-2xl font-black uppercase italic tracking-tight text-orange-text mb-2">
        사업 등록
      </h1>
      <p className="text-xs text-orange-text/40 font-bold uppercase tracking-widest mb-8">
        Register R&amp;D Project
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── 섹션 1: 기본 정보 ── */}
        <div className="p-8 bg-white/60 glass rounded-3xl">
          <SectionHeader icon={FileText} title="기본 정보" />

          {/* 사업명 */}
          <div className="mb-5">
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
              사업명 *
            </label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              placeholder="예: 2026년도 AI AGENT 융합·확산 지원 사업"
            />
          </div>

          {/* 사업 구분 */}
          <div className="mb-5">
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-3">
              사업 구분 *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PROJECT_TYPES.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setProjectType(opt.value)}
                  className={`py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-all ${
                    projectType === opt.value
                      ? 'bg-gradient-to-r from-orange-primary to-orange-secondary text-white shadow-lg'
                      : 'bg-white/50 text-orange-text/50 hover:bg-white/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 지원 상태 */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-3">
              지원 상태 *
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`px-4 py-2 rounded-2xl text-[11px] font-black transition-all ${
                    status === opt.value
                      ? 'bg-gradient-to-r from-orange-primary to-orange-secondary text-white shadow-lg scale-105'
                      : 'bg-white/50 text-orange-text/50 hover:bg-white/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── 섹션 2: 기관 정보 ── */}
        <div className="p-8 bg-white/60 glass rounded-3xl">
          <SectionHeader icon={Building2} title="기관 정보" />

          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* 부처 */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
                부처 *
              </label>
              <select
                value={ministry}
                onChange={e => setMinistry(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 appearance-none"
              >
                <option value="">선택하세요</option>
                {MINISTRIES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* 운영기관 */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
                운영기관 (전담기관) *
              </label>
              <select
                value={agency}
                onChange={e => setAgency(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 appearance-none"
              >
                <option value="">선택하세요</option>
                {AGENCIES.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 주관기관 */}
          <div className="mb-4">
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
              주관기관
            </label>
            <input
              type="text"
              value={hostOrg}
              onChange={e => setHostOrg(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              placeholder="예: (주)코팅코리아"
            />
          </div>

          {/* 공동기관 */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
              공동기관 (컨소시엄)
            </label>
            <div className="space-y-2">
              {partners.map((partner, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={partner}
                    onChange={e => updatePartner(i, e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
                    placeholder={`공동기관 ${i + 1} (예: AIRA, 가톨릭대학교)`}
                  />
                  {partners.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePartner(i)}
                      className="p-3 text-orange-text/30 hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPartner}
                className="flex items-center gap-2 text-xs font-black text-orange-primary/60 hover:text-orange-primary transition-colors mt-1"
              >
                <Plus size={14} />
                공동기관 추가
              </button>
            </div>
          </div>
        </div>

        {/* ── 섹션 3: 일정 ── */}
        <div className="p-8 bg-white/60 glass rounded-3xl">
          <SectionHeader icon={CalendarDays} title="일정" />

          <div className="grid grid-cols-2 gap-4">
            {/* 공고일 */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
                공고일
              </label>
              <input
                type="date"
                value={announcedAt}
                onChange={e => setAnnouncedAt(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              />
            </div>

            {/* 접수 마감일 */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
                접수 마감일 *
              </label>
              <input
                type="date"
                value={deadlineAt}
                onChange={e => setDeadlineAt(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              />
            </div>

            {/* 사업 시작일 */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
                사업 시작일
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              />
            </div>

            {/* 사업 종료일 */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
                사업 종료일
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              />
            </div>
          </div>

          {/* D-Day 미리보기 */}
          {deadlineAt && (
            <div className="mt-4 p-4 bg-orange-50/50 rounded-2xl flex items-center gap-3">
              <div className="text-xs font-black text-orange-text/50 uppercase tracking-widest">마감까지</div>
              <div className={`text-lg font-black ${
                (() => {
                  const diff = Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 86400000)
                  return diff < 0 ? 'text-gray-400' : diff <= 7 ? 'text-red-500' : 'text-orange-primary'
                })()
              }`}>
                {(() => {
                  const diff = Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 86400000)
                  return diff < 0 ? '마감됨' : `D-${diff}`
                })()}
              </div>
            </div>
          )}
        </div>

        {/* ── 섹션 4: 금액 ── */}
        <div className="p-8 bg-white/60 glass rounded-3xl">
          <SectionHeader icon={Wallet} title="금액" />

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* 정부지원금 */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
                정부지원금 (원)
              </label>
              <input
                type="number"
                value={govAmount}
                onChange={e => setGovAmount(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
                placeholder="예: 116000000"
              />
            </div>

            {/* 총 사업비 */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
                총 사업비 (원)
              </label>
              <input
                type="number"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
                placeholder="예: 155000000"
              />
            </div>
          </div>

          {/* 비율 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
                정부지원 비율 (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={govRatio}
                onChange={e => handleGovRatioChange(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
                placeholder="예: 75"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
                자부담 비율 (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={selfRatio}
                onChange={e => setSelfRatio(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
                placeholder="자동 계산"
              />
            </div>
          </div>

          {/* 금액 미리보기 */}
          {govAmount && (
            <div className="mt-4 p-4 bg-orange-50/50 rounded-2xl">
              <div className="text-xs font-black text-orange-text/40 uppercase tracking-widest mb-1">정부지원금</div>
              <div className="text-xl font-black text-orange-primary">
                ₩{Number(govAmount).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* ── 섹션 5: 참고 ── */}
        <div className="p-8 bg-white/60 glass rounded-3xl">
          <SectionHeader icon={LinkIcon} title="참고" />

          {/* 공고 URL */}
          <div className="mb-5">
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
              공고 URL
            </label>
            <input
              type="url"
              value={announcementUrl}
              onChange={e => setAnnouncementUrl(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              placeholder="https://www.iris.go.kr/..."
            />
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">
              메모
            </label>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 resize-none"
              placeholder="내부 검토 사항, 특이사항 등"
            />
          </div>
        </div>

        {/* 등록 버튼 */}
        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-orange-primary to-orange-secondary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg hover:scale-[1.02] transition-transform"
        >
          사업 등록하기
        </button>
      </form>
    </div>
  )
}
