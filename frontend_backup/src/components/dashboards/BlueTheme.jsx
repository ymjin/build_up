import React from 'react';

const StatCard = ({ title, value, subtext, colorClass, icon }) => (
    <div className={`p-6 bg-white/30 glass rounded-3xl border-slate-200/50 ${colorClass}`}>
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wider">{title}</h3>
            {icon && <span className="opacity-40">{icon}</span>}
        </div>
        <div className="text-3xl font-black mb-2 text-blue-text">{value}</div>
        {subtext && <div className="text-[10px] opacity-50 font-bold uppercase tracking-widest">{subtext}</div>}
    </div>
);

const SectionHeader = ({ title }) => (
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-black tracking-tight uppercase text-blue-text">{title}</h2>
        <div className="flex space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-primary opacity-30"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-primary opacity-30"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-primary"></div>
        </div>
    </div>
);

export const BlueTheme = () => {
    return (
        <div className="min-h-screen bg-blue-base text-blue-text p-8 transition-colors duration-500">
            <header className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-5">
                    <div className="p-2 bg-blue-primary/10 rounded-2xl">
                        <img src="/design/build_up_icon.png" alt="빌드업(BuildUp)" className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter uppercase leading-none">빌드업 (Build-Up)</h1>
                        <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em]">통합 관리 스위트</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
                        ))}
                    </div>
                    <button className="px-5 py-2 bg-blue-primary text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 uppercase tracking-widest hover:scale-105 transition-transform">
                        테스터 초대 (Invite)
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-6">
                {/* 상단 통계 바 (Statistics Bar) */}
                <div className="col-span-12 grid grid-cols-4 gap-6 mb-2">
                    <StatCard title="총 테스터 수" value="145" subtext="4개 지역 통합" />
                    <StatCard title="이슈 해결률" value="85%" subtext="전회차 대비 +12%" />
                    <StatCard title="빌드 안정성" value="98.2%" subtext="최적 등급 (Optimal)" />
                    <StatCard title="진행 중인 미션" value="24" subtext="현재 스프린트" />
                </div>

                {/* 메인 그리드 (Main Grid) */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <div className="p-8 bg-blue-card glass rounded-3xl shadow-sm border-slate-200/50">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tight mb-2">빌드 상태 (Build Health)</h2>
                                <p className="text-xs font-bold opacity-40 uppercase tracking-widest">실시간 시스템 진단 데이터</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-black text-blue-primary uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100 italic">안정적 릴리스 (Stable)</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-12">
                            <div className="relative w-40 h-40">
                                <div className="absolute inset-0 rounded-full border-[16px] border-blue-50"></div>
                                <div className="absolute inset-0 rounded-full border-[16px] border-blue-primary border-t-transparent border-r-transparent -rotate-45"></div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black">98</span>
                                    <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">건강도</span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                {[
                                    { label: '시스템 무결성', val: 99 },
                                    { label: '빌드 성공률', val: 94 },
                                    { label: '테스터 만족도', val: 88 }
                                ].map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between mb-1.5">
                                            <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">{item.label}</span>
                                            <span className="text-[10px] font-black">{item.val}%</span>
                                        </div>
                                        <div className="h-1.5 bg-blue-50 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-primary rounded-full transition-all duration-1000" style={{ width: `${item.val}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-8 bg-blue-card glass rounded-3xl border-slate-200/50">
                            <SectionHeader title="미션 로드맵 (Roadmap)" />
                            <div className="space-y-6">
                                {[
                                    { step: '01단계', title: '베타 테스트 환경 구축', done: true },
                                    { step: '02단계', title: '사용자 인터페이스(UI) 정교화', done: true },
                                    { step: '03단계', title: 'API 통합 및 보안 강화', done: false },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className={`mt-1 w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${item.done ? 'bg-blue-primary text-white' : 'border-2 border-blue-100 text-transparent'}`}>
                                            <span className="text-[10px]">✓</span>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-0.5">{item.step}</h4>
                                            <p className={`text-sm font-bold ${!item.done && 'opacity-60'}`}>{item.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 bg-blue-card glass rounded-3xl border-slate-200/50">
                            <SectionHeader title="실시간 피드백 (Live Feedback)" />
                            <div className="space-y-5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                        <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0"></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-tighter">테스터 #{i + 45}</span>
                                                <span className="text-[9px] font-bold opacity-30">오후 12:4{i}</span>
                                            </div>
                                            <p className="text-xs font-bold leading-tight mt-0.5">모바일 기기에서 사이드바가 접히지 않는 문제를 수정했습니다.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 오른쪽 영역 (Right Side) */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="p-8 bg-blue-card glass rounded-3xl border-slate-200/50">
                        <SectionHeader title="활동 히트맵 (Heatmap)" />
                        <div className="grid grid-cols-7 gap-2">
                            {[...Array(35)].map((_, i) => (
                                <div
                                    key={i}
                                    className="aspect-square rounded-[6px] transition-all hover:bg-blue-primary"
                                    style={{ backgroundColor: `rgba(59, 130, 246, ${Math.random() * 0.8 + 0.1})` }}
                                ></div>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-between text-[9px] font-black opacity-30 uppercase tracking-widest">
                            <span>활동 낮음</span>
                            <span>활동 높음</span>
                        </div>
                    </div>

                    <div className="p-8 bg-blue-card glass rounded-3xl border-slate-200/50 overflow-hidden relative">
                        <div className="relative z-10">
                            <SectionHeader title="글로벌 빌드 점수 (Build Score)" />
                            <div className="text-center py-4">
                                <div className="text-6xl font-black text-blue-primary mb-2 italic">86.4</div>
                                <div className="text-xs font-black opacity-30 uppercase tracking-[0.4em]">통합 등급 (Rating)</div>
                            </div>
                            <div className="mt-6 p-4 bg-white/40 rounded-2xl border border-white/50">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase mb-3">
                                    <span>현재 마일스톤</span>
                                    <span className="text-blue-primary">75%</span>
                                </div>
                                <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-primary w-3/4 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                        {/* 배경 디자인 요소 */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-primary/5 rounded-full blur-3xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
