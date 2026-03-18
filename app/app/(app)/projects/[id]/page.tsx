'use client'

import { use, useState } from 'react'
import { useProject, useUpdateProject, useActivities, useComments, useCreateComment, useProjectAttachments } from '@/lib/queries'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { STATUS_COLORS, PROJECT_STATUS_LABELS, CONCLUSION_LABELS, CONCLUSION_COLORS, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Users, Settings, MessageSquare, Send, FileText, Paperclip } from 'lucide-react'
import type { ProjectStatus, ProjectConclusion } from '@/types'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: project, isLoading } = useProject(id)
  const { data: activities = [] } = useActivities(id)
  const { data: comments = [] } = useComments(id)
  const { data: attachments = [] } = useProjectAttachments(id)
  const updateProject = useUpdateProject()
  const createComment = useCreateComment()

  const [editProgress, setEditProgress] = useState(false)
  const [progress, setProgress] = useState(0)
  const [newComment, setNewComment] = useState('')

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 bg-white/30 rounded-2xl w-48 mb-4 animate-pulse" />
        <div className="h-64 bg-white/30 glass rounded-3xl animate-pulse" />
      </div>
    )
  }

  if (!project) return null

  async function handleStatusChange(status: ProjectStatus) {
    await updateProject.mutateAsync({ id, status })
  }

  async function handleConclusionChange(conclusion: ProjectConclusion) {
    await updateProject.mutateAsync({ id, conclusion })
  }

  async function handleProgressSave() {
    await updateProject.mutateAsync({ id, progress })
    setEditProgress(false)
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    await createComment.mutateAsync({ project_id: id, content: newComment.trim() })
    setNewComment('')
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/projects" className="flex items-center gap-2 text-xs font-black opacity-40 uppercase tracking-widest hover:opacity-70 transition-opacity mb-3">
            <ArrowLeft size={12} />
            프로젝트 목록
          </Link>
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-orange-text">{project.name}</h1>
          {project.description && (
            <p className="text-sm font-bold opacity-50 mt-2 max-w-xl">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${id}/members`}
            className="flex items-center gap-2 px-4 py-2 bg-white/50 glass rounded-2xl text-xs font-black uppercase tracking-widest text-orange-text/60 hover:bg-white/80 transition-all"
          >
            <Users size={14} />
            팀원
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Kanban Board */}
        <div className="col-span-12 lg:col-span-8">
          <div className="p-6 bg-white/40 glass rounded-3xl">
            <h2 className="text-sm font-black uppercase tracking-widest opacity-50 mb-5">칸반 보드</h2>
            <KanbanBoard projectId={id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* Status & Progress */}
          <div className="p-6 bg-white/40 glass rounded-3xl">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">프로젝트 상태</h3>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {Object.entries(PROJECT_STATUS_LABELS[project.category]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => handleStatusChange(value as ProjectStatus)}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    project.status === value
                      ? 'bg-gradient-to-r from-orange-primary to-orange-secondary text-white shadow-md'
                      : 'bg-white/50 text-orange-text/40 hover:bg-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {project.category === 'rnd' && project.status === 'planning' && (
              <div className="mt-6 pt-6 border-t border-orange-100 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">검토 결론</h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CONCLUSION_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => handleConclusionChange(value as ProjectConclusion)}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        project.conclusion === value
                          ? 'bg-white text-orange-primary shadow-sm border border-orange-200'
                          : 'text-orange-text/40 hover:text-orange-text/60 hover:bg-white/50 border border-transparent'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between text-[10px] font-black opacity-50 uppercase mb-2">
                <span>진행률</span>
                {editProgress ? (
                  <button onClick={handleProgressSave} className="text-orange-secondary">저장</button>
                ) : (
                  <button onClick={() => { setProgress(project.progress); setEditProgress(true) }} className="text-orange-secondary">
                    <Settings size={10} />
                  </button>
                )}
              </div>
              {editProgress ? (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={e => setProgress(Number(e.target.value))}
                  className="w-full accent-orange-primary"
                />
              ) : null}
              <div className="text-2xl font-black text-orange-primary mb-2">{editProgress ? progress : project.progress}%</div>
              <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-primary to-orange-secondary rounded-full transition-all"
                  style={{ width: `${editProgress ? progress : project.progress}%` }}
                />
              </div>
            </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="p-6 bg-white/40 glass rounded-3xl">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4 flex items-center gap-2">
              <Paperclip size={12} />
              관련 문서
            </h3>
            
            {attachments.length === 0 ? (
              <p className="text-xs font-bold opacity-30 text-center py-4">첨부된 문서가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {attachments.map(file => (
                  <div key={file.id} className="group/file flex items-center justify-between p-3 bg-white/40 rounded-2xl hover:bg-white/60 transition-all border border-transparent hover:border-orange-100">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-orange-50 rounded-xl text-orange-primary flex-shrink-0">
                        <FileText size={14} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[11px] font-bold text-orange-text truncate">{file.file_name}</div>
                        <div className="text-[9px] font-black opacity-30 mt-0.5">{(file.file_size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="p-6 bg-white/40 glass rounded-3xl">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4 flex items-center gap-2">
              <MessageSquare size={12} />
              피드백 & 코멘트
            </h3>

            <form onSubmit={handleComment} className="flex gap-2 mb-4">
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="코멘트 남기기..."
                className="flex-1 px-3 py-2 text-xs font-bold bg-white/80 rounded-xl border border-white/50 focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || createComment.isPending}
                className="p-2 bg-orange-primary text-white rounded-xl hover:bg-orange-secondary transition-colors disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </form>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center text-xs font-black text-orange-primary">
                    {(comment.author?.full_name ?? 'U')[0]}
                  </div>
                  <div>
                    <div className="text-[10px] font-black opacity-40 uppercase">
                      {comment.author?.full_name ?? '사용자'} · {formatRelativeTime(comment.created_at)}
                    </div>
                    <p className="text-xs font-bold text-orange-text/80 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="p-6 bg-white/40 glass rounded-3xl">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">활동 로그</h3>
            {activities.length === 0 ? (
              <p className="text-xs font-bold opacity-30 text-center py-4">활동 없음</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {activities.map(a => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-primary flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-orange-text/70">{a.user?.full_name} </span>
                      <span className="text-xs font-bold opacity-50">{a.action} {a.target}</span>
                    </div>
                    <span className="text-[9px] font-black opacity-30">{formatRelativeTime(a.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
