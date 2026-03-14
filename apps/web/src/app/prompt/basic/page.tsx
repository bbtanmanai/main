'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faChevronRight, faExternalLinkAlt, faBookOpen, faLayerGroup } from '@fortawesome/free-solid-svg-icons';

// 정적 JSON 데이터 임포트
import guideData from '@/data/prompt_basic.json';

interface Guide {
  id: string;
  level: string;
  title: string;
  description: string;
}

export default function FrontPromptBasicPage() {
  const [isMounted, setIsMounted] = useState(false);
  const API_BASE = "http://localhost:8000/api/v1";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const openGuide = (id: string) => {
    // 백엔드 에셋 브릿지를 통해 sub1 HTML 파일을 새창으로 띄움
    window.open(`${API_BASE}/assets/prompt-view/${id}`, '_blank');
  };

  if (!isMounted) return <div className="min-h-screen bg-[#f8fafc]" />;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-[5%] lg:px-[8%] py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-4">
              <FontAwesomeIcon icon={faGraduationCap} />
              AI Training Center
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">AI 실무 마스터 가이드</h1>
            <p className="text-slate-500 text-lg font-medium mt-4 max-w-2xl leading-relaxed">
              이감독님의 소중한 학습 지산들을 <span className="text-indigo-600 font-black underline underline-offset-4 decoration-indigo-200">3단계 커리큘럼</span>으로 완벽하게 정리했습니다.
            </p>
          </div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Link href="/front" className="hover:text-indigo-600 transition-colors">Home</Link>
            <span>›</span>
            <span className="text-slate-600 font-black">Prompt Basic</span>
          </nav>
        </div>
      </header>

      {/* Grid Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {guideData.map((guide) => (
            <div 
              key={guide.id}
              onClick={() => openGuide(guide.id)}
              className="group bg-white rounded-[40px] border border-slate-200 p-10 flex flex-col hover:border-indigo-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-10 relative z-10">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  guide.level === '입문' ? 'bg-green-50 text-green-600 border border-green-100' :
                  guide.level === '중급' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                  guide.level === '마스터' ? 'bg-indigo-600 text-white shadow-lg' :
                  'bg-purple-50 text-purple-600 border border-purple-100'
                }`}>
                  {guide.level}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="text-sm" />
                </div>
              </div>
              
              <h3 className="text-2xl font-black mb-4 tracking-tight group-hover:text-indigo-600 transition-colors leading-tight relative z-10">
                {guide.title}
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-10 relative z-10">
                {guide.description}
              </p>
              
              <div className="mt-auto flex items-center gap-3 relative z-10">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FontAwesomeIcon icon={faBookOpen} className="text-indigo-300" />
                  Full Guide View
                </span>
              </div>

              {/* Decoration */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>

        {/* Promotion Block */}
        <div className="mt-20 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[40px] p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-xl">
            <h4 className="text-3xl font-black mb-4 tracking-tighter">실전 프롬프트가 더 필요하신가요?</h4>
            <p className="text-indigo-100 font-medium mb-8 opacity-80 leading-relaxed">이감독님이 직접 선별한 160여 개의 전문 프롬프트 라이브러리를 <br/> 지금 바로 확인하고 업무에 적용해 보세요.</p>
            <Link href="/prompt/library" className="inline-flex px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl text-sm hover:bg-indigo-50 transition-all items-center gap-2 shadow-lg">
              <FontAwesomeIcon icon={faLayerGroup} /> 라이브러리 이동하기
            </Link>
          </div>
          <FontAwesomeIcon icon={faGraduationCap} className="absolute -bottom-10 -right-10 text-white/5 text-[300px] rotate-12" />
        </div>
      </main>

      <footer className="text-center py-16 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] border-t border-slate-100 bg-white">
        AI Academy Assets · LinkDrop Core V2
      </footer>
    </div>
  );
}
