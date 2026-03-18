# 🚀 실행 및 트러블슈팅 가이드

빌드업(Build-Up) 프로젝트의 로컬 개발 환경 실행 방법과 주요 포트 정보, 문제 해결 방법을 정리한 가이드입니다.

---

## 🏗️ 개발 서버 실행

### 1. 메인 애플리케이션 (Next.js)
가장 핵심이 되는 풀스택 애플리케이션입니다.
- **경로:** `app/`
- **명령어:** 
  ```bash
  cd app
  lsof -ti :3000 | xargs kill -9 && npm run dev
  ```
- **주소:** `http://localhost:3000`

### 2. UI 프로토타입 (Vite)
기존에 제작된 React 기반 UI 프로토타입입니다. 기능 구현 시 디자인 참조용으로 사용합니다.
- **경로:** `frontend/`
- **명령어:**
  ```bash
  cd frontend
  lsof -ti :5173 | xargs kill -9 && npm run dev
  ```
- **주소:** `http://localhost:5173`

---

## 🔌 주요 포트 요약

| 구성 요소 | 포트 | URL | 설명 |
| :--- | :--- | :--- | :--- |
| **Next.js App** | `3000` | `localhost:3000` | 현재 개발 중인 메인 서비스 |
| **Vite Prototype** | `5173` | `localhost:5173` | 디자인 및 UI 참조용 프로토타입 |
| **Supabase Local** | `5432` | - | 로컬 DB 사용 시 (현재는 클라우드 Supabase 사용 중) |

---

## 🛠️ 트러블슈팅 (Troubleshooting)

### 1. 포트 충돌 (Port already in use)
`3000` 또는 `5173` 포트가 이미 사용 중이라는 에러가 발생할 경우:
- **포트 확인 (Mac/Linux):**
  ```bash
  lsof -i :3000
  ```
- **프로세스 종료:**
  ```bash
  kill -9 <PID>
  ```

### 2. 환경 변수 오류
앱 실행은 되나 로그인이 안 되거나 DB 에러가 발생할 경우:
- `app/.env.local` 또는 `app/.env` 파일에 다음 값이 올바르게 설정되었는지 확인하세요.
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NAVER_WORKS_CLIENT_ID` / `SECRET`

### 3. 디펜던시(Dependency) 문제
새로운 패키지 설치 후 빌드 에러가 발생할 경우:
```bash
rm -rf .next node_modules package-lock.json
npm install
```

### 4. Supabase 리다이렉트 무한 루프
로그인 후 계속 로그인 페이지로 돌아오는 경우:
- 브라우저 쿠키를 삭제하거나, `npm run dev` 실행 시 강제 새로고침(Cmd+Shift+R)을 수행하세요.
- `.env`의 `NAVER_WORKS_CLIENT_ID`가 현재 도메인(`localhost:3000`)과 일치하는지 확인하세요.

---

## 📝 관리자 참고 사항
시스템 설정 및 드라이브 연동은 **관리자 권한(`is_admin: true`)**이 있는 계정으로 로그인해야 접근 가능합니다. 일반 사용자는 메뉴가 보이지 않을 수 있습니다.
