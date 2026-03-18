import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { naverDrive } from '@/lib/naver-drive'

/**
 * GET /api/rd/[id]/download
 * Naver Works Drive 파일을 서버에서 프록시하여 반환
 *
 * Query params:
 *   driveFileId      - Naver Drive fileId
 *   sharedDriveId    - 공유드라이브 ID (없으면 personal)
 *   fileName         - 다운로드 시 사용할 파일명 (Content-Disposition)
 *   view             - "true" 이면 인라인 뷰어 (PDF/이미지), 아니면 첨부 다운로드
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const driveFileId = searchParams.get('driveFileId')
  const sharedDriveId = searchParams.get('sharedDriveId') || 'personal'
  const fileName = searchParams.get('fileName') || 'download'
  const isView = searchParams.get('view') === 'true'

  if (!driveFileId) {
    return NextResponse.json({ error: 'driveFileId is required' }, { status: 400 })
  }

  try {
    const driveType = sharedDriveId === 'personal' ? 'personal' : 'shared'
    const driveRes = await naverDrive.downloadFile(
      user.id,
      driveFileId,
      driveType,
      sharedDriveId === 'personal' ? undefined : sharedDriveId
    )

    if (!driveRes.ok) {
      const errText = await driveRes.text()
      console.error(`[download] Naver Drive error (${driveRes.status}):`, errText)
      return NextResponse.json(
        { error: `Drive error: ${driveRes.statusText}` },
        { status: driveRes.status }
      )
    }

    // Content-Type 결정
    const contentType =
      driveRes.headers.get('content-type') ||
      guessMimeType(fileName)

    // 뷰어 모드: PDF/이미지는 inline, 나머지는 attachment
    const viewable = isView && (
      contentType.startsWith('image/') ||
      contentType === 'application/pdf'
    )
    const disposition = viewable
      ? `inline; filename="${encodeURIComponent(fileName)}"`
      : `attachment; filename="${encodeURIComponent(fileName)}"`

    // 파일 데이터를 스트리밍으로 전달
    const body = driveRes.body
    if (!body) {
      return NextResponse.json({ error: 'Empty response from Drive' }, { status: 502 })
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': 'private, max-age=300', // 5분 캐시
      },
    })
  } catch (err: any) {
    console.error('[download] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** 파일명으로 MIME 타입 추측 */
function guessMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    hwp: 'application/x-hwp',
    hwpx: 'application/x-hwpx',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    zip: 'application/zip',
    txt: 'text/plain',
    mp4: 'video/mp4',
  }
  return mimeMap[ext ?? ''] ?? 'application/octet-stream'
}
