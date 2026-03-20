import { createClient } from '@supabase/supabase-js'

const NAVER_API_BASE = 'https://www.worksapis.com/v1.0'

export type DriveType = 'personal' | 'shared'

export class NaverDriveService {
  private supabase: any

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  private async getValidToken(userId: string): Promise<string> {
    const { data: tokenData, error } = await this.supabase
      .from('naver_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.message.includes('not found') || error.code === 'PGRST116') {
        throw new Error('Naver token table or record not found. Please apply supabase-schema.sql and re-login.')
      }
      throw error
    }

    if (!tokenData) throw new Error('Naver token not found. Please re-login with Naver Works to save tokens.')

    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)

    // 토큰 만료 5분 전이면 갱신
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      return this.refreshToken(userId, tokenData.refresh_token)
    }

    return tokenData.access_token
  }

  private async refreshToken(userId: string, refreshToken: string): Promise<string> {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.NAVER_WORKS_CLIENT_ID!,
      client_secret: process.env.NAVER_WORKS_CLIENT_SECRET!,
      grant_type: 'refresh_token'
    })

    const response = await fetch('https://auth.worksmobile.com/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    })

    const tokens = await response.json()
    if (tokens.error) throw new Error(`Refresh failed: ${tokens.error_description}`)

    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()

    await this.supabase
      .from('naver_tokens')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || refreshToken, // 가끔 안 줄 때가 있음
        expires_at: expiresAt
      })
      .eq('user_id', userId)

    return tokens.access_token
  }

  private getDriveBaseUrl(driveType: DriveType, sharedDriveId?: string): string {
    if (driveType === 'shared' && sharedDriveId) {
      return `${NAVER_API_BASE}/sharedrives/${sharedDriveId}`
    }
    return `${NAVER_API_BASE}/users/me/drive`
  }

  async createFolder(
    userId: string,
    folderName: string,
    parentFolderId: string = 'root',
    driveType: DriveType = 'personal',
    sharedDriveId?: string
  ): Promise<string> {
    const token = await this.getValidToken(userId)
    let url: string
    const body = {
      fileName: folderName.trim()
    }

    // 네이버웍스 API v1.0: 최상위(root)든 하위 폴더든 /{parentFileId}/createfolder 경로 형식이 가장 안정적임
    const parentId = parentFolderId || 'root'

    if (driveType === 'personal') {
      url = `${NAVER_API_BASE}/users/me/drive/files/${parentId}/createfolder`
    } else {
      url = `${NAVER_API_BASE}/sharedrives/${sharedDriveId}/files/${parentId}/createfolder`
    }

    console.log(`NaverDriveService: POST ${url} | Body:`, JSON.stringify(body))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const resultText = await response.text()
      console.error(`NaverDriveService: createFolder FAILED (${response.status}) | Raw:`, resultText)

      // 409 이미 존재 → 기존 폴더 ID 찾아서 반환
      if (response.status === 409) {
        console.log(`NaverDriveService: 폴더 "${folderName}" 이미 존재 → 기존 폴더 ID 조회`)
        const existingId = await this.findFolderByName(userId, folderName, parentId, driveType, sharedDriveId)
        if (existingId) return existingId
      }

      let errorMessage = response.statusText
      try {
        const result = JSON.parse(resultText)
        errorMessage = result.message || result.description || result.error_description || response.statusText
      } catch (e) { }

      throw new Error(`Folder creation failed: ${errorMessage} (Status: ${response.status})`)
    }

    const result = await response.json()
    console.log(`NaverDriveService: createFolder SUCCESS | response:`, JSON.stringify(result))
    return result.fileId
  }

  /** 부모 폴더 내에서 이름으로 폴더 ID 조회 (409 충돌 처리용)
   *  - 1단계: parentId 직접 하위에서 탐색
   *  - 2단계: 못 찾으면 parentId 하위 폴더들 내부(1레벨 더)까지 탐색
   *    (저장된 rootFolderId가 Build+Up 위 레벨일 때도 커버)
   */
  private async findFolderByName(
    userId: string,
    folderName: string,
    parentId: string,
    driveType: DriveType,
    sharedDriveId?: string
  ): Promise<string | null> {
    const driveId = sharedDriveId || 'personal'
    try {
      // 1단계: 직접 하위 탐색
      const folders = await this.listFolders(userId, driveId, parentId)
      const found = folders.find((f: any) => f.fileName === folderName || f.name === folderName)
      if (found) {
        console.log(`NaverDriveService: 기존 폴더 "${folderName}" 발견 (1단계) → fileId: ${found.fileId}`)
        return found.fileId
      }

      // 2단계: 하위 폴더들 안에서도 탐색 (rootFolderId가 한 레벨 위일 경우 대비)
      console.log(`NaverDriveService: "${folderName}" 1단계 탐색 실패 → 하위 폴더 ${folders.length}개 내부 탐색 시작`)
      for (const subFolder of folders) {
        const subId = subFolder.fileId || subFolder.id
        if (!subId) continue
        try {
          const subFolders = await this.listFolders(userId, driveId, subId)
          const foundInSub = subFolders.find((f: any) => f.fileName === folderName || f.name === folderName)
          if (foundInSub) {
            console.log(`NaverDriveService: 기존 폴더 "${folderName}" 발견 (2단계, 부모: ${subFolder.fileName}) → fileId: ${foundInSub.fileId}`)
            return foundInSub.fileId
          }
        } catch {
          // 개별 하위 폴더 조회 실패는 무시하고 다음으로
        }
      }
    } catch (err) {
      console.warn(`NaverDriveService: findFolderByName 실패:`, err)
    }
    return null
  }

  async uploadFile(
    userId: string,
    file: Buffer,
    fileName: string,
    parentFolderId: string,
    driveType: DriveType = 'personal',
    sharedDriveId?: string
  ): Promise<string> {
    const token = await this.getValidToken(userId)

    const baseUrl = driveType === 'personal'
      ? `${NAVER_API_BASE}/users/me/drive`
      : `${NAVER_API_BASE}/sharedrives/${sharedDriveId}`

    const authHeaders = { 'Authorization': `Bearer ${token}` }

    console.log(`NaverDriveService: uploadFile 호출 | parentFolderId: ${parentFolderId} | fileName: ${fileName} | size: ${file.length}`)
    // ── 1단계: 업로드 URL 발급 ────────────────────────────────────
    // 공식 API: POST /sharedrives/{sharedriveId}/files/{parentFolderId}
    // (parentFolderId를 body가 아닌 경로(path)에 지정해야 정확한 폴더에 업로드됨)
    const uploadMetaUrl = `${baseUrl}/files/${parentFolderId}`
    console.log(`NaverDriveService: [1단계] uploadUrl 발급 → ${uploadMetaUrl}`)
    const metaRes = await fetch(uploadMetaUrl, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, fileSize: file.length }),
    })
    const metaText = await metaRes.text()
    console.log(`NaverDriveService: uploadUrl 발급 응답 (${metaRes.status}):`, metaText.substring(0, 200))

    if (!metaRes.ok) throw new Error(`uploadUrl 발급 실패 (${metaRes.status}): ${metaText}`)

    const meta = JSON.parse(metaText)
    const uploadUrl: string = meta.uploadUrl
    if (!uploadUrl) throw new Error('uploadUrl이 응답에 없습니다')

    // ── 2단계: 파일 바이너리 PUT ──────────────────────────────────
    console.log(`NaverDriveService: [2단계] PUT → ${uploadUrl.substring(0, 80)}...`)
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/octet-stream' },
      body: new Uint8Array(file)
    })
    const putText = await putRes.text()
    console.log(`NaverDriveService: PUT 응답 (${putRes.status}):`, putText.substring(0, 300))

    if (!putRes.ok) throw new Error(`파일 업로드 실패 (${putRes.status}): ${putText}`)

    // PUT 응답에서 fileId 추출
    let uploadedFileId: string | null = null
    try {
      const putJson = JSON.parse(putText)
      uploadedFileId = putJson.fileId ?? null
    } catch { }

    if (!uploadedFileId) throw new Error('업로드 응답에서 fileId를 찾을 수 없습니다')
    console.log(`NaverDriveService: 업로드 완료 fileId=${uploadedFileId}`)

    // ── 3단계: 이동 확인 (업로드 경로 지정이 무시된 경우 fallback) ──
    // POST /sharedrives/{id}/files/{fileId}/move + { toParentFileId } 공식 필드명
    console.log(`NaverDriveService: [3단계] 이동 확인 시도 → target: ${parentFolderId}`)
    const moveRes = await fetch(`${baseUrl}/files/${uploadedFileId}/move`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      // 공식 API 필드명: toParentFileId (parentFileId 아님)
      body: JSON.stringify({ toParentFileId: parentFolderId }),
    })
    const moveText = await moveRes.text()
    console.log(`NaverDriveService: move 응답 (${moveRes.status}):`, moveText.substring(0, 300))

    if (!moveRes.ok) {
      console.warn(`NaverDriveService: 이동 실패 (${moveRes.status}) - 업로드 경로 지정이 작동했을 경우 정상`)
    }

    return uploadedFileId
  }

  async listSharedDrives(userId: string): Promise<any[]> {
    console.log('NaverDriveService: Fetching drives for user:', userId)
    const token = await this.getValidToken(userId)

    const response = await fetch(`${NAVER_API_BASE}/sharedrives`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    const result = await response.json()
    console.log('NaverDriveService: listSharedDrives raw response:', JSON.stringify(result, null, 2))

    // v2.0 표준은 sharedrives (소문자), v1.0 호환성 혹은 오타 대비 sharedDrives 체크
    const sharedDrives = result.sharedrives || result.sharedDrives || []

    if (!Array.isArray(sharedDrives)) {
      console.warn('NaverDriveService: sharedDrives is not an array:', sharedDrives)
      return []
    }

    // 드라이브 객체 표준화 (sharedriveId, sharedriveName 보장)
    return sharedDrives.map((d: any) => ({
      sharedriveId: d.sharedriveId || d.sharedDriveId || d.id,
      sharedriveName: d.sharedriveName || d.sharedDriveName || d.name || '이름 없는 드라이브',
      driveType: 'shared'
    }))
  }

  async listFolders(userId: string, sharedDriveId: string, parentFolderId: string = 'root'): Promise<any[]> {
    console.log(`NaverDriveService: Fetching folders for drive ${sharedDriveId}, parent ${parentFolderId}`)
    const token = await this.getValidToken(userId)

    // 모든 파일을 수집 (페이지네이션 지원)
    const allFiles: any[] = []
    let cursor: string | undefined

    do {
      let url: string
      const baseParams = `parentFileId=${parentFolderId}&limit=500`
      const cursorParam = cursor ? `&nextCursor=${encodeURIComponent(cursor)}` : ''

      if (sharedDriveId === 'personal') {
        url = `${NAVER_API_BASE}/users/me/drive/files?${baseParams}${cursorParam}`
      } else {
        url = `${NAVER_API_BASE}/sharedrives/${sharedDriveId}/files?${baseParams}${cursorParam}`
      }

      console.log('NaverDriveService: Fetching folders from URL:', url)

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('NaverDriveService: listFolders failed:', result)
        throw new Error(`Folder fetch failed: ${result.message || JSON.stringify(result)}`)
      }

      const pageFiles = result.files || []
      allFiles.push(...pageFiles)

      // 다음 페이지 커서 확인 (nextCursor 또는 cursor 필드)
      cursor = result.nextCursor || result.cursor || undefined
      console.log(`NaverDriveService: page fetched ${pageFiles.length} items, nextCursor: ${cursor ?? 'none'}`)
    } while (cursor)

    // 실제 필드 구조 파악을 위해 첫 번째 아이템 전체 출력
    if (allFiles.length > 0) {
      console.log('NaverDriveService: RAW first item keys:', Object.keys(allFiles[0]))
      console.log('NaverDriveService: RAW first item:', JSON.stringify(allFiles[0]))
    }
    console.log(`NaverDriveService: listFolders SUCCESS | Total items: ${allFiles.length} | Items:`, allFiles.map((f: any) => ({ name: f.fileName, type: f.fileType })))

    // API 레벨 필터링이 안되므로 수동으로 폴더만 거름 (대소문자 무시)
    const foldersOnly = allFiles.filter((f: any) => {
      const type = (f.fileType || f.type || '').toLowerCase()
      return type === 'folder' || f.isFolder === true
    })

    console.log(`NaverDriveService: Filtered folders count: ${foldersOnly.length}`)
    return foldersOnly
  }

  /**
   * 파일 다운로드 (서버에서 Naver Works API 프록시)
   * 반환값: fetch Response (스트림 그대로 전달 가능)
   */
  async downloadFile(
    userId: string,
    fileId: string,
    driveType: DriveType = 'shared',
    sharedDriveId?: string
  ): Promise<Response> {
    const token = await this.getValidToken(userId)
    let url: string

    if (driveType === 'personal') {
      url = `${NAVER_API_BASE}/users/me/drive/files/${fileId}/content`
    } else {
      url = `${NAVER_API_BASE}/sharedrives/${sharedDriveId}/files/${fileId}/content`
    }

    console.log(`NaverDriveService: Downloading file ${fileId} from ${url}`)

    return fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  /**
   * 파일 삭제 (Drive에서 실제 파일 제거)
   */
  async deleteFile(
    userId: string,
    fileId: string,
    driveType: DriveType = 'shared',
    sharedDriveId?: string
  ): Promise<void> {
    const token = await this.getValidToken(userId)
    const url = driveType === 'personal'
      ? `${NAVER_API_BASE}/users/me/drive/files/${fileId}`
      : `${NAVER_API_BASE}/sharedrives/${sharedDriveId}/files/${fileId}`

    console.log(`NaverDriveService: 파일 삭제 → ${url}`)
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`NaverDriveService: 파일 삭제 실패 (${res.status}):`, text)
      throw new Error(`Drive 파일 삭제 실패 (${res.status}): ${text}`)
    }

    console.log(`NaverDriveService: 파일 삭제 완료 fileId=${fileId}`)
  }

  async getFileInfo(userId: string, fileId: string, driveType: 'personal' | 'shared', sharedDriveId?: string) {
    const token = await this.getValidToken(userId)
    const url = driveType === 'shared'
      ? `${NAVER_API_BASE}/sharedrives/${sharedDriveId}/files/${fileId}`
      : `${NAVER_API_BASE}/users/me/drive/files/${fileId}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      console.error(`NaverDriveService: getFileInfo failed:`, result)
      return null
    }

    return result
  }
}

export const naverDrive = new NaverDriveService()
