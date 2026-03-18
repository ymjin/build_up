'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Save, FolderOpen, AlertTriangle, Users, HardDrive, Check, Loader2, ChevronRight, Folder, ArrowLeft, Plus, X, Shield, CheckCircle } from 'lucide-react'
import { Profile } from '@/types'

type TabType = 'storage' | 'members'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('storage')
  const [driveRootId, setDriveRootId] = useState('')
  const [driveRootName, setDriveRootName] = useState<string | null>(null)
  const [sharedDriveId, setSharedDriveId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Storage Browser States
  const [drives, setDrives] = useState<any[]>([])
  const [browsingSharedDriveId, setBrowsingSharedDriveId] = useState<string | null>(null)
  const [folders, setFolders] = useState<any[]>([])
  const [currentParentId, setCurrentParentId] = useState<string>('root')
  const [path, setPath] = useState<any[]>([])
  const [browserLoading, setBrowserLoading] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Member Management States
  const [users, setUsers] = useState<Profile[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  useEffect(() => {
    fetchSettings()
    fetchDrives()
  }, [])

  async function fetchSettings() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      setDriveRootId(data.drive_root_folder_id || '')
      setSharedDriveId(data.drive_shared_drive_id || '')
      
      if (data.drive_root_folder_id) {
        fetchRootInfo(data.drive_root_folder_id, data.drive_shared_drive_id)
      }

      // 만약 저장된 공유 드라이브 ID가 있다면 즉시 브라우징 시작 준비
      if (data.drive_shared_drive_id) {
        setBrowsingSharedDriveId(data.drive_shared_drive_id)
      }
    } catch (err) {
      setError('설정을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchRootInfo(fileId: string, sDriveId: string) {
    try {
      const driveType = sDriveId && sDriveId !== 'personal' ? 'shared' : 'personal'
      const url = `/api/admin/drive?mode=fileInfo&fileId=${fileId}&sharedDriveId=${sDriveId}&driveType=${driveType}`
      const res = await fetch(url)
      const data = await res.json()
      if (data && data.fileName) {
        setDriveRootName(data.fileName)
      }
    } catch (e) {
      console.error('Failed to fetch root info:', e)
    }
  }

  async function fetchDrives() {
    try {
      const res = await fetch('/api/admin/drive?mode=drives')
      const data = await res.json()
      setDrives(data || [])
    } catch (err) {
      console.error('Failed to fetch drives:', err)
    }
  }

  async function fetchFolders(driveId: string, parentId: string = 'root') {
    setBrowserLoading(true)
    try {
      const encodedDriveId = encodeURIComponent(driveId)
      const encodedParentId = encodeURIComponent(parentId)
      console.log(`[AdminSettings] Fetching folders for Drive: ${driveId}, Parent: ${parentId}`)
      const res = await fetch(`/api/admin/drive?mode=folders&sharedDriveId=${encodedDriveId}&parentId=${encodedParentId}&_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const data = await res.json()
      console.log(`[AdminSettings] Folders response for ${parentId}:`, data)
      if (Array.isArray(data)) {
        setFolders(data)
        setError(null)
      } else {
        console.error('Folders API error:', data)
        setFolders([])
        setError(data.error || '폴더 목록을 불러오지 못했습니다')
      }
      setCurrentParentId(parentId)
    } catch (err) {
      setError('폴더 정보를 불러오는 중 네트워크 오류가 발생했습니다')
      setFolders([])
    } finally {
      setBrowserLoading(false)
    }
  }

  useEffect(() => {
    if (browsingSharedDriveId) {
      fetchFolders(browsingSharedDriveId, currentParentId)
    }
  }, [browsingSharedDriveId])

  async function fetchUsers() {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'members') {
      fetchUsers()
    }
  }, [activeTab])

  async function handleSaveSettings(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drive_root_folder_id: driveRootId,
          drive_shared_drive_id: sharedDriveId
        })
      })
      if (res.ok) alert('시스템 설정이 저장되었습니다')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDriveSelect = (drive: any) => {
    console.log('AdminSettingsPage: drive selected:', drive)
    const driveId = drive.sharedriveId || drive.sharedDriveId
    const driveName = drive.sharedriveName || drive.sharedDriveName
    setBrowsingSharedDriveId(driveId)
    setSharedDriveId(driveId)
    setPath([{ name: driveName, id: 'root' }])
    fetchFolders(driveId, 'root')
  }

  const handleFolderClick = (folder: any) => {
    setPath(prev => [...prev, { name: folder.fileName, id: folder.fileId }])
    fetchFolders(browsingSharedDriveId!, folder.fileId)
  }

  const handleBreadcrumbClick = (item: any, index: number) => {
    setPath(prev => prev.slice(0, index + 1))
    fetchFolders(browsingSharedDriveId!, item.id)
  }

  const handleSetAsRoot = (folderId: string) => {
    setDriveRootId(folderId)
    setToast({ 
      message: `루트 폴더가 지정되었습니다. 하단 '저장' 버튼을 꼭 눌러주세요.`,
      type: 'success' 
    })
  }

  async function handleCreateFolder() {
    if (!newFolderName || !browsingSharedDriveId) return
    setIsCreating(true)
    const payload = {
      sharedDriveId: browsingSharedDriveId,
      parentId: currentParentId,
      folderName: newFolderName
    }
    console.log('[AdminSettings] Creating folder with payload:', payload)

    try {
      const res = await fetch('/api/admin/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      console.log('[AdminSettings] Create folder response:', data)
      
      if (res.ok) {
        setToast({ message: `'${newFolderName}' 폴더가 생성되었습니다. 목록을 확인하고 있습니다...`, type: 'success' })
        setNewFolderName('')
        
        // 지연 반영을 해결하기 위한 폴링(Polling) 로직: 2초 간격으로 3회 재조회
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (browsingSharedDriveId) {
            fetchFolders(browsingSharedDriveId, currentParentId);
          }
          if (attempts >= 3) clearInterval(interval);
        }, 2000);
      } else {
        setToast({ message: `폴더 생성 실패: ${data.message || data.error || '알 수 없는 오류'}`, type: 'error' })
      }
    } catch (err) {
      console.error('Folder creation error:', err)
      setToast({ message: '폴더 생성 중 네트워크 오류가 발생했습니다.', type: 'error' })
    } finally {
      setIsCreating(false)
    }
  }

  async function handleUpdateUserDepartment(userId: string, targetDept: string) {
    const user = users.find(u => u.id === userId)
    if (!user) return

    let currentDepts = user.department ? user.department.split(',').filter(Boolean) : []
    let nextDepts: string[]

    if (currentDepts.includes(targetDept)) {
      nextDepts = currentDepts.filter(d => d !== targetDept)
    } else {
      nextDepts = [...currentDepts, targetDept]
    }

    const department = nextDepts.length > 0 ? nextDepts.join(',') : null

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, department })
      })
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, department } : u))
        setToast({ message: '사용자 정보가 업데이트되었습니다.', type: 'success' })
      }
    } catch (err) {
      setToast({ message: '사용자 정보 업데이트 실패', type: 'error' })
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="p-4 bg-orange-100 rounded-3xl text-orange-primary flex-shrink-0 shadow-sm">
          <Settings size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-orange-text italic leading-none">시스템 설정</h1>
          <p className="text-xs font-black opacity-30 uppercase tracking-[0.3em] mt-2">Admin Control Panel</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-white/40 glass rounded-3xl mb-8 w-fit border border-white/30">
        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'storage' ? 'bg-orange-primary text-white shadow-lg' : 'text-orange-text/40 hover:text-orange-text'
          }`}
        >
          <HardDrive size={14} />
          스토리지 정보
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'members' ? 'bg-orange-primary text-white shadow-lg' : 'text-orange-text/40 hover:text-orange-text'
          }`}
        >
          <Users size={14} />
          회원 관리
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'storage' ? (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Storage Configuration Status Summary (Top Focus) */}
            <div className="bg-orange-text text-white p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
              <div className="flex items-center gap-6 relative">
                <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                  <HardDrive size={32} className="text-orange-100" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Current Active Storage</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black italic tracking-tight">
                      {sharedDriveId && drives.find(d => d.sharedDriveId === sharedDriveId)
                        ? `${drives.find(d => d.sharedDriveId === sharedDriveId)?.sharedDriveName} / ` 
                        : (sharedDriveId === 'personal' ? 'Personal Drive / ' : '')}
                      <span className="text-orange-200">{driveRootName || (driveRootId ? 'Root' : 'Not Set')}</span>
                    </span>
                    {driveRootId ? (
                      <div className="px-3 py-1 bg-orange-primary/30 rounded-lg border border-orange-primary/20 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-primary animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-100">Synchronized</span>
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-white/10 rounded-lg border border-white/10 flex items-center gap-2">
                        <AlertTriangle size={10} className="text-orange-200" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-200 opacity-60">Not Configured</span>
                      </div>
                    )}
                  </div>
                  {driveRootId && (
                    <div className="mt-2 flex items-center gap-2 opacity-50">
                      <Folder size={12} />
                      <span className="text-[10px] font-bold tracking-wider">ID: {driveRootId}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {!driveRootId ? (
                <div className="flex flex-col items-end gap-2 relative">
                  <p className="text-[10px] font-bold text-orange-100/40 italic max-w-[200px] text-right leading-tight">파일이 저장될 위치를 위 탐색기에서 선택하여 'Set as Root' 버튼을 눌러주세요.</p>
                </div>
              ) : (
                <div className="hidden md:flex flex-col items-end gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
                  <span className="text-[8px] font-black uppercase tracking-[0.4em]">Ready for Integration</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-1 rounded-full bg-white"></div>)}
                  </div>
                </div>
              )}
            </div>

            {/* Directory Browser (Main Focus) */}
            <div className="bg-white/40 glass rounded-[2.5rem] border border-white/30 flex flex-col h-[700px] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/30 bg-white/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-primary flex items-center justify-center text-white shadow-lg">
                    <HardDrive size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-orange-text">Drive Explorer</h3>
                    <p className="text-[10px] font-bold text-orange-text/40 italic">프로젝트 파일을 저장할 루트 폴더를 탐색하고 지정하세요.</p>
                  </div>
                </div>
                {!browsingSharedDriveId ? (
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-xl border border-orange-100 animate-pulse">
                      <span className="text-[10px] font-black text-orange-primary uppercase tracking-tighter">Select a drive to browse folders</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const currentFolder = path[path.length - 1]
                        setDriveRootId(currentFolder.id)
                        fetch('/api/admin/settings', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            drive_root_folder_id: currentFolder.id,
                            drive_shared_drive_id: browsingSharedDriveId
                          })
                        }).then(res => {
                          if (res.ok) setToast({ message: `'${currentFolder.name}' 위치가 루트 저장소로 지정되었습니다.`, type: 'success' })
                        })
                      }}
                      className="px-5 py-2.5 bg-orange-text hover:bg-orange-primary rounded-xl text-[10px] font-black text-white uppercase transition-all shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                      <Check size={14} />
                      Set CURRENT as Root
                    </button>
                    <button 
                      onClick={() => setBrowsingSharedDriveId(null)} 
                      className="px-5 py-2.5 bg-white/50 hover:bg-white rounded-xl text-[10px] font-black text-orange-primary uppercase transition-all shadow-sm border border-orange-100/50 flex items-center gap-2 group"
                    >
                      <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                      Drives
                    </button>
                    <button 
                      onClick={() => fetchFolders(browsingSharedDriveId!, currentParentId)} 
                      className="flex items-center gap-2 px-5 py-2.5 bg-orange-50 hover:bg-orange-100 rounded-xl text-[10px] font-black text-orange-primary uppercase transition-all shadow-sm border border-orange-200 group"
                    >
                      <Loader2 size={14} className={`${browserLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                      목록 새로고침
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-auto p-8">
                {!browsingSharedDriveId ? (
                  /* Drive List */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!Array.isArray(drives) || drives.length === 0 ? (
                      <div className="col-span-full p-20 flex flex-col items-center gap-6 opacity-40">
                        <AlertTriangle size={48} className="text-orange-primary/50" />
                        <div className="text-center">
                          <p className="font-black text-sm italic">드라이브를 불러올 수 없습니다</p>
                          <p className="text-[10px] font-bold mt-2">API 권한 설정 또는 네트워크 상태를 확인해 주세요.</p>
                        </div>
                      </div>
                    ) : (
                      drives.map((drive: any) => (
                        <button
                          key={drive.sharedriveId}
                          onClick={() => handleDriveSelect(drive)}
                          className="flex items-center gap-4 p-5 bg-white/50 hover:bg-white rounded-3xl border border-transparent hover:border-orange-200 transition-all group text-left shadow-sm hover:shadow-xl hover:-translate-y-1"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                            <HardDrive size={28} />
                          </div>
                          <div className="flex-1">
                            <div className="font-black text-orange-text text-base">{drive.sharedriveName}</div>
                            <div className="text-[10px] font-bold uppercase tracking-tighter opacity-30">Shared Drive</div>
                          </div>
                          <ChevronRight size={20} className="opacity-20 group-hover:opacity-100 transition-opacity text-orange-primary" />
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  /* Folder Browser */
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Sticky Header: Breadcrumbs */}
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-6 mb-2 border-b border-orange-100/30 flex-shrink-0">
                      {path.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 flex-shrink-0">
                          {i > 0 && <ChevronRight size={14} className="opacity-20" />}
                          <button
                            onClick={() => handleBreadcrumbClick(item, i)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              i === path.length - 1 ? 'bg-orange-primary text-white shadow-md scale-105' : 'bg-white/50 text-orange-text/40 hover:text-orange-text hover:bg-white'
                            }`}
                          >
                            {item.name}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Scrollable Area: Folder List */}
                    <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 py-4">
                      {browserLoading ? (
                        <div className="p-24 flex flex-col items-center gap-4">
                          <Loader2 className="animate-spin text-orange-primary" size={40} />
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Loading Folders...</p>
                        </div>
                      ) : folders.length === 0 ? (
                        <div className="p-24 flex flex-col items-center gap-4">
                          <div className="p-6 bg-orange-50 rounded-full text-orange-200">
                            <Folder size={32} />
                          </div>
                          <p className="text-[11px] font-black text-orange-text/30 italic">이 폴더는 비어 있습니다</p>
                          <button 
                            onClick={() => fetchFolders(browsingSharedDriveId!, currentParentId)}
                            className="mt-2 px-6 py-2 bg-white border border-orange-100 rounded-full text-[10px] font-black text-orange-primary uppercase hover:bg-orange-50 transition-all flex items-center gap-2"
                          >
                            <Loader2 size={12} className={browserLoading ? 'animate-spin' : ''} />
                            Check Again
                          </button>
                        </div>
                      ) : (
                        folders.map(folder => (
                          <div key={folder.fileId} className="flex items-center gap-3 group animate-in fade-in slide-in-from-right-2 duration-300">
                            {/* 폴더 클릭 → 선택 (루트 지정) */}
                            <button
                              onClick={() => {
                                setDriveRootId(folder.fileId)
                                setDriveRootName(folder.fileName)
                                fetch('/api/admin/settings', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    drive_root_folder_id: folder.fileId,
                                    drive_shared_drive_id: browsingSharedDriveId
                                  })
                                }).then(res => {
                                  if (res.ok) {
                                    setToast({ message: `'${folder.fileName}' 폴더가 기본 저장 위치로 지정되었습니다.`, type: 'success' })
                                  }
                                })
                              }}
                              className={`flex-1 flex items-center justify-between p-4 rounded-[1.5rem] border transition-all shadow-sm group-hover:shadow-md ${
                                driveRootId === folder.fileId
                                  ? 'border-orange-primary bg-orange-50/50'
                                  : 'bg-white/30 hover:bg-white border-transparent hover:border-orange-100'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                  driveRootId === folder.fileId ? 'bg-orange-primary text-white' : 'bg-orange-50 text-orange-400 group-hover:text-orange-primary'
                                }`}>
                                  {driveRootId === folder.fileId ? <Check size={20} /> : <Folder size={20} />}
                                </div>
                                <div className="flex flex-col items-start">
                                  <span className="text-sm font-bold text-orange-text">{folder.fileName}</span>
                                  {driveRootId === folder.fileId
                                    ? <span className="text-[9px] font-black text-orange-primary uppercase tracking-tighter">Current Upload Root</span>
                                    : <span className="text-[9px] font-bold text-orange-text/30 opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 루트로 지정</span>
                                  }
                                </div>
                              </div>
                              {driveRootId === folder.fileId && (
                                <span className="text-[9px] font-black text-orange-primary uppercase tracking-widest">Selected</span>
                              )}
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Sticky Footer: Add Folder Feature */}
                    <div className="mt-4 p-8 bg-orange-primary/5 rounded-[3rem] border border-orange-primary/10 flex flex-col gap-6 shadow-inner flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-primary flex items-center gap-2">
                            <Plus size={14} />
                            Create New Folder
                          </h4>
                          <p className="text-[9px] font-bold text-orange-text/30 italic">현재 위치에 새 폴더를 생성하고 바로 루트로 지정할 수 있습니다.</p>
                        </div>
                        <span className="px-3 py-1 bg-white/50 rounded-lg text-[8px] font-black text-orange-primary/40 uppercase tracking-widest border border-orange-100">Inside {path[path.length - 1]?.name || 'Root'}</span>
                      </div>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <FolderOpen className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-primary/30" size={18} />
                          <input
                            type="text"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleCreateFolder()
                              }
                            }}
                            placeholder="새 폴더 이름을 입력하세요..."
                            className="w-full pl-16 pr-8 py-5 bg-white border-2 border-transparent focus:border-orange-primary/40 rounded-3xl outline-none font-bold text-orange-text placeholder:opacity-20 text-sm transition-all shadow-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleCreateFolder}
                          disabled={isCreating || !newFolderName}
                          className="px-10 bg-orange-primary text-white text-[11px] font-black uppercase tracking-widest rounded-3xl shadow-xl hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                        >
                          {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={20} />}
                          Create
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/40 glass rounded-[2.5rem] border border-white/30 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-orange-100/20 bg-white/20 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-orange-text">User Access Management</h3>
                  <p className="text-[10px] font-bold text-orange-text/40 italic">프로젝트 접근 권한 및 업무 분류를 설정하세요.</p>
                </div>
                <div className="flex gap-12 mr-8">
                  <span className="text-[10px] font-black text-orange-text/40 uppercase tracking-tighter w-12 text-center">개발</span>
                  <span className="text-[10px] font-black text-orange-text/40 uppercase tracking-tighter w-12 text-center">과제</span>
                </div>
              </div>
              
              <div className="divide-y divide-orange-100/10">
                {usersLoading ? (
                  <div className="p-20 flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-orange-primary" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Loading Members...</p>
                  </div>
                ) : !Array.isArray(users) || users.length === 0 ? (
                  <div className="p-20 text-center opacity-30 font-bold italic text-sm">등록된 회원이 없거나 불러올 수 없습니다</div>
                ) : (
                  users.map(user => {
                    // JSON 성함 파싱 로직
                    let displayName = user.full_name || '이름 없음'
                    try {
                      if (displayName.startsWith('{')) {
                        const nameObj = JSON.parse(displayName)
                        displayName = `${nameObj.lastName || ''}${nameObj.firstName || ''}`.trim() || displayName
                      }
                    } catch (e) {}

                    return (
                      <div key={user.id} className="p-6 flex items-center justify-between group hover:bg-white/40 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-orange-50 overflow-hidden flex-shrink-0 border-2 border-white shadow-md group-hover:scale-105 transition-transform">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-orange-primary font-black text-xl">
                                  {displayName[0] || 'U'}
                                </div>
                              )}
                            </div>
                            {user.is_admin && (
                              <div className="absolute -top-2 -right-2 bg-orange-text text-white p-1 rounded-lg shadow-lg">
                                <Shield size={10} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-black text-orange-text text-lg tracking-tight">{displayName}</div>
                            <div className="text-[10px] opacity-40 font-bold uppercase tracking-wider">{user.email}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-12 mr-8">
                          {/* 개발 (Development) Check/Toggle */}
                          <button
                            onClick={() => handleUpdateUserDepartment(user.id, 'development')}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 ${
                              user.department?.split(',').includes('development')
                                ? 'bg-orange-primary border-orange-200 text-white shadow-lg scale-110' 
                                : 'bg-white/50 border-orange-50 text-orange-100 hover:border-orange-200 hover:text-orange-200 shadow-sm'
                            }`}
                          >
                            <div className={`transition-all duration-300 ${user.department?.split(',').includes('development') ? 'scale-100 rotate-0' : 'scale-75 rotate-45'}`}>
                              <CheckCircle size={24} strokeWidth={3} />
                            </div>
                          </button>

                          {/* 과제 (R&D) Check/Toggle */}
                          <button
                            onClick={() => handleUpdateUserDepartment(user.id, 'rnd')}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 ${
                              user.department?.split(',').includes('rnd')
                                ? 'bg-orange-text border-orange-200 text-white shadow-lg scale-110' 
                                : 'bg-white/50 border-orange-50 text-orange-100 hover:border-orange-200 hover:text-orange-200 shadow-sm'
                            }`}
                          >
                            <div className={`transition-all duration-300 ${user.department?.split(',').includes('rnd') ? 'scale-100 rotate-0' : 'scale-75 rotate-45'}`}>
                              <CheckCircle size={24} strokeWidth={3} />
                            </div>
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            
            <div className="p-8 bg-orange-50/50 rounded-[2.5rem] border border-orange-100 text-center">
              <p className="text-[10px] font-bold text-orange-text/40 uppercase tracking-[0.2em] italic">
                * 회원의 업무 분류를 변경하면 대시보드 및 프로젝트 목록 구성에 반영됩니다.
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-300 border backdrop-blur-xl ${
          toast.type === 'success' ? 'bg-orange-primary text-white border-white/20' : 'bg-red-500 text-white border-white/20'
        }`}>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          </div>
          <span className="text-xs font-black uppercase tracking-widest">{toast?.message}</span>
          <button onClick={() => setToast(null)} className="ml-4 p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
