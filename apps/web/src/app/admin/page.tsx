'use client';

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faRobot, faBook, faGlobe, faArrowRight, 
  faServer, faShieldAlt, faMicrochip, faCogs
} from '@fortawesome/free-solid-svg-icons';

export default function AdminIndex() {
  return (
    <div className="max-w-6xl mx-auto space-y-10 py-10">
      
      {/* 1. Welcome Banner */}
      <div className="relative bg-slate-900 rounded-3xl p-10 overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-4">
            LinkDrop <span className="text-blue-500 font-mono italic">V2</span>
          </h1>
          <p className="text-slate-400 font-bold max-w-lg leading-relaxed">
            환영합니다, 이감독님. <br/>
            현재 AI 공장의 모든 시스템이 정상 가동 중입니다. <br/>
            실시간 데이터 흐름과 에이전트들의 상태를 중앙에서 통제하세요.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/admin/data-flow" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30">
              <FontAwesomeIcon icon={faChartLine} /> 실시간 현황판 보기
            </Link>
            <div className="px-6 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-sm border border-slate-700">
              <FontAwesomeIcon icon={faServer} className="mr-2 text-green-500" /> SYSTEM_STABLE
            </div>
          </div>
        </div>
        
        {/* Background Decors */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent" />
        <FontAwesomeIcon icon={faMicrochip} className="absolute -bottom-10 -right-10 text-white/5 text-[300px] rotate-12" />
      </div>

      {/* 2. Quick Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickLinkCard 
          title="공정 제어" 
          desc="17종 에이전트의 실시간 가동 상태 관리 및 명령" 
          href="/admin/agent-control" 
          icon={faRobot} 
          color="green" 
        />
        <QuickLinkCard 
          title="통합 현황" 
          desc="수집부터 동기화까지의 전 공정 시각화 및 자산 명부" 
          href="/admin/data-flow" 
          icon={faChartLine} 
          color="blue" 
        />
        <QuickLinkCard 
          title="노트북LM" 
          desc="구글 세션 유지 및 지식 베이스 무결성 대조" 
          href="/admin/notebook-login" 
          icon={faBook} 
          color="purple" 
        />
        <QuickLinkCard 
          title="웹 세이브" 
          desc="고정밀 웹 아카이빙 및 본문 직접 주입 처리" 
          href="/admin/web-save" 
          icon={faGlobe} 
          color="amber" 
        />
      </div>

      {/* 3. System Specs (Mini) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <FontAwesomeIcon icon={faShieldAlt} className="text-blue-500" /> Security: Standard
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <FontAwesomeIcon icon={faCogs} className="text-amber-500" /> Engine: FastAPI 1.0.0
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-300">
          BUILD_20260305_STABLE
        </div>
      </div>

    </div>
  );
}

function QuickLinkCard({ title, desc, href, icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50 hover:border-blue-500',
    green: 'text-emerald-600 bg-emerald-50 hover:border-emerald-500',
    purple: 'text-indigo-600 bg-indigo-50 hover:border-indigo-500',
    amber: 'text-amber-600 bg-amber-50 hover:border-amber-500'
  };

  return (
    <Link href={href} className={`group p-8 rounded-3xl border-2 border-transparent transition-all bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 ${colors[color]}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 transition-transform group-hover:scale-110 ${colors[color].split(' ')[1]} ${colors[color].split(' ')[0]}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6 h-10 overflow-hidden">{desc}</p>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group-hover:gap-4 transition-all">
        Enter Module <FontAwesomeIcon icon={faArrowRight} />
      </div>
    </Link>
  );
}
