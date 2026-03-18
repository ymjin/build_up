'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateProject } from '@/lib/queries'
import { PROJECT_STATUS_LABELS, CONCLUSION_LABELS } from '@/lib/utils'
import type { ProjectStatus, ProjectCategory, ProjectConclusion } from '@/types'
import { ArrowLeft, Upload, X, FileText } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const createProject = useCreateProject()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('planning')
  const [category, setCategory] = useState<ProjectCategory>('development')
  const [conclusion, setConclusion] = useState<ProjectConclusion | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsUploading(true)
    try {
      const project = await createProject.mutateAsync({ 
        name, 
        description, 
        status, 
        category,
        conclusion: category === 'rnd' && status === 'planning' ? conclusion : null,
        progress: 0 
      })

      // 파일 업로드 수행
      if (files.length > 0) {
        const formData = new FormData()
        formData.append('projectId', project.id)
        files.forEach(f => formData.append('files', f))

        await fetch('/api/projects/upload', {
          method: 'POST',
          body: formData
        })
      }

      router.push(`/projects/${project.id}`)
    } catch (err) {
      console.error(err)
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Link href="/projects" className="flex items-center gap-2 text-xs font-black opacity-40 uppercase tracking-widest hover:opacity-70 transition-opacity mb-8">
        <ArrowLeft size={14} />
        프로젝트 목록
      </Link>

      <h1 className="text-2xl font-black uppercase italic tracking-tight text-orange-text mb-8">새 프로젝트</h1>

      <form onSubmit={handleSubmit} className="p-8 bg-white/60 glass rounded-3xl space-y-6">
        <div>
          <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">프로젝트 이름 *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30"
            placeholder="예: 빌드업 v2.0"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">설명</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-white/80 rounded-2xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 resize-none"
            placeholder="프로젝트에 대한 간략한 설명"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-3">프로젝트 분류 *</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'rnd', label: 'R&D 과제' },
              { value: 'development', label: '개발' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setCategory(opt.value as ProjectCategory)
                  setStatus('planning') // 카테고리 변경 시 상태 초기화
                }}
                className={`py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                  category === opt.value
                    ? 'bg-gradient-to-r from-orange-primary to-orange-secondary text-white shadow-lg'
                    : 'bg-white/50 text-orange-text/50 hover:bg-white/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-3">현재 단계</label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(PROJECT_STATUS_LABELS[category]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value as ProjectStatus)}
                className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  status === value
                    ? 'bg-gradient-to-r from-orange-primary to-orange-secondary text-white shadow-lg'
                    : 'bg-white/50 text-orange-text/50 hover:bg-white/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-3">관류 문서 첨부 (네이버웍스 드라이브)</label>
          <div className="space-y-4">
            <div className="relative group">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="p-8 border-2 border-dashed border-orange-200 rounded-3xl bg-orange-50/20 text-center group-hover:bg-orange-50/40 transition-all">
                <Upload className="mx-auto text-orange-text/30 mb-2 group-hover:scale-110 transition-transform" size={24} />
                <p className="text-xs font-bold text-orange-text/60">클래식한 방식으로 선택하거나 파일을 드래그하세요</p>
                <p className="text-[10px] opacity-40 mt-1 uppercase tracking-widest">Multiple files allowed</p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/40 glass rounded-2xl animate-in fade-in slide-in-from-left-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-orange-100 rounded-xl text-orange-primary flex-shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[11px] font-bold text-orange-text truncate">{file.name}</div>
                        <div className="text-[9px] font-black opacity-30 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="p-2 text-orange-text/20 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={createProject.isPending || isUploading}
          className="w-full py-4 bg-gradient-to-r from-orange-primary to-orange-secondary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100"
        >
          {createProject.isPending || isUploading ? '처리 중...' : '프로젝트 만들기'}
        </button>
      </form>
    </div>
  )
}
