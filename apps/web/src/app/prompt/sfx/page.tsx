'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faVolumeHigh,
  faPlay,
  faPause,
  faDownload,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

type SfxItem = {
  id: string;
  name: string;
  path: string;
  mainCategory: string;
  subCategory: string;
};

type SfxCatalog = {
  generatedAt: string;
  total: number;
  mainCategories: Array<{
    name: string;
    count: number;
    subcategories: Array<{ name: string; count: number }>;
  }>;
  items: SfxItem[];
};

function displayName(name: string) {
  return name.replace(/_/g, ' ');
}

export default function PromptSfxPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState<SfxCatalog | null>(null);

  const [activeMain, setActiveMain] = useState<string>('전체');
  const [activeSub, setActiveSub] = useState<string>('전체');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentId, setCurrentId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    setLoading(true);
    setError('');
    fetch('/api/prompt/sfx-catalog')
      .then(async (res) => {
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || 'SFX 카탈로그 로드 실패');
        setCatalog(j);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'SFX 카탈로그 로드 실패'))
      .finally(() => setLoading(false));
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.addEventListener('ended', () => setIsPlaying(false));
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [isMounted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  const filteredItems = useMemo(() => {
    const items = catalog?.items ?? [];
    return items.filter((it) => {
      const okMain = activeMain === '전체' || it.mainCategory === activeMain;
      const okSub = activeSub === '전체' || it.subCategory === activeSub;
      return okMain && okSub;
    });
  }, [catalog?.items, activeMain, activeSub]);

  const activeSubcategories = useMemo(() => {
    if (!catalog || activeMain === '전체') return [];
    return catalog.mainCategories.find((m) => m.name === activeMain)?.subcategories ?? [];
  }, [catalog, activeMain]);

  const playItem = async (it: SfxItem) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentId === it.id) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
      return;
    }

    setCurrentId(it.id);
    setIsPlaying(false);
    audio.pause();
    audio.currentTime = 0;
    audio.src = it.path;
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const currentItem = useMemo(() => {
    if (!catalog || !currentId) return null;
    return catalog.items.find((x) => x.id === currentId) ?? null;
  }, [catalog, currentId]);

  if (!isMounted) return <div className="min-h-screen bg-[#0f0f1a]" />;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <header className="border-b border-white/10 px-6 lg:px-[8%] py-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end gap-6 justify-between">
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
              <Link href="/front" className="hover:text-[#c4b5fd] transition-colors">
                LinkDrop
              </Link>
              <span>›</span>
              <Link href="/prompt" className="hover:text-[#c4b5fd] transition-colors">
                Prompt
              </Link>
              <span>›</span>
              <span className="text-[#a78bfa]">SFX</span>
            </nav>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/15 border border-[#a78bfa]/20 flex items-center justify-center">
                <FontAwesomeIcon icon={faVolumeHigh} className="text-[#a78bfa]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">효과음 카탈로그</h1>
                <p className="text-slate-400 text-sm mt-1">
                  {loading ? '로딩 중…' : `${filteredItems.length.toLocaleString()}개 / 전체 ${(catalog?.total ?? 0).toLocaleString()}개`}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[420px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
              <div className="text-[10px] font-black text-[#a78bfa] uppercase tracking-widest mb-2">사용 안내</div>
              <div className="text-sm text-slate-200 font-medium leading-relaxed">
                효과음은 AI로 창작된 것으로 저작권표기 없이 자유 사용이 가능합니다
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-[8%] py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="rounded-2xl border border-white/10 bg-[#1c1c2e] overflow-hidden">
            <div className="px-4 py-4 border-b border-white/10">
              <div className="text-[10px] font-black text-[#a78bfa] uppercase tracking-widest">카테고리</div>
            </div>
            <div className="p-3 space-y-1 max-h-[70vh] overflow-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveMain('전체');
                  setActiveSub('전체');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                  activeMain === '전체'
                    ? 'bg-[#a78bfa]/15 border-[#a78bfa]/25 text-white'
                    : 'bg-white/0 border-transparent text-slate-300 hover:bg-white/5 hover:border-white/10'
                }`}
              >
                <span>전체</span>
                <span className="text-[10px] text-slate-500">{(catalog?.total ?? 0).toLocaleString()}</span>
              </button>
              {(catalog?.mainCategories ?? []).map((m) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => {
                    setActiveMain(m.name);
                    setActiveSub('전체');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                    activeMain === m.name
                      ? 'bg-[#a78bfa]/15 border-[#a78bfa]/25 text-white'
                      : 'bg-white/0 border-transparent text-slate-300 hover:bg-white/5 hover:border-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faChevronRight} className="text-[10px] opacity-60" />
                    {m.name}
                  </span>
                  <span className="text-[10px] text-slate-500">{m.count.toLocaleString()}</span>
                </button>
              ))}

              {activeMain !== '전체' && activeSubcategories.length > 0 && (
                <div className="pt-3 mt-3 border-t border-white/10 space-y-1">
                  <div className="px-3 pb-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">세부</div>
                  <button
                    type="button"
                    onClick={() => setActiveSub('전체')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                      activeSub === '전체'
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-white/0 border-transparent text-slate-400 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <span>전체</span>
                    <span className="text-[10px] text-slate-500">
                      {activeSubcategories.reduce((acc, s) => acc + s.count, 0).toLocaleString()}
                    </span>
                  </button>
                  {activeSubcategories.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setActiveSub(s.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        activeSub === s.name
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-white/0 border-transparent text-slate-400 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="text-[10px] text-slate-500">{s.count.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section className="rounded-2xl border border-white/10 bg-[#13131f] overflow-hidden">
            <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {activeMain === '전체' ? '전체 목록' : `${activeMain}${activeSub === '전체' ? '' : ` · ${activeSub}`}`}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Vol
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-32 accent-[#a78bfa]"
                  />
                </div>
                {currentItem && (
                  <div className="text-[11px] font-bold text-slate-300 flex items-center gap-2">
                    <span className="text-[#a78bfa] font-black">NOW</span>
                    <span className="truncate max-w-[240px]">{displayName(currentItem.name)}</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="px-4 py-4 text-sm text-rose-300 border-b border-white/10 bg-rose-500/10">{error}</div>
            )}
            {loading && <div className="px-4 py-10 text-sm text-slate-400">카탈로그를 불러오는 중…</div>}

            {!loading && filteredItems.length === 0 && (
              <div className="px-4 py-16 text-center">
                <div className="text-slate-400 font-bold">표시할 효과음이 없습니다.</div>
              </div>
            )}

            <div className="divide-y divide-white/5">
              {filteredItems.slice(0, 800).map((it) => {
                const active = currentId === it.id;
                return (
                  <div
                    key={it.id}
                    className={`px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-all ${
                      active ? 'bg-[#a78bfa]/10' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => playItem(it)}
                      className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-200 transition-all"
                      title={active && isPlaying ? '일시정지' : '재생'}
                    >
                      <FontAwesomeIcon icon={active && isPlaying ? faPause : faPlay} className="text-sm" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black text-white truncate">{displayName(it.name)}</div>
                      <div className="text-[10px] font-bold text-slate-500 truncate">
                        {it.mainCategory} / {it.subCategory}
                      </div>
                    </div>

                    <a
                      href={it.path}
                      download
                      className="w-9 h-9 rounded-xl border border-[#a78bfa]/25 bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 flex items-center justify-center text-[#c4b5fd] transition-all"
                      title="다운로드"
                    >
                      <FontAwesomeIcon icon={faDownload} className="text-sm" />
                    </a>
                  </div>
                );
              })}
            </div>

            {!loading && filteredItems.length > 800 && (
              <div className="px-4 py-3 text-[11px] text-slate-500 border-t border-white/10 bg-white/5">
                너무 많은 결과로 인해 상위 800개만 표시합니다. 카테고리를 더 구체화해 주세요.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
