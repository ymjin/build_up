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
      
      let errorMessage = response.statusText
      try {
        const result = JSON.parse(resultText)
        errorMessage = result.message || result.description || result.error_description || response.statusText
      } catch (e) {}
      
      throw new Error(`Folder creation failed: ${errorMessage} (Status: ${response.status})`)
    }
    
    const result = await response.json()
    return result.fileId
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
    const baseUrl = this.getDriveBaseUrl(driveType, sharedDriveId)

    // 1. 세션 생성 (Upload Session)
    const sessionRes = await fetch(`${baseUrl}/files/upload/session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: fileName,
        parentFileId: parentFolderId
      })
    })

    const session = await sessionRes.json()
    if (!sessionRes.ok) throw new Error(`Upload session failed: ${session.message || sessionRes.statusText}`)

    // 2. 실제 파일 바이너리 전송 (Access Token은 session endpoint와 동일하게 필요할 수 있음)
    // Naver Works v2.0 uploadUrl은 보통 token을 요구하지 않거나 헤더로 받음
    const uploadRes = await fetch(session.uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream'
      },
      body: new Uint8Array(file)
    })

    const result = await uploadRes.json()
    if (!uploadRes.ok) throw new Error(`Upload failed: ${result.message || uploadRes.statusText}`)

    return result.fileId
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
    
    let url: string
    if (sharedDriveId === 'personal') {
      url = `${NAVER_API_BASE}/users/me/drive/files?parentFileId=${parentFolderId}`
    } else {
      url = `${NAVER_API_BASE}/sharedrives/${sharedDriveId}/files?parentFileId=${parentFolderId}`
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

    const allFiles = result.files || []
    console.log(`NaverDriveService: listFolders SUCCESS | Total items: ${allFiles.length} | Items:`, allFiles.map((f: any) => ({ name: f.fileName, type: f.fileType })))
    
    // API 레벨 필터링이 안되므로 수동으로 폴더만 거름 (대소문자 무시)
    const foldersOnly = allFiles.filter((f: any) => {
      const type = (f.fileType || f.type || '').toLowerCase()
      return type === 'folder' || f.isFolder === true
    })

    console.log(`NaverDriveService: Filtered folders count: ${foldersOnly.length}`)
    return foldersOnly
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
