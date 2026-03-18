import Image from 'next/image'

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-orange-base flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Image src="/design/build_up_icon.png" alt="빌드업" width={64} height={64} className="mx-auto mb-4" />
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-orange-text">빌드업</h1>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">Setup Required</p>
        </div>

        <div className="p-8 bg-white/60 glass rounded-[2.5rem] shadow-sm space-y-6">
          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-black text-orange-text text-sm">Supabase 설정이 필요합니다</p>
              <p className="text-xs font-bold opacity-60 mt-0.5">.env.local 파일에 환경변수를 입력하세요</p>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-widest opacity-50 mb-3">설정 방법</h2>
            <ol className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-primary text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-black text-orange-text">Supabase 프로젝트 생성</p>
                  <p className="font-bold opacity-50 text-xs mt-0.5">supabase.com → New Project</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-primary text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-black text-orange-text">DB 스키마 실행</p>
                  <p className="font-bold opacity-50 text-xs mt-0.5">Supabase SQL Editor에서 <code className="bg-orange-50 px-1 rounded">supabase-schema.sql</code> 실행</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-primary text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-black text-orange-text">.env.local 업데이트</p>
                  <div className="mt-2 p-3 bg-slate-800 rounded-xl font-mono text-xs text-green-400 space-y-1">
                    <p>NEXT_PUBLIC_SUPABASE_URL=<span className="text-yellow-300">https://xxxx.supabase.co</span></p>
                    <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=<span className="text-yellow-300">eyJhbGc...</span></p>
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-primary text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                <div>
                  <p className="font-black text-orange-text">dev 서버 재시작</p>
                  <p className="font-bold opacity-50 text-xs mt-0.5">환경변수 변경 후 서버를 재시작하세요</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
