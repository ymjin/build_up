🏗️ 프로젝트: 빌드업 (Build-Up)
"소스 관리를 제외한 프로젝트 기획부터 테스트, 피드백까지의 전 과정을 차곡차곡 쌓아가는 개인 프로젝트 통합 관리 플랫폼"

1. 핵심 컨셉 및 디자인 (Design Identity)
네이밍: 빌드업 (Build-Up) - 기초부터 완성까지 차근차근 다듬어가는 과정.

퍼스널 컬러: * Base: 다크 모드 (블루-블랙 / #0F172A, #1E293B)

Point: 오렌지 그라데이션 (#FB923C → #EA580C)

핵심 비주얼: 'Progressive Fill' (진행률이 높을수록 바의 길이가 길어지고, 색상 농도가 진해지는 효과)

2. 주요 화면 구성 (Dashboard Elements)
📊 대시보드 (통합/다중 프로젝트 뷰)
Global Build Score: 모든 프로젝트의 평균 진행률을 상단 중앙에 거대한 원형 게이지로 표시.

Project Grid: 각 프로젝트를 카드로 나열.

진행도에 따라 채워지는 오렌지 그라데이션 프로그레스 바.

현재 단계 표시 (기획 - 개발 - 테스트 - 완료).

Build Health: 각 프로젝트의 안정성 상태 (Stable / Needs Feedback / Under Construction).

Feedback Heatmap: 모든 프로젝트의 활동(코멘트, 미션 완료)을 깃허브 잔디 스타일로 시각화 (활동량이 많을수록 진한 오렌지색).

Global Live Feedback: 모든 프로젝트에서 발생하는 최신 코멘트를 실시간 타임라인으로 노출.

Tester Insights: 총 참여 테스터 수, 이슈 해결률 등 통계 데이터.

3. 기능 상세 (Features)
① 프로젝트 관리
수동 프로젝트 등록 및 상세 정보 관리.

마일스톤 기반 로드맵 설정.

프로젝트 상태 전이 (기획 -> 개발 -> 테스트 -> 완료).

② 참여 및 피드백 (Collaboration)
테스트 미션: 관리자가 테스터에게 요청할 체크리스트 등록.

인터랙티브 코멘트: 테스터들의 피드백 등록 및 관리자의 답변 기능.

이슈 트래킹: 기획적 오류나 UI/UX 개선안을 별도 카테고리로 관리.

③ 유저 시스템
참여자(테스터) 승인 및 권한 관리.

기여도에 따른 테스터 랭킹 시스템.

4. 기술 스택 제안 (Tech Stack)
Frontend: Next.js (App Router), Tailwind CSS

Backend/DB: Supabase (Auth, Database, Storage)

State Management: TanStack Query (React Query)

Deployment: Vercel