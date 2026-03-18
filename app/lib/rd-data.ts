// 노션 사업관리 데이터 기반 시드 데이터 (2026년 사업 리스트)
// Supabase 연동 전 목업 데이터로 사용

export type RdProjectType = 'rnd' | 'support' | 'education' | 'proof'
export type RdProjectStatus = 'reviewing' | 'planned' | 'submitted' | 'failed_submit' | 'skipped' | 'selected' | 'rejected'

export interface RdProject {
  id: string
  name: string
  project_type: RdProjectType
  status: RdProjectStatus
  ministry: string
  agency: string
  host_org: string
  partners: string[]
  announced_at?: string
  deadline_at: string
  period_start?: string
  period_end?: string
  gov_amount?: number
  total_amount?: number
  gov_ratio?: number
  self_ratio?: number
  announcement_url?: string
  memo?: string
}

export const RD_PROJECTS: RdProject[] = [
  {
    id: '1',
    name: '창업도약패키지',
    project_type: 'support',
    status: 'submitted',
    ministry: '중소벤처기업부',
    agency: '창업진흥원 (KOIPO)',
    host_org: '(주)슈크란코리아',
    partners: [],
    deadline_at: '2026-02-13',
    memo: '슈크란코리아 단독 지원',
  },
  {
    id: '2',
    name: '2026년 인공지능(AI) 특화 공동훈련센터 신규 공모',
    project_type: 'education',
    status: 'submitted',
    ministry: '고용노동부',
    agency: 'HRDK (한국산업인력공단)',
    host_org: '인하공업전문대학',
    partners: ['AIRA (에이아이스마트인프라건설연구조합)'],
    deadline_at: '2026-02-23',
    announcement_url: 'https://www.hrd4u.or.kr/champ/bbs/view/B0001209/4321.do?menuNo=0401',
    memo: '연구조합의 연구용역 컨설팅 용역 형태로 참여. 자동차 산업 재직자 AI 교육 사업 (3개년)',
  },
  {
    id: '3',
    name: '2026년 서울형 R&D 지원사업',
    project_type: 'support',
    status: 'planned',
    ministry: '서울특별시',
    agency: 'SBA (서울경제진흥원)',
    host_org: '(주)슈크란코리아',
    partners: ['동양미래대학교'],
    deadline_at: '2026-03-10',
    memo: '슈크란코리아 주관, 동양미래대학교 공동',
  },
  {
    id: '4',
    name: '2026년 K-브랜드 플랫폼 육성사업',
    project_type: 'support',
    status: 'skipped',
    ministry: '중소벤처기업부',
    agency: '중소벤처기업진흥공단',
    host_org: '(주)슈크란코리아',
    partners: [],
    deadline_at: '2026-03-10',
    memo: '검토 후 지원 포기',
  },
  {
    id: '5',
    name: '2026년도 제조안전고도화기술개발사업',
    project_type: 'rnd',
    status: 'failed_submit',
    ministry: '산업통상자원부',
    agency: 'KEIT (한국산업기술기획평가원)',
    host_org: '(주)코팅코리아',
    partners: ['가톨릭대학교', 'AIRA (에이아이스마트인프라건설연구조합)', '(주)아이오유소프트'],
    deadline_at: '2026-03-03',
    period_start: '2026-04-01',
    period_end: '2028-12-31',
    total_amount: 750000000,
    announcement_url: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=018436&ancmPrg=ancmPre',
    memo: '제출 기한 내 서류 준비 미완료로 제출 실패. 과제 유형: 품목지정공모 > 뿌리 업종',
  },
  {
    id: '6',
    name: '2026년 협력·융합 과학기술사업화 촉진지원사업 (태일씨앤티 컨소시엄)',
    project_type: 'support',
    status: 'planned',
    ministry: '과학기술정보통신부',
    agency: '한국산업기술진흥협회 (KOITA)',
    host_org: 'AIRA (에이아이스마트인프라건설연구조합)',
    partners: ['(주)태일씨앤티', '동양미래대학교'],
    deadline_at: '2026-03-13',
    period_start: '2026-06-01',
    period_end: '2026-10-31',
    gov_amount: 60000000,
    total_amount: 60000000,
    announcement_url: 'https://www.koita.or.kr/board/commBoardNoticeView.do?no=66976',
    memo: 'Track 2. 가치사슬 전후방 기업간 협력 / AI Agent 기반 건설스마트 플랫폼',
  },
  {
    id: '7',
    name: '2026년 협력·융합 과학기술사업화 촉진지원사업 (코팅코리아+가톨릭대 컨소시엄)',
    project_type: 'support',
    status: 'planned',
    ministry: '과학기술정보통신부',
    agency: '한국산업기술진흥협회 (KOITA)',
    host_org: 'AIRA (에이아이스마트인프라건설연구조합)',
    partners: ['(주)코팅코리아', '가톨릭대학교'],
    deadline_at: '2026-03-13',
    period_start: '2026-06-01',
    period_end: '2026-10-31',
    gov_amount: 60000000,
    total_amount: 60000000,
    announcement_url: 'https://www.koita.or.kr/board/commBoardNoticeView.do?no=66976',
    memo: 'Track 2. 가치사슬 전후방 기업간 협력 / 제조안전 AI 모델 및 시스템 개발. 각 기관별 20백만원',
  },
  {
    id: '8',
    name: '2026년도 산업현장 여성R&D인력 참여확산 기반구축 사업',
    project_type: 'education',
    status: 'planned',
    ministry: '과학기술정보통신부',
    agency: '한국여성과학기술인육성재단 (WISET)',
    host_org: '동양미래대학교',
    partners: ['AIRA (에이아이스마트인프라건설연구조합)'],
    deadline_at: '2026-03-13',
    memo: '동양미래대학교 주관, AIRA 공동 참여',
  },
  {
    id: '9',
    name: '2026년도 산업전문인력 AI역량강화 지원사업',
    project_type: 'education',
    status: 'planned',
    ministry: '산업통상자원부',
    agency: 'KEIT (한국산업기술기획평가원)',
    host_org: '동양미래대학교',
    partners: ['AIRA (에이아이스마트인프라건설연구조합)', 'TTA (한국정보통신기술협회)'],
    deadline_at: '2026-03-27',
    memo: '동양미래대학교 주관, AIRA + TTA 공동 참여',
  },
  {
    id: '10',
    name: '2026년도 창업중심대학 지역기반 (예비)창업기업 모집',
    project_type: 'support',
    status: 'planned',
    ministry: '중소벤처기업부',
    agency: '창업진흥원 (KOIPO)',
    host_org: 'AIRA (에이아이스마트인프라건설연구조합)',
    partners: [],
    deadline_at: '2026-03-23',
    memo: 'AIRA 단독 신청',
  },
]

// 상태 라벨 및 색상
export const STATUS_CONFIG: Record<RdProjectStatus, { label: string; color: string; bg: string }> = {
  reviewing:    { label: '검토중',   color: 'text-gray-500',   bg: 'bg-gray-100' },
  planned:      { label: '지원예정', color: 'text-blue-600',   bg: 'bg-blue-100' },
  submitted:    { label: '제출완료', color: 'text-green-600',  bg: 'bg-green-100' },
  failed_submit:{ label: '제출못함', color: 'text-red-600',    bg: 'bg-red-100' },
  skipped:      { label: '지원안함', color: 'text-gray-400',   bg: 'bg-gray-100' },
  selected:     { label: '선정',     color: 'text-orange-600', bg: 'bg-orange-100' },
  rejected:     { label: '탈락',     color: 'text-red-400',    bg: 'bg-red-50' },
}

// 사업 구분 라벨
export const TYPE_CONFIG: Record<RdProjectType, { label: string; color: string }> = {
  rnd:       { label: 'R&D 연구개발', color: 'text-purple-600' },
  support:   { label: '지원사업',     color: 'text-blue-600' },
  education: { label: '교육사업',     color: 'text-green-600' },
  proof:     { label: '실증사업',     color: 'text-orange-600' },
}
