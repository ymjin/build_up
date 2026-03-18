'use client'

import { use, useState } from 'react'
import {
  useProject, useUpdateProject,
  useDevFeatures, useCreateDevFeature, useUpdateDevFeature, useDeleteDevFeature,
  useDevTestCases, useCreateDevTestCase, useUpdateDevTestCase, useDeleteDevTestCase,
  useDevDeployments, useCreateDevDeployment, useDeleteDevDeployment,
  useDevIssues, useCreateDevIssue, useUpdateDevIssue, useDeleteDevIssue,
} from '@/lib/queries'
import {
  PROJECT_STATUS_LABELS, DEV_STATUS_COLORS, DEV_PHASE_LABELS, DEV_PHASE_ORDER,
  DEV_TYPE_LABELS, CONTRACT_TYPE_LABELS,
  FEATURE_PRIORITY_LABELS, FEATURE_PRIORITY_COLORS, FEATURE_STATUS_LABELS, FEATURE_STATUS_COLORS,
  TEST_STATUS_LABELS, TEST_STATUS_COLORS,
  DEPLOY_ENV_LABELS, DEPLOY_ENV_COLORS,
  ISSUE_TYPE_LABELS, ISSUE_TYPE_COLORS, ISSUE_PRIORITY_LABELS, ISSUE_PRIORITY_COLORS,
  ISSUE_STATUS_LABELS, ISSUE_STATUS_COLORS,
  formatDate, formatAmount, calcDday,
} from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowLeft, Users, Plus, Trash2, Check, X, ChevronDown,
  Calendar, Building2, User, DollarSign, GitBranch,
  BookOpen, FlaskConical, Rocket, Settings2, AlertTriangle,
  Edit2, RefreshCw
} from 'lucide-react'
import type {
  ProjectStatus, DevPhase, DevType, ContractType,
  FeaturePriority, FeatureStatus, TestCaseStatus,
  DeployEnvironment, IssueType, IssuePriority, IssueStatus,
} from '@/types'

// =============================================
// 탭 정의
// =============================================
type Tab = 'overview' | 'features' | 'tests' | 'deployments' | 'operations'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: '개요', icon: <BookOpen size={14} /> },
  { id: 'features', label: '기능명세', icon: <GitBranch size={14} /> },
  { id: 'tests', label: '테스트', icon: <FlaskConical size={14} /> },
  { id: 'deployments', label: '배포이력', icon: <Rocket size={14} /> },
  { id: 'operations', label: '운영', icon: <Settings2 size={14} /> },
]

// =============================================
// 메인 컴포넌트
// =============================================
export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: project, isLoading } = useProject(id)
  const updateProject = useUpdateProject()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 bg-white/30 rounded-2xl w-48 animate-pulse" />
        <div className="h-64 bg-white/30 glass rounded-3xl animate-pulse" />
      </div>
    )
  }
  if (!project) return null

  const statusLabel = PROJECT_STATUS_LABELS.development[project.status] ?? project.status
  const statusColor = DEV_STATUS_COLORS[project.status] ?? 'bg-slate-100 text-slate-600'
  const isOperating = project.status === 'operating'

  return (
    <div className="p-8">
      {/* ── 헤더 ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/projects" className="flex items-center gap-2 text-xs font-black opacity-40 uppercase tracking-widest hover:opacity-70 transition-opacity mb-3">
            <ArrowLeft size={12} />
            프로젝트 목록
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black uppercase italic tracking-tight text-orange-text">{project.name}</h1>
            <span className={`text-xs font-black px-3 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
            {project.dev_type && (
              <span className="text-xs font-black px-3 py-1 rounded-full bg-purple-100 text-purple-600">
                {DEV_TYPE_LABELS[project.dev_type]}
              </span>
            )}
          </div>
          {project.client_name && (
            <div className="flex items-center gap-1.5 text-sm font-bold text-orange-text/50">
              <Building2 size={13} />
              {project.client_name}
            </div>
          )}
        </div>
        <Link
          href={`/projects/${id}/members`}
          className="flex items-center gap-2 px-4 py-2 bg-white/50 glass rounded-2xl text-xs font-black uppercase tracking-widest text-orange-text/60 hover:bg-white/80 transition-all"
        >
          <Users size={14} />
          팀원
        </Link>
      </div>

      {/* ── 탭 네비게이션 ── */}
      <div className="flex border-b border-orange-primary/10 mb-6">
        {TABS.map(tab => {
          const isDisabled = tab.id === 'operations' && !isOperating
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab.id
                  ? 'text-orange-primary'
                  : isDisabled
                  ? 'text-orange-text/20 cursor-not-allowed'
                  : 'text-orange-text/30 hover:text-orange-text/50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'operations' && !isOperating && (
                <span className="text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">운영전환 후 활성화</span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-primary rounded-t-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* ── 탭 콘텐츠 ── */}
      {activeTab === 'overview' && <OverviewTab projectId={id} />}
      {activeTab === 'features' && <FeaturesTab projectId={id} />}
      {activeTab === 'tests' && <TestsTab projectId={id} />}
      {activeTab === 'deployments' && <DeploymentsTab projectId={id} />}
      {activeTab === 'operations' && isOperating && <OperationsTab projectId={id} />}
    </div>
  )
}

// =============================================
// 개요 탭
// =============================================
function OverviewTab({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId)
  const updateProject = useUpdateProject()
  const issues = useDevIssues(projectId)
  const [editMode, setEditMode] = useState(false)

  // 편집 상태
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'in_progress')
  const [devPhase, setDevPhase] = useState<DevPhase>(project?.dev_phase ?? 'planning')
  const [progress, setProgress] = useState(project?.progress ?? 0)
  const [latestUpdate, setLatestUpdate] = useState(project?.latest_update ?? '')
  const [nextAction, setNextAction] = useState(project?.next_action ?? '')

  if (!project) return null

  const openIssues = issues.data?.filter(i => i.status === 'open' || i.status === 'in_progress') ?? []
  const currentPhaseIdx = DEV_PHASE_ORDER.indexOf(project.dev_phase ?? 'planning')

  async function handleSave() {
    await updateProject.mutateAsync({
      id: projectId, status, dev_phase: devPhase, progress,
      latest_update: latestUpdate || null,
      next_action: nextAction || null,
    })
    setEditMode(false)
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* 좌측: 기본 정보 + 계약 */}
      <div className="col-span-12 lg:col-span-4 space-y-5">
        {/* 기본 정보 카드 */}
        <div className="p-6 bg-white/40 glass rounded-3xl space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">기본 정보</h3>
          <InfoRow icon={<Building2 size={13} />} label="클라이언트" value={project.client_name} />
          <InfoRow icon={<User size={13} />} label="PM" value={project.pm_name} />
          {project.dev_type && (
            <InfoRow icon={<GitBranch size={13} />} label="유형" value={DEV_TYPE_LABELS[project.dev_type]} />
          )}
          {project.contract_type && (
            <InfoRow icon={<DollarSign size={13} />} label="계약형태" value={CONTRACT_TYPE_LABELS[project.contract_type]} />
          )}
          {project.contract_amount && (
            <InfoRow icon={<DollarSign size={13} />} label="계약금액" value={formatAmount(project.contract_amount)} />
          )}
        </div>

        {/* 일정 카드 */}
        <div className="p-6 bg-white/40 glass rounded-3xl space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">일정</h3>
          {project.contract_date && <InfoRow icon={<Calendar size={13} />} label="계약일" value={formatDate(project.contract_date)} />}
          {project.start_date && <InfoRow icon={<Calendar size={13} />} label="시작일" value={formatDate(project.start_date)} />}
          {project.deadline && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-text/50">
                <Calendar size={13} />
                납기일
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-orange-text">{formatDate(project.deadline)}</div>
                <div className={`text-[10px] font-black ${
                  calcDday(project.deadline).startsWith('D+') ? 'text-red-500' : 'text-orange-primary'
                }`}>
                  {calcDday(project.deadline)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 열린 이슈 카드 */}
        {openIssues.length > 0 && (
          <div className="p-6 bg-white/40 glass rounded-3xl">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4 flex items-center gap-2">
              <AlertTriangle size={12} />
              오픈 이슈 ({openIssues.length})
            </h3>
            <div className="space-y-2">
              {openIssues.slice(0, 5).map(issue => (
                <div key={issue.id} className="flex items-center gap-2">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${ISSUE_TYPE_COLORS[issue.type]}`}>
                    {ISSUE_TYPE_LABELS[issue.type]}
                  </span>
                  <span className="text-xs font-bold text-orange-text/70 truncate">{issue.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 우측: 현황 */}
      <div className="col-span-12 lg:col-span-8 space-y-5">
        {/* 현황 카드 */}
        <div className="p-6 bg-white/40 glass rounded-3xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-50">프로젝트 현황</h3>
            {editMode ? (
              <div className="flex gap-2">
                <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 bg-orange-primary text-white text-[10px] font-black rounded-xl">
                  <Check size={10} /> 저장
                </button>
                <button onClick={() => setEditMode(false)} className="flex items-center gap-1 px-3 py-1.5 bg-white/50 text-orange-text/50 text-[10px] font-black rounded-xl">
                  <X size={10} /> 취소
                </button>
              </div>
            ) : (
              <button onClick={() => {
                setStatus(project.status)
                setDevPhase(project.dev_phase ?? 'planning')
                setProgress(project.progress)
                setLatestUpdate(project.latest_update ?? '')
                setNextAction(project.next_action ?? '')
                setEditMode(true)
              }} className="flex items-center gap-1 px-3 py-1.5 bg-white/50 text-orange-text/50 text-[10px] font-black rounded-xl hover:bg-white/80">
                <Edit2 size={10} /> 수정
              </button>
            )}
          </div>

          {/* 상태 선택 (편집 모드) */}
          {editMode && (
            <div className="mb-5">
              <div className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">상태</div>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(PROJECT_STATUS_LABELS.development) as [ProjectStatus, string][]).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setStatus(v)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      status === v ? 'bg-orange-primary text-white' : 'bg-white/50 text-orange-text/40 hover:bg-white/80'
                    }`}>{l}</button>
                ))}
              </div>
            </div>
          )}

          {/* 개발 단계 스텝퍼 */}
          <div className="mb-6">
            <div className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-3">개발 단계</div>
            {editMode ? (
              <div className="flex flex-wrap gap-2">
                {DEV_PHASE_ORDER.map(phase => (
                  <button key={phase} type="button" onClick={() => setDevPhase(phase as DevPhase)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      devPhase === phase ? 'bg-white text-orange-primary border border-orange-200 shadow-sm' : 'bg-white/50 text-orange-text/40 hover:bg-white/80'
                    }`}>{DEV_PHASE_LABELS[phase]}</button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {DEV_PHASE_ORDER.map((phase, idx) => {
                  const isDone = idx < currentPhaseIdx
                  const isCurrent = idx === currentPhaseIdx
                  return (
                    <div key={phase} className="flex items-center flex-1">
                      <div className={`flex-1 text-center py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        isCurrent ? 'bg-orange-primary text-white shadow-md' :
                        isDone ? 'bg-orange-100 text-orange-400' :
                        'bg-white/30 text-orange-text/20'
                      }`}>
                        {isDone && <span className="mr-0.5">✓</span>}
                        {DEV_PHASE_LABELS[phase]}
                      </div>
                      {idx < DEV_PHASE_ORDER.length - 1 && (
                        <div className={`w-2 h-0.5 mx-0.5 ${isDone ? 'bg-orange-300' : 'bg-orange-100'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 진행률 */}
          <div className="mb-5">
            <div className="flex justify-between text-[10px] font-black opacity-50 uppercase mb-2">
              <span>전체 진행률</span>
              <span>{editMode ? progress : project.progress}%</span>
            </div>
            {editMode ? (
              <input type="range" min={0} max={100} value={progress}
                onChange={e => setProgress(Number(e.target.value))}
                className="w-full accent-orange-primary mb-1" />
            ) : null}
            <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-primary to-orange-secondary rounded-full transition-all"
                style={{ width: `${editMode ? progress : project.progress}%` }} />
            </div>
          </div>

          {/* 현황 메모 + 다음 할 일 */}
          {editMode ? (
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1.5">최근 현황</div>
                <textarea value={latestUpdate} onChange={e => setLatestUpdate(e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-xs font-bold bg-white/80 rounded-xl border border-white/50 focus:outline-none focus:ring-2 focus:ring-orange-primary/30 resize-none"
                  placeholder="현재 진행 상황을 간단히 기록하세요" />
              </div>
              <div>
                <div className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1.5">다음 할 일</div>
                <textarea value={nextAction} onChange={e => setNextAction(e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-xs font-bold bg-white/80 rounded-xl border border-white/50 focus:outline-none focus:ring-2 focus:ring-orange-primary/30 resize-none"
                  placeholder="다음 액션 아이템을 입력하세요" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {project.latest_update && (
                <div className="p-3 bg-white/40 rounded-2xl">
                  <div className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1">최근 현황</div>
                  <p className="text-xs font-bold text-orange-text/80">{project.latest_update}</p>
                </div>
              )}
              {project.next_action && (
                <div className="p-3 bg-orange-50/60 rounded-2xl border border-orange-100">
                  <div className="text-[9px] font-black text-orange-primary/60 uppercase tracking-widest mb-1">다음 할 일</div>
                  <p className="text-xs font-bold text-orange-text/80">{project.next_action}</p>
                </div>
              )}
              {!project.latest_update && !project.next_action && (
                <p className="text-xs font-bold opacity-30 text-center py-3">현황을 업데이트해보세요</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 정보 행 컴포넌트
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-bold text-orange-text/40">
        {icon}
        {label}
      </div>
      <span className="text-xs font-bold text-orange-text/80">{value}</span>
    </div>
  )
}

// =============================================
// 기능 명세 탭
// =============================================
function FeaturesTab({ projectId }: { projectId: string }) {
  const { data: features = [], isLoading } = useDevFeatures(projectId)
  const createFeature = useCreateDevFeature()
  const updateFeature = useUpdateDevFeature()
  const deleteFeature = useDeleteDevFeature()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<FeaturePriority>('required')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createFeature.mutateAsync({ project_id: projectId, title, description: description || null, priority, position: features.length })
    setTitle(''); setDescription(''); setShowForm(false)
  }

  const stats = {
    total: features.length,
    completed: features.filter(f => f.status === 'completed').length,
    inProgress: features.filter(f => f.status === 'in_progress').length,
  }

  return (
    <div className="space-y-5">
      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '전체', value: stats.total, color: 'text-orange-text' },
          { label: '진행중', value: stats.inProgress, color: 'text-blue-600' },
          { label: '완료', value: stats.completed, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="p-4 bg-white/40 glass rounded-2xl text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 추가 버튼 */}
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-primary text-white text-xs font-black rounded-2xl hover:bg-orange-secondary transition-colors">
          <Plus size={14} /> 기능 추가
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <form onSubmit={handleCreate} className="p-5 bg-white/60 glass rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="기능명" className="w-full px-4 py-2.5 bg-white/80 rounded-xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="기능 설명 (선택)" className="w-full px-4 py-2.5 bg-white/80 rounded-xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 resize-none" />
          <div className="flex gap-2">
            {(Object.entries(FEATURE_PRIORITY_LABELS) as [FeaturePriority, string][]).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setPriority(v)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  priority === v ? FEATURE_PRIORITY_COLORS[v] + ' ring-1 ring-current' : 'bg-white/50 text-orange-text/40'
                }`}>{l}</button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[10px] font-black text-orange-text/40 hover:text-orange-text/70">취소</button>
            <button type="submit" disabled={createFeature.isPending}
              className="px-4 py-2 bg-orange-primary text-white text-[10px] font-black rounded-xl disabled:opacity-50">추가</button>
          </div>
        </form>
      )}

      {/* 기능 목록 */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-white/30 rounded-2xl animate-pulse" />)}</div>
      ) : features.length === 0 ? (
        <div className="text-center py-16 text-orange-text/40">
          <GitBranch size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-black">기능 명세서가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {features.map(feature => (
            <div key={feature.id} className="p-4 bg-white/40 glass rounded-2xl flex items-center gap-4 group">
              {/* 우선순위 */}
              <span className={`text-[9px] font-black px-2 py-1 rounded-lg flex-shrink-0 ${FEATURE_PRIORITY_COLORS[feature.priority]}`}>
                {FEATURE_PRIORITY_LABELS[feature.priority]}
              </span>
              {/* 제목 */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-orange-text truncate">{feature.title}</div>
                {feature.description && <div className="text-xs font-bold opacity-40 truncate mt-0.5">{feature.description}</div>}
              </div>
              {/* 상태 선택 */}
              <select
                value={feature.status}
                onChange={e => updateFeature.mutate({ id: feature.id, project_id: projectId, status: e.target.value as FeatureStatus })}
                className={`text-[9px] font-black px-2 py-1.5 rounded-xl border-0 focus:outline-none focus:ring-1 focus:ring-orange-primary/30 cursor-pointer ${FEATURE_STATUS_COLORS[feature.status]}`}
              >
                {(Object.entries(FEATURE_STATUS_LABELS) as [FeatureStatus, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              {/* 삭제 */}
              <button onClick={() => { if (confirm(`"${feature.title}" 항목을 삭제할까요?`)) deleteFeature.mutate({ id: feature.id, project_id: projectId }) }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-orange-text/30">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================
// 테스트 탭
// =============================================
function TestsTab({ projectId }: { projectId: string }) {
  const { data: testCases = [], isLoading } = useDevTestCases(projectId)
  const { data: features = [] } = useDevFeatures(projectId)
  const createTestCase = useCreateDevTestCase()
  const updateTestCase = useUpdateDevTestCase()
  const deleteTestCase = useDeleteDevTestCase()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [scenario, setScenario] = useState('')
  const [expectedResult, setExpectedResult] = useState('')
  const [featureId, setFeatureId] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createTestCase.mutateAsync({
      project_id: projectId, title,
      scenario: scenario || null,
      expected_result: expectedResult || null,
      feature_id: featureId || null,
      position: testCases.length,
    })
    setTitle(''); setScenario(''); setExpectedResult(''); setFeatureId(''); setShowForm(false)
  }

  const stats = {
    total: testCases.length,
    pass: testCases.filter(t => t.status === 'pass').length,
    fail: testCases.filter(t => t.status === 'fail').length,
    pending: testCases.filter(t => t.status === 'pending').length,
  }
  const passRate = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0

  return (
    <div className="space-y-5">
      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '전체', value: stats.total, color: 'text-orange-text' },
          { label: '통과', value: stats.pass, color: 'text-green-600' },
          { label: '실패', value: stats.fail, color: 'text-red-500' },
          { label: '통과율', value: `${passRate}%`, color: passRate >= 80 ? 'text-green-600' : 'text-orange-primary' },
        ].map(s => (
          <div key={s.label} className="p-4 bg-white/40 glass rounded-2xl text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-primary text-white text-xs font-black rounded-2xl hover:bg-orange-secondary transition-colors">
          <Plus size={14} /> 테스트 케이스 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="p-5 bg-white/60 glass rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="테스트 케이스명" className="w-full px-4 py-2.5 bg-white/80 rounded-xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30" />
          <textarea value={scenario} onChange={e => setScenario(e.target.value)} rows={2}
            placeholder="테스트 시나리오" className="w-full px-4 py-2.5 bg-white/80 rounded-xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 resize-none" />
          <input type="text" value={expectedResult} onChange={e => setExpectedResult(e.target.value)}
            placeholder="예상 결과" className="w-full px-4 py-2.5 bg-white/80 rounded-xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30" />
          {features.length > 0 && (
            <select value={featureId} onChange={e => setFeatureId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/80 rounded-xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30">
              <option value="">연결된 기능 (선택)</option>
              {features.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[10px] font-black text-orange-text/40 hover:text-orange-text/70">취소</button>
            <button type="submit" disabled={createTestCase.isPending}
              className="px-4 py-2 bg-orange-primary text-white text-[10px] font-black rounded-xl disabled:opacity-50">추가</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-white/30 rounded-2xl animate-pulse" />)}</div>
      ) : testCases.length === 0 ? (
        <div className="text-center py-16 text-orange-text/40">
          <FlaskConical size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-black">테스트 케이스가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {testCases.map(tc => (
            <div key={tc.id} className="p-4 bg-white/40 glass rounded-2xl flex items-start gap-4 group">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-orange-text">{tc.title}</div>
                {tc.feature && <div className="text-[10px] font-black text-orange-primary/50 mt-0.5">{tc.feature.title}</div>}
                {tc.scenario && <div className="text-xs font-bold opacity-40 mt-1 line-clamp-1">{tc.scenario}</div>}
                {tc.actual_result && (
                  <input type="text" value={tc.actual_result}
                    onChange={e => updateTestCase.mutate({ id: tc.id, project_id: projectId, actual_result: e.target.value })}
                    className="mt-1.5 w-full px-2 py-1 text-[10px] font-bold bg-white/60 rounded-lg border border-white/50 focus:outline-none"
                    placeholder="실제 결과 입력" />
                )}
              </div>
              <select
                value={tc.status}
                onChange={e => updateTestCase.mutate({ id: tc.id, project_id: projectId, status: e.target.value as TestCaseStatus, tested_at: e.target.value !== 'pending' ? new Date().toISOString() : null })}
                className={`text-[9px] font-black px-2 py-1.5 rounded-xl border-0 focus:outline-none cursor-pointer flex-shrink-0 ${TEST_STATUS_COLORS[tc.status]}`}
              >
                {(Object.entries(TEST_STATUS_LABELS) as [TestCaseStatus, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <button onClick={() => { if (confirm(`"${tc.title}" 항목을 삭제할까요?`)) deleteTestCase.mutate({ id: tc.id, project_id: projectId }) }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-orange-text/30 mt-0.5">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================
// 배포 이력 탭
// =============================================
function DeploymentsTab({ projectId }: { projectId: string }) {
  const { data: deployments = [], isLoading } = useDevDeployments(projectId)
  const createDeployment = useCreateDevDeployment()
  const deleteDeployment = useDeleteDevDeployment()
  const [showForm, setShowForm] = useState(false)
  const [version, setVersion] = useState('')
  const [environment, setEnvironment] = useState<DeployEnvironment>('dev')
  const [summary, setSummary] = useState('')
  const [isRollback, setIsRollback] = useState(false)
  const [deployedAt, setDeployedAt] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createDeployment.mutateAsync({
      project_id: projectId, version, environment, summary: summary || null,
      is_rollback: isRollback,
      deployed_at: deployedAt || new Date().toISOString(),
    })
    setVersion(''); setSummary(''); setIsRollback(false); setDeployedAt(''); setShowForm(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-primary text-white text-xs font-black rounded-2xl hover:bg-orange-secondary transition-colors">
          <Plus size={14} /> 배포 이력 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="p-5 bg-white/60 glass rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={version} onChange={e => setVersion(e.target.value)} required
              placeholder="버전 (예: v1.2.0)" className="px-4 py-2.5 bg-white/80 rounded-xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30" />
            <input type="datetime-local" value={deployedAt} onChange={e => setDeployedAt(e.target.value)}
              className="px-4 py-2.5 bg-white/80 rounded-xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30" />
          </div>
          <div className="flex gap-2">
            {(Object.entries(DEPLOY_ENV_LABELS) as [DeployEnvironment, string][]).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setEnvironment(v)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  environment === v ? DEPLOY_ENV_COLORS[v] + ' ring-1 ring-current' : 'bg-white/50 text-orange-text/40'
                }`}>{l}</button>
            ))}
          </div>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2}
            placeholder="반영 내용 요약" className="w-full px-4 py-2.5 bg-white/80 rounded-xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 resize-none" />
          <label className="flex items-center gap-2 text-xs font-bold text-orange-text/60 cursor-pointer">
            <input type="checkbox" checked={isRollback} onChange={e => setIsRollback(e.target.checked)} className="accent-orange-primary" />
            <RefreshCw size={12} /> 롤백 여부
          </label>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[10px] font-black text-orange-text/40 hover:text-orange-text/70">취소</button>
            <button type="submit" disabled={createDeployment.isPending}
              className="px-4 py-2 bg-orange-primary text-white text-[10px] font-black rounded-xl disabled:opacity-50">추가</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/30 rounded-2xl animate-pulse" />)}</div>
      ) : deployments.length === 0 ? (
        <div className="text-center py-16 text-orange-text/40">
          <Rocket size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-black">배포 이력이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deployments.map(dep => (
            <div key={dep.id} className="p-4 bg-white/40 glass rounded-2xl flex items-start gap-4 group">
              <div className="flex-shrink-0 text-center">
                <div className="text-sm font-black text-orange-text">{dep.version}</div>
                {dep.is_rollback && <div className="text-[9px] font-black text-orange-primary mt-0.5 flex items-center gap-1"><RefreshCw size={9} />롤백</div>}
              </div>
              <div className="flex-1 min-w-0">
                {dep.summary && <div className="text-xs font-bold text-orange-text/70 mb-1">{dep.summary}</div>}
                <div className="flex items-center gap-2 text-[10px] font-bold text-orange-text/40">
                  <span>{dep.deployer?.full_name ?? '담당자'}</span>
                  <span>·</span>
                  <span>{new Date(dep.deployed_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <span className={`text-[9px] font-black px-2 py-1 rounded-lg flex-shrink-0 ${DEPLOY_ENV_COLORS[dep.environment]}`}>
                {DEPLOY_ENV_LABELS[dep.environment]}
              </span>
              <button onClick={() => { if (confirm('이 배포 이력을 삭제할까요?')) deleteDeployment.mutate({ id: dep.id, project_id: projectId }) }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-orange-text/30">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================
// 운영 탭 (운영중 상태일 때만 활성화)
// =============================================
function OperationsTab({ projectId }: { projectId: string }) {
  const { data: issues = [], isLoading } = useDevIssues(projectId)
  const createIssue = useCreateDevIssue()
  const updateIssue = useUpdateDevIssue()
  const deleteIssue = useDeleteDevIssue()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<IssueType>('issue')
  const [priority, setPriority] = useState<IssuePriority>('medium')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createIssue.mutateAsync({ project_id: projectId, title, description: description || null, type, priority })
    setTitle(''); setDescription(''); setShowForm(false)
  }

  const openIssues = issues.filter(i => i.status !== 'closed' && i.status !== 'resolved')
  const resolvedIssues = issues.filter(i => i.status === 'resolved' || i.status === 'closed')

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-primary text-white text-xs font-black rounded-2xl hover:bg-orange-secondary transition-colors">
          <Plus size={14} /> 이슈 등록
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="p-5 bg-white/60 glass rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="이슈명" className="w-full px-4 py-2.5 bg-white/80 rounded-xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="상세 내용 (선택)" className="w-full px-4 py-2.5 bg-white/80 rounded-xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 resize-none" />
          <div className="flex gap-4">
            <div className="space-y-1.5">
              <div className="text-[9px] font-black opacity-40 uppercase tracking-widest">유형</div>
              <div className="flex gap-1.5">
                {(Object.entries(ISSUE_TYPE_LABELS) as [IssueType, string][]).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setType(v)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      type === v ? ISSUE_TYPE_COLORS[v] + ' ring-1 ring-current' : 'bg-white/50 text-orange-text/40'
                    }`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-[9px] font-black opacity-40 uppercase tracking-widest">우선순위</div>
              <div className="flex gap-1.5">
                {(Object.entries(ISSUE_PRIORITY_LABELS) as [IssuePriority, string][]).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setPriority(v)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      priority === v ? ISSUE_PRIORITY_COLORS[v] + ' ring-1 ring-current' : 'bg-white/50 text-orange-text/40'
                    }`}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[10px] font-black text-orange-text/40 hover:text-orange-text/70">취소</button>
            <button type="submit" disabled={createIssue.isPending}
              className="px-4 py-2 bg-orange-primary text-white text-[10px] font-black rounded-xl disabled:opacity-50">등록</button>
          </div>
        </form>
      )}

      {/* 오픈 이슈 */}
      <div>
        <div className="text-xs font-black uppercase tracking-widest opacity-50 mb-3">오픈 이슈 ({openIssues.length})</div>
        {isLoading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-white/30 rounded-2xl animate-pulse" />)}</div>
        ) : openIssues.length === 0 ? (
          <div className="p-4 bg-white/30 rounded-2xl text-center text-xs font-bold opacity-30">오픈 이슈 없음</div>
        ) : (
          <div className="space-y-2">
            {openIssues.map(issue => (
              <div key={issue.id} className="p-4 bg-white/40 glass rounded-2xl flex items-start gap-3 group">
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${ISSUE_TYPE_COLORS[issue.type]}`}>{ISSUE_TYPE_LABELS[issue.type]}</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${ISSUE_PRIORITY_COLORS[issue.priority]}`}>{ISSUE_PRIORITY_LABELS[issue.priority]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-orange-text">{issue.title}</div>
                  {issue.description && <div className="text-xs font-bold opacity-40 mt-0.5 line-clamp-1">{issue.description}</div>}
                </div>
                <select
                  value={issue.status}
                  onChange={e => updateIssue.mutate({ id: issue.id, project_id: projectId, status: e.target.value as IssueStatus, resolved_at: (e.target.value === 'resolved' || e.target.value === 'closed') ? new Date().toISOString() : null })}
                  className={`text-[9px] font-black px-2 py-1.5 rounded-xl border border-current focus:outline-none cursor-pointer flex-shrink-0 ${ISSUE_STATUS_COLORS[issue.status]}`}
                >
                  {(Object.entries(ISSUE_STATUS_LABELS) as [IssueStatus, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <button onClick={() => { if (confirm(`"${issue.title}" 이슈를 삭제할까요?`)) deleteIssue.mutate({ id: issue.id, project_id: projectId }) }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-orange-text/30">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 해결된 이슈 */}
      {resolvedIssues.length > 0 && (
        <div>
          <div className="text-xs font-black uppercase tracking-widest opacity-30 mb-3">해결된 이슈 ({resolvedIssues.length})</div>
          <div className="space-y-2">
            {resolvedIssues.map(issue => (
              <div key={issue.id} className="p-3 bg-white/20 rounded-2xl flex items-center gap-3 opacity-50 group">
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${ISSUE_TYPE_COLORS[issue.type]}`}>{ISSUE_TYPE_LABELS[issue.type]}</span>
                <span className="text-xs font-bold text-orange-text/60 flex-1 line-through">{issue.title}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border flex-shrink-0 ${ISSUE_STATUS_COLORS[issue.status]}`}>{ISSUE_STATUS_LABELS[issue.status]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
