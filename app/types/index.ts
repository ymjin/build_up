export type ProjectStatus = 'planning' | 'development' | 'testing' | 'completed'
export type ProjectCategory = 'rnd' | 'development'
export type ProjectConclusion = 'ongoing' | 'pending' | 'dropped'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type MemberRole = 'owner' | 'admin' | 'member' | 'tester'

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
  conclusion: ProjectConclusion | null
  progress: number
  owner_id: string
  drive_folder_id?: string
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
