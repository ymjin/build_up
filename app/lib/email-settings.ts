// =============================================
// 이메일 설정 타입 및 localStorage 유틸리티
// 수신자는 프로젝트 멤버로 자동 결정 — 별도 관리 불필요
// =============================================

const STORAGE_KEY = 'buildup-email-settings'

export interface EmailSettings {
  // 이벤트별 알림 ON/OFF
  events: {
    project_status_changed: boolean  // 프로젝트 상태 변경
    deadline_reminder: boolean       // 납기일 임박 알림
    issue_created: boolean           // 이슈 등록
    member_invited: boolean          // 팀원 초대
  }
}

// 기본 설정값
const DEFAULT_SETTINGS: EmailSettings = {
  events: {
    project_status_changed: true,
    deadline_reminder: true,
    issue_created: true,
    member_invited: false,
  },
}

// 이벤트 라벨 (UI 표시용)
export const EMAIL_EVENT_LABELS: Record<keyof EmailSettings['events'], string> = {
  project_status_changed: '프로젝트 상태 변경',
  deadline_reminder: '납기일 임박 알림',
  issue_created: '이슈 등록',
  member_invited: '팀원 초대',
}

export const EMAIL_EVENT_DESCRIPTIONS: Record<keyof EmailSettings['events'], string> = {
  project_status_changed: '상태 변경 시 해당 프로젝트 전체 멤버에게 알림',
  deadline_reminder: '납기일 D-7, D-3, D-1에 전체 멤버에게 자동 알림',
  issue_created: '이슈 등록 시 해당 프로젝트 전체 멤버에게 알림',
  member_invited: '팀원이 초대될 때 초대받은 본인에게 알림',
}

// 설정 불러오기
export function loadEmailSettings(): EmailSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<EmailSettings>
    return {
      events: { ...DEFAULT_SETTINGS.events, ...parsed.events },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

// 설정 저장
export function saveEmailSettings(settings: EmailSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

// 특정 이벤트 알림이 켜져있는지 확인
export function isEventEnabled(eventKey: keyof EmailSettings['events']): boolean {
  return loadEmailSettings().events[eventKey]
}
