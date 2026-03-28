'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faBars, faTimes, faCog, faKey, faCheck } from '@fortawesome/free-solid-svg-icons';

// JSON 메뉴 데이터 임포트
import menuData from '@/data/menu_gnb.json';

const GOOGLE_API_KEY_STORAGE = 'ld_google_api_key';
const IDB_NAME    = 'ld_settings';
const IDB_STORE   = 'settings';
const IDB_VERSION = 1;

function openSettingsIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function idbPut(key: string, value: string) {
  const db = await openSettingsIDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

async function idbGet(key: string): Promise<string> {
  const db = await openSettingsIDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? '');
    req.onerror   = () => reject(req.error);
  });
}

export default function FrontGNB() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // localStorage 우선 로드 → IndexedDB 보조 로드
  useEffect(() => {
    const lsKey = localStorage.getItem(GOOGLE_API_KEY_STORAGE) ?? '';
    if (lsKey) {
      setApiKey(lsKey);
    } else {
      idbGet(GOOGLE_API_KEY_STORAGE).then(v => {
        if (v) {
          setApiKey(v);
          localStorage.setItem(GOOGLE_API_KEY_STORAGE, v); // 동기화
        }
      });
    }
  }, []);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    if (isSettingsOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isSettingsOpen]);

  const hasApiKey = apiKey.trim().length > 0;

  function handleSave() {
    const key = apiKey.trim();
    localStorage.setItem(GOOGLE_API_KEY_STORAGE, key);
    idbPut(GOOGLE_API_KEY_STORAGE, key);
    window.dispatchEvent(new CustomEvent('google-api-key-updated', { detail: key }));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsSettingsOpen(false);
    }, 1200);
  }

  const navItems = menuData;

  return (
    <header suppressHydrationWarning className="fixed top-0 left-0 right-0 h-[52px] bg-[#13131f] border-b border-white/10 flex items-center justify-between px-4 md:px-6 z-[9999]">
      {/* Logo */}
      <Link href="/front" className="text-lg font-black text-[#a78bfa] tracking-tighter flex items-center gap-1.5 z-[10001]">
        Link<span suppressHydrationWarning className="text-[#6366f1]">Drop</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-1">
        {navItems.map((group: any) => (
          <div key={group.name} className="relative group py-2">
            <span className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              group.dev
                ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 border border-orange-500/20'
                : 'text-slate-400 hover:text-[#c4b5fd] hover:bg-white/5'
            }`}>
              {group.dev && <span className="text-[9px] font-black bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">DEV</span>}
              {group.name} <FontAwesomeIcon icon={faChevronDown} className="text-[8px] opacity-50 group-hover:rotate-180 transition-transform" />
            </span>
            
            {/* Dropdown Panel */}
            <div className={`absolute top-[calc(100%-4px)] left-0 bg-[#1c1c2e] border border-white/10 rounded-xl p-2 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto translate-y-[-8px] group-hover:translate-y-0 transition-all duration-200 max-w-[calc(100vw-2rem)] ${group.type === 'complex' ? 'min-w-[320px] flex gap-4' : 'min-w-[160px]'}`}>
              
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
                  item.href ? (
                    <Link 
                      key={item.name}
                      href={item.href}
                      className={`block px-3 py-2 rounded-lg text-slate-400 text-xs font-medium hover:bg-[#a78bfa]/10 hover:text-[#c4b5fd] transition-all ${pathname === item.href ? 'text-[#a78bfa] font-bold' : ''}`}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <div
                      key={item.name}
                      className="block px-3 py-2 rounded-lg text-slate-500 text-xs font-medium cursor-default select-none opacity-80"
                    >
                      {item.name}
                    </div>
                  )
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
        {/* 설정 버튼 + 드롭다운 모달 */}
        <div className="relative flex items-center gap-1.5" ref={modalRef}>
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${hasApiKey ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-red-500 shadow-[0_0_6px_#f87171]'}`}
            title={hasApiKey ? 'Google API Key 등록됨' : 'Google API Key 미등록'}
          />
          <button
            onClick={() => setIsSettingsOpen(v => !v)}
            className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${isSettingsOpen ? 'border-[#a78bfa]/60 text-[#c4b5fd] bg-[#a78bfa]/10' : 'border-white/10 text-slate-400 hover:border-[#a78bfa]/40 hover:text-[#c4b5fd]'}`}
            title="설정"
          >
            <FontAwesomeIcon icon={faCog} className="text-sm" />
          </button>

          {isSettingsOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] bg-[#1c1c2e] border border-white/10 rounded-xl shadow-2xl p-4 z-[10002]">
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faKey} className="text-[#a78bfa] text-sm" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Google API Key</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Gemini 비주얼타입 생성에 사용됩니다.<br />
                키는 이 브라우저에만 저장되며 서버로 전송되지 않습니다.
              </p>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="AIza..."
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#a78bfa]/50 font-mono mb-3"
              />
              <button
                onClick={handleSave}
                className={`w-full py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${saved ? 'bg-emerald-600/80 text-white' : 'bg-[#a78bfa]/20 text-[#c4b5fd] hover:bg-[#a78bfa]/30 border border-[#a78bfa]/30'}`}
              >
                {saved ? (
                  <><FontAwesomeIcon icon={faCheck} /> 저장 완료</>
                ) : '저장'}
              </button>
            </div>
          )}
        </div>
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
                <div className={`font-black text-sm mb-2 flex items-center gap-2 ${group.dev ? 'text-orange-400' : 'text-[#a78bfa]'}`}>
                  {group.dev && <span className="text-[9px] font-black bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">DEV</span>}
                  {group.name}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {group.type === 'complex' ? (
                    group.subgroups.flatMap((s: any) => s.items).map((item: any) => (
                      <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 bg-white/5 rounded-lg text-slate-400 text-xs">{item.name}</Link>
                    ))
                  ) : (
                    group.items?.map((item: any) => (
                      item.href ? (
                        <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 bg-white/5 rounded-lg text-slate-400 text-xs">{item.name}</Link>
                      ) : (
                        <div key={item.name} className="px-3 py-2 bg-white/5 rounded-lg text-slate-500 text-xs cursor-default select-none opacity-80">{item.name}</div>
                      )
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
