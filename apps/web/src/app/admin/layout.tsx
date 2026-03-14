'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie, faDatabase, faRobot, faBook, faGlobe, faChevronDown, faChevronRight,
  faSignOutAlt, faLayerGroup, faFilm
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
    <div className="flex flex-col min-h-screen">
      {/* 어드민 전용 상단 바 */}
      <AdminGNB />

      <div className="flex flex-1 bg-[#f4f6f8] pt-[52px]">
        {/* Sidebar - fixed position adjusted */}
        <aside className="w-64 bg-[#1e293b] text-white flex-shrink-0 shadow-2xl fixed top-[52px] bottom-0 left-0 z-10">
          <nav className="mt-1 px-3 flex-1 overflow-y-auto">
            {/* Dashboard Item */}
            <div className="mb-2">
              <Link 
                href="/admin"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  pathname === '/admin' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <FontAwesomeIcon icon={faChartPie} className="w-4" />
                <span className="font-bold text-sm">통합 현황판</span>
              </Link>
            </div>

            {/* Group: Data Management */}
            <div className="mt-6">
              <button 
                onClick={() => setIsDataMenuOpen(!isDataMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-2 text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faLayerGroup} className="text-[10px]" />
                  <span className="text-[11px] font-black uppercase tracking-widest">데이터 관리</span>
                </div>
                <FontAwesomeIcon icon={isDataMenuOpen ? faChevronDown : faChevronRight} className="text-[10px]" />
              </button>

              {isDataMenuOpen && (
                <ul className="mt-2 space-y-1 px-2 list-none">
                  {dataManagementItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link 
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                            isActive 
                              ? 'bg-slate-700/50 text-blue-400 font-bold border-l-4 border-blue-500' 
                              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <FontAwesomeIcon icon={item.icon} className={`w-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                          <span className="text-sm">{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </nav>

          <div className="p-4 border-t border-slate-700/50 mt-auto">
            <button className="flex items-center justify-center gap-2 text-slate-500 hover:text-red-400 transition-colors w-full px-4 py-2 text-xs font-bold bg-slate-800/50 rounded-xl border-none cursor-pointer">
              <FontAwesomeIcon icon={faSignOutAlt} />
              시스템 종료
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
