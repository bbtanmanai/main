'use client';

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine, faRobot, faBook, faGlobe, faArrowRight,
  faShieldAlt, faCogs, faBolt, faServer, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

export default function AdminIndex() {
  return (
    <div className="max-w-5xl mx-auto space-y-7 py-8">

      {/* 1. Welcome Banner */}
      <div className="neu-raised rounded-3xl overflow-hidden" style={{ background: 'var(--neu-bg)' }}>
        <div className="flex items-stretch">
          {/* Left content */}
          <div className="flex-1 p-10">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-5"
              style={{ background: 'var(--neu-inset, #dde1e7)', boxShadow: 'inset 3px 3px 6px #b8bcc2, inset -3px -3px 6px #ffffff', color: 'var(--neu-accent)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              System Online
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-3" style={{ color: 'var(--neu-text)', fontFamily: 'Inter, system-ui, sans-serif' }}>
              LinkDrop <span style={{ color: 'var(--neu-accent)' }}>V2</span>
            </h1>
            <p className="text-sm font-medium leading-loose max-w-sm mb-8" style={{ color: 'var(--neu-text-sub)' }}>
              환영합니다, 이감독님.<br />
              AI 공장의 모든 시스템이 정상 가동 중입니다.
            </p>
            <div className="flex gap-3">
              <Link href="/admin/data-flow" className="neu-btn-accent flex items-center gap-2 px-6 py-3 text-sm font-black text-white no-underline">
                <FontAwesomeIcon icon={faChartLine} /> 현황판 보기
              </Link>
              <Link href="/admin/agent-control" className="neu-btn flex items-center gap-2 px-6 py-3 text-sm font-bold no-underline" style={{ color: 'var(--neu-text-sub)' }}>
                <FontAwesomeIcon icon={faRobot} /> 에이전트 제어
              </Link>
            </div>
          </div>

          {/* Right decorative panel */}
          <div
            className="w-56 flex-shrink-0 flex flex-col items-center justify-center gap-5 p-8"
            style={{ boxShadow: 'inset 6px 0 12px #b8bcc2, inset -1px 0 4px #ffffff' }}
          >
            {/* Big circle decoration */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl text-white"
              style={{ background: 'linear-gradient(145deg, #8b5cf6, #6d28d9)', boxShadow: '8px 8px 16px #b8bcc2, -4px -4px 12px #ffffff' }}
            >
              <FontAwesomeIcon icon={faBolt} />
            </div>
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: 'var(--neu-text)' }}>17</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: 'var(--neu-text-sub)' }}>에이전트</div>
            </div>
            <div
              className="w-full rounded-xl p-3 text-center"
              style={{ boxShadow: 'inset 4px 4px 8px #b8bcc2, inset -4px -4px 8px #ffffff' }}
            >
              <div className="flex items-center justify-center gap-1.5">
                <FontAwesomeIcon icon={faCheckCircle} className="text-xs" style={{ color: 'var(--neu-green)' }} />
                <span className="text-[11px] font-black" style={{ color: 'var(--neu-green)' }}>STABLE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Navigation Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <QuickLinkCard title="공정 제어" desc="에이전트 실시간 관리" href="/admin/agent-control" icon={faRobot} color="green" />
        <QuickLinkCard title="통합 현황" desc="전 공정 시각화" href="/admin/data-flow" icon={faChartLine} color="blue" />
        <QuickLinkCard title="노트북LM" desc="지식 베이스 관제" href="/admin/notebook-login" icon={faBook} color="purple" />
        <QuickLinkCard title="웹 세이브" desc="웹 아카이빙" href="/admin/web-save" icon={faGlobe} color="amber" />
      </div>

      {/* 3. System Specs */}
      <div className="neu-flat rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Spec icon={faShieldAlt} label="Security: Standard" color="var(--neu-blue)" />
          <Spec icon={faCogs} label="Engine: FastAPI 1.0.0" color="var(--neu-amber)" />
          <Spec icon={faServer} label="API: Online" color="var(--neu-green)" />
        </div>
        <div className="text-[10px] font-mono" style={{ color: 'var(--neu-text-sub)' }}>
          BUILD_20260305_STABLE
        </div>
      </div>

    </div>
  );
}

function Spec({ icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--neu-text-sub)' }}>
      <FontAwesomeIcon icon={icon} style={{ color }} />
      {label}
    </div>
  );
}

const colorMap: Record<string, { icon: string; bg: string; shadow: string }> = {
  blue:   { icon: 'var(--neu-blue)',   bg: '#dbeafe', shadow: 'rgba(37,99,235,0.2)' },
  green:  { icon: 'var(--neu-green)',  bg: '#d1fae5', shadow: 'rgba(5,150,105,0.2)' },
  purple: { icon: 'var(--neu-accent)', bg: 'var(--neu-accent-lt)', shadow: 'rgba(124,58,237,0.2)' },
  amber:  { icon: 'var(--neu-amber)',  bg: '#fef3c7', shadow: 'rgba(217,119,6,0.2)' },
};

function QuickLinkCard({ title, desc, href, icon, color }: {
  title: string; desc: string; href: string; icon: any; color: string;
}) {
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <Link
      href={href}
      className="neu-raised group p-6 flex flex-col gap-4 no-underline"
      style={{ textDecoration: 'none' }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110"
        style={{ background: c.bg, color: c.icon, boxShadow: `3px 3px 8px ${c.shadow}` }}
      >
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-black mb-1" style={{ color: 'var(--neu-text)' }}>{title}</h3>
        <p className="text-[11px] font-medium leading-relaxed" style={{ color: 'var(--neu-text-sub)' }}>{desc}</p>
      </div>
      <div
        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest group-hover:gap-3 transition-all"
        style={{ color: c.icon }}
      >
        Enter <FontAwesomeIcon icon={faArrowRight} />
      </div>
    </Link>
  );
}
