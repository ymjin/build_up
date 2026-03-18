import React from 'react';

const SectionHeader = ({ title }) => (
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold tracking-tight uppercase">{title}</h2>
        <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20"></div>
        </div>
    </div>
);

export const OrangeTheme = () => {
    return (
        <div className="min-h-screen bg-orange-base text-orange-text p-8 transition-colors duration-500">
            <header className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                    <img src="/design/build_up_icon.png" alt="빌드업(BuildUp)" className="w-12 h-12" />
                    <h1 className="text-2xl font-black tracking-tighter uppercase italic">빌드업 대시보드 (Build-Up Dashboard)</h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="px-4 py-2 bg-white/50 glass rounded-2xl text-sm font-bold shadow-sm">
                        상태: <span className="text-orange-secondary">빌드 활성화 (ACTIVE BUILD)</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8">
                {/* 왼쪽 컬럼 (Left Column) */}
                <div className="col-span-12 lg:col-span-3 space-y-8">
                    <div className="p-8 bg-white/40 glass rounded-[2.5rem] shadow-sm relative overflow-hidden">
                        <SectionHeader title="빌드 상태 (Build Health)" />
                        <div className="relative h-48 flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full border-[12px] border-orange-100 border-t-orange-primary rotate-45"></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                                <span className="text-green-600 font-bold mb-1">✓</span>
                                <span className="text-2xl font-black">최적 (Optimal)</span>
                            </div>
                        </div>
                        <div className="mt-8">
                            <div className="flex justify-between items-end">
                                <div className="text-4xl font-black">98% 안정 (Stable)</div>
                                <div className="text-xs font-bold text-orange-primary flex items-center gap-1">
                                    <span className="w-1 h-3 bg-current"></span>
                                    <span className="w-1 h-2 bg-current opacity-50"></span>
                                    타임라인 (Timeline)
                                </div>
                            </div>
                            <div className="mt-4 h-12 flex items-end space-x-1 opacity-20">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className="flex-1 bg-orange-secondary" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-white/40 glass rounded-[2.5rem] shadow-sm">
                        <SectionHeader title="실시간 피드백 (Live Feedback)" />
                        <div className="space-y-6">
                            {[
                                { user: '사라(Sarah)', msg: '로그인 버그 발견!', time: '2분 전' },
                                { user: '마이크(Mike)', msg: '설정 UI 개선 제안', time: '15분 전' },
                                { user: '개발팀(DevTeam)', msg: '자잘한 이슈 수정 완료', time: '1시간 전' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-primary">{item.user[0]}</div>
                                    <div>
                                        <div className="text-xs font-black opacity-40 uppercase">{item.user} <span className="ml-2 font-medium">• {item.time}</span></div>
                                        <div className="text-sm font-bold">{item.msg}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 중앙 컬럼 (Center Column) */}
                <div className="col-span-12 lg:col-span-6 space-y-8">
                    <div className="p-10 bg-white/40 glass rounded-[2.5rem] shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-8">
                            <img src="/design/build_up_icon.png" alt="빌드(Build)" className="w-24 h-24 opacity-80" />
                            <div className="flex-1">
                                <h2 className="text-3xl font-black uppercase mb-4 tracking-tight">프로젝트 진행률 (Progress)</h2>
                                <div className="relative h-8 bg-orange-100 rounded-full overflow-hidden mb-2">
                                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-primary to-orange-secondary w-3/4 rounded-full"></div>
                                </div>
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest opacity-40">
                                    <span>시작</span>
                                    <span>75%</span>
                                    <span>100% (완료)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 bg-white/40 glass rounded-[2.5rem] shadow-sm">
                        <SectionHeader title="미션 로드맵 (Mission Roadmap)" />
                        <div className="flex justify-between items-center relative py-10">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-orange-100 -translate-y-1/2"></div>
                            {[
                                { label: '베타 테스트', active: true },
                                { label: '현재 단계', active: true },
                                { label: '마일스톤 완료', active: true },
                                { label: '다음 단계', active: false },
                                { label: '향후 단계', active: false },
                            ].map((stage, i) => (
                                <div key={i} className="relative z-10 flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center shadow-lg border-4 border-white ${stage.active ? 'bg-orange-primary text-white scale-110' : 'bg-orange-50 text-orange-200'}`}>
                                        {stage.active ? '✓' : ''}
                                    </div>
                                    <div className={`text-[9px] font-black w-20 text-center uppercase tracking-tighter ${stage.active ? 'opacity-100' : 'opacity-30'}`}>{stage.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-10 bg-white/40 glass rounded-[2.5rem] shadow-sm">
                        <SectionHeader title="프로젝트 활동 로그 (Activity Log)" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 bg-white/20 rounded-2xl flex items-center gap-4 hover:bg-white/40 transition-colors cursor-pointer">
                                    <div className="w-2 h-2 rounded-full bg-orange-primary"></div>
                                    <div className="flex-1 text-sm font-bold">사라(Sarah)로부터 로그인 흐름에 대한 새로운 피드백 수신</div>
                                    <div className="text-[10px] font-black opacity-30 uppercase tracking-widest">방금 전</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 오른쪽 컬럼 (Right Column) */}
                <div className="col-span-12 lg:col-span-3 space-y-8">
                    <div className="p-8 bg-white/40 glass rounded-[2.5rem] shadow-sm">
                        <SectionHeader title="테스터 인사이트 (Tester Insights)" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-orange-50/50 rounded-3xl">
                                <div className="text-[10px] font-black opacity-40 uppercase mb-1">총 테스터 수</div>
                                <div className="text-2xl font-black">145</div>
                            </div>
                            <div className="p-4 bg-orange-50/50 rounded-3xl">
                                <div className="text-[10px] font-black opacity-40 uppercase mb-1">이슈 해결률</div>
                                <div className="text-2xl font-black text-orange-secondary">85%</div>
                            </div>
                        </div>
                        <div className="mt-8 space-y-4">
                            <div className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">주요 기여자 (Top Contributors)</div>
                            {[
                                { name: '사라(Sarah)', points: '★' },
                                { name: '마이크(Mike)', points: '⚙' },
                                { name: '개발팀(DevTeam)', points: '⭐' },
                            ].map((u, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                                        <span className="text-xs font-black">{u.name}</span>
                                    </div>
                                    <span className="text-orange-primary">{u.points}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 bg-white/40 glass rounded-[2.5rem] shadow-sm">
                        <SectionHeader title="활동 히트맵 (Heatmap)" />
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex space-x-1">
                                <div className="px-3 py-1 bg-orange-primary text-white text-[10px] font-black rounded-full uppercase">일간 (Daily)</div>
                                <div className="px-3 py-1 text-[10px] font-black opacity-30 rounded-full uppercase">비활성 (Unvend)</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-1.5">
                            {[...Array(60)].map((_, i) => (
                                <div
                                    key={i}
                                    className="aspect-square rounded-[3px] transition-all hover:scale-125 cursor-help"
                                    style={{ backgroundColor: `rgba(251, 146, 60, ${Math.random()})` }}
                                ></div>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-between text-[8px] font-bold uppercase opacity-30 tracking-widest">
                            <span>활동 낮음</span>
                            <span>활동 높음</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
