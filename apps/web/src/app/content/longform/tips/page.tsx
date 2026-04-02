'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faChevronRight, faLightbulb, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import tipsData from '@/data/keyframe-tips.json';

interface TipSection {
  heading: string;
  items: string[];
}

interface Tip {
  id: string;
  category: string;
  icon: string;
  title: string;
  summary: string;
  sections: TipSection[];
  usage_guide: string;
}

const CATEGORIES = ['전체', '훅 전략', 'Google Flow', '직접 촬영', '썸네일 연계', '업로드 팁'];

const CAT_BADGE: Record<string, string> = {
  '훅 전략':    'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Google Flow': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  '직접 촬영':  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  '썸네일 연계': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  '업로드 팁':  'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const CAT_ACCENT: Record<string, string> = {
  '훅 전략':    'from-rose-400 to-pink-400',
  'Google Flow': 'from-blue-400 to-cyan-400',
  '직접 촬영':  'from-emerald-400 to-teal-400',
  '썸네일 연계': 'from-amber-400 to-orange-400',
  '업로드 팁':  'from-violet-400 to-purple-400',
};

const MIN_PANEL_WIDTH = 360;
const MAX_PANEL_RATIO = 0.8;
const DEFAULT_PANEL_WIDTH = 520;

export default function LongformTipsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const isDragging = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('ld_panel_width');
    if (saved) setPanelWidth(Math.max(MIN_PANEL_WIDTH, Number(saved)));
  }, []);

  const filteredTips = useMemo(() => {
    return (tipsData as Tip[]).filter(t => {
      const matchCat = activeCategory === '전체' || t.category === activeCategory;
      const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.summary.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchTerm]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const startX = e.clientX;
    const startWidth = panelWidth;

    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX - e.clientX;
      const next = Math.min(
        Math.max(startWidth + delta, MIN_PANEL_WIDTH),
        window.innerWidth * MAX_PANEL_RATIO
      );
      setPanelWidth(next);
    };
    const onUp = () => {
      isDragging.current = false;
      localStorage.setItem('ld_panel_width', String(panelWidth));
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!isMounted) return <div className="min-h-screen bg-[#050B1E]" />;

  return (
    <div className="min-h-screen bg-[#050B1E] text-white font-sans">

      {/* ── 헤더 ── */}
      <header className="relative border-b border-white/10 px-6 lg:px-[8%] py-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              <Link href="/index1" className="hover:text-cyan-400 transition-colors">LinkDrop</Link>
              <span>›</span>
              <Link href="/content/longform" className="hover:text-cyan-400 transition-colors">롱폼 제작</Link>
              <span>›</span>
              <span className="text-rose-400">영상 제작 팁</span>
            </nav>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faLightbulb} className="text-white text-xs" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-rose-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                  수동 영상 제작 팁
                </span>
              </h1>
            </div>
            <p className="text-gray-400 text-sm">
              훅 전략 · Google Flow · 직접 촬영 · 썸네일 — 첫 15초로 YouTube 알고리즘을 이기는 법
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/content/longform"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              롱폼 제작으로
            </Link>
            <div className="relative w-64">
              <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="text"
                placeholder="팁 검색…"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-rose-500/60 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── 카테고리 필터 ── */}
      <nav className="sticky top-[52px] z-30 bg-[#050B1E]/80 backdrop-blur-md border-b border-white/10 py-3 px-6 lg:px-[8%] overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white border-transparent shadow-lg shadow-rose-500/20'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-600 whitespace-nowrap flex-shrink-0">
            {filteredTips.length}개
          </span>
        </div>
      </nav>

      {/* ── 카드 그리드 ── */}
      <main className="px-6 lg:px-[8%] py-10">
        <div className="max-w-7xl mx-auto rounded-2xl p-6" style={{ backgroundColor: '#333333' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTips.map(tip => (
              <div
                key={tip.id}
                onClick={() => setSelectedTip(tip)}
                className="group relative rounded-2xl border border-white/10 p-6 flex flex-col gap-4 hover:border-rose-400/50 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1 transition-all cursor-pointer"
                style={{ backgroundColor: '#2a2a2a' }}
              >
                <div className="flex justify-between items-start">
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${CAT_BADGE[tip.category] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                    {tip.category}
                  </span>
                  <span className="text-2xl">{tip.icon}</span>
                </div>

                <h3 className="text-sm font-black text-white leading-snug group-hover:text-rose-400 transition-colors line-clamp-2">
                  {tip.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{tip.summary}</p>

                <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter flex items-center gap-1 group-hover:text-rose-400 transition-colors">
                    Detail View <FontAwesomeIcon icon={faChevronRight} className="text-[8px]" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredTips.length === 0 && (
            <div className="text-center py-40">
              <div className="text-6xl mb-6 opacity-20">🔍</div>
              <h3 className="text-gray-500 font-bold text-xl">검색 결과가 없습니다.</h3>
            </div>
          )}
        </div>
      </main>

      {/* ── 사이드 패널 (120UI) ── */}
      {selectedTip && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]" onClick={() => setSelectedTip(null)} />
          <aside
            style={{ width: panelWidth }}
            className="fixed top-0 right-0 h-full bg-[#0D1528] border-l border-white/10 z-[10001] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* 드래그 핸들 */}
            <div
              onMouseDown={handleMouseDown}
              className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-rose-400/60 transition-colors z-10"
            />

            {/* 패널 헤더 */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedTip.icon}</span>
                <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${CAT_BADGE[selectedTip.category] ?? ''}`}>
                  {selectedTip.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedTip(null)}
                className="w-9 h-9 rounded-full bg-white/5 text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* 패널 본문 */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
              <h2 className="text-xl font-black text-white leading-tight">{selectedTip.title}</h2>

              {/* 본문 — 섹션별 렌더링 */}
              <div className="space-y-5">
                {selectedTip.sections.map((section, si) => (
                  <div key={si} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${CAT_ACCENT[selectedTip.category] ?? 'from-slate-400 to-gray-400'} shrink-0`} />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{section.heading}</span>
                    </div>
                    <div className="bg-[#050B1E] rounded-xl p-4 border border-white/10 space-y-2">
                      {section.items.map((item, ii) => (
                        <p key={ii} className={`text-sm leading-6 ${
                          item.startsWith('✕') ? 'text-red-400' :
                          item.startsWith('□') ? 'text-amber-300' :
                          item.match(/^[①②③④⑤⑥⑦⑧⑨]/) ? 'text-white font-medium' :
                          item.match(/^\d+\./) ? 'text-cyan-300' :
                          'text-gray-300'
                        }`}>{item}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 활용 가이드 */}
              {selectedTip.usage_guide && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                    💡 LinkDrop 활용 가이드
                  </label>
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 text-gray-300 text-sm leading-relaxed">
                    {selectedTip.usage_guide}
                  </div>
                </div>
              )}
            </div>

            {/* 패널 푸터 */}
            <div className="px-6 py-5 border-t border-white/10 bg-black/20">
              <Link
                href="/content/longform"
                className="w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:opacity-90 shadow-lg shadow-rose-500/20 transition-all"
              >
                영상 제작 시작하기 →
              </Link>
            </div>
          </aside>
        </>
      )}

    </div>
  );
}
