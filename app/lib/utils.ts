import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PROJECT_STATUS_LABELS: Record<string, Record<string, string>> = {
  rnd: {
    planning: '검토',
    development: '작성',
    testing: '완료',
    completed: '제출',
  },
  development: {
    planning: '기획',
    development: '개발',
    testing: '테스트',
    completed: '완료',
  },
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
