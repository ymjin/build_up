-- BuildUp 프로젝트 관리 플랫폼 DB 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. 프로필 테이블 (Supabase Auth와 연동)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  department TEXT, -- 부서/업무 분류 (개발/과제 등)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 프로젝트 테이블
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'development', 'testing', 'completed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 태스크 테이블
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 프로젝트 멤버 테이블
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'tester')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 5. 코멘트 테이블
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 활동 로그 테이블
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 8. 네이버웍스 토큰 테이블
CREATE TABLE IF NOT EXISTS naver_tokens (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS) 정책
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE naver_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles: 자신의 프로필만 수정 가능, 전체 조회 가능
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: 멤버만 조회, 소유자만 수정/삭제
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
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.id = tasks.project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );
CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );
CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.id = tasks.project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );
CREATE POLICY "tasks_delete" ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.id = tasks.project_id AND (p.owner_id = auth.uid() OR (pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin')))
    )
  );

-- Project Members: 프로젝트 멤버 접근
CREATE POLICY "members_select" ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND (p.owner_id = auth.uid())
    ) OR user_id = auth.uid()
  );
CREATE POLICY "members_insert" ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members pm WHERE pm.project_id = project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin')
    )
  );
CREATE POLICY "members_delete" ON project_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()) OR
    user_id = auth.uid()
  );

-- Comments: 프로젝트 멤버만 접근
CREATE POLICY "comments_select" ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.id = comments.project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );
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

-- Activities: 프로젝트 멤버 접근
CREATE POLICY "activities_select" ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.id = activities.project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );
CREATE POLICY "activities_insert" ON activities FOR INSERT WITH CHECK (user_id = auth.uid());

-- System Settings: 관리자만 읽고 쓰기 가능
CREATE POLICY "system_settings_admin" ON system_settings
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true));

-- Naver Tokens: 자신만 접근 가능
CREATE POLICY "naver_tokens_owner" ON naver_tokens
  USING (user_id = auth.uid());

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
-- 트리거: projects.updated_at 자동 업데이트
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER naver_tokens_updated_at
  BEFORE UPDATE ON naver_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
