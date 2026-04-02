'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faChevronLeft, faChevronRight, faChevronUp, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

// 정적 JSON 데이터 임포트 (Base64 데이터 포함)
import designData from '@/data/front_design.json';

interface DesignAsset {
  id: number;
  title: string;
  description: string | null;
  thumbnail_base64?: string; // 내장된 이미지 데이터
  external_url?: string;
  download_url?: string;
}

export default function FrontDesignPage() {
  const [assets] = useState<DesignAsset[]>(designData);
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const itemsPerPage = 12;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalPages = Math.ceil(assets.length / itemsPerPage);
  const pagedData = assets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const changePage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isMounted) return <div className="min-h-screen bg-[#f8fafc]" />;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 py-20 px-6 text-center border-b border-white/5">
        <div className="inline-block bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-1 rounded-full text-[10px] font-black mb-5 uppercase tracking-[0.2em]">
          Design Warehouse V2
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tighter">
          프론트 디자인 창고
        </h1>
        <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto leading-relaxed text-white shadow-sm">
          이감독님의 <span className="text-indigo-400 underline underline-offset-8 font-black tracking-tight">실제 디자인 모반 17종</span>을 <br/>
          백엔드 연결 없이 즉시 확인하고 소스를 확보하세요.
        </p>
      </section>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {pagedData.map((item) => (
            <div 
              key={item.id} 
              className="group relative bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col cursor-pointer"
              onClick={() => {
                window.open(`${API_BASE}/assets/view/moban${item.id}/index.html`, '_blank');
              }}
            >
              {/* Thumbnail Container */}
              <div className="relative h-56 bg-slate-100 overflow-hidden">
                {/* Base64 내장 이미지를 우선 사용 */}
                <img 
                  src={item.thumbnail_base64 || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800'}
                  alt={item.title}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* ID Badge */}
                <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black text-slate-900 border border-white">
                  MOBAN_{item.id}
                </div>
              </div>
              
              {/* Content Area */}
              <div className="p-6 flex-grow flex flex-col">
                <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed mb-6">
                  {item.description}
                </p>
                
                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between gap-3">
                  <a 
                    href={item.download_url || `${API_BASE}/assets/design/${item.id}/download`}
                    className="flex-1 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    SOURCE_RAR
                  </a>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.external_url) {
                        window.open(item.external_url, '_blank');
                      } else {
                        alert(`미리보기는 design_inbox 폴더의 moban${item.id}/index.html을 직접 확인해주세요.`);
                      }
                    }}
                    className="w-12 h-12 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                    title={item.external_url ? "새창으로 미리보기" : "미리보기 가이드"}
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-20">
            <button 
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-12 h-12 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => changePage(page)}
                className={`w-12 h-12 rounded-2xl font-black text-xs transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-12 h-12 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
      </main>

      {/* Back to Top */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-10 right-10 w-12 h-12 bg-white text-indigo-600 rounded-full shadow-2xl border border-slate-100 flex items-center justify-center transition-all hover:-translate-y-2 hover:bg-indigo-600 hover:text-white z-50 ${showBackToTop ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
      >
        <FontAwesomeIcon icon={faChevronUp} />
      </button>

      <footer className="text-center py-12 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] border-t border-slate-100 bg-white">
        Official Design Assets · LinkDrop Core V2
      </footer>
    </div>
  );
}
