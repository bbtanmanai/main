'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown, faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';

import adminMenuData from './menu_admin.json';

export default function AdminGNB() {
  const pathname = usePathname();
  const navItems = adminMenuData;

  return (
    <header
      className="fixed top-0 left-0 right-0 h-[52px] flex items-center justify-between px-6 z-[9999]"
      style={{
        background: 'var(--neu-bg)',
        boxShadow: '0 4px 20px var(--neu-shadow-d), 0 1px 4px var(--neu-shadow-l)',
      }}
    >
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-base font-black tracking-tighter flex items-center gap-2" style={{ color: 'var(--neu-text)' }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '2px 2px 6px rgba(109,40,217,0.4)' }}
          >
            A
          </div>
          LinkDrop <span style={{ color: 'var(--neu-accent)' }} className="italic">Admin</span>
        </Link>
        <div className="h-4 w-[1px]" style={{ background: 'var(--neu-shadow-d)' }} />

        {/* Desktop Admin Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((group) => (
            <div key={group.name} className="relative group py-2">
              <span
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-black rounded-lg cursor-pointer transition-all uppercase tracking-tighter"
                style={{ color: 'var(--neu-text-sub)' }}
              >
                {group.name} <FontAwesomeIcon icon={faChevronDown} className="text-[8px] opacity-50 group-hover:rotate-180 transition-transform" />
              </span>
              <div
                className="absolute top-[calc(100%-4px)] left-0 min-w-[180px] rounded-xl p-1.5 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto translate-y-[-8px] group-hover:translate-y-0 transition-all duration-200 z-50"
                style={{ background: 'var(--neu-bg)', boxShadow: '4px 4px 12px var(--neu-shadow-d), -2px -2px 8px var(--neu-shadow-l)' }}
              >
                {group.items.map((item: any) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2 rounded-lg text-[11px] font-bold transition-all"
                    style={{
                      color: pathname === item.href ? 'var(--neu-accent)' : 'var(--neu-text-sub)',
                      background: pathname === item.href ? 'var(--neu-accent-lt)' : 'transparent',
                    }}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/front"
          className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
          style={{ color: 'var(--neu-text-sub)' }}
        >
          <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[8px]" />
          Go_Front
        </Link>
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{
            background: 'var(--neu-bg)',
            boxShadow: 'inset 2px 2px 4px var(--neu-shadow-d), inset -2px -2px 4px var(--neu-shadow-l)',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: 'var(--neu-text-sub)' }}>Engine_v1.2</span>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black"
          style={{ background: 'linear-gradient(135deg, var(--neu-accent), #a78bfa)', boxShadow: '2px 2px 6px var(--neu-shadow-d)' }}
        >
          AD
        </div>
      </div>
    </header>
  );
}
