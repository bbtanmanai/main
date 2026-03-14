'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShieldAlt, faSyncAlt, faExternalLinkAlt, 
  faChevronDown, faCogs, faDatabase, faUsers 
} from '@fortawesome/free-solid-svg-icons';

// JSON 메뉴 데이터 임포트
import adminMenuData from './menu_admin.json';

export default function AdminGNB() {
  const pathname = usePathname();
  const navItems = adminMenuData;

  return (
    <header className="fixed top-0 left-0 right-0 h-[52px] bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-6 z-[9999]">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-lg font-black text-white tracking-tighter flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-blue-500/20">A</div>
          LinkDrop <span className="text-blue-500 italic">Admin</span>
        </Link>
        <div className="h-4 w-[1px] bg-slate-700 mx-2" />
        
        {/* Desktop Admin Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((group) => (
            <div key={group.name} className="relative group py-2">
              <span className="flex items-center gap-1 px-3 py-1.5 text-slate-400 text-[11px] font-black rounded-lg hover:text-white hover:bg-white/5 cursor-pointer transition-all uppercase tracking-tighter">
                {group.name} <FontAwesomeIcon icon={faChevronDown} className="text-[8px] opacity-50 group-hover:rotate-180 transition-transform" />
              </span>
              <div className="absolute top-[calc(100%-4px)] left-0 min-w-[180px] bg-[#1e293b] border border-slate-700 rounded-xl p-1.5 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto translate-y-[-8px] group-hover:translate-y-0 transition-all duration-200">
                {group.items.map((item) => (
                  <Link 
                    key={item.name}
                    href={item.href}
                    className={`block px-3 py-2 rounded-lg text-slate-400 text-[11px] font-bold hover:bg-blue-600/20 hover:text-blue-400 transition-all ${pathname === item.href ? 'text-blue-500 bg-blue-500/10' : ''}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/front" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors flex items-center gap-1">
          <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[8px]" />
          Go_Front
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Engine_v1.2</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-white text-[10px] font-black">
          AD
        </div>
      </div>
    </header>
  );
}
