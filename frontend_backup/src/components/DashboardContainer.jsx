import React, { useState } from 'react';
import { OrangeTheme } from './dashboards/OrangeTheme';
import { BlueTheme } from './dashboards/BlueTheme';

const DashboardContainer = () => {
    const [theme, setTheme] = useState('orange'); // 'orange' or 'blue'

    return (
        <div className="relative">
            {/* 테마 전환 버튼 (Theme Toggle Button) */}
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={() => setTheme(theme === 'orange' ? 'blue' : 'orange')}
                    className="group relative flex items-center gap-3 px-6 py-4 bg-white/80 glass rounded-2xl shadow-2xl hover:scale-105 transition-all active:scale-95 overflow-hidden"
                >
                    <div className="relative z-10 flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full transition-colors duration-500 ${theme === 'orange' ? 'bg-orange-primary shadow-[0_0_10px_rgba(251,146,60,0.5)]' : 'bg-blue-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}></div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-800">
                            {theme === 'orange' ? '블루' : '오렌지'} 테마로 전환하기
                        </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
            </div>

            {/* 선택된 테마 렌더링 (Render selected theme) */}
            {theme === 'orange' ? <OrangeTheme /> : <BlueTheme />}

            {/* 부드러운 전환을 위한 글로벌 오버레이 (Global Overlay for smooth transition) */}
            <div className="fixed inset-0 pointer-events-none z-40 bg-white/5 backdrop-blur-[2px] opacity-0 transition-opacity duration-500"></div>
        </div>
    );
};

export default DashboardContainer;
