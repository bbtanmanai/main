'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie, faDatabase, faRobot, faBook, faGlobe, faChevronDown, faChevronRight,
  faSignOutAlt, faLayerGroup, faFilm, faBolt
} from '@fortawesome/free-solid-svg-icons';
import AdminGNB from '@/components/AdminGNB';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(true);

  const dataManagementItems = [
    { name: '에이전트 제어', href: '/admin/agent-control', icon: faRobot },
    { name: '웹페이지 저장', href: '/admin/web-save', icon: faGlobe },
    { name: '자료 현황', href: '/admin/data-flow', icon: faDatabase },
    { name: '노트북LM 관제', href: '/admin/notebook-login', icon: faBook },
    { name: '시나리오 팩토리', href: '/admin/scenario-factory', icon: faFilm },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--neu-bg)', fontFamily: 'Inter, sans-serif' }}>
      {/* 어드민 전용 상단 바 */}
      <AdminGNB />

      <div className="flex flex-1 pt-[52px]">
        {/* Sidebar — Neuromorphic */}
        <aside
          className="w-64 flex-shrink-0 fixed top-[52px] bottom-0 left-0 z-10 flex flex-col"
          style={{ background: 'var(--neu-bg)', boxShadow: '8px 0 32px var(--neu-shadow-d), 2px 0 8px var(--neu-shadow-l)' }}
        >
          <nav className="mt-3 px-3 flex-1 overflow-y-auto">
            {/* Dashboard Item */}
            <div className="mb-2">
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-4 py-3 transition-all text-sm font-bold ${
                  pathname === '/admin'
                    ? 'neu-sidebar-item-active'
                    : 'neu-sidebar-item text-[var(--neu-text-sub)] hover:text-[var(--neu-accent)]'
                }`}
              >
                <span
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-sm"
                  style={pathname === '/admin' ? { background: 'var(--neu-accent-lt)', color: 'var(--neu-accent)' } : { color: 'var(--neu-text-sub)' }}
                >
                  <FontAwesomeIcon icon={faChartPie} />
                </span>
                통합 현황판
              </Link>
            </div>

            {/* Group: Data Management */}
            <div className="mt-5">
              <button
                onClick={() => setIsDataMenuOpen(!isDataMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-2 bg-transparent border-none outline-none cursor-pointer"
                style={{ color: 'var(--neu-text-sub)' }}
              >
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faLayerGroup} className="text-[9px]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">데이터 관리</span>
                </div>
                <FontAwesomeIcon icon={isDataMenuOpen ? faChevronDown : faChevronRight} className="text-[9px]" />
              </button>

              {isDataMenuOpen && (
                <ul className="mt-1 space-y-1 px-1 list-none">
                  {dataManagementItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all ${
                            isActive
                              ? 'neu-sidebar-item-active'
                              : 'neu-sidebar-item text-[var(--neu-text-sub)] hover:text-[var(--neu-accent)]'
                          }`}
                        >
                          <span
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs"
                            style={isActive ? { background: 'var(--neu-accent-lt)', color: 'var(--neu-accent)' } : { color: 'var(--neu-text-sub)' }}
                          >
                            <FontAwesomeIcon icon={item.icon} />
                          </span>
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </nav>

          {/* Bottom — system status */}
          <div className="p-4">
            <div className="neu-inset p-3 rounded-xl flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faBolt} className="text-[10px]" style={{ color: 'var(--neu-green)' }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--neu-text-sub)' }}>시스템 정상</span>
            </div>
            <button
              className="neu-btn w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold"
              style={{ color: 'var(--neu-text-sub)' }}
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              시스템 종료
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          className="flex-1 ml-64 p-8 overflow-y-auto"
          style={{ background: 'var(--neu-bg)', minHeight: 'calc(100vh - 52px)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
