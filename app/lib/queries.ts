import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Project, Task, ProjectMember, Comment, Activity } from '@/types'

function getSupabase() {
  return createClient()
}

// =============================================
// Projects
// =============================================
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('projects')
        .select(`
          *,
          member_count:project_members(count),
          task_count:tasks(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (Project & { member_count: { count: number }[]; task_count: { count: number }[] })[]
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Project
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: Partial<Project>) => {
      const { data: { user } } = await getSupabase().auth.getUser()
      const { data, error } = await getSupabase()
        .from('projects')
        .insert({ ...values, owner_id: user!.id })
        .select()
        .single()

      if (error) throw error

      // 소유자를 멤버로 자동 추가
      await getSupabase().from('project_members').insert({
        project_id: data.id,
        user_id: user!.id,
        role: 'owner',
      })

      return data as Project
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Project> & { id: string }) => {
      const { data, error } = await getSupabase()
        .from('projects')
        .update(values)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Project
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', data.id] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from('projects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// =============================================
// Tasks
// =============================================
export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('tasks')
        .select(`*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)`)
        .eq('project_id', projectId)
        .order('position', { ascending: true })

      if (error) throw error
      return data as Task[]
    },
    enabled: !!projectId,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: Partial<Task> & { project_id: string }) => {
      const { data, error } = await getSupabase()
        .from('tasks')
        .insert(values)
        .select()
        .single()

      if (error) throw error
      return data as Task
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.project_id] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, project_id, ...values }: Partial<Task> & { id: string; project_id: string }) => {
      const { data, error } = await getSupabase()
        .from('tasks')
        .update(values)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { ...data, project_id } as Task
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.project_id] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await getSupabase().from('tasks').delete().eq('id', id)
      if (error) throw error
      return project_id
    },
    onSuccess: (project_id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', project_id] })
    },
  })
}

// =============================================
// Members
// =============================================
export function useMembers(projectId: string) {
  return useQuery({
    queryKey: ['members', projectId],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('project_members')
        .select(`*, profile:profiles(id, email, full_name, avatar_url)`)
        .eq('project_id', projectId)
        .order('joined_at', { ascending: true })

      if (error) throw error
      return data as ProjectMember[]
    },
    enabled: !!projectId,
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, email, role }: { projectId: string; email: string; role: string }) => {
      // 이메일로 사용자 조회
      const { data: profile, error: profileError } = await getSupabase()
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profileError) throw new Error('해당 이메일의 사용자를 찾을 수 없습니다')

      const { error } = await getSupabase().from('project_members').insert({
        project_id: projectId,
        user_id: profile.id,
        role,
      })

      if (error) {
        if (error.code === '23505') throw new Error('이미 프로젝트 멤버입니다')
        throw error
      }
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] })
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, projectId }: { memberId: string; projectId: string }) => {
      const { error } = await getSupabase().from('project_members').delete().eq('id', memberId)
      if (error) throw error
      return projectId
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] })
    },
  })
}

// =============================================
// Comments
// =============================================
export function useComments(projectId: string) {
  return useQuery({
    queryKey: ['comments', projectId],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('comments')
        .select(`*, author:profiles(id, full_name, avatar_url)`)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data as Comment[]
    },
    enabled: !!projectId,
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: { project_id: string; task_id?: string; content: string }) => {
      const { data: { user } } = await getSupabase().auth.getUser()
      const { data, error } = await getSupabase()
        .from('comments')
        .insert({ ...values, author_id: user!.id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', data.project_id] })
    },
  })
}

// =============================================
// Attachments
// =============================================
export function useProjectAttachments(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'attachments'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('project_attachments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ProjectAttachment[]
    },
    enabled: !!projectId,
  })
}

// =============================================
// Activities
// =============================================
export function useActivities(projectId: string) {
  return useQuery({
    queryKey: ['activities', projectId],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('activities')
        .select(`*, user:profiles(id, full_name, avatar_url)`)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data as Activity[]
    },
    enabled: !!projectId,
  })
}
