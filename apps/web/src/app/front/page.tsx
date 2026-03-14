'use client';

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, faChartLine, faEdit, faLaptopCode, faBolt, faArrowRight,
  faStar, faTag, faCalendarAlt, faDownload, faFileAlt, faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import AnimatedHeroBg from '@/components/AnimatedHeroBg';
import WaveDivider from '@/components/WaveDivider';

export default function FrontMainPage() {
  return (
    <div className="bg-white">
      
      {/* ══════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════ */}
      <section className="relative bg-[#0f0f1a] pt-24 pb-48 overflow-hidden">
        {/* Loop-type SVG Background Animation */}
        <AnimatedHeroBg />

        {/* Background Glows */}
        <div className="absolute top-[-200px] left-[-100px] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(99,102,241,0.25)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-0 right-[-80px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(139,92,246,0.18)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          {/* Top Tagline */}
          <div className="flex justify-center mb-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#c4b5fd] text-xs font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-ping" />
              AI 실무 플랫폼 · UPDATE_V2_READY
            </div>
          </div>

          {/* 3-Column Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr_1fr] gap-3 relative z-10">
            
            {/* LEFT SIDE: 2 Mini Cards */}
            <div className="flex flex-col gap-3">
              <HeroMiniCard 
                title="롱폼 영상 제작 엔진" 
                meta="콘텐츠 제작 · NEW" 
                desc="주제 하나로 60초 롱폼 영상을 자동 생성합니다." 
                icon="🎬" 
                theme="grad-indigo"
                tag="롱폼 제작"
                href="/content/longform"
              />
              <HeroMiniCard 
                title="엔지니어가 쓰는 프롬프트 7기법" 
                meta="가이드 · 5분 읽기" 
                desc="AI 결과물의 수준을 결정하는 것은 설계의 규칙입니다." 
                icon="🤖" 
                theme="grad-emerald"
                tag="AI 실무"
                href="/prompt/basic"
              />
            </div>

            {/* CENTER: 1 Large Card */}
            <Link href="/prompt/library" className="group flex flex-col h-full bg-[#1c1c2e] rounded-t-3xl overflow-hidden border-t border-x border-white/5 hover:-translate-y-1 transition-transform">
              <div className="flex-grow min-h-[260px] p-10 flex flex-col justify-end relative overflow-hidden bg-gradient-to-br from-[#1a0533] via-[#6b21a8] to-[#7c3aed]">
                <span className="text-6xl absolute top-10 right-10 opacity-20 group-hover:scale-110 transition-transform duration-500">✨</span>
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-4 align-self-start">프롬프트 라이브러리</span>
                <h2 className="text-3xl font-black text-white leading-tight mb-2 shadow-sm">업무별 최적화 프롬프트<br/>바로 복사해서 쓰기</h2>
                <p className="text-white/60 text-xs font-bold uppercase tracking-tighter">재무제표 분석 · SNS 전략 · 보고서 작성 · 기획안 외 다수</p>
              </div>
              <div className="p-6 bg-[#1c1c2e] border-t border-white/5">
                <p className="text-slate-400 text-sm leading-relaxed">실무에서 바로 쓸 수 있는 프롬프트를 카테고리별로 정리했습니다. 클릭 한 번으로 복사해서 AI에 붙여넣기만 하면 됩니다.</p>
              </div>
            </Link>

            {/* RIGHT SIDE: 2 Mini Cards */}
            <div className="flex flex-col gap-3">
              <HeroMiniCard 
                title="프론트엔드 필수 용어 사전" 
                meta="가이드 · 참고자료" 
                desc="개발 협업에 꼭 필요한 프론트 핵심 용어들을 정리." 
                icon="💻" 
                theme="grad-sky"
                tag="프론트엔드"
                href="/front/word"
              />
              <HeroMiniCard 
                title="AI와 함께하는 바이브코딩" 
                meta="가이드 · 준비 중" 
                desc="코딩 없이 AI로 웹앱을 만드는 새로운 방식." 
                icon="⚡" 
                theme="grad-orange"
                tag="바이브코딩"
                href="#"
              />
            </div>

          </div>
        </div>

        {/* Wave Divider at the bottom of Hero */}
        <WaveDivider />
      </section>

      {/* ══════════════════════════════════════════════════
          STATS BAR
          ══════════════════════════════════════════════════ */}
      <div className="bg-[#0f172a] py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-0 border-x border-white/5">
          <StatItem label="AI 실무 가이드" value="15+" />
          <StatItem label="프롬프트 라이브러리" value="30+" />
          <StatItem label="학습 카테고리" value="5개" />
          <StatItem label="신규 콘텐츠 추가" value="매주" />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          CATEGORY SECTION
          ══════════════════════════════════════════════════ */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <span className="text-[#6366f1] text-[11px] font-black uppercase tracking-[0.2em]">Category</span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">학습 카테고리</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <CategoryBlock label="컨텐츠제작" count="쇼츠·인스타툰·영상" icon="🎨" color="indigo" href="#" />
          <CategoryBlock label="비지니스" count="수익화·아이디어·소설" icon="💼" color="orange" href="#" />
          <CategoryBlock label="프롬프트" count="가이드·라이브러리" icon="✍️" color="purple" href="/prompt/library" />
          <CategoryBlock label="프론트엔드" count="용어·색상·디자인" icon="💻" color="blue" href="/front/word" />
          <CategoryBlock label="마케팅" count="뉴스레터 자동화" icon="📧" color="emerald" href="/marketing/news" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TRENDING SECTION
          ══════════════════════════════════════════════════ */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-[#6366f1] text-[11px] font-black uppercase tracking-[0.2em]">Trending</span>
              <h2 className="text-3xl font-black text-slate-900 mt-2">인기 콘텐츠</h2>
            </div>
            <Link href="#" className="px-5 py-2 border-2 border-indigo-100 rounded-full text-indigo-600 text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all">전체 보기 →</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <TrendCard 
              tag="AI 실무" 
              date="AI 엔지니어링" 
              title="AI 엔지니어들이 사용하는 프롬프트 기법" 
              theme="grad-indigo"
              icon="🤖"
              href="/prompt/basic"
            />
            <TrendCard 
              tag="프롬프트" 
              date="재무 분석" 
              title="기업 재무제표 포렌식 감사 프롬프트" 
              theme="grad-purple"
              icon="📊"
              href="/prompt/library"
            />
            <TrendCard 
              tag="페이스북" 
              date="계정 보안" 
              title="페이스북 계정 정지 예방 가이드" 
              theme="grad-sky"
              icon="🎯"
              href="#"
            />
            <TrendCard 
              tag="SNS" 
              date="마케팅 전략" 
              title="SNS 콘텐츠 전략 생성 프롬프트" 
              theme="grad-emerald"
              icon="💬"
              href="#"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          LATEST SECTION
          ══════════════════════════════════════════════════ */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-[#6366f1] text-[11px] font-black uppercase tracking-[0.2em]">Latest</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">최신 가이드</h2>
          </div>
          <Link href="#" className="px-5 py-2 border-2 border-indigo-100 rounded-full text-indigo-600 text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all">전체 보기 →</Link>
        </div>

        <div className="flex flex-col border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <LatestItem num="01" cat="AI 실무" title="AI 엔지니어들이 사용하는 프롬프트 기법 7가지" icon="🤖" color="#ede9fe" href="/prompt/basic" />
          <LatestItem num="02" cat="계정 보안" title="페이스북 계정 정지 예방 완벽 가이드" icon="🎯" color="#dcfce7" href="#" />
          <LatestItem num="03" cat="AI 활용" title="메타 프롬프트 초간단 사용법" icon="📝" color="#fef3c7" href="#" />
          <LatestItem num="04" cat="영상 제작" title="NotebookLM을 활용한 영상 제작 워크플로우" icon="🎥" color="#e0f2fe" href="#" />
          <LatestItem num="05" cat="프롬프트" title="기업 재무제표 포렌식 감사 프롬프트" icon="💼" color="#faf5ff" href="/prompt/library" />
        </div>
      </section>

    </div>
  );
}

// --- Sub Components ---

function HeroMiniCard({ title, meta, desc, icon, theme, tag, href }: any) {
  const themes: any = {
    'grad-indigo': 'bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca]',
    'grad-emerald': 'bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#059669]',
    'grad-sky': 'bg-gradient-to-br from-[#0c4a6e] via-[#0369a1] to-[#0284c7]',
    'grad-orange': 'bg-gradient-to-br from-[#431407] via-[#c2410c] to-[#ea580c]'
  };

  return (
    <Link href={href} className="group flex flex-col h-full bg-[#1c1c2e] rounded-t-2xl overflow-hidden border-t border-x border-white/5 hover:-translate-y-1 transition-transform">
      <div className={`h-[120px] p-6 flex flex-col justify-end relative overflow-hidden ${themes[theme]}`}>
        <span className="text-4xl absolute top-4 right-4 opacity-20 group-hover:scale-110 transition-transform duration-500">{icon}</span>
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-white text-[9px] font-black uppercase tracking-wider mb-2 align-self-start ${theme === 'grad-indigo' ? 'bg-indigo-500/40' : theme === 'grad-emerald' ? 'bg-emerald-500/40' : theme === 'grad-sky' ? 'bg-sky-500/40' : 'bg-orange-500/40'}`}>{tag}</span>
        <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
        <p className="text-white/50 text-[9px] font-bold uppercase tracking-tighter mt-1">{meta}</p>
      </div>
      <div className="p-4 bg-[#1c1c2e] border-t border-white/5 flex-grow">
        <p className="text-slate-500 text-[11px] leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}

function StatItem({ label, value }: any) {
  return (
    <div className="text-center py-10 border-r border-white/5 last:border-r-0">
      <div className="text-4xl lg:text-5xl font-black bg-gradient-to-br from-indigo-400 to-indigo-600 bg-clip-text text-transparent mb-2 leading-none">{value}</div>
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function CategoryBlock({ label, count, icon, color, href }: any) {
  const colors: any = {
    indigo: 'hover:bg-indigo-50 text-indigo-600 border-indigo-100',
    orange: 'hover:bg-orange-50 text-orange-600 border-orange-100',
    purple: 'hover:bg-purple-50 text-purple-600 border-purple-100',
    blue: 'hover:bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'hover:bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  return (
    <Link href={href} className={`flex flex-col items-center gap-4 p-8 rounded-3xl border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:shadow-xl group ${colors[color].split(' ')[0]}`}>
      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-center">
        <div className="text-sm font-black text-slate-800 group-hover:text-inherit transition-colors">{label}</div>
        <div className="text-[10px] font-bold text-slate-400 mt-1">{count}</div>
      </div>
    </Link>
  );
}

function TrendCard({ tag, date, title, theme, icon, href }: any) {
  const themes: any = {
    'grad-indigo': 'bg-gradient-to-br from-[#1e1b4b] to-[#4338ca]',
    'grad-purple': 'bg-gradient-to-br from-[#1a0533] to-[#7c3aed]',
    'grad-sky': 'bg-gradient-to-br from-[#0c4a6e] to-[#0284c7]',
    'grad-emerald': 'bg-gradient-to-br from-[#064e3b] to-[#059669]'
  };

  return (
    <Link href={href} className="group relative block rounded-3xl overflow-hidden border border-slate-200 bg-white hover:-translate-y-1 hover:shadow-xl transition-all">
      <div className={`h-40 flex items-end p-5 relative overflow-hidden ${themes[theme]}`}>
        <span className="text-7xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">{icon}</span>
        <span className="px-2.5 py-0.5 bg-black/30 backdrop-blur-md rounded-full text-white text-[9px] font-black uppercase tracking-widest relative z-10">{tag}</span>
      </div>
      <div className="p-5">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">{date}</div>
        <h3 className="text-sm font-black text-slate-800 leading-snug line-clamp-2">{title}</h3>
      </div>
      {/* Hover Overlay */}
      <div className={`absolute inset-0 p-6 flex flex-col justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 ${themes[theme]}`}>
        <div className="text-[10px] font-bold text-white/60 uppercase tracking-tighter">{tag}</div>
        <h3 className="text-base font-black text-white leading-tight">{title}</h3>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest self-start">자세히 보기 <FontAwesomeIcon icon={faArrowRight} /></span>
      </div>
    </Link>
  );
}

function LatestItem({ num, cat, title, icon, color, href }: any) {
  return (
    <Link href={href} className="flex items-center gap-6 p-6 bg-white hover:bg-indigo-50/50 transition-colors group border-b border-slate-100 last:border-b-0">
      <div className="text-sm font-black text-slate-200 font-mono tracking-tighter group-hover:text-indigo-200 transition-colors">{num}</div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: color }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-black text-[#6366f1] uppercase tracking-widest mb-1">{cat}</div>
        <h3 className="text-base font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{title}</h3>
      </div>
      <FontAwesomeIcon icon={faArrowRight} className="text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all text-sm" />
    </Link>
  );
}
