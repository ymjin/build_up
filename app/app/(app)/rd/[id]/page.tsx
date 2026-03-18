'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Pencil, FolderOpen, FolderPlus, Upload,
  Eye, Download, Trash2, X, Plus, ExternalLink,
} from 'lucide-react'
import { getRdProject } from '@/lib/rd-store'
import { RdProject, STATUS_CONFIG, TYPE_CONFIG } from '@/lib/rd-data'
import { formatFileSize, isViewable, getFileIcon } from '@/lib/rd-documents-store'

// ── 타입 ──────────────────────────────────────────────────────────
interface Category {
  id: string
  rd_project_id: string
  name: string
  drive_folder_id: string | null
  drive_shared_drive_id: string | null
  position: number
  created_at: string
}

interface DriveFile {
  id: string
  category_id: string
  rd_project_id: string
  file_name: string
  file_size: number
  mime_type: string
  drive_file_id: string
  drive_shared_drive_id: string
  uploaded_at: string
}

// ── 기본 카테고리 제안 목록 ────────────────────────────────────────
const SUGGESTED_CATEGORIES = ['사업 공고', '신청서', '사업계획서', '검토 결과', '협약서', '보고서', '기타']

// ── 금액 포맷 ─────────────────────────────────────────────────────
function formatAmount(n?: number) {
  if (!n) return '-'
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(0)}억원`
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만원`
  return `${n.toLocaleString()}원`
}

// ── D-Day 계산 ────────────────────────────────────────────────────
function calcDDay(dateStr?: string) {
  if (!dateStr) return null
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (diff === 0) return 'D-Day'
  if (diff > 0) return `D-${diff}`
  return `D+${Math.abs(diff)}`
}

// ── 파일 뷰어 모달 ────────────────────────────────────────────────
function FileViewerModal({
  file, rdId, onClose,
}: {
  file: DriveFile
  rdId: string
  onClose: () => void
}) {
  const viewUrl = `/api/rd/${rdId}/download?driveFileId=${file.drive_file_id}&sharedDriveId=${file.drive_shared_drive_id}&fileName=${encodeURIComponent(file.file_name)}&view=true`
  const isImage = file.mime_type.startsWith('image/')
  const isPdf = file.mime_type === 'application/pdf' || file.file_name.endsWith('.pdf')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="font-medium text-gray-800 truncate max-w-lg">{file.file_name}</span>
          <div className="flex items-center gap-2">
            <a
              href={`/api/rd/${rdId}/download?driveFileId=${file.drive_file_id}&sharedDriveId=${file.drive_shared_drive_id}&fileName=${encodeURIComponent(file.file_name)}`}
              download={file.file_name}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
            >
              <Download size={14} />
              다운로드
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 뷰어 영역 */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          {isPdf && (
            <iframe src={viewUrl} className="w-full h-full border-0" title={file.file_name} />
          )}
          {isImage && !isPdf && (
            <div className="w-full h-full flex items-center justify-center p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewUrl} alt={file.file_name} className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
          )}
          {!isPdf && !isImage && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-500">
              <span className="text-5xl">{getFileIcon(file.file_name, file.mime_type)}</span>
              <p className="text-sm">이 파일 형식은 미리보기를 지원하지 않습니다.</p>
              <a
                href={`/api/rd/${rdId}/download?driveFileId=${file.drive_file_id}&sharedDriveId=${file.drive_shared_drive_id}&fileName=${encodeURIComponent(file.file_name)}`}
                download={file.file_name}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition"
              >
                <Download size={15} />
                파일 다운로드
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 카테고리 카드 ─────────────────────────────────────────────────
function CategoryCard({
  category, rdId, projectName, allFiles,
  onRefresh,
}: {
  category: Category
  rdId: string
  projectName: string
  allFiles: DriveFile[]
  onRefresh: () => void
}) {
  const files = allFiles.filter(f => f.category_id === category.id)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [viewerFile, setViewerFile] = useState<DriveFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 업로드 처리
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    setUploading(true)
    setUploadError(null)
    for (const file of selectedFiles) {
      setUploadProgress(`"${file.name}" 업로드 중...`)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('categoryId', category.id)
        formData.append('categoryName', category.name)
        formData.append('projectName', projectName)

        const res = await fetch(`/api/rd/${rdId}/upload`, {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()

        if (!res.ok) {
          if (res.status === 400 && data.error?.includes('스토리지')) {
            setUploadError(data.error)
            setUploading(false)
            setUploadProgress('')
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
          }
          throw new Error(data.error || '업로드 실패')
        }

        // 업로드 성공 → 목록 새로고침
        onRefresh()
      } catch (err: any) {
        alert(`업로드 오류: ${err.message}`)
      }
    }

    setUploading(false)
    setUploadProgress('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDeleteFile(file: DriveFile) {
    if (!confirm(
      `"${file.file_name}" 파일을 삭제하시겠습니까?\n\n이 파일은 Naver Works Drive에서도 영구 삭제됩니다.`
    )) return

    try {
      const res = await fetch(`/api/rd/${rdId}/files?fileId=${file.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '삭제 실패')
      onRefresh()
    } catch (err: any) {
      alert(`삭제 오류: ${err.message}`)
    }
  }

  async function handleDeleteCategory() {
    const msg = files.length > 0
      ? `"${category.name}" 카테고리를 삭제하시겠습니까?\n\n소속 파일 ${files.length}개가 Naver Works Drive에서도 영구 삭제됩니다.`
      : `"${category.name}" 카테고리를 삭제하시겠습니까?`

    if (!confirm(msg)) return

    // 카테고리 내 파일을 Drive에서 먼저 삭제
    for (const f of files) {
      await fetch(`/api/rd/${rdId}/files?fileId=${f.id}`, { method: 'DELETE' })
    }

    await fetch(`/api/rd/${rdId}/categories?categoryId=${category.id}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 카테고리 헤더 */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <FolderOpen size={18} className="text-orange-400" />
            <span className="font-semibold text-gray-800">{category.name}</span>
            {files.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                {files.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 font-medium transition disabled:opacity-50"
            >
              <Upload size={13} />
              파일 추가
            </button>
            <button
              onClick={handleDeleteCategory}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* 파일 목록 */}
        <div className="divide-y divide-gray-50">
          {uploadError && (
            <div className="flex items-start gap-3 px-5 py-3 bg-red-50 border-b border-red-100">
              <span className="text-red-400 mt-0.5 flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="text-sm text-red-600 font-medium whitespace-pre-line">{uploadError}</p>
              </div>
              <button onClick={() => setUploadError(null)} className="text-red-300 hover:text-red-500 transition flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          )}
          {uploading && (
            <div className="flex items-center gap-3 px-5 py-3 bg-orange-50">
              <div className="w-4 h-4 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
              <span className="text-sm text-orange-600">{uploadProgress}</span>
            </div>
          )}
          {files.length === 0 && !uploading && (
            <div className="px-5 py-6 text-center text-sm text-gray-400">
              파일을 추가해주세요
            </div>
          )}
          {files.map(file => (
            <div key={file.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group transition">
              <span className="text-xl flex-shrink-0">{getFileIcon(file.file_name, file.mime_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.file_name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.file_size)}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                {isViewable(file.mime_type, file.file_name) && (
                  <button
                    onClick={() => setViewerFile(file)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
                  >
                    <Eye size={13} />
                    보기
                  </button>
                )}
                <a
                  href={`/api/rd/${rdId}/download?driveFileId=${file.drive_file_id}&sharedDriveId=${file.drive_shared_drive_id}&fileName=${encodeURIComponent(file.file_name)}`}
                  download={file.file_name}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                >
                  <Download size={13} />
                  다운로드
                </a>
                <button
                  onClick={() => handleDeleteFile(file)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 숨겨진 파일 input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* 파일 뷰어 모달 */}
      {viewerFile && (
        <FileViewerModal
          file={viewerFile}
          rdId={rdId}
          onClose={() => setViewerFile(null)}
        />
      )}
    </>
  )
}

// ── 메인 상세 페이지 ─────────────────────────────────────────────
export default function RdDetailPage() {
  const params = useParams()
  const router = useRouter()
  const rdId = params.id as string

  const [project, setProject] = useState<RdProject | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategoryLoading, setAddingCategoryLoading] = useState(false)

  useEffect(() => {
    const p = getRdProject(rdId)
    if (!p) { router.push('/rd'); return }
    setProject(p)
  }, [rdId])

  // DB에서 카테고리 + 파일 로드
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rd/${rdId}/categories`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories ?? [])
        setFiles(data.files ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [rdId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 새 카테고리 추가
  async function handleAddCategory(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    setAddingCategoryLoading(true)
    try {
      const res = await fetch(`/api/rd/${rdId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || '카테고리 추가 실패')
        return
      }
      setCategories(prev => [...prev, data])
      setAddingCategory(false)
      setNewCategoryName('')
    } finally {
      setAddingCategoryLoading(false)
    }
  }

  if (!project) return null

  const status = STATUS_CONFIG[project.status]
  const type = TYPE_CONFIG[project.project_type]
  const dday = calcDDay(project.deadline_at)

  return (
    <div className="min-h-full bg-orange-base">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/rd"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
            >
              <ArrowLeft size={16} />
              목록
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-base font-semibold text-gray-900 truncate max-w-sm">{project.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {project.announcement_url && (
              <a
                href={project.announcement_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
              >
                <ExternalLink size={14} />
                공고 보기
              </a>
            )}
            <Link
              href={`/rd/${rdId}/edit`}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition shadow-sm"
            >
              <Pencil size={14} />
              수정
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── 왼쪽: 사업 기본 정보 ──────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          {/* 상태 / 유형 / D-Day */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${status.bg} ${status.color}`}>
                {status.label}
              </span>
              <span className={`text-sm font-medium ${type.color}`}>{type.label}</span>
              {dday && (
                <span className={`text-sm font-bold ml-auto ${
                  dday.startsWith('D-') && !dday.includes('+') ? 'text-orange-500' : 'text-gray-400'
                }`}>
                  {dday}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-snug">{project.name}</h2>
          </div>

          {/* 기관 정보 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">기관 정보</h3>
            <InfoRow label="주관부처" value={project.ministry} />
            <InfoRow label="전문기관" value={project.agency} />
            <InfoRow label="주관기관" value={project.host_org} />
            {project.partners?.length > 0 && (
              <div>
                <span className="text-xs text-gray-400 block mb-1">참여기관</span>
                <div className="flex flex-wrap gap-1.5">
                  {project.partners.map((p, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 일정 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">일정</h3>
            {project.announced_at && <InfoRow label="공고일" value={project.announced_at} />}
            <InfoRow label="마감일" value={project.deadline_at} highlight={!!dday && !dday.startsWith('D+')} />
            {project.period_start && <InfoRow label="사업기간" value={`${project.period_start} ~ ${project.period_end ?? '?'}`} />}
          </div>

          {/* 금액 */}
          {(project.gov_amount || project.total_amount) && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">금액</h3>
              {project.gov_amount && <InfoRow label="정부지원금" value={formatAmount(project.gov_amount)} />}
              {project.total_amount && <InfoRow label="총사업비" value={formatAmount(project.total_amount)} />}
              {project.gov_ratio && <InfoRow label="정부지원비율" value={`${project.gov_ratio}%`} />}
              {project.self_ratio && <InfoRow label="자부담비율" value={`${project.self_ratio}%`} />}
            </div>
          )}

          {/* 메모 */}
          {project.memo && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">메모</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{project.memo}</p>
            </div>
          )}
        </div>

        {/* ── 오른쪽: 문서 관리 ──────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">
          {/* 문서 섹션 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">문서 관리</h2>
              <p className="text-xs text-gray-400 mt-0.5">카테고리별로 파일을 관리합니다 → Naver Works Drive에 저장</p>
            </div>
            <button
              onClick={() => setAddingCategory(true)}
              className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:border-orange-300 hover:text-orange-600 text-gray-600 font-medium transition shadow-sm"
            >
              <FolderPlus size={15} />
              카테고리 추가
            </button>
          </div>

          {/* 카테고리 추가 폼 */}
          {addingCategory && (
            <div className="bg-white rounded-2xl border border-orange-200 p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-700 mb-3">새 카테고리명 입력</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {SUGGESTED_CATEGORIES
                  .filter(s => !categories.some(c => c.name === s))
                  .map(s => (
                    <button
                      key={s}
                      onClick={() => handleAddCategory(s)}
                      disabled={addingCategoryLoading}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 transition disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCategory(newCategoryName)}
                  placeholder="카테고리명 직접 입력..."
                  className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  autoFocus
                />
                <button
                  onClick={() => handleAddCategory(newCategoryName)}
                  disabled={addingCategoryLoading}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition disabled:opacity-50"
                >
                  <Plus size={15} />
                </button>
                <button
                  onClick={() => { setAddingCategory(false); setNewCategoryName('') }}
                  className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {/* 로딩 상태 */}
          {loading && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center gap-3 text-gray-400">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
              <span className="text-sm">불러오는 중...</span>
            </div>
          )}

          {/* 빈 상태 */}
          {!loading && categories.length === 0 && !addingCategory && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <FolderOpen size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500 mb-1">등록된 문서가 없습니다</p>
              <p className="text-xs text-gray-400 mb-4">
                카테고리를 추가하고 파일을 업로드해보세요
              </p>
              <button
                onClick={() => setAddingCategory(true)}
                className="text-sm px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition"
              >
                첫 카테고리 추가
              </button>
            </div>
          )}

          {/* 카테고리 카드 목록 */}
          {!loading && categories.map(cat => (
            <CategoryCard
              key={cat.id}
              category={cat}
              rdId={rdId}
              projectName={project.name}
              allFiles={files}
              onRefresh={loadData}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 정보 행 컴포넌트 ──────────────────────────────────────────────
function InfoRow({ label, value, highlight = false }: {
  label: string
  value?: string
  highlight?: boolean
}) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5 w-20">{label}</span>
      <span className={`text-sm text-right ${highlight ? 'font-semibold text-orange-600' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  )
}
