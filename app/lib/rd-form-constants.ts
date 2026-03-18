// R&D 사업 등록/수정 폼 공통 상수

export const MINISTRIES = [
  '과학기술정보통신부', '산업통상자원부', '중소벤처기업부',
  '교육부', '고용노동부', '국토교통부', '보건복지부', '환경부', '서울특별시', '기타',
]

export const AGENCIES = [
  'KEIT (한국산업기술기획평가원)',
  'NIPA (정보통신산업진흥원)',
  'NRF (한국연구재단)',
  'KIAT (한국산업기술진흥원)',
  'COMPA (과학기술사업화진흥원)',
  'IITP (정보통신기획평가원)',
  'HRDK (한국산업인력공단)',
  'KOIPO (창업진흥원)',
  'KOITA (한국산업기술진흥협회)',
  'SBA (서울경제진흥원)',
  'WISET (한국여성과학기술인육성재단)',
  '기타',
]

export const PROJECT_TYPES = [
  { value: 'rnd',       label: 'R&D 연구개발' },
  { value: 'support',   label: '지원사업' },
  { value: 'education', label: '교육사업' },
  { value: 'proof',     label: '실증사업' },
]

export const STATUSES = [
  { value: 'reviewing',     label: '검토중' },
  { value: 'planned',       label: '지원예정' },
  { value: 'submitted',     label: '제출완료' },
  { value: 'failed_submit', label: '제출못함' },
  { value: 'skipped',       label: '지원안함' },
  { value: 'selected',      label: '선정' },
  { value: 'rejected',      label: '탈락' },
]

export type { RdProjectType, RdProjectStatus } from './rd-data'
