'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faChevronDown, faChevronUp, faCheck, faCopy, faBookOpen } from '@fortawesome/free-solid-svg-icons';

// 160개 전체 용어 데이터 임포트
import wordDataRaw from '@/data/front_word.json';

interface Chapter {
  ch: number;
  title: string;
  en: string;
  terms: [number, string, string, string][];
}

const wordData = wordDataRaw as Chapter[];

export default function FrontWordPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openChapters, setOpenChapters] = useState<number[]>([]);
  const [copiedTerm, setCopiedId] = useState<number | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleChapter = (ch: number) => {
    setOpenChapters(prev => 
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const copyTerm = (num: number, en: string, kr: string) => {
    const text = `${en} (${kr})`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(num);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return wordData;
    const q = searchTerm.toLowerCase();
    return wordData.map(ch => ({
      ...ch,
      terms: ch.terms.filter(t => 
        t[1].toLowerCase().includes(q) || 
        t[2].toLowerCase().includes(q) || 
        t[3].toLowerCase().includes(q)
      )
    })).filter(ch => ch.terms.length > 0);
  }, [searchTerm]);

  // 검색 시 검색 결과가 있는 챕터 자동 열기
  useEffect(() => {
    if (searchTerm) {
      setOpenChapters(filteredData.map(ch => ch.ch));
    }
  }, [searchTerm, filteredData]);

  if (!isMounted) return <div className="min-h-screen bg-[#f8fafc]" />;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans text-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-100 to-slate-200 py-20 px-6 text-center border-b border-slate-200">
        <div className="inline-block bg-indigo-50 border border-indigo-100 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black mb-5 uppercase tracking-[0.2em]">
          160 Essential Design Terms
        </div>
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent mb-4 leading-tight tracking-tighter">
          바이브코더를 위한<br />프론트엔드 디자인 백과사전
        </h1>
        <p className="text-slate-500 text-lg font-medium">코드보다 맥락이 먼저다 — AI와의 대화 정밀도를 높이는 필수 용어집</p>
      </section>

      {/* Search Bar (Sticky) */}
      <div className="sticky top-[52px] z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input 
            type="text" 
            placeholder="용어 검색... (한국어, 영어, 설명 모두 검색됩니다)"
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-300 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-6">
        {filteredData.map((ch) => (
          <article 
            key={ch.ch} 
            id={`ch-${ch.ch}`}
            className={`bg-white border rounded-[32px] overflow-hidden transition-all duration-500 ${openChapters.includes(ch.ch) ? 'border-indigo-200 shadow-2xl' : 'border-slate-200 shadow-sm'}`}
          >
            <header 
              className="flex items-center gap-5 p-8 cursor-pointer hover:bg-slate-50 transition-colors select-none"
              onClick={() => toggleChapter(ch.ch)}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-500/20">
                {String(ch.ch).padStart(2, '0')}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{ch.title}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{ch.en}</p>
              </div>
              <FontAwesomeIcon 
                icon={openChapters.includes(ch.ch) ? faChevronUp : faChevronDown} 
                className={`text-slate-300 transition-transform ${openChapters.includes(ch.ch) ? 'text-indigo-500' : ''}`}
              />
            </header>

            <div className={`grid transition-all duration-500 ease-in-out ${openChapters.includes(ch.ch) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden bg-slate-50/30">
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ch.terms.map(([num, en, kr, desc]) => (
                    <div key={num} className="group relative bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all flex gap-5">
                      <span className="text-[10px] font-black text-slate-200 font-mono mt-1">{String(num).padStart(3, '0')}</span>
                      <div className="flex-1">
                        <div className="text-sm font-black text-indigo-600 mb-0.5">{en}</div>
                        <div className="text-[13px] font-black text-sky-600 mb-3">{kr}</div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); copyTerm(num, en, kr); }}
                        className={`absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${copiedTerm === num ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300 border border-slate-100 opacity-0 group-hover:opacity-100 hover:bg-indigo-600 hover:text-white'}`}
                      >
                        <FontAwesomeIcon icon={copiedTerm === num ? faCheck : faCopy} className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}

        {filteredData.length === 0 && (
          <div className="text-center py-40">
            <div className="text-slate-200 text-8xl mb-6 opacity-20">🔍</div>
            <h3 className="text-slate-400 font-black text-xl tracking-tight">조건에 맞는 용어가 없습니다.</h3>
            <p className="text-slate-400 mt-2 font-medium">다른 검색어를 입력해 보세요.</p>
          </div>
        )}
      </main>

      {/* Back to Top */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-10 right-10 w-14 h-14 bg-white text-indigo-600 rounded-full shadow-2xl border border-slate-100 flex items-center justify-center transition-all hover:-translate-y-2 hover:bg-indigo-600 hover:text-white z-50 ${showBackToTop ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
      >
        <FontAwesomeIcon icon={faChevronUp} />
      </button>

      <footer className="text-center py-16 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] border-t border-slate-100 bg-white">
        Front-end Design Encyclopedia 160 · LinkDrop Core
      </footer>
    </div>
  );
}
