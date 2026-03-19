import { Resend } from 'resend'

// =============================================
// Resend 클라이언트 초기화
// =============================================
const resend = new Resend(process.env.RESEND_API_KEY)

// 발신 이메일 주소 (도메인 인증 후 변경)
// 테스트 시: onboarding@resend.dev (Resend 기본 테스트 주소)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Build-Up <noreply@buildup.kr>'

// =============================================
// 공통 HTML 레이아웃 (오렌지 테마)
// =============================================
function baseTemplate(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#fff7f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(255,107,0,0.08);">

          <!-- 헤더 -->
          <tr>
            <td style="background:linear-gradient(135deg,#ff6b00,#ff8c00);padding:28px 36px;">
              <span style="color:#fff;font-size:20px;font-weight:900;letter-spacing:-0.5px;">
                BUILD-UP
              </span>
              <span style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;margin-left:12px;text-transform:uppercase;letter-spacing:2px;">
                Project Management
              </span>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:36px;">
              ${content}
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #fff0e0;background:#fffaf5;">
              <p style="margin:0;color:#aaa;font-size:11px;font-weight:600;">
                이 메일은 Build-Up 프로젝트 관리 시스템에서 자동 발송되었습니다.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// =============================================
// 배지 스타일 헬퍼
// =============================================
function badge(text: string, color = '#ff6b00', bg = '#fff0e0'): string {
  return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;color:${color};background:${bg};text-transform:uppercase;letter-spacing:1px;">${text}</span>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #f0e8e0;margin:24px 0;" />`
}

function ctaButton(text: string, href: string): string {
  return `
  <a href="${href}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#ff6b00,#ff8c00);color:#fff;font-size:13px;font-weight:800;text-decoration:none;border-radius:14px;margin-top:8px;">
    ${text} →
  </a>`
}

// =============================================
// 이메일 타입 정의
// =============================================
export type EmailType =
  | 'project_status_changed'   // 프로젝트 상태 변경
  | 'deadline_reminder'        // 납기일 임박 알림
  | 'issue_created'            // 이슈 등록 알림
  | 'member_invited'           // 팀원 초대
  | 'test'                     // 설정 확인용 테스트 메일

// =============================================
// 이메일 발송 함수들
// =============================================

/**
 * 프로젝트 상태 변경 알림
 */
export async function sendProjectStatusEmail(opts: {
  to: string[]
  projectName: string
  oldStatus: string
  newStatus: string
  changedBy: string
  projectUrl: string
}) {
  const content = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;color:#1a1a1a;">
      프로젝트 상태가 변경되었습니다
    </h2>
    <p style="margin:0 0 24px;color:#888;font-size:13px;font-weight:600;">
      ${opts.changedBy}님이 상태를 변경했습니다
    </p>

    <div style="background:#fffaf5;border:1px solid #ffe0c0;border-radius:16px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:15px;font-weight:900;color:#1a1a1a;">
        ${opts.projectName}
      </p>
      <div style="display:flex;align-items:center;gap:12px;">
        ${badge(opts.oldStatus, '#888', '#f0f0f0')}
        <span style="color:#ccc;font-weight:900;">→</span>
        ${badge(opts.newStatus)}
      </div>
    </div>

    ${ctaButton('프로젝트 보기', opts.projectUrl)}
  `

  return resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject: `[Build-Up] ${opts.projectName} 상태 변경: ${opts.newStatus}`,
    html: baseTemplate('프로젝트 상태 변경', content),
  })
}

/**
 * 납기일 임박 알림
 */
export async function sendDeadlineReminderEmail(opts: {
  to: string[]
  projectName: string
  deadline: string
  dday: string
  projectUrl: string
}) {
  const isOverdue = opts.dday.startsWith('D+')
  const ddayColor = isOverdue ? '#e53e3e' : '#ff6b00'

  const content = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;color:#1a1a1a;">
      납기일 ${isOverdue ? '초과' : '임박'} 알림
    </h2>
    <p style="margin:0 0 24px;color:#888;font-size:13px;font-weight:600;">
      프로젝트 납기일을 확인해주세요
    </p>

    <div style="background:#fffaf5;border:1px solid #ffe0c0;border-radius:16px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:900;color:#1a1a1a;">
        ${opts.projectName}
      </p>
      <p style="margin:0 0 4px;font-size:13px;color:#888;font-weight:600;">
        납기일: <strong style="color:#1a1a1a;">${opts.deadline}</strong>
      </p>
      <span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:16px;font-weight:900;color:#fff;background:${ddayColor};margin-top:8px;">
        ${opts.dday}
      </span>
    </div>

    ${ctaButton('프로젝트 확인하기', opts.projectUrl)}
  `

  return resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject: `[Build-Up] ${opts.dday} ${opts.projectName} 납기일 알림`,
    html: baseTemplate('납기일 알림', content),
  })
}

/**
 * 이슈 등록 알림
 */
export async function sendIssueCreatedEmail(opts: {
  to: string[]
  projectName: string
  issueTitle: string
  issueType: string
  issuePriority: string
  createdBy: string
  projectUrl: string
}) {
  const priorityColors: Record<string, { color: string; bg: string }> = {
    critical: { color: '#e53e3e', bg: '#fff5f5' },
    high: { color: '#dd6b20', bg: '#fffaf0' },
    medium: { color: '#d69e2e', bg: '#fffff0' },
    low: { color: '#38a169', bg: '#f0fff4' },
  }
  const pc = priorityColors[opts.issuePriority] ?? priorityColors.medium

  const content = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;color:#1a1a1a;">
      새 이슈가 등록되었습니다
    </h2>
    <p style="margin:0 0 24px;color:#888;font-size:13px;font-weight:600;">
      ${opts.createdBy}님이 이슈를 등록했습니다
    </p>

    <div style="background:#fffaf5;border:1px solid #ffe0c0;border-radius:16px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:12px;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
        ${opts.projectName}
      </p>
      <p style="margin:0 0 12px;font-size:16px;font-weight:900;color:#1a1a1a;">
        ${opts.issueTitle}
      </p>
      <div style="display:flex;gap:8px;">
        ${badge(opts.issueType)}
        ${badge(opts.issuePriority, pc.color, pc.bg)}
      </div>
    </div>

    ${ctaButton('이슈 확인하기', opts.projectUrl)}
  `

  return resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject: `[Build-Up] 이슈 등록: ${opts.issueTitle}`,
    html: baseTemplate('이슈 등록 알림', content),
  })
}

/**
 * 팀원 초대 알림
 */
export async function sendMemberInviteEmail(opts: {
  to: string
  projectName: string
  invitedBy: string
  role: string
  acceptUrl: string
}) {
  const content = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;color:#1a1a1a;">
      프로젝트에 초대되었습니다
    </h2>
    <p style="margin:0 0 24px;color:#888;font-size:13px;font-weight:600;">
      ${opts.invitedBy}님이 회원님을 초대했습니다
    </p>

    <div style="background:#fffaf5;border:1px solid #ffe0c0;border-radius:16px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:900;color:#1a1a1a;">
        ${opts.projectName}
      </p>
      <p style="margin:0;font-size:13px;color:#888;font-weight:600;">
        역할: ${badge(opts.role)}
      </p>
    </div>

    ${divider()}

    <p style="margin:0 0 16px;color:#555;font-size:13px;line-height:1.6;">
      아래 버튼을 클릭하면 Build-Up에 접속해서 프로젝트를 확인할 수 있습니다.
    </p>

    ${ctaButton('초대 수락하기', opts.acceptUrl)}
  `

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [opts.to],
    subject: `[Build-Up] ${opts.invitedBy}님이 "${opts.projectName}" 프로젝트에 초대했습니다`,
    html: baseTemplate('프로젝트 초대', content),
  })
}

/**
 * 테스트 메일 — 설정이 올바른지 확인용
 */
export async function sendTestEmail(to: string) {
  const now = new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  const content = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;color:#1a1a1a;">
      이메일 설정 확인
    </h2>
    <p style="margin:0 0 24px;color:#888;font-size:13px;font-weight:600;">
      테스트 메일이 정상적으로 수신되었습니다 ✅
    </p>

    <div style="background:#fffaf5;border:1px solid #ffe0c0;border-radius:16px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:12px;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
        발송 시각
      </p>
      <p style="margin:0;font-size:15px;font-weight:900;color:#1a1a1a;">${now}</p>
    </div>

    <p style="margin:0;color:#888;font-size:12px;line-height:1.6;">
      Build-Up 이메일 알림 시스템이 올바르게 설정되었습니다.<br/>
      이제 프로젝트 이벤트가 발생하면 자동으로 알림이 발송됩니다.
    </p>
  `

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: `[Build-Up] 이메일 설정 테스트`,
    html: baseTemplate('테스트 메일', content),
  })
}
