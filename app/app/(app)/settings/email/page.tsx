'use client'

import { useState, useEffect } from 'react'
import {
  Mail, Send, Check, X, Bell, BellOff,
  AlertCircle, ChevronRight, Users, ExternalLink,
} from 'lucide-react'
import {
  loadEmailSettings, saveEmailSettings,
  EMAIL_EVENT_LABELS, EMAIL_EVENT_DESCRIPTIONS,
  type EmailSettings,
} from '@/lib/email-settings'

// =============================================
// 이메일 설정 페이지
// =============================================
export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings>({
    events: {
      project_status_changed: true,
      deadline_reminder: true,
      issue_created: true,
      member_invited: false,
    },
  })
  const [loaded, setLoaded] = useState(false)

  // 테스트 메일 상태
  const [testEmail, setTestEmail] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // 초기 로드
  useEffect(() => {
    setSettings(loadEmailSettings())
    setLoaded(true)
  }, [])

  // 이벤트 토글 (즉시 저장)
  function handleToggleEvent(key: keyof EmailSettings['events']) {
    const next = {
      ...settings,
      events: { ...settings.events, [key]: !settings.events[key] },
    }
    setSettings(next)
    saveEmailSettings(next)
  }

  // 테스트 메일 발송
  async function handleTestSend(e: React.FormEvent) {
    e.preventDefault()
    if (!testEmail) return
    setTestSending(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test', to: testEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        setTestResult({ ok: true, msg: `${testEmail}으로 테스트 메일을 발송했습니다` })
      } else {
        setTestResult({ ok: false, msg: data.error ?? '발송 실패' })
      }
    } catch {
      setTestResult({ ok: false, msg: '네트워크 오류가 발생했습니다' })
    } finally {
      setTestSending(false)
    }
  }

  if (!loaded) return null

  const eventKeys = Object.keys(settings.events) as Array<keyof EmailSettings['events']>
  const enabledCount = eventKeys.filter(k => settings.events[k]).length

  return (
    <div className="p-8 max-w-2xl">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-black opacity-40 uppercase tracking-widest mb-3">
          설정 <ChevronRight size={12} /> 이메일
        </div>
        <h1 className="text-3xl font-black uppercase italic tracking-tight text-orange-text">
          이메일 설정
        </h1>
        <p className="text-sm font-bold text-orange-text/50 mt-1">
          프로젝트 알림 이메일 규칙을 관리합니다
        </p>
      </div>

      <div className="space-y-6">

        {/* ── 발신/수신 정보 요약 ── */}
        <section className="p-5 bg-orange-50/60 glass rounded-3xl border border-orange-100 space-y-3">
          <h2 className="text-xs font-black text-orange-primary uppercase tracking-widest">발송 정보</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/60 rounded-2xl">
              <div className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1">발신 주소</div>
              <div className="text-sm font-black text-orange-text">aira@aira.kr</div>
              <div className="text-[10px] font-bold text-orange-text/50 mt-0.5">관리자 계정으로 발송</div>
            </div>
            <div className="p-3 bg-white/60 rounded-2xl">
              <div className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Users size={9} /> 수신자
              </div>
              <div className="text-sm font-black text-orange-text">자동 (프로젝트 멤버)</div>
              <div className="text-[10px] font-bold text-orange-text/50 mt-0.5">이벤트 발생 시 전체 멤버 수신</div>
            </div>
          </div>

          {/* 도메인 인증 안내 */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-100">
            <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] font-bold text-amber-700 leading-relaxed">
              <span className="font-black">aira.kr 도메인 인증</span>이 필요합니다.&nbsp;
              <a
                href="https://resend.com/domains"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-amber-900 inline-flex items-center gap-0.5"
              >
                Resend 도메인 설정 <ExternalLink size={9} />
              </a>
              에서 DNS 레코드를 추가해야 실제 발송됩니다.
              인증 전에는 테스트 메일 발송으로 확인하세요.
            </div>
          </div>
        </section>

        {/* ── 이벤트별 알림 ON/OFF ── */}
        <section className="p-6 bg-white/40 glass rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-orange-primary" />
              <h2 className="text-sm font-black text-orange-text uppercase tracking-widest">이벤트 알림</h2>
            </div>
            <span className="text-[10px] font-black text-orange-text/40 bg-orange-50 px-2 py-1 rounded-full">
              {enabledCount}/{eventKeys.length} 활성화
            </span>
          </div>

          <div className="space-y-2">
            {eventKeys.map((key) => {
              const isOn = settings.events[key]
              return (
                <div
                  key={key}
                  onClick={() => handleToggleEvent(key)}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all select-none ${
                    isOn
                      ? 'bg-orange-50/80 border border-orange-100'
                      : 'bg-white/30 border border-transparent hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isOn ? 'bg-orange-100' : 'bg-white/50'
                    }`}>
                      {isOn
                        ? <Bell size={14} className="text-orange-primary" />
                        : <BellOff size={14} className="text-orange-text/30" />
                      }
                    </div>
                    <div>
                      <div className={`text-sm font-black ${isOn ? 'text-orange-text' : 'text-orange-text/40'}`}>
                        {EMAIL_EVENT_LABELS[key]}
                      </div>
                      <div className="text-[10px] font-bold text-orange-text/40 mt-0.5">
                        {EMAIL_EVENT_DESCRIPTIONS[key]}
                      </div>
                    </div>
                  </div>

                  {/* 토글 스위치 */}
                  <div
                    className={`relative rounded-full transition-all flex-shrink-0 ${isOn ? 'bg-orange-primary' : 'bg-orange-text/20'}`}
                    style={{ width: '40px', height: '22px' }}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${isOn ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-[10px] font-bold text-orange-text/40 pt-1">
            설정은 자동으로 저장됩니다. 이벤트가 꺼져 있으면 해당 알림은 발송되지 않습니다.
          </p>
        </section>

        {/* ── 테스트 메일 발송 ── */}
        <section className="p-6 bg-white/40 glass rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-orange-primary" />
            <h2 className="text-sm font-black text-orange-text uppercase tracking-widest">테스트 메일</h2>
          </div>
          <p className="text-xs font-bold text-orange-text/50">
            API 키와 도메인 설정이 올바른지 확인하기 위한 테스트 메일을 발송합니다.
            실제 이메일 주소를 입력하면 즉시 받아볼 수 있습니다.
          </p>

          <form onSubmit={handleTestSend} className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={e => { setTestEmail(e.target.value); setTestResult(null) }}
              placeholder="수신할 이메일 주소"
              required
              className="flex-1 px-4 py-2.5 bg-white/80 rounded-xl border border-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-primary/30 placeholder:text-orange-text/30"
            />
            <button
              type="submit"
              disabled={testSending || !testEmail}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-orange-primary to-orange-secondary text-white text-xs font-black rounded-xl disabled:opacity-40 hover:opacity-90 transition-all flex-shrink-0"
            >
              <Send size={13} />
              {testSending ? '발송 중...' : '발송'}
            </button>
          </form>

          {/* 결과 메시지 */}
          {testResult && (
            <div className={`flex items-start gap-2 p-3 rounded-xl text-xs font-bold ${
              testResult.ok
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {testResult.ok
                ? <Check size={13} className="flex-shrink-0 mt-0.5" />
                : <X size={13} className="flex-shrink-0 mt-0.5" />
              }
              {testResult.msg}
            </div>
          )}

          {/* API 키 안내 */}
          <div className="flex items-start gap-2 p-3 bg-orange-50/60 rounded-xl border border-orange-100">
            <Mail size={12} className="text-orange-primary flex-shrink-0 mt-0.5" />
            <div className="text-[10px] font-bold text-orange-text/60 leading-relaxed">
              <span className="font-black text-orange-primary">RESEND_API_KEY</span>를 .env.local에 설정하고
              서버를 재시작해야 실제 발송됩니다.&nbsp;
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-orange-primary inline-flex items-center gap-0.5"
              >
                API 키 발급 <ExternalLink size={9} />
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
