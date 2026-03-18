import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// R&D 과제 상태 레이블 (기존 유지)
export const PROJECT_STATUS_LABELS: Record<string, Record<string, string>> = {
  rnd: {
    planning: '검토',
    development: '작성',
    testing: '완료',
    completed: '제출',
  },
  // 개발 프로젝트 전용 상태
  development: {
    contract_pending: '계약협의',
    in_progress: '진행중',
    review: '검수',
    operating: '운영중',
    completed: '완료',
    on_hold: '보류',
  },
}

// 개발 프로젝트 상태 색상
export const DEV_STATUS_COLORS: Record<string, string> = {
  contract_pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-yellow-100 text-yellow-700',
  operating: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-red-100 text-red-500',
}

// 개발 내부 단계(phase) 레이블
export const DEV_PHASE_LABELS: Record<string, string> = {
  planning: '기획',
  design: '디자인',
  development: '개발',
  qa: 'QA',
  review: '검수',
  done: '완료',
}

// 개발 단계 순서 (스텝퍼용)
export const DEV_PHASE_ORDER = ['planning', 'design', 'development', 'qa', 'review', 'done']

// 프로젝트 유형 레이블
export const DEV_TYPE_LABELS: Record<string, string> = {
  web: '웹',
  app: '앱',
  system: '시스템통합',
  maintenance: '유지보수',
  other: '기타',
}

// 계약형태 레이블
export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  fixed: '고정가',
  time: '시간제',
  maintenance: '유지보수',
}

// 기능 명세서 우선순위
export const FEATURE_PRIORITY_LABELS: Record<string, string> = {
  required: '필수',
  recommended: '권장',
  optional: '선택',
}

export const FEATURE_PRIORITY_COLORS: Record<string, string> = {
  required: 'bg-red-100 text-red-600',
  recommended: 'bg-orange-100 text-orange-600',
  optional: 'bg-slate-100 text-slate-500',
}

// 기능 명세서 상태
export const FEATURE_STATUS_LABELS: Record<string, string> = {
  pending: '미착수',
  in_progress: '진행중',
  completed: '완료',
  on_hold: '보류',
}

export const FEATURE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-500',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-600',
}

// 테스트 케이스 상태
export const TEST_STATUS_LABELS: Record<string, string> = {
  pending: '미실시',
  pass: '통과',
  fail: '실패',
  skip: '건너뜀',
}

export const TEST_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-500',
  pass: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-600',
  skip: 'bg-yellow-100 text-yellow-600',
}

// 배포 환경 레이블
export const DEPLOY_ENV_LABELS: Record<string, string> = {
  dev: '개발계',
  staging: '스테이징',
  production: '운영',
}

export const DEPLOY_ENV_COLORS: Record<string, string> = {
  dev: 'bg-slate-100 text-slate-600',
  staging: 'bg-blue-100 text-blue-700',
  production: 'bg-green-100 text-green-700',
}

// 이슈 유형 레이블
export const ISSUE_TYPE_LABELS: Record<string, string> = {
  issue: '이슈',
  risk: '리스크',
  cr: '변경요청',
}

export const ISSUE_TYPE_COLORS: Record<string, string> = {
  issue: 'bg-red-100 text-red-600',
  risk: 'bg-orange-100 text-orange-600',
  cr: 'bg-blue-100 text-blue-700',
}

// 이슈 우선순위
export const ISSUE_PRIORITY_LABELS: Record<string, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  critical: '긴급',
}

export const ISSUE_PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-500',
  medium: 'bg-yellow-100 text-yellow-600',
  high: 'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-600',
}

// 이슈 상태
export const ISSUE_STATUS_LABELS: Record<string, string> = {
  open: '오픈',
  in_progress: '처리중',
  resolved: '해결',
  closed: '종료',
}

export const ISSUE_STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-50 text-red-500 border-red-200',
  in_progress: 'bg-blue-50 text-blue-600 border-blue-200',
  resolved: 'bg-green-50 text-green-600 border-green-200',
  closed: 'bg-slate-50 text-slate-500 border-slate-200',
}

export const CONCLUSION_LABELS: Record<string, string> = {
  ongoing: '진행',
  pending: '보류',
  dropped: '중단',
}

export const CONCLUSION_COLORS: Record<string, string> = {
  ongoing: 'bg-blue-50 text-blue-600 border-blue-200',
  pending: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  dropped: 'bg-red-50 text-red-600 border-red-200',
}

export const STATUS_LABELS: Record<string, string> = {
  todo: '할 일',
  in_progress: '진행 중',
  done: '완료',
}

export const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-purple-100 text-purple-700',
  development: 'bg-blue-100 text-blue-700',
  testing: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  contract_pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-yellow-100 text-yellow-700',
  operating: 'bg-green-100 text-green-700',
  on_hold: 'bg-red-100 text-red-500',
}

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-orange-100 text-orange-600',
  high: 'bg-red-100 text-red-600',
}

export const ROLE_LABELS: Record<string, string> = {
  owner: '소유자',
  admin: '관리자',
  member: '멤버',
  tester: '테스터',
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  return `${days}일 전`
}

// D-Day 계산
export function calcDday(deadline: string): string {
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (diff === 0) return 'D-Day'
  if (diff > 0) return `D-${diff}`
  return `D+${Math.abs(diff)}`
}

// 금액 포맷 (천 단위 콤마)
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}
