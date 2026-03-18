/**
 * R&D 사업 문서 관리 localStorage 저장소
 * - 카테고리(폴더)와 파일 메타데이터를 관리
 * - 실제 파일은 Naver Works Drive에 저장됨
 */

export interface RdDocumentCategory {
  id: string
  rdProjectId: string
  name: string                   // 카테고리명 = Naver Drive 폴더명
  driveFolderId?: string         // Naver Drive 폴더 ID
  driveSharedDriveId?: string    // Naver Drive 공유드라이브 ID
  position: number
  createdAt: string
}

export interface RdDocumentFile {
  id: string
  categoryId: string
  rdProjectId: string
  fileName: string
  fileSize: number               // bytes
  mimeType: string
  driveFileId: string            // Naver Drive fileId
  driveSharedDriveId: string
  uploadedAt: string
}

const CATEGORIES_KEY = 'rd_document_categories'
const FILES_KEY = 'rd_document_files'

// ── 카테고리(폴더) CRUD ──────────────────────────────────────────

export function loadCategories(): RdDocumentCategory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCategories(categories: RdDocumentCategory[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}

/** 특정 R&D 사업의 카테고리 목록 반환 (position 순) */
export function getCategoriesForProject(rdProjectId: string): RdDocumentCategory[] {
  return loadCategories()
    .filter(c => c.rdProjectId === rdProjectId)
    .sort((a, b) => a.position - b.position)
}

/** 카테고리 추가 */
export function addCategory(data: Omit<RdDocumentCategory, 'id' | 'createdAt'>): RdDocumentCategory {
  const categories = loadCategories()
  const newCat: RdDocumentCategory = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  saveCategories([...categories, newCat])
  return newCat
}

/** 카테고리 Drive 폴더 ID 업데이트 (업로드 후 호출) */
export function updateCategoryFolder(
  categoryId: string,
  driveFolderId: string,
  driveSharedDriveId: string
): void {
  const categories = loadCategories().map(c =>
    c.id === categoryId ? { ...c, driveFolderId, driveSharedDriveId } : c
  )
  saveCategories(categories)
}

/** 카테고리 삭제 (소속 파일도 함께 삭제) */
export function deleteCategory(categoryId: string): void {
  saveCategories(loadCategories().filter(c => c.id !== categoryId))
  saveFiles(loadFiles().filter(f => f.categoryId !== categoryId))
}

// ── 파일 CRUD ────────────────────────────────────────────────────

export function loadFiles(): RdDocumentFile[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(FILES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveFiles(files: RdDocumentFile[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(FILES_KEY, JSON.stringify(files))
}

/** 특정 카테고리의 파일 목록 반환 */
export function getFilesForCategory(categoryId: string): RdDocumentFile[] {
  return loadFiles()
    .filter(f => f.categoryId === categoryId)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
}

/** 특정 R&D 사업의 전체 파일 목록 반환 */
export function getFilesForProject(rdProjectId: string): RdDocumentFile[] {
  return loadFiles().filter(f => f.rdProjectId === rdProjectId)
}

/** 파일 메타데이터 추가 */
export function addFile(data: Omit<RdDocumentFile, 'id' | 'uploadedAt'>): RdDocumentFile {
  const files = loadFiles()
  const newFile: RdDocumentFile = {
    ...data,
    id: crypto.randomUUID(),
    uploadedAt: new Date().toISOString(),
  }
  saveFiles([...files, newFile])
  return newFile
}

/** 파일 삭제 (Drive에서의 실제 삭제는 별도 처리) */
export function deleteFile(fileId: string): void {
  saveFiles(loadFiles().filter(f => f.id !== fileId))
}

// ── 유틸 ─────────────────────────────────────────────────────────

/** 파일 크기를 사람이 읽기 좋은 형태로 변환 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** mimeType 또는 파일명으로 뷰어 지원 여부 판단 */
export function isViewable(mimeType: string, fileName: string): boolean {
  if (mimeType.startsWith('image/')) return true
  if (mimeType === 'application/pdf') return true
  const ext = fileName.split('.').pop()?.toLowerCase()
  return ext === 'pdf' || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext ?? '')
}

/** 파일 확장자로 아이콘 이모지 반환 */
export function getFileIcon(fileName: string, mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  const ext = fileName.split('.').pop()?.toLowerCase()
  const icons: Record<string, string> = {
    pdf: '📕', hwp: '📄', hwpx: '📄',
    doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📋', pptx: '📋', zip: '🗜️', txt: '📃',
    mp4: '🎬', mov: '🎬',
  }
  return icons[ext ?? ''] ?? '📎'
}
