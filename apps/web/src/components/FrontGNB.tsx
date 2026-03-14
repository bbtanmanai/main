'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faBars, faTimes, faCog } from '@fortawesome/free-solid-svg-icons';

// JSON 메뉴 데이터 임포트
import menuData from '@/data/menu_gnb.json';

export default function FrontGNB() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const navItems = menuData;

  return (
    <header className="fixed top-0 left-0 right-0 h-[52px] bg-[#13131f] border-b border-white/10 flex items-center justify-between px-4 md:px-6 z-[9999]">
      {/* Logo */}
      <Link href="/front" className="text-lg font-black text-[#a78bfa] tracking-tighter flex items-center gap-1.5 z-[10001]">
        Link<span className="text-[#6366f1]">Drop</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-1">
        {navItems.map((group: any) => (
          <div key={group.name} className="relative group py-2">
            <span className="flex items-center gap-1 px-3 py-1.5 text-slate-400 text-xs font-bold rounded-lg hover:text-[#c4b5fd] hover:bg-white/5 cursor-pointer transition-all">
              {group.name} <FontAwesomeIcon icon={faChevronDown} className="text-[8px] opacity-50 group-hover:rotate-180 transition-transform" />
            </span>
            
            {/* Dropdown Panel */}
            <div className={`absolute top-[calc(100%-4px)] left-0 bg-[#1c1c2e] border border-white/10 rounded-xl p-2 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto translate-y-[-8px] group-hover:translate-y-0 transition-all duration-200 ${group.type === 'complex' ? 'min-w-[320px] flex gap-4' : 'min-w-[160px]'}`}>
              
              {/* 3단 구성 (Complex Type) */}
              {group.type === 'complex' ? (
                group.subgroups.map((sub: any) => (
                  <div key={sub.title} className="flex-1 min-w-[140px]">
                    <div className="px-3 py-1.5 text-[10px] font-black text-[#a78bfa] uppercase tracking-widest border-b border-white/5 mb-1">
                      {sub.title}
                    </div>
                    {sub.items.map((item: any) => (
                      <Link 
                        key={item.name}
                        href={item.href}
                        className={`block px-3 py-2 rounded-lg text-slate-400 text-xs font-medium hover:bg-[#a78bfa]/10 hover:text-[#c4b5fd] transition-all ${pathname === item.href ? 'text-[#a78bfa] font-bold' : ''}`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                ))
              ) : (
                /* 일반 2단 구성 */
                group.items?.map((item: any) => (
                  <Link 
                    key={item.name}
                    href={item.href}
                    className={`block px-3 py-2 rounded-lg text-slate-400 text-xs font-medium hover:bg-[#a78bfa]/10 hover:text-[#c4b5fd] transition-all ${pathname === item.href ? 'text-[#a78bfa] font-bold' : ''}`}
                  >
                    {item.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Link href="/admin/agent-control" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 text-[10px] font-black hover:border-[#a78bfa]/40 hover:text-[#c4b5fd] transition-all font-mono uppercase">
          Admin_Console
        </Link>
        <button 
          onClick={() => {
            // 전역 이벤트 또는 상태 관리를 통해 설정 모달을 열 수 있도록 구현 가능
            // 현재는 롱폼 페이지에서 사용하는 gemini_api_key 설정을 위한 커스텀 이벤트 발생 예시
            window.dispatchEvent(new CustomEvent('open-settings'));
          }}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-slate-400 hover:border-[#a78bfa]/40 hover:text-[#c4b5fd] transition-all"
          title="설정"
        >
          <FontAwesomeIcon icon={faCog} className="text-sm" />
        </button>
        <button 
          className="lg:hidden text-white p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} size="lg" />
        </button>
      </div>

      {/* Mobile Navigation (Simplified) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#0f0f1a] z-[10000] lg:hidden flex flex-col pt-20 px-6">
          <div className="flex-1 overflow-y-auto space-y-4">
            {navItems.map((group: any) => (
              <div key={group.name} className="border-b border-white/5 pb-2">
                <div className="text-[#a78bfa] font-black text-sm mb-2">{group.name}</div>
                <div className="grid grid-cols-2 gap-2">
                  {group.type === 'complex' ? (
                    group.subgroups.flatMap((s: any) => s.items).map((item: any) => (
                      <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 bg-white/5 rounded-lg text-slate-400 text-xs">{item.name}</Link>
                    ))
                  ) : (
                    group.items?.map((item: any) => (
                      <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 bg-white/5 rounded-lg text-slate-400 text-xs">{item.name}</Link>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
