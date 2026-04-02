'use client';

import React from 'react';

export type OhStep = 'oh-1' | 'oh-2' | 'oh-3' | 'oh-4';

const STEPS: { id: OhStep; label: string; icon: string; href: string }[] = [
  { id: 'oh-1', label: '대본 생산',  icon: '📝', href: '/team/oh-1' },
  { id: 'oh-2', label: '키프레임',  icon: '🖼️', href: '/team/oh-2' },
  { id: 'oh-3', label: 'TTS 더빙',  icon: '🎙️', href: '/team/oh-3' },
  { id: 'oh-4', label: '영상 완성', icon: '🎬', href: '/team/oh-4' },
];

export default function OhStepNav({ active, variant = 'dark' }: { active: OhStep; variant?: 'dark' | 'light' }) {
  const isDark = variant === 'dark';

  /* ── Dark variant: 슬라이딩 인디케이터 ── */
  const navRef = React.useRef<HTMLDivElement>(null);
  const btnRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = React.useState({ left: 0, width: 0 });

  const updateIndicator = React.useCallback(() => {
    if (!isDark) return;
    const activeIdx = STEPS.findIndex(s => s.id === active);
    if (activeIdx < 0) { setIndicator({ left: 0, width: 0 }); return; }
    const btn = btnRefs.current[activeIdx];
    const nav = navRef.current;
    if (!btn || !nav) return;
    const bRect = btn.getBoundingClientRect();
    const nRect = nav.getBoundingClientRect();
    setIndicator({ left: bRect.left - nRect.left + nav.scrollLeft, width: bRect.width });
  }, [active, isDark]);

  React.useEffect(() => {
    updateIndicator();
    const obs = new ResizeObserver(updateIndicator);
    if (navRef.current) obs.observe(navRef.current);
    return () => obs.disconnect();
  }, [updateIndicator]);

  /* ── Light variant: 개별 버튼 스타일 ── */
  if (!isDark) {
    return (
      <div className="flex gap-4">
        {STEPS.map((s) => {
          const isActive = s.id === active;
          return (
            <a
              key={s.id}
              href={s.href}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-sm sm:text-base whitespace-nowrap transition-all duration-300"
              style={isActive
                ? {
                    background: 'linear-gradient(145deg, #b06ef0 0%, #9333ea 40%, #7c3aed 70%, #5b21b6 100%)',
                    color: '#ffffff',
                    boxShadow: '8px 8px 20px rgba(100,30,200,0.35), -4px -4px 10px rgba(255,255,255,0.8), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.15)',
                  }
                : {
                    background: 'linear-gradient(145deg, #d0d0d0 0%, #b8b8b8 40%, #a8a8a8 70%, #909090 100%)',
                    color: '#ffffff',
                    boxShadow: '8px 8px 16px rgba(0,0,0,0.18), -6px -6px 14px rgba(255,255,255,0.95), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.1)',
                  }
              }
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = isActive
                  ? '12px 12px 28px rgba(100,30,200,0.45), -6px -6px 14px rgba(255,255,255,0.9), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.2)'
                  : '12px 12px 24px rgba(0,0,0,0.22), -8px -8px 18px rgba(255,255,255,1), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -2px 0 rgba(0,0,0,0.12)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = isActive
                  ? '8px 8px 20px rgba(100,30,200,0.35), -4px -4px 10px rgba(255,255,255,0.8), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.15)'
                  : '8px 8px 16px rgba(0,0,0,0.18), -6px -6px 14px rgba(255,255,255,0.95), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.1)';
              }}
            >
              <span className="text-base shrink-0">{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{STEPS.findIndex(x => x.id === s.id) + 1}</span>
            </a>
          );
        })}
      </div>
    );
  }

  /* ── Dark variant: 슬라이딩 인디케이터 ── */
  return (
    <div
      ref={navRef}
      className="relative flex gap-3 p-2 rounded-2xl overflow-x-auto scrollbar-none"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className="absolute top-2 bottom-2 rounded-xl pointer-events-none transition-all duration-500"
        style={{
          transform: `translateX(${indicator.left}px)`,
          width: indicator.width,
          background: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)',
          boxShadow: '0 4px 24px rgba(34,211,238,0.4), 0 0 48px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
          zIndex: 1,
        }}
        aria-hidden="true"
      />
      {STEPS.map((s, i) => {
        const isActive = s.id === active;
        return (
          <a
            key={s.id}
            href={s.href}
            ref={el => { btnRefs.current[i] = el; }}
            className="relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-sm sm:text-base transition-all duration-300 whitespace-nowrap"
            style={{ zIndex: 2, color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)' }}
          >
            <span className="text-base shrink-0">{s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </a>
        );
      })}
    </div>
  );
}
