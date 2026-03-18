'use client'

import { use, useState } from 'react'
import { useProject, useMembers, useInviteMember, useRemoveMember } from '@/lib/queries'
import { ROLE_LABELS } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Trash2 } from 'lucide-react'
import type { MemberRole } from '@/types'

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: 'admin', label: '관리자' },
  { value: 'member', label: '멤버' },
  { value: 'tester', label: '테스터' },
]

export default function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: project } = useProject(id)
  const { data: members = [], isLoading } = useMembers(id)
  const inviteMember = useInviteMember()
  const removeMember = useRemoveMember()

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberRole>('member')
  const [error, setError] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await inviteMember.mutateAsync({ projectId: id, email: inviteEmail, role: inviteRole })
      setInviteEmail('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '초대 실패')
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href={`/projects/${id}`} className="flex items-center gap-2 text-xs font-black opacity-40 uppercase tracking-widest hover:opacity-70 transition-opacity mb-6">
        <ArrowLeft size={12} />
        {project?.name ?? '프로젝트'}
      </Link>

      <h1 className="text-2xl font-black uppercase italic tracking-tight text-orange-text mb-8">팀원 관리</h1>

      {/* Invite Form */}
      <div className="p-6 bg-white/50 glass rounded-3xl mb-6">
        <h2 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4 flex items-center gap-2">
          <UserPlus size={12} />
          팀원 초대
        </h2>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-bold mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            required
            placeholder="email@example.com"
            className="flex-1 px-4 py-2.5 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value as MemberRole)}
            className="px-3 py-2.5 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none"
          >
            {ROLE_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={inviteMember.isPending}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-primary to-orange-secondary text-white text-sm font-black rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 whitespace-nowrap"
          >
            초대
          </button>
        </form>
      </div>

      {/* Members List */}
      <div className="p-6 bg-white/50 glass rounded-3xl">
        <h2 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">
          팀원 목록 ({members.length}명)
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-white/30 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm font-bold opacity-30 text-center py-6">아직 팀원이 없습니다</p>
        ) : (
          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-white/40 rounded-2xl group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center font-black text-orange-primary text-sm">
                    {(member.profile?.full_name ?? member.profile?.email ?? 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-black text-orange-text">
                      {member.profile?.full_name ?? '이름 없음'}
                    </div>
                    <div className="text-[10px] font-bold opacity-40">{member.profile?.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                    member.role === 'owner' ? 'bg-orange-100 text-orange-600' :
                    member.role === 'admin' ? 'bg-blue-100 text-blue-600' :
                    member.role === 'tester' ? 'bg-purple-100 text-purple-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {ROLE_LABELS[member.role]}
                  </span>
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => removeMember.mutate({ memberId: member.id, projectId: id })}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-red-50 hover:text-red-500 text-orange-text/30 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
