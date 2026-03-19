'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateProject } from '@/lib/queries'
import { PROJECT_STATUS_LABELS, DEV_TYPE_LABELS, CONTRACT_TYPE_LABELS, DEV_PHASE_LABELS, PROJECT_CATEGORY_LABELS } from '@/lib/utils'
import type { ProjectStatus, DevType, ContractType, DevPhase, ProjectCategory } from '@/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const createProject = useCreateProject()

  // 카테고리
  const [category, setCategory] = useState<ProjectCategory>('external')

  // 기본 정보
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [clientName, setClientName] = useState('')
  const [devType, setDevType] = useState<DevType>('web')
  const [pmName, setPmName] = useState('')

  // 상태 / 단계
  const [status, setStatus] = useState<ProjectStatus>('in_progress')
  const [devPhase, setDevPhase] = useState<DevPhase>('planning')

  // 일정
  const [contractDate, setContractDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')

  // 계약
  const [contractAmount, setContractAmount] = useState('')
  const [contractType, setContractType] = useState<ContractType>('fixed')

  // 에러 메시지
  const [errorMsg, setErrorMsg] = useState('')

  // 카테고리 변경 시 상태 초기화
  function handleCategoryChange(val: ProjectCategory) {
    setCategory(val)
    setErrorMsg('')
    if (val === 'external') setStatus('contract_pending')
    else setStatus('in_progress')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    try {
      // 카테고리별 필요한 필드만 전달
      const payload: Record<string, unknown> = {
        name,
        description: description || null,
        status,
        category,
        progress: 0,
        dev_phase: devPhase,
        start_date: startDate || null,
        deadline: deadline || null,
      }
      if (category === 'external') {
        payload.client_name = clientName || null
        payload.pm_name = pmName || null
        payload.dev_type = devType
        payload.contract_date = contractDate || null
        payload.contract_amount = contractAmount ? parseInt(contractAmount.replace(/,/g, ''), 10) : null
        payload.contract_type = contractType
      }
      const project = await createProject.mutateAsync(payload)
      router.push(`/projects/${project.id}`)
    } catch (err: unknown) {
      console.error(err)
      // Supabase 에러는 message 프로퍼티가 있는 객체
      const msg =
        err instanceof Error ? err.message
        : (err as { message?: string })?.message
        ?? JSON.stringify(err)
      setErrorMsg(msg)
    }
  }

  // 금액 입력 시 천 단위 콤마 포맷
  function handleAmountChange(v: string) {
    const raw = v.replace(/[^0-9]/g, '')
    setContractAmount(raw ? parseInt(raw, 10).toLocaleString('ko-KR') : '')
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/projects" className="flex items-center gap-2 text-xs font-black opacity-40 uppercase tracking-widest hover:opacity-70 transition-opacity mb-8">
        <ArrowLeft size={14} />
        프로젝트 목록
      </Link>

      <h1 className="text-2xl font-black uppercase italic tracking-tight text-orange-text mb-8">새 프로젝트</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 카테고리 선택 */}
        <div className="p-6 bg-white/60 glass rounded-3xl space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest opacity-50">프로젝트 구분</h2>
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(PROJECT_CATEGORY_LABELS) as [ProjectCategory, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => handleCategoryChange(value)}
                className={`py-4 rounded-2xl text-sm font-black tracking-widest transition-all flex flex-col items-center gap-1.5 border-2 ${
                  category === value
                    ? 'border-orange-primary bg-orange-primary/10 text-orange-primary'
                    : 'border-transparent bg-white/50 text-orange-text/40 hover:bg-white/80'
                }`}
              >
                <span className="text-xl">
                  {value === 'external' ? '🤝' : value === 'internal' ? '🏢' : '🔒'}
                </span>
                {label}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-bold opacity-40">
            {category === 'external' && '클라이언트 발주 프로젝트 — 계약/납기 관리 포함'}
            {category === 'internal' && '사내 자체 개발 프로젝트 — 팀원 공유 가능'}
            {category === 'personal' && '개인 프로젝트 — 본인만 열람 가능'}
          </p>
        </div>

        {/* 기본 정보 섹션 */}
        <div className="p-6 bg-white/60 glass rounded-3xl space-y-5">
          <h2 className="text-xs font-black uppercase tracking-widest opacity-50">기본 정보</h2>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">프로젝트명 *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              placeholder="예: 쇼핑몰 리뉴얼 v2.0"
            />
          </div>

          {/* 외부 프로젝트: 클라이언트 + PM */}
          {category === 'external' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">클라이언트</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
                  placeholder="발주처명"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">PM 담당자</label>
                <input
                  type="text"
                  value={pmName}
                  onChange={e => setPmName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
                  placeholder="담당자명"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">설명</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 resize-none"
              placeholder="프로젝트 간략 설명"
            />
          </div>

          {/* 프로젝트 유형 */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-3">프로젝트 유형</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(DEV_TYPE_LABELS) as [DevType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDevType(value)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    devType === value
                      ? 'bg-gradient-to-r from-orange-primary to-orange-secondary text-white shadow-md'
                      : 'bg-white/50 text-orange-text/50 hover:bg-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 상태 / 단계 섹션 */}
        <div className="p-6 bg-white/60 glass rounded-3xl space-y-5">
          <h2 className="text-xs font-black uppercase tracking-widest opacity-50">상태 / 단계</h2>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-3">현재 상태</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(PROJECT_STATUS_LABELS[category] ?? PROJECT_STATUS_LABELS.external) as [ProjectStatus, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    status === value
                      ? 'bg-gradient-to-r from-orange-primary to-orange-secondary text-white shadow-md'
                      : 'bg-white/50 text-orange-text/50 hover:bg-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-3">내부 개발 단계</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(DEV_PHASE_LABELS) as [DevPhase, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDevPhase(value)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    devPhase === value
                      ? 'bg-white text-orange-primary shadow-sm border border-orange-200'
                      : 'bg-white/50 text-orange-text/40 hover:bg-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 일정 섹션 */}
        <div className="p-6 bg-white/60 glass rounded-3xl space-y-5">
          <h2 className="text-xs font-black uppercase tracking-widest opacity-50">일정</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">계약일</label>
              <input
                type="date"
                value={contractDate}
                onChange={e => setContractDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">납기일</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              />
            </div>
          </div>
        </div>

        {/* 계약 섹션 — 외부 프로젝트 전용 */}
        {category === 'external' && (
        <div className="p-6 bg-white/60 glass rounded-3xl space-y-5">
          <h2 className="text-xs font-black uppercase tracking-widest opacity-50">계약</h2>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-3">계약 형태</label>
            <div className="flex gap-2">
              {(Object.entries(CONTRACT_TYPE_LABELS) as [ContractType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setContractType(value)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    contractType === value
                      ? 'bg-gradient-to-r from-orange-primary to-orange-secondary text-white shadow-md'
                      : 'bg-white/50 text-orange-text/50 hover:bg-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">계약금액</label>
            <div className="relative">
              <input
                type="text"
                value={contractAmount}
                onChange={e => handleAmountChange(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 pr-10"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black opacity-40">원</span>
            </div>
          </div>
        </div>
        )}

        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm font-bold text-red-600">
            ⚠️ {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={createProject.isPending}
          className="w-full py-4 bg-gradient-to-r from-orange-primary to-orange-secondary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100"
        >
          {createProject.isPending ? '생성 중...' : '프로젝트 만들기'}
        </button>
      </form>
    </div>
  )
}
