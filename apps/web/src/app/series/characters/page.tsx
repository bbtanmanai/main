'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import charIndex from '@/data/characters/_index.json';

/* ── 타입 ── */
interface CharEntry {
  id: string;
  name: string;
  gender: string;
  age: number;
  age_group: string;
  occupation: string;
  family_group: string;
  role: string;
}

/* ── A4 상수 ── */
const A4_W  = 794;
const PAD_H = 56;
const PAD_V = 48;

/* ── 가족 그룹 ── */
const FAMILY_META: Record<string, { label: string; color: string; border: string }> = {
  family_park: { label: '박준혁 가족', color: '#3b82f6', border: 'rgba(59,130,246,0.25)' },
  family_kim:  { label: '김태호 가족', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
  family_choi: { label: '최민성 가족', color: '#f59e0b', border: 'rgba(245,158,11,0.25)'  },
  supporting:  { label: '주변 인물',   color: '#8b5cf6', border: 'rgba(139,92,246,0.25)'  },
};
const GROUP_ORDER = ['family_park', 'family_kim', 'family_choi', 'supporting'];

/* ════════════════════════════════════════════════════════
   IndexedDB 헬퍼
   Phase 1: IndexedDB (현재 구현)
   Phase 2: Supabase Storage (추후 migration — idbPut/idbDelete를
             supabaseUpload/supabaseDelete 로 교체하고
             idbLoadAll 대신 supabase.storage.list() 호출)
   ════════════════════════════════════════════════════════ */
const DB_NAME = 'ld_characters';
const DB_VER  = 1;
const STORE   = 'portraits';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = e => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror   = e => reject((e.target as IDBOpenDBRequest).error);
  });
}

async function idbPut(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).put(blob, id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function idbDelete(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/** 전체 로드 → { id: objectURL } 맵 반환 */
async function idbLoadAll(): Promise<Record<string, string>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const allKeys = store.getAllKeys();
    allKeys.onsuccess = () => {
      const keys = allKeys.result as string[];
      if (keys.length === 0) { resolve({}); return; }
      const result: Record<string, string> = {};
      let pending = keys.length;
      keys.forEach(key => {
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result instanceof Blob) {
            result[key as string] = URL.createObjectURL(req.result);
          }
          if (--pending === 0) resolve(result);
        };
        req.onerror = () => { if (--pending === 0) resolve(result); };
      });
    };
    allKeys.onerror = () => reject(allKeys.error);
  });
}

/* ════════════════════════════════════════════════════════
   Page Component
   ════════════════════════════════════════════════════════ */
export default function CharactersPage() {
  /* objectURL 맵 — unmount 시 revoke 필요 */
  const [portraits, setPortraits] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [deleting,  setDeleting]  = useState<Record<string, boolean>>({});
  const [loaded,    setLoaded]    = useState(false);
  const fileRefs    = useRef<Record<string, HTMLInputElement | null>>({});
  const objectURLs  = useRef<string[]>([]);   // cleanup 목록

  /* ── 마운트 시 IDB 전체 로드 ── */
  useEffect(() => {
    idbLoadAll().then(map => {
      objectURLs.current.push(...Object.values(map));
      setPortraits(map);
      setLoaded(true);
    });
    return () => {
      objectURLs.current.forEach(u => URL.revokeObjectURL(u));
    };
  }, []);

  /* ── 업로드 ── */
  const handleUpload = useCallback(async (id: string, file: File) => {
    setUploading(p => ({ ...p, [id]: true }));
    try {
      await idbPut(id, file);
      const url = URL.createObjectURL(file);
      objectURLs.current.push(url);
      setPortraits(p => {
        if (p[id]) URL.revokeObjectURL(p[id]);   // 이전 URL 해제
        return { ...p, [id]: url };
      });
    } catch (err) {
      console.error('portrait save error', err);
    } finally {
      setUploading(p => ({ ...p, [id]: false }));
    }
  }, []);

  /* ── 삭제 ── */
  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(p => ({ ...p, [id]: true }));
    try {
      await idbDelete(id);
      setPortraits(p => {
        if (p[id]) URL.revokeObjectURL(p[id]);
        const next = { ...p };
        delete next[id];
        return next;
      });
    } catch {}
    finally { setDeleting(p => ({ ...p, [id]: false })); }
  }, []);

  const groups = GROUP_ORDER.map(key => ({
    key,
    meta: FAMILY_META[key],
    chars: (charIndex.characters as CharEntry[]).filter(c => c.family_group === key),
  }));

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #e8edf2 0%, #edeaf4 50%, #e8edf2 100%)' }}
    >
      {/* ── 페이지 타이틀 바 ── */}
      <div
        className="sticky z-40 border-b"
        style={{
          top: 52,
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(15,23,42,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <div className="flex items-center gap-3 px-6" style={{ minHeight: 44 }}>
          <span style={{ background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, letterSpacing: '0.06em' }}>03</span>
          <span className="text-sm font-bold text-gray-700">캐릭터</span>
          <span className="text-xs text-gray-400">대표 이미지 · 인물 설명</span>
        </div>
      </div>

      <div className="py-10 px-4">
      {/* ── A4 용지 ── */}
      <div
        style={{
          width: A4_W,
          margin: '0 auto',
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 4,
          border: '1px solid rgba(15,23,42,0.06)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,1)',
          paddingTop: PAD_V,
          paddingBottom: PAD_V * 1.5,
          paddingLeft: PAD_H,
          paddingRight: PAD_H,
        }}
      >
        {/* ── 용지 헤더 ── */}
        <div style={{ borderBottom: '1px solid #ebebeb', paddingBottom: 20, marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a78bfa' }}>
                Character Profile
              </span>
              <span style={{ fontSize: 11, color: '#d1d5db' }}>대표 이미지 · 인물 설명</span>
            </div>
            <span style={{ fontSize: 11, color: '#d1d5db' }}>{charIndex.characters.length}명</span>
          </div>
        </div>

        {/* 로딩 중 */}
        {!loaded && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{
              width: 24, height: 24, border: '2px solid #e5e7eb',
              borderTopColor: '#a78bfa', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        )}

        {/* ── 그룹별 섹션 ── */}
        {loaded && groups.map(({ key, meta, chars }, gi) => (
          <section key={key} style={{ marginBottom: gi < groups.length - 1 ? 44 : 0 }}>

            {/* 섹션 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: meta.color }}>
                {meta.label}
              </span>
              <div style={{ flex: 1, height: 1, background: meta.border }} />
              <span style={{ fontSize: 10, color: '#d1d5db' }}>{chars.length}명</span>
            </div>

            {/* 4열 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {chars.map(char => {
                const imgSrc = portraits[char.id];
                const hasImg = !!imgSrc;
                const isUp   = uploading[char.id] ?? false;
                const isDel  = deleting[char.id]  ?? false;

                return (
                  <div
                    key={char.id}
                    style={{
                      borderRadius: 10, overflow: 'hidden',
                      display: 'flex', flexDirection: 'column',
                      background: '#fff',
                      border: `1px solid ${meta.border}`,
                      boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* 1:1 이미지 */}
                    <div
                      style={{ position: 'relative', paddingBottom: '100%', cursor: 'pointer' }}
                      className="group"
                      onClick={() => fileRefs.current[char.id]?.click()}
                    >
                      <div style={{ position: 'absolute', inset: 0 }}>

                        {/* 실제 이미지 (IDB objectURL) */}
                        {hasImg && (
                          <img
                            src={imgSrc}
                            alt={char.name}
                            style={{
                              position: 'absolute', inset: 0,
                              width: '100%', height: '100%',
                              objectFit: 'cover', objectPosition: 'top',
                            }}
                          />
                        )}

                        {/* 플레이스홀더 */}
                        {!hasImg && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: `linear-gradient(145deg, ${meta.color}10 0%, ${meta.color}22 100%)`,
                          }}>
                            <div style={{
                              width: 44, height: 44, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: `${meta.color}20`, color: meta.color,
                              fontSize: 18, fontWeight: 700,
                            }}>
                              {char.name[0]}
                            </div>
                            <span style={{ fontSize: 9, color: '#9ca3af' }}>{char.age_group}</span>
                          </div>
                        )}

                        {/* 호버 오버레이 */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            background: 'rgba(0,0,0,0.48)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}
                        >
                          {isUp || isDel ? (
                            <div style={{
                              width: 20, height: 20,
                              border: '2px solid white', borderTopColor: 'transparent',
                              borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                            }} />
                          ) : (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span style={{ color: 'white', fontSize: 9 }}>이미지 추가</span>
                              </div>
                              {hasImg && (
                                <button
                                  style={{
                                    marginTop: 2, padding: '2px 8px', borderRadius: 20,
                                    fontSize: 9, fontWeight: 600,
                                    color: 'rgba(255,255,255,0.85)',
                                    background: 'rgba(220,38,38,0.55)',
                                    border: 'none', cursor: 'pointer',
                                  }}
                                  onClick={e => handleDelete(char.id, e)}
                                >
                                  삭제
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <input
                        ref={el => { fileRefs.current[char.id] = el; }}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(char.id, f);
                          e.target.value = '';
                        }}
                      />
                    </div>

                    {/* 정보 */}
                    <div style={{ padding: '10px 10px 11px', display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#1f2937' }}>{char.name}</span>
                        <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0, marginLeft: 4 }}>{char.age}세</span>
                      </div>
                      <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {char.occupation}
                      </p>
                      <p style={{
                        fontSize: 10, color: meta.color, fontWeight: 500, margin: 0, lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      } as React.CSSProperties}>
                        {char.role}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* ── 용지 푸터 ── */}
        <div style={{
          marginTop: 40, paddingTop: 16,
          borderTop: '1px solid #ebebeb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 10, color: '#d1d5db' }}>LinkDrop Series — Character Profile</span>
          <span style={{ fontSize: 10, color: '#d1d5db' }}>{new Date().getFullYear()}</span>
        </div>
      </div>
      </div>
    </div>
  );
}
