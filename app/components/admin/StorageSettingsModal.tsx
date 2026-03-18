'use client'

import { useState, useEffect } from 'react'
import { X, Folder, ChevronRight, Plus, Loader2, HardDrive, Check, ArrowLeft } from 'lucide-react'

interface StorageSettingsModalProps {
  onClose: () => void
}

export function StorageSettingsModal({ onClose }: StorageSettingsModalProps) {
  const [drives, setDrives] = useState<any[]>([])
  const [sharedDriveId, setSharedDriveId] = useState<string | null>(null)
  const [folders, setFolders] = useState<any[]>([])
  const [currentParentId, setCurrentParentId] = useState<string>('root')
  const [path, setPath] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

  useEffect(() => {
    fetchDrives()
  }, [])

  async function fetchDrives() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/drive?mode=drives')
      const data = await res.json()
      setDrives(data)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchFolders(driveId: string, parentId: string = 'root') {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/drive?mode=folders&sharedDriveId=${driveId}&parentId=${parentId}`)
      const data = await res.json()
      setFolders(data || [])
      setCurrentParentId(parentId)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDriveSelect = (drive: any) => {
    setSharedDriveId(drive.sharedDriveId)
    setPath([{ name: drive.sharedDriveName, id: 'root' }])
    fetchFolders(drive.sharedDriveId, 'root')
  }

  const handleFolderClick = (folder: any) => {
    setPath(prev => [...prev, { name: folder.fileName, id: folder.fileId }])
    fetchFolders(sharedDriveId!, folder.fileId)
  }

  const handleBreadcrumbClick = (item: any, index: number) => {
    setPath(prev => prev.slice(0, index + 1))
    fetchFolders(sharedDriveId!, item.id)
  }

  async function handleCreateFolder() {
    if (!newFolderName) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sharedDriveId,
          parentId: currentParentId,
          folderName: newFolderName
        })
      })
      if (res.ok) {
        setNewFolderName('')
        fetchFolders(sharedDriveId!, currentParentId)
      }
    } finally {
      setIsCreating(false)
    }
  }

  async function handleApply() {
    // 현재 보고 있는 폴더(currentParentId)가 루트가 됨
    // 만약 root면 공용폴더의 최상단
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drive_shared_drive_id: sharedDriveId,
          drive_root_folder_id: currentParentId
        })
      })
      alert('공용폴더 루트가 설정되었습니다')
      onClose()
    } catch (err) {
      alert('설정 저장 중 오류가 발생했습니다')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white/90 glass w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden border border-white/40">
        {/* Header */}
        <div className="p-8 border-b border-white/30 flex items-center justify-between bg-white/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-2xl text-orange-primary flex-shrink-0">
              <HardDrive size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-orange-text italic leading-none">외부 스토리지 설정</h2>
              <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-1">Naver Works Shared Drive</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-orange-50 rounded-full transition-colors text-orange-text/30">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 space-y-6">
          {!sharedDriveId ? (
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest opacity-50 px-2">대상 공용폴더 선택</label>
              {isLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="animate-spin opacity-20" /></div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {drives.map(drive => (
                    <button
                      key={drive.sharedDriveId}
                      onClick={() => handleDriveSelect(drive)}
                      className="flex items-center justify-between p-5 bg-white/50 hover:bg-white rounded-[2rem] border border-transparent hover:border-orange-100 hover:shadow-xl hover:shadow-orange-900/5 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl text-orange-text/30 group-hover:text-orange-primary transition-colors">
                          <HardDrive size={20} />
                        </div>
                        <span className="font-bold text-orange-text">{drive.sharedDriveName}</span>
                      </div>
                      <ChevronRight size={18} className="text-orange-text/20 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 flex flex-col h-full">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 overflow-hidden bg-orange-50/50 p-2 rounded-2xl border border-orange-100">
                <button onClick={() => setSharedDriveId(null)} className="p-2 hover:bg-white rounded-xl text-orange-primary">
                  <ArrowLeft size={16} />
                </button>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {path.map((item, i) => (
                    <div key={i} className="flex items-center gap-1 flex-shrink-0">
                      {i > 0 && <span className="opacity-20 text-[10px] font-black">/</span>}
                      <button
                        onClick={() => handleBreadcrumbClick(item, i)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${i === path.length - 1 ? 'bg-white text-orange-text shadow-sm' : 'text-orange-text/40 hover:text-orange-text'}`}
                      >
                        {item.name}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Folder List */}
              <div className="flex-1 space-y-2 min-h-[200px]">
                {isLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="animate-spin opacity-20" /></div>
                ) : folders.length === 0 ? (
                  <div className="py-12 text-center text-xs font-bold opacity-20">폴더가 비어 있습니다</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {folders.map(folder => (
                      <button
                        key={folder.fileId}
                        onClick={() => handleFolderClick(folder)}
                        className="flex items-center justify-between p-4 bg-white/30 hover:bg-white/80 rounded-2xl border border-transparent hover:border-orange-100 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <Folder size={18} className="text-orange-text/30 group-hover:text-orange-primary transition-colors" />
                          <span className="text-sm font-bold text-orange-text">{folder.fileName}</span>
                        </div>
                        <ChevronRight size={16} className="text-orange-text/10 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Folder */}
              <div className="flex gap-2 p-2 bg-white/40 rounded-2xl border border-white/50">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="새 폴더 이름"
                  className="flex-1 bg-transparent px-4 py-3 outline-none text-xs font-bold text-orange-text placeholder:opacity-20"
                />
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName || isCreating}
                  className="p-3 bg-white rounded-xl text-orange-primary hover:bg-orange-primary hover:text-white transition-all disabled:opacity-30"
                >
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {sharedDriveId && (
          <div className="p-8 border-t border-white/30 bg-white/60 flex items-center justify-between">
            <div className="text-[10px] font-black opacity-30 uppercase tracking-widest pl-2">
              Current: {path[path.length - 1]?.name}
            </div>
            <button
              onClick={handleApply}
              className="px-8 py-4 bg-gradient-to-r from-orange-text to-[#333] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-3"
            >
              <Check size={16} />
              Set as Root
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
