'use client';

import React from 'react';

export default function Jun4Page() {
  const neuRaised = { boxShadow: '8px 8px 16px #b8bcc2, -8px -8px 16px #ffffff' };

  const steps = [
    { label: '대본 생산', icon: '📝', href: '/team/jun-1', key: 'jun-1' },
    { label: '키프레임',  icon: '🖼️', href: '/team/jun-2', key: 'jun-2' },
    { label: 'TTS 더빙',  icon: '🎙️', href: '/team/jun-3', key: 'jun-3' },
    { label: '영상 완성', icon: '🎬', href: '/team/jun-4', key: 'jun-4' },
  ];

  return (
    <div className="min-h-screen font-sans antialiased pb-20" style={{ background: '#e0e5ec' }}>

      <header className="relative pt-12 pb-24 px-6 overflow-hidden" style={{ background: '#e0e5ec' }}>
        <div className="max-w-6xl mx-auto relative z-10">

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-5 flex justify-end">
            <ol className="flex items-center gap-2 text-sm flex-wrap">
              <li><a href="/" className="text-gray-400 hover:text-violet-600 transition-colors font-medium">홈</a></li>
              <li aria-hidden="true"><span className="text-gray-300 text-xs">›</span></li>
              <li><a href="/team/jun-1" className="text-gray-400 hover:text-violet-600 transition-colors font-medium">팀워크</a></li>
              <li aria-hidden="true"><span className="text-gray-300 text-xs">›</span></li>
              <li><a href="/team/jun-1" className="text-gray-400 hover:text-violet-600 transition-colors font-medium">전우진</a></li>
              <li aria-hidden="true"><span className="text-gray-300 text-xs">›</span></li>
              <li><span className="text-violet-600 font-black" aria-current="page">영상완성</span></li>
            </ol>
          </nav>

          <div className="mb-6">
            <div className="flex gap-4">
              {steps.map((s) => {
                const isActive = s.key === 'jun-4';
                return (
                  <a key={s.href} href={s.href}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-sm sm:text-base whitespace-nowrap transition-all duration-300"
                    style={isActive
                      ? { background: 'linear-gradient(145deg, #b06ef0 0%, #9333ea 40%, #7c3aed 70%, #5b21b6 100%)', color: '#ffffff', boxShadow: '8px 8px 20px rgba(100,30,200,0.35), -4px -4px 10px rgba(255,255,255,0.8), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.15)' }
                      : { background: 'linear-gradient(145deg, #d0d0d0 0%, #b8b8b8 40%, #a8a8a8 70%, #909090 100%)', color: '#ffffff', boxShadow: '8px 8px 16px rgba(0,0,0,0.18), -6px -6px 14px rgba(255,255,255,0.95), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.1)' }
                    }
                  >
                    <span className="text-base shrink-0">{s.icon}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-2xl" style={{ background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)', boxShadow: '4px 4px 10px #b8bcc2, -2px -2px 6px #ffffff' }}>
              🎬
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-800">
              전우진 <span className="bg-gradient-to-r from-violet-600 to-purple-800 bg-clip-text text-transparent">× 영상완성</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm">씬 MP4 합치기 → 최종 영상 완성 및 업로드</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
        <section className="rounded-[2rem] p-8 flex flex-col items-center justify-center gap-6 min-h-[320px]" style={{ background: '#e0e5ec', ...neuRaised }}>
          <div className="text-6xl">🎬</div>
          <div className="text-center">
            <p className="text-2xl font-black text-gray-800 mb-2">영상 완성 및 업로드</p>
            <p className="text-gray-500 text-sm">씬별 MP4를 합쳐 최종 영상을 완성하고 업로드합니다.</p>
          </div>
          <div className="px-6 py-3 rounded-2xl font-black text-sm text-gray-500" style={{ background: '#e0e5ec', boxShadow: 'inset 4px 4px 8px #c5c9d0, inset -4px -4px 8px #ffffff' }}>
            🚧 준비중
          </div>
          <a href="/team/jun-3" className="text-xs text-gray-400 hover:text-violet-600 transition-colors">← TTS 더빙으로 돌아가기</a>
        </section>
      </main>

      <p className="text-center mt-12 text-gray-400 text-[10px] font-black uppercase tracking-[0.4em]">
        영상 완성 · TEAM JUN-4
      </p>
    </div>
  );
}
