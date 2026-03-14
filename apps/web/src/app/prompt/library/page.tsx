'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCheck, faCopy, faTimes, faChevronRight, faMagic } from '@fortawesome/free-solid-svg-icons';

import promptDataRaw from '@/data/prompt_library.json';

interface Prompt {
  id: string;
  title: string;
  category: string;
  content: string;
  usage_guide: string | null;
  tag: string | null;
  icon?: string;
  theme?: string;
}

const CATEGORIES = ["전체", "재무", "HR", "마케팅", "영업", "기획"];

const CAT_ACCENT: Record<string, string> = {
  재무:   'from-blue-400 to-cyan-400',
  HR:     'from-violet-400 to-purple-400',
  마케팅: 'from-rose-400 to-pink-400',
  영업:   'from-amber-400 to-orange-400',
  기획:   'from-emerald-400 to-teal-400',
  기타:   'from-slate-400 to-gray-400',
};

const CAT_BADGE: Record<string, string> = {
  재무:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HR:     'bg-violet-500/10 text-violet-400 border-violet-500/20',
  마케팅: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  영업:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  기획:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  기타:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function PromptLibraryPage() {
  const [prompts] = useState<Prompt[]>(promptDataRaw);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchCat = activeCategory === '전체' || p.category === activeCategory;
      const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [prompts, activeCategory, searchTerm]);

  const copyToClipboard = (prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.content).then(() => {
      setCopiedId(prompt.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (!isMounted) return <div className="min-h-screen bg-[#050B1E]" />;

  return (
    <div className="min-h-screen bg-[#050B1E] text-white font-sans">

      {/* ── 상단 헤더 ── */}
      <header className="relative border-b border-white/10 px-6 lg:px-[8%] py-10 overflow-hidden">
        {/* 배경 글로우 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              <Link href="/index1" className="hover:text-cyan-400 transition-colors">LinkDrop</Link>
              <span>›</span>
              <Link href="/prompt" className="hover:text-cyan-400 transition-colors">Prompt</Link>
              <span>›</span>
              <span className="text-cyan-400">Library</span>
            </nav>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faMagic} className="text-white text-xs" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  직무별 특화 프롬프트
                </span>
              </h1>
            </div>
            <p className="text-gray-400 text-sm">재무 · HR · 마케팅 · 영업 · 기획 전문가를 위한 AI 프롬프트 라이브러리</p>
          </div>

          {/* 검색창 */}
          <div className="relative w-full md:w-80 flex-shrink-0">
            <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input
              type="text"
              placeholder="프롬프트 검색…"
              className="w-full pl-12 pr-5 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/60 focus:bg-white/8 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white border-transparent shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-600 whitespace-nowrap flex-shrink-0">
            {filteredPrompts.length}개
          </span>
        </div>
      </nav>

      {/* ── 카드 그리드 (밝은 배경) ── */}
      <main className="px-6 lg:px-[8%] py-10 flex-1">
        <div className="max-w-7xl mx-auto bg-slate-50 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredPrompts.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPrompt(p)}
                className="group relative bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${CAT_BADGE[p.category] ?? CAT_BADGE['기타']}`}>
                    {p.icon} {p.category}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-colors">
                    <FontAwesomeIcon icon={faMagic} className="text-xs" />
                  </div>
                </div>

                <h3 className="text-sm font-black text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{p.content}</p>

                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                    Detail View <FontAwesomeIcon icon={faChevronRight} className="text-[8px]" />
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(p); }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all text-sm ${
                      copiedId === p.id
                        ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                        : 'bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white'
                    }`}
                  >
                    <FontAwesomeIcon icon={copiedId === p.id ? faCheck : faCopy} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredPrompts.length === 0 && (
            <div className="text-center py-40">
              <div className="text-6xl mb-6 opacity-20">🔍</div>
              <h3 className="text-slate-400 font-bold text-xl">검색 결과가 없습니다.</h3>
            </div>
          )}
        </div>
      </main>

      {/* ── 사이드 패널 ── */}
      {selectedPrompt && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]" onClick={() => setSelectedPrompt(null)} />
          <aside className="fixed top-0 right-0 w-full md:w-[520px] h-full bg-[#0D1528] border-l border-white/10 z-[10001] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex flex-col">

            {/* 패널 헤더 */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className={`text-xl`}>{selectedPrompt.icon}</span>
                <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${CAT_BADGE[selectedPrompt.category] ?? CAT_BADGE['기타']}`}>
                  {selectedPrompt.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="w-9 h-9 rounded-full bg-white/5 text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 custom-scrollbar">
              <h2 className="text-xl font-black text-white leading-tight">{selectedPrompt.title}</h2>

              {/* 프롬프트 본문 */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${CAT_ACCENT[selectedPrompt.category] ?? CAT_ACCENT['기타']}`} />
                  Prompt Content
                </label>
                <div className="bg-[#050B1E] rounded-2xl p-5 border border-white/10 relative">
                  <button
                    onClick={() => copyToClipboard(selectedPrompt)}
                    className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[9px] font-black transition-all border border-white/10 z-10"
                  >
                    COPY
                  </button>
                  <div className="text-white text-sm leading-7 pr-16 space-y-3">
                    {selectedPrompt.content.split(/\n+/).map((line, i) =>
                      line.trim() === '' ? null : (
                        <p key={i} className={
                          line.startsWith('[') && line.includes(']')
                            ? 'font-bold text-white mt-4 first:mt-0'
                            : line.match(/^[①②③④⑤⑥⑦⑧⑨ⓐⓑⓒⓓ■▪]/)
                            ? 'pl-3 border-l-2 border-white/20 text-white'
                            : 'text-white'
                        }>{line}</p>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* 사용 가이드 */}
              {selectedPrompt.usage_guide && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">💡 Usage Guide</label>
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-5 text-white text-sm leading-relaxed">
                    {selectedPrompt.usage_guide}
                  </div>
                </div>
              )}
            </div>

            {/* 패널 푸터 */}
            <div className="px-6 py-5 border-t border-white/10 bg-black/20">
              <button
                onClick={() => copyToClipboard(selectedPrompt)}
                className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 transition-all ${
                  copiedId === selectedPrompt.id
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                    : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/20'
                }`}
              >
                <FontAwesomeIcon icon={copiedId === selectedPrompt.id ? faCheck : faCopy} />
                {copiedId === selectedPrompt.id ? '복사 완료!' : '프롬프트 전체 복사하기'}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── 토스트 ── */}
      {copiedId && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0D1528] border border-white/10 text-white px-6 py-3 rounded-xl shadow-2xl font-bold text-xs z-[10002] flex items-center gap-2">
          <FontAwesomeIcon icon={faCheck} className="text-green-400" />
          프롬프트가 클립보드에 복사되었습니다
        </div>
      )}

    </div>
  );
}
