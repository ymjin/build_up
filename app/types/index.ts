// =============================================
// 공통 타입
// =============================================
export type ProjectStatus =
  | 'planning'          // (하위호환) R&D 기존 상태
  | 'development'       // (하위호환)
  | 'testing'           // (하위호환)
  | 'completed'         // 완료 (공통)
  | 'contract_pending'  // 계약협의 (개발 전용)
  | 'in_progress'       // 진행중 (개발 전용)
  | 'review'            // 검수 (개발 전용)
  | 'operating'         // 운영중 (개발 전용)
  | 'on_hold'           // 보류 (개발 전용)

export type ProjectCategory = 'external' | 'internal' | 'personal'
export type ProjectConclusion = 'ongoing' | 'pending' | 'dropped'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type MemberRole = 'owner' | 'admin' | 'member' | 'tester'

// 개발 프로젝트 - 내부 개발 단계
export type DevPhase = 'planning' | 'design' | 'development' | 'qa' | 'review' | 'done'

// 개발 프로젝트 - 유형
export type DevType = 'web' | 'app' | 'system' | 'maintenance' | 'other'

// 개발 프로젝트 - 계약형태
export type ContractType = 'fixed' | 'time' | 'maintenance'

// 기능 명세서 - 우선순위 / 상태
export type FeaturePriority = 'required' | 'recommended' | 'optional'
export type FeatureStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold'

// 테스트 케이스 - 상태
export type TestCaseStatus = 'pending' | 'pass' | 'fail' | 'skip'

// 배포 환경
export type DeployEnvironment = 'dev' | 'staging' | 'production'

// 이슈 - 유형 / 상태 / 우선순위
export type IssueType = 'issue' | 'risk' | 'cr'
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical'

// =============================================
// 인터페이스
// =============================================
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  department: string | null
  is_admin?: boolean
  created_at: string
}

export interface ProjectAttachment {
  id: string
  project_id: string
  file_name: string
  file_size: number
  file_type: string
  file_path: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  category: ProjectCategory
  conclusion?: ProjectConclusion | null
  progress: number
  owner_id: string
  drive_folder_id?: string
  // 개발 프로젝트 전용 필드
  client_name?: string | null
  dev_type?: DevType | null
  contract_date?: string | null
  start_date?: string | null
  deadline?: string | null
  contract_amount?: number | null
  contract_type?: ContractType | null
  pm_name?: string | null
  dev_phase?: DevPhase | null
  latest_update?: string | null
  next_action?: string | null
  attachments?: ProjectAttachment[]
  created_at: string
  updated_at: string
  member_count?: number
  task_count?: number
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  assignee_id: string | null
  due_date: string | null
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
  assignee?: Profile
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: MemberRole
  joined_at: string
  profile?: Profile
}

export interface Comment {
  id: string
  project_id: string
  task_id: string | null
  author_id: string
  content: string
  created_at: string
  author?: Profile
}

export interface Activity {
  id: string
  project_id: string
  user_id: string
  action: string
  target: string
  created_at: string
  user?: Profile
}

// 기능 명세서
export interface DevFeature {
  id: string
  project_id: string
  parent_id: string | null   // 상위 Feature ID (null이면 최상위)
  title: string
  description: string | null
  priority: FeaturePriority
  status: FeatureStatus
  assignee_id: string | null
  position: number
  created_at: string
  updated_at: string
  assignee?: Profile
}

// 테스트 케이스
export interface DevTestCase {
  id: string
  project_id: string
  feature_id: string | null
  title: string
  scenario: string | null
  expected_result: string | null
  actual_result: string | null
  status: TestCaseStatus
  tested_by: string | null
  tested_at: string | null
  position: number
  created_at: string
  tester?: Profile
  feature?: DevFeature
}

// 배포 이력
export interface DevDeployment {
  id: string
  project_id: string
  version: string
  environment: DeployEnvironment
  summary: string | null
  is_rollback: boolean
  deployed_by: string | null
  deployed_at: string
  created_at: string
  deployer?: Profile
}

// 이슈 / 리스크 / 변경요청
export interface DevIssue {
  id: string
  project_id: string
  title: string
  description: string | null
  type: IssueType
  status: IssueStatus
  priority: IssuePriority
  assignee_id: string | null
  resolved_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  assignee?: Profile
  creator?: Profile
}
