-- =============================================
-- BuildUp 프로젝트 관리 플랫폼 DB 스키마 v2
-- 업데이트: 2026-03-19
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- =============================================
-- 공통 함수: updated_at 자동 갱신 트리거
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 1. 프로필 테이블 (Supabase Auth 연동)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  department  TEXT,                   -- 부서/업무 분류 (개발/과제 등)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. 프로젝트 테이블 (개발 프로젝트 전용 컬럼 포함)
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT,
  status           TEXT DEFAULT 'planning' CHECK (status IN (
                     -- 기존 (하위 호환)
                     'planning', 'development', 'testing', 'completed',
                     -- 개발 프로젝트 전용 상태
                     'contract_pending', 'in_progress', 'review', 'operating', 'on_hold'
                   )),
  category         TEXT DEFAULT 'external' CHECK (category IN ('external', 'internal', 'personal')),
  progress         INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  owner_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- 개발 프로젝트 전용 필드
  client_name      TEXT,                   -- 클라이언트(발주처)
  dev_type         TEXT CHECK (dev_type IN ('web', 'app', 'system', 'maintenance', 'other')),
  contract_date    DATE,                   -- 계약일
  start_date       DATE,                   -- 시작일
  deadline         DATE,                   -- 납기일
  contract_amount  BIGINT,                 -- 계약금액
  contract_type    TEXT CHECK (contract_type IN ('fixed', 'time', 'maintenance')),
  pm_name          TEXT,                   -- PM 담당자명
  dev_phase        TEXT CHECK (dev_phase IN ('planning', 'design', 'development', 'qa', 'review', 'done')),
  latest_update    TEXT,                   -- 최근 현황 메모
  next_action      TEXT,                   -- 다음 할 일
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. 태스크 테이블 (칸반 보드)
-- =============================================
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  assignee_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date     DATE,
  priority     TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  position     INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. 프로젝트 멤버 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS project_members (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role        TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'tester')),
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- =============================================
-- 5. 코멘트 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  task_id     UUID REFERENCES tasks(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. 활동 로그 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS activities (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action      TEXT NOT NULL,
  target      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. 시스템 설정 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS system_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- =============================================
-- 8. 네이버웍스 토큰 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS naver_tokens (
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. R&D 사업 관리 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS rd_projects (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT NOT NULL,
  project_type     TEXT DEFAULT 'rnd' CHECK (project_type IN ('rnd', 'support', 'education', 'proof')),
  status           TEXT DEFAULT 'reviewing' CHECK (status IN (
                     'reviewing', 'planned', 'submitted', 'failed_submit',
                     'skipped', 'selected', 'rejected'
                   )),
  ministry         TEXT,
  agency           TEXT,
  host_org         TEXT,
  partners         TEXT[],
  announced_at     DATE,
  deadline_at      DATE,
  period_start     DATE,
  period_end       DATE,
  gov_amount       BIGINT,
  total_amount     BIGINT,
  gov_ratio        INTEGER,
  self_ratio       INTEGER,
  announcement_url TEXT,
  memo             TEXT,
  created_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. R&D 문서 관리 테이블 (Naver Drive 연동)
-- =============================================

-- 프로젝트별 Drive 폴더 ID 캐싱
CREATE TABLE IF NOT EXISTS rd_drive_folders (
  rd_project_id        TEXT PRIMARY KEY,
  drive_folder_id      TEXT NOT NULL,
  drive_shared_drive_id TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 문서 카테고리 (Drive 하위 폴더)
CREATE TABLE IF NOT EXISTS rd_document_categories (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rd_project_id         TEXT NOT NULL,
  name                  TEXT NOT NULL,
  drive_folder_id       TEXT,
  drive_shared_drive_id TEXT,
  position              INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  created_by            UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 업로드 파일 메타데이터 (실제 파일은 Naver Drive에 저장)
CREATE TABLE IF NOT EXISTS rd_document_files (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id           UUID REFERENCES rd_document_categories(id) ON DELETE CASCADE NOT NULL,
  rd_project_id         TEXT NOT NULL,
  file_name             TEXT NOT NULL,
  file_size             BIGINT DEFAULT 0,
  mime_type             TEXT DEFAULT 'application/octet-stream',
  drive_file_id         TEXT NOT NULL,
  drive_shared_drive_id TEXT,
  uploaded_at           TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by           UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- =============================================
-- 11. 개발 프로젝트 상세 관리 테이블
-- =============================================

-- 기능 명세서
CREATE TABLE IF NOT EXISTS dev_features (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  priority     TEXT DEFAULT 'required' CHECK (priority IN ('required', 'recommended', 'optional')),
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold')),
  assignee_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  position     INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 단위 테스트 명세서
CREATE TABLE IF NOT EXISTS dev_test_cases (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  feature_id      UUID REFERENCES dev_features(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  scenario        TEXT,
  expected_result TEXT,
  actual_result   TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pass', 'fail', 'skip')),
  tested_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tested_at       TIMESTAMPTZ,
  position        INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 배포 이력
CREATE TABLE IF NOT EXISTS dev_deployments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  version      TEXT NOT NULL,
  environment  TEXT NOT NULL CHECK (environment IN ('dev', 'staging', 'production')),
  summary      TEXT,
  is_rollback  BOOLEAN DEFAULT FALSE,
  deployed_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deployed_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 이슈 / 리스크 / 변경요청
CREATE TABLE IF NOT EXISTS dev_issues (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  type         TEXT DEFAULT 'issue' CHECK (type IN ('issue', 'risk', 'cr')),
  status       TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority     TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assignee_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at  TIMESTAMPTZ,
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS) 활성화
-- =============================================
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE naver_tokens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rd_projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rd_drive_folders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rd_document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rd_document_files    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_features         ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_test_cases       ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_deployments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_issues           ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 정책
-- =============================================

-- Profiles: 전체 조회 / 본인만 수정
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: 멤버만 조회 / 소유자·관리자만 수정 / 소유자만 삭제
CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
  );
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (owner_id = auth.uid());

-- Tasks: 프로젝트 멤버만 접근
CREATE POLICY "tasks_select" ON tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id
    WHERE p.id = tasks.project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  ));
CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id
    WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  ));
CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id
    WHERE p.id = tasks.project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  ));
CREATE POLICY "tasks_delete" ON tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id
    WHERE p.id = tasks.project_id AND (p.owner_id = auth.uid() OR (pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin')))
  ));

-- Project Members
CREATE POLICY "members_select" ON project_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()) OR
    user_id = auth.uid()
  );
CREATE POLICY "members_insert" ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin'))
  );
CREATE POLICY "members_delete" ON project_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()) OR
    user_id = auth.uid()
  );

-- Comments
CREATE POLICY "comments_select" ON comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id
    WHERE p.id = comments.project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  ));
CREATE POLICY "comments_insert" ON comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (author_id = auth.uid());

-- Activities
CREATE POLICY "activities_select" ON activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id
    WHERE p.id = activities.project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  ));
CREATE POLICY "activities_insert" ON activities FOR INSERT WITH CHECK (user_id = auth.uid());

-- System Settings: 관리자만
CREATE POLICY "system_settings_admin" ON system_settings
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  ));

-- Naver Tokens: 본인만
CREATE POLICY "naver_tokens_owner" ON naver_tokens USING (user_id = auth.uid());

-- R&D 테이블: 로그인 사용자 전체 접근
CREATE POLICY "rd_projects_all"    ON rd_projects          USING (auth.uid() IS NOT NULL);
CREATE POLICY "rd_drive_folders_all" ON rd_drive_folders   USING (auth.uid() IS NOT NULL);
CREATE POLICY "rd_doc_categories_all" ON rd_document_categories USING (auth.uid() IS NOT NULL);
CREATE POLICY "rd_doc_files_all"   ON rd_document_files    USING (auth.uid() IS NOT NULL);

-- Dev 테이블: 프로젝트 멤버만
CREATE POLICY "dev_features_access" ON dev_features
  USING (EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id
    WHERE p.id = dev_features.project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  ));
CREATE POLICY "dev_test_cases_access" ON dev_test_cases
  USING (EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id
    WHERE p.id = dev_test_cases.project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  ));
CREATE POLICY "dev_deployments_access" ON dev_deployments
  USING (EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id
    WHERE p.id = dev_deployments.project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  ));
CREATE POLICY "dev_issues_access" ON dev_issues
  USING (EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id
    WHERE p.id = dev_issues.project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  ));

-- =============================================
-- 트리거: 신규 유저 프로필 자동 생성
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 트리거: updated_at 자동 갱신
-- =============================================
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER naver_tokens_updated_at
  BEFORE UPDATE ON naver_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER rd_projects_updated_at
  BEFORE UPDATE ON rd_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER dev_features_updated_at
  BEFORE UPDATE ON dev_features FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER dev_issues_updated_at
  BEFORE UPDATE ON dev_issues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
