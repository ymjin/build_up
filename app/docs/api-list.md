# 빌드업 (Build-Up) — API 목록

**버전:** 0.1.0
**업데이트:** 2026-03-12
**백엔드:** Supabase (PostgreSQL + RLS)
**클라이언트:** TanStack Query v5 + Supabase JS SDK v2

---

## 개요

빌드업은 별도 REST API 서버 없이 **Supabase 클라이언트 SDK**를 직접 사용합니다.
`lib/queries.ts`에 TanStack Query 훅으로 캡슐화되어 있으며, 모든 쿼리는 Row Level Security(RLS)로 접근 제어됩니다.

---

## 인증 (Auth)

Supabase Auth를 사용합니다.

| 작업 | 메서드 | 설명 |
|------|--------|------|
| 로그인 | `supabase.auth.signInWithPassword()` | 이메일 + 비밀번호 |
| 회원가입 | `supabase.auth.signUp()` | 이메일 인증 필요 |
| 로그아웃 | `supabase.auth.signOut()` | 세션 삭제 |
| 세션 갱신 | `supabase.auth.getUser()` | proxy.ts에서 자동 처리 |
| OAuth 콜백 | `supabase.auth.exchangeCodeForSession()` | `/auth/callback` 라우트 |

**신규 유저 프로필 자동 생성:** `auth.users` INSERT 트리거 → `profiles` 테이블 자동 삽입

---

## Projects API

### `useProjects()`
```
테이블: projects
메서드: SELECT
조건: 소유자 또는 멤버인 프로젝트
포함: member_count(집계), task_count(집계)
정렬: created_at DESC
```

| 반환 필드 | 타입 | 설명 |
|-----------|------|------|
| `id` | uuid | 프로젝트 ID |
| `name` | string | 프로젝트 이름 |
| `description` | string \| null | 설명 |
| `status` | `'planning' \| 'development' \| 'testing' \| 'completed'` | 현재 단계 |
| `progress` | number (0–100) | 진행률 % |
| `owner_id` | uuid | 소유자 ID |
| `created_at` | timestamp | 생성일 |
| `updated_at` | timestamp | 수정일 |
| `member_count` | `{ count: number }[]` | 멤버 수 |
| `task_count` | `{ count: number }[]` | 태스크 수 |

---

### `useProject(id: string)`
```
테이블: projects
메서드: SELECT ... WHERE id = :id
```

---

### `useCreateProject()`
```
테이블: projects → INSERT
부작용: project_members → INSERT (owner 역할로 자동 추가)
```

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `name` | string | 필수 |
| `description` | string | 선택 |
| `status` | ProjectStatus | 선택 (기본: `'planning'`) |
| `progress` | number | 선택 (기본: `0`) |

---

### `useUpdateProject()`
```
테이블: projects → UPDATE WHERE id = :id
권한: 소유자 또는 admin 멤버
```

| 파라미터 | 타입 |
|----------|------|
| `id` | string (필수) |
| `status` | ProjectStatus (선택) |
| `progress` | number (선택) |
| `name` | string (선택) |
| `description` | string (선택) |

---

### `useDeleteProject()`
```
테이블: projects → DELETE WHERE id = :id
권한: 소유자만
부작용: CASCADE → tasks, project_members, comments, activities 전부 삭제
```

---

## Tasks API

### `useTasks(projectId: string)`
```
테이블: tasks
조인: profiles (assignee)
조건: project_id = :projectId
정렬: position ASC
```

| 반환 필드 | 타입 | 설명 |
|-----------|------|------|
| `id` | uuid | 태스크 ID |
| `project_id` | uuid | 소속 프로젝트 |
| `title` | string | 제목 |
| `description` | string \| null | 설명 |
| `status` | `'todo' \| 'in_progress' \| 'done'` | 칸반 컬럼 |
| `assignee_id` | uuid \| null | 담당자 ID |
| `due_date` | date \| null | 마감일 |
| `priority` | `'low' \| 'medium' \| 'high'` | 우선순위 |
| `position` | number | 컬럼 내 정렬 순서 |
| `assignee` | Profile \| null | 담당자 정보 (조인) |

---

### `useCreateTask()`
```
테이블: tasks → INSERT
```

| 파라미터 | 타입 | 필수 |
|----------|------|------|
| `project_id` | string | ✅ |
| `title` | string | ✅ |
| `status` | TaskStatus | 선택 (기본: `'todo'`) |
| `priority` | string | 선택 (기본: `'medium'`) |
| `description` | string | 선택 |
| `assignee_id` | string | 선택 |
| `due_date` | string | 선택 |

---

### `useUpdateTask()`
```
테이블: tasks → UPDATE WHERE id = :id
주 용도: 칸반 드래그&드롭 시 status 변경
```

---

### `useDeleteTask()`
```
테이블: tasks → DELETE WHERE id = :id
```

---

## Members API

### `useMembers(projectId: string)`
```
테이블: project_members
조인: profiles
조건: project_id = :projectId
정렬: joined_at ASC
```

| 반환 필드 | 타입 | 설명 |
|-----------|------|------|
| `id` | uuid | 멤버십 ID |
| `project_id` | uuid | 프로젝트 ID |
| `user_id` | uuid | 사용자 ID |
| `role` | `'owner' \| 'admin' \| 'member' \| 'tester'` | 역할 |
| `joined_at` | timestamp | 참여일 |
| `profile` | Profile | 사용자 정보 (조인) |

---

### `useInviteMember()`
```
1. profiles → SELECT WHERE email = :email (사용자 조회)
2. project_members → INSERT
에러: 유저 없음 / 이미 멤버
```

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `projectId` | string | 프로젝트 ID |
| `email` | string | 초대할 사용자 이메일 |
| `role` | MemberRole | 부여할 역할 |

---

### `useRemoveMember()`
```
테이블: project_members → DELETE WHERE id = :memberId
제한: owner 역할은 삭제 불가 (UI에서 버튼 숨김)
```

---

## Comments API

### `useComments(projectId: string)`
```
테이블: comments
조인: profiles (author)
조건: project_id = :projectId
정렬: created_at DESC
제한: 최근 20개
```

| 반환 필드 | 타입 | 설명 |
|-----------|------|------|
| `id` | uuid | 코멘트 ID |
| `project_id` | uuid | 소속 프로젝트 |
| `task_id` | uuid \| null | 연결된 태스크 (null이면 프로젝트 전체) |
| `author_id` | uuid | 작성자 ID |
| `content` | string | 내용 |
| `created_at` | timestamp | 작성일 |
| `author` | Profile | 작성자 정보 (조인) |

---

### `useCreateComment()`
```
테이블: comments → INSERT
author_id: 현재 로그인 유저 자동 주입
```

| 파라미터 | 타입 | 필수 |
|----------|------|------|
| `project_id` | string | ✅ |
| `content` | string | ✅ |
| `task_id` | string | 선택 |

---

## Activities API

### `useActivities(projectId: string)`
```
테이블: activities
조인: profiles (user)
조건: project_id = :projectId
정렬: created_at DESC
제한: 최근 20개
```

| 반환 필드 | 타입 | 설명 |
|-----------|------|------|
| `id` | uuid | 활동 ID |
| `project_id` | uuid | 소속 프로젝트 |
| `user_id` | uuid | 활동한 사용자 |
| `action` | string | 동작 (예: "생성", "수정") |
| `target` | string | 대상 (예: "태스크명") |
| `created_at` | timestamp | 발생일 |
| `user` | Profile | 사용자 정보 (조인) |

---

## Row Level Security (RLS) 요약

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `profiles` | 전체 공개 | 본인만 | 본인만 | — |
| `projects` | 멤버만 | 본인 owner_id | 소유자/admin | 소유자만 |
| `tasks` | 프로젝트 멤버 | 프로젝트 멤버 | 프로젝트 멤버 | 소유자/admin |
| `project_members` | 소유자 또는 본인 | 소유자/admin | — | 소유자 또는 본인 |
| `comments` | 프로젝트 멤버 | 본인 + 멤버 | — | 본인만 |
| `activities` | 프로젝트 멤버 | 본인만 | — | — |

---

## 캐시 무효화 전략 (TanStack Query)

| 작업 | 무효화 대상 |
|------|------------|
| 프로젝트 생성/수정/삭제 | `['projects']` |
| 프로젝트 수정 | `['projects']`, `['projects', id]` |
| 태스크 생성/수정/삭제 | `['tasks', projectId]` |
| 멤버 추가/제거 | `['members', projectId]` |
| 코멘트 생성 | `['comments', projectId]` |

---

## 환경변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key (공개) | `eyJhbGci...` |
