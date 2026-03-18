// R&D 사업 데이터 임시 저장소 (localStorage 기반)
// Supabase 연동 전까지 로컬에서 수정 상태를 유지합니다

import { RD_PROJECTS, type RdProject } from './rd-data'

const STORAGE_KEY = 'buildup_rd_projects'

// localStorage에서 전체 프로젝트 목록 로드 (없으면 기본 시드 데이터 사용)
export function loadRdProjects(): RdProject[] {
  if (typeof window === 'undefined') return RD_PROJECTS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : RD_PROJECTS
  } catch {
    return RD_PROJECTS
  }
}

// 전체 저장
export function saveRdProjects(projects: RdProject[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

// 단건 수정
export function updateRdProject(id: string, updates: Partial<RdProject>): RdProject[] {
  const projects = loadRdProjects()
  const updated = projects.map(p => p.id === id ? { ...p, ...updates } : p)
  saveRdProjects(updated)
  return updated
}

// 단건 조회
export function getRdProject(id: string): RdProject | undefined {
  return loadRdProjects().find(p => p.id === id)
}
