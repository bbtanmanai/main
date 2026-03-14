import React from 'react';
import { Sparkles, ArrowRight, Zap, ShieldCheck, Globe } from 'lucide-react';
import Link from 'next/link';

export default function UserHomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 상단 네비바 (임시) */}
      <nav className="h-20 border-b border-slate-100 px-12 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2 text-xl font-black italic">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">L</div>
          LinkDrop
        </div>
        <Link href="/admin" className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
          관리자 모드
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black mb-8">
          <Sparkles size={14} /> AI 기반 자동화의 새로운 기준
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-[1.1]">
          당신의 지식을<br />
          <span className="text-blue-600">콘텐츠 수익</span>으로 바꾸세요
        </h1>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mb-12 leading-relaxed">
          NotebookLM과 LinkDrop의 기술이 결합하여, 단순한 요약을 넘어<br />
          즉시 배포 가능한 프리미엄 카드뉴스와 쇼츠를 생산합니다.
        </p>
        <div className="flex gap-4">
          <button className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
            지금 시작하기
          </button>
        </div>
      </section>
    </div>
  );
}
