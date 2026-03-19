import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import {
  sendProjectStatusEmail,
  sendDeadlineReminderEmail,
  sendIssueCreatedEmail,
  sendMemberInviteEmail,
  sendTestEmail,
} from '@/lib/email'

// =============================================
// Supabase Admin 클라이언트 (RLS 우회 — 멤버 이메일 조회용)
// =============================================
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// 프로젝트 멤버 이메일 자동 조회
async function getProjectMemberEmails(projectId: string): Promise<string[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('project_members')
    .select('profiles:user_id(email)')
    .eq('project_id', projectId)

  if (error || !data) {
    console.error('[getProjectMemberEmails]', error)
    return []
  }

  return data.flatMap(m => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return (profile as { email?: string } | null)?.email
      ? [(profile as { email: string }).email]
      : []
  })
}

// =============================================
// POST /api/email
// 프로젝트 관련 이메일 발송 엔드포인트
// 수신자: project_id 기반 자동 조회 (프로젝트 멤버 전체)
// =============================================
export async function POST(request: NextRequest) {
  // 인증 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const body = await request.json()
  const { type, projectId, ...payload } = body

  if (!type) {
    return NextResponse.json({ error: 'type 필드가 필요합니다' }, { status: 400 })
  }

  try {
    let result

    switch (type) {

      // ── 프로젝트 상태 변경 알림 ──
      // 수신자: 프로젝트 전체 멤버
      case 'project_status_changed': {
        const recipients = await getProjectMemberEmails(projectId)
        if (recipients.length === 0) {
          return NextResponse.json({ success: true, skipped: '수신자 없음' })
        }
        result = await sendProjectStatusEmail({
          to: recipients,
          projectName: payload.projectName,
          oldStatus: payload.oldStatus,
          newStatus: payload.newStatus,
          changedBy: payload.changedBy ?? user.email ?? '담당자',
          projectUrl: payload.projectUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/projects/${projectId}`,
        })
        break
      }

      // ── 납기일 임박 알림 ──
      // 수신자: 프로젝트 전체 멤버
      case 'deadline_reminder': {
        const recipients = await getProjectMemberEmails(projectId)
        if (recipients.length === 0) {
          return NextResponse.json({ success: true, skipped: '수신자 없음' })
        }
        result = await sendDeadlineReminderEmail({
          to: recipients,
          projectName: payload.projectName,
          deadline: payload.deadline,
          dday: payload.dday,
          projectUrl: payload.projectUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/projects/${projectId}`,
        })
        break
      }

      // ── 이슈 등록 알림 ──
      // 수신자: 프로젝트 전체 멤버
      case 'issue_created': {
        const recipients = await getProjectMemberEmails(projectId)
        if (recipients.length === 0) {
          return NextResponse.json({ success: true, skipped: '수신자 없음' })
        }
        result = await sendIssueCreatedEmail({
          to: recipients,
          projectName: payload.projectName,
          issueTitle: payload.issueTitle,
          issueType: payload.issueType,
          issuePriority: payload.issuePriority,
          createdBy: payload.createdBy ?? user.email ?? '담당자',
          projectUrl: payload.projectUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/projects/${projectId}`,
        })
        break
      }

      // ── 팀원 초대 알림 ──
      // 수신자: 초대받는 특정 인원 (to 필드 필수)
      case 'member_invited':
        result = await sendMemberInviteEmail({
          to: payload.to,
          projectName: payload.projectName,
          invitedBy: payload.invitedBy ?? user.email ?? '담당자',
          role: payload.role,
          acceptUrl: payload.acceptUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/projects/${projectId}`,
        })
        break

      // ── 테스트 메일 ──
      // 수신자: 직접 지정 (to 필드 필수)
      case 'test':
        result = await sendTestEmail(payload.to)
        break

      default:
        return NextResponse.json({ error: `알 수 없는 type: ${type}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('[Email API Error]', err)
    return NextResponse.json(
      { error: (err as Error).message ?? '이메일 발송 실패' },
      { status: 500 }
    )
  }
}
