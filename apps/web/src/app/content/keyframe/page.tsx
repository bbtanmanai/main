'use client';

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faImage, faArrowRight, faArrowLeft, faChevronRight,
  faCopy, faCheck, faFilm, faEdit, faSave, faTimes,
  faPalette, faCheckCircle, faCode, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import Aurora from '@/components/Aurora';
import styleConfig from '@/data/content_styleimage.json';
import keyframeStyleData from '@/data/keyframe_style.json';
import keyframeToolsData from '@/data/keyframe_tools.json';

// ── keyframe_tools.json 에서 로드 ────────────────────────────────────────────
type KeyframeTool = { id: string; name: string; nameKo: string; icon: string; logoUrl?: string; tier: string; url: string; desc: string; tips: string; };
const KEYFRAME_TOOLS = keyframeToolsData.tools as KeyframeTool[];
const TOOL_COLORS: Record<number, string> = {
  0: 'bg-emerald-800 hover:bg-emerald-700 border-emerald-500/40',
  1: 'bg-violet-800 hover:bg-violet-700 border-violet-500/40',
  2: 'bg-orange-800 hover:bg-orange-700 border-orange-500/40',
  3: 'bg-blue-800 hover:bg-blue-700 border-blue-500/40',
  4: 'bg-amber-800 hover:bg-amber-700 border-amber-500/40',
  5: 'bg-sky-800 hover:bg-sky-700 border-sky-500/40',
};

// ── keyframe_style.json 에서 로드 ─────────────────────────────────────────────
type ArtStyleDef = {
  id: string; label: string; desc: string; bgImage: string;
  customPrompt: string; colorPalette: string;
  qualityId: string; negativeIds: string[];
};
const ART_STYLES   = keyframeStyleData.artStyles as ArtStyleDef[];
const NICHE_COMPAT = keyframeStyleData.nicheCompat as {
  keywords: string[]; styles: string[]; genreEn: string;
}[];

const STYLE_MAP     = Object.fromEntries(ART_STYLES.map(a => [a.id, a]));
const QUALITY_MAP   = Object.fromEntries(styleConfig.quality.map(q => [q.id, q.val]));
const NEGATIVE_MAP  = Object.fromEntries(styleConfig.negative.map(n => [n.id, n.val]));

// ── 구조화 프롬프트 타입 ──────────────────────────────────────────────────────
interface StructuredPrompt {
  style: string;
  background_and_location: string;
  color_palette: string;
  quality_boosters: string;
  negative_prompt: string;
}

// ── IndexedDB 통합 저장소 (이미지 + 화풍/대본/번역 데이터) ──────────────────
const IDB_NAME    = 'ld_keyframe';
const IDB_IMAGES  = 'scene_images';
const IDB_STATE   = 'state';
const IDB_VERSION = 2;

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_IMAGES)) db.createObjectStore(IDB_IMAGES);
      if (!db.objectStoreNames.contains(IDB_STATE))  db.createObjectStore(IDB_STATE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

// 상태 저장/로드 (화풍, 대본, 번역, 프롬프트 등)
async function saveStateIDB(key: string, value: any) {
  const db = await openIDB();
  const tx = db.transaction(IDB_STATE, 'readwrite');
  tx.objectStore(IDB_STATE).put(value, key);
}

async function loadStateIDB(key: string): Promise<any> {
  const db = await openIDB();
  return new Promise(res => {
    const tx = db.transaction(IDB_STATE, 'readonly');
    const req = tx.objectStore(IDB_STATE).get(key);
    req.onsuccess = () => res(req.result ?? null);
    req.onerror = () => res(null);
  });
}

// 이미지 저장/로드
function getSessionId(): string {
  // sessionId는 localStorage에 저장 (탭 닫아도 유지)
  let id = localStorage.getItem('ld_img_session');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('ld_img_session', id); }
  return id;
}

async function saveImageIDB(sessionId: string, idx: number, blob: Blob) {
  const db = await openIDB();
  const tx = db.transaction(IDB_IMAGES, 'readwrite');
  tx.objectStore(IDB_IMAGES).put(blob, `${sessionId}_${idx}`);
}

async function loadImagesIDB(sessionId: string, count: number): Promise<Record<number, string>> {
  const db     = await openIDB();
  const result: Record<number, string> = {};
  const tx     = db.transaction(IDB_IMAGES, 'readonly');
  const store  = tx.objectStore(IDB_IMAGES);
  await Promise.all(
    Array.from({ length: count }, (_, i) =>
      new Promise<void>(res => {
        const req = store.get(`${sessionId}_${i}`);
        req.onsuccess = () => {
          if (req.result instanceof Blob) result[i] = URL.createObjectURL(req.result);
          res();
        };
        req.onerror = () => res();
      })
    )
  );
  return result;
}

function getCompatibleStyles(niche: string): Set<string> | null {
  if (!niche) return null;
  const lower = niche.toLowerCase();
  for (const entry of NICHE_COMPAT) {
    if (entry.keywords.some(kw => lower.includes(kw.toLowerCase()))) return new Set(entry.styles);
  }
  return null;
}

function nicheToGenreEn(niche: string): string {
  if (!niche) return '';
  const lower = niche.toLowerCase();
  for (const entry of NICHE_COMPAT) {
    if (entry.keywords.some(kw => lower.includes(kw.toLowerCase()))) return entry.genreEn;
  }
  return '';
}

function getAutoOptions(styleId: string) {
  const def = STYLE_MAP[styleId];
  const qualityVal    = def ? (QUALITY_MAP[def.qualityId]  || '') : '';
  const negativeVal   = def ? def.negativeIds.map(id => NEGATIVE_MAP[id] || '').filter(Boolean).join(', ') : '';
  const qualityLabel  = def ? (styleConfig.quality.find(q => q.id === def.qualityId)?.label  || '') : '';
  const negativeLabel = def ? def.negativeIds.map(id => styleConfig.negative.find(n => n.id === id)?.label || '').filter(Boolean).join(' · ') : '';
  return { qualityVal, negativeVal, qualityLabel, negativeLabel };
}

const API = 'http://localhost:8000/api/v1';

// ── 백엔드 번역 API로 씬 텍스트 → 영문 비주얼 키워드 + accent 변환 ──────────
async function translateScenesToVisual(
  scenes: string[], genreEn: string, artStyleId: string = ''
): Promise<{ visual_prompts: string[]; accents: object[][] }> {
  const apiKey = localStorage.getItem('ld_google_api_key') ?? '';
  const res = await fetch(`${API}/translate/scenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenes, genre_en: genreEn, art_style: artStyleId, api_key: apiKey }),
  });
  if (!res.ok) throw new Error('번역 API 오류');
  const data = await res.json();
  return {
    visual_prompts: data.visual_prompts as string[],
    accents: (data.accents ?? []) as object[][],
  };
}

// ── 구조화 프롬프트 생성 ──────────────────────────────────────────────────────
function buildStructuredPrompt(
  sceneEn: string,
  idx: number,
  art: ArtStyleDef | null,
  quality: string,
  negative: string,
): StructuredPrompt {
  const def       = art ? STYLE_MAP[art.id] : null;
  const styleBase = def?.customPrompt || 'dramatic cinematic environment, ultra-detailed, 4K';
  return {
    style:                   styleBase,
    background_and_location: sceneEn || `scene ${idx + 1}`,
    color_palette:           def?.colorPalette || '',
    quality_boosters:        quality,
    negative_prompt:         negative,
  };
}

// ── 자연어 프롬프트 조합 ──────────────────────────────────────────────────────
function toFlatPrompt(sp: StructuredPrompt): string {
  const parts = [
    sp.background_and_location,  // 1. 씬 비주얼 키워드 (가장 중요)
    sp.style,                     // 2. 화풍 키워드
    sp.color_palette,             // 3. 색감
    sp.quality_boosters,          // 4. 퀄리티 부스터
  ].filter(Boolean);
  const positive = parts.join(', ');
  return sp.negative_prompt ? `${positive} --no ${sp.negative_prompt}` : positive;
}

// ── 화풍 카드 ─────────────────────────────────────────────────────────────────
function ArtStyleCard({ a, selected, disabled, onSelect }: {
  a: ArtStyleDef; selected: boolean; disabled: boolean; onSelect: () => void;
}) {
  return (
    <button
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      title={disabled ? '현재 대본 장르와 맞지 않는 화풍입니다' : a.desc}
      className={`group relative h-36 rounded-2xl overflow-hidden border transition-all duration-300 text-left ${
        disabled
          ? 'opacity-25 cursor-not-allowed border-white/5 grayscale'
          : selected
            ? 'border-fuchsia-400/60 scale-[1.02] shadow-[0_16px_32px_-8px_rgba(217,70,239,0.4)] ring-2 ring-fuchsia-500/20'
            : 'border-white/10 hover:border-white/20 hover:scale-[1.01]'
      }`}
    >
      {a.bgImage ? (
        <>
          <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${a.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className={`absolute inset-0 transition-all duration-500 ${selected ? 'bg-violet-950/30' : 'bg-black/50 group-hover:bg-black/30'}`} />
        </>
      ) : (
        <div className={`absolute inset-0 ${selected ? 'bg-gradient-to-br from-fuchsia-950 via-indigo-950 to-slate-900' : 'bg-slate-900'}`} />
      )}
      {selected && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 z-20" />}
      <div className="relative z-10 h-full flex flex-col justify-end p-3">
        {selected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-[10px] shadow-lg border border-white/20">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
        )}
        <p className={`text-xs ${a.bgImage ? 'text-white drop-shadow-lg' : selected ? 'text-fuchsia-200' : 'text-slate-200'}`}>{a.label}</p>
      </div>
    </button>
  );
}

// ── 씬 카드 ───────────────────────────────────────────────────────────────────
function SceneCard({ idx, scene, selected, imageUrl, onSelect, onImageAdd }: {
  idx: number; scene: string; selected: boolean; imageUrl?: string;
  onSelect: () => void; onImageAdd: (file: File) => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const preview = scene.replace(/\[씬\s*\d+\]/gi, '').trim().slice(0, 60);
  return (
    <div className={`w-full rounded-2xl border transition-all ${
      selected
        ? 'bg-indigo-950/60 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
        : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
    }`}>
      <div className="flex gap-3 p-3">

        {/* 1:1 이미지 영역 */}
        <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden relative group/img">
          {imageUrl ? (
            <>
              <img src={imageUrl} alt={`씬 ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                  className="text-[10px] text-white font-black bg-white/20 px-2 py-1 rounded-lg"
                >교체</button>
              </div>
            </>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
              className="w-full h-full flex flex-col items-center justify-center gap-0.5 bg-slate-800/60 border border-dashed border-slate-600 rounded-xl hover:border-indigo-500/60 hover:bg-indigo-950/40 transition-all"
            >
              <span className="text-slate-500 text-base leading-none">＋</span>
              <span className="text-[9px] text-slate-500 font-black leading-tight">이미지<br/>추가</span>
            </button>
          )}
        </div>

        {/* 씬 텍스트 */}
        <button onClick={onSelect} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${selected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>{idx + 1}</span>
            {selected
              ? <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">선택됨</span>
              : <span className="text-[10px] text-slate-500">씬 {idx + 1}</span>
            }
            {imageUrl && (
              <span className="ml-auto text-[9px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">이미지 ✓</span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{preview}…</p>
        </button>
      </div>

      <input
        ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onImageAdd(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function KeyframePage() {
  const [scenes, setScenes]       = React.useState<string[]>([]);
  const [analysis, setAnalysis]   = React.useState<any>(null);
  const [idea, setIdea]           = React.useState('');
  const [selectedIdx, setSelectedIdx]           = React.useState(0);
  const [artStyle, setArtStyle]                 = React.useState<ArtStyleDef | null>(null);
  const [artStyleOpen, setArtStyleOpen]         = React.useState(false);
  const [prompts, setPrompts]                   = React.useState<StructuredPrompt[]>([]);
  const [nlEdits, setNlEdits]                   = React.useState<Record<number, string>>({});
  const [translatedScenes, setTranslatedScenes] = React.useState<string[]>([]);
  const [isTranslating, setIsTranslating]       = React.useState(false);
  const [sceneImages, setSceneImages]           = React.useState<Record<number, string>>({});
  const [editingIdx, setEditingIdx]             = React.useState<number | null>(null);
  const [editingPrompt, setEditingPrompt]       = React.useState('');
  const [copied, setCopied]                     = React.useState<{ idx: number; type: 'nl' | 'json' } | null>(null);
  const [toolCopied, setToolCopied]             = React.useState<string | null>(null);
  const [toolOpening, setToolOpening]           = React.useState<string | null>(null);
  const [webviewTool, setWebviewTool]           = React.useState<KeyframeTool | null>(null);
  const [webviewWidth, setWebviewWidth]         = React.useState<number | null>(null);
  const webviewDragging                         = React.useRef(false);
  const autoTranslated                          = React.useRef(false);
  const [isMobile, setIsMobile]                 = React.useState(false);

  React.useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // 씬 삽입 (afterIdx 다음에 빈 씬 추가)
  const addEmptyScene = (afterIdx: number) => {
    const insertAt = afterIdx + 1;

    setScenes(prev => {
      const next = [...prev];
      next.splice(insertAt, 0, '');
      // keyframe_data의 scenes도 IDB에 즉시 반영 (새로고침 후에도 유지)
      loadStateIDB('keyframe_data').then(saved => {
        if (saved) saveStateIDB('keyframe_data', { ...saved, scenes: next });
      });
      return next;
    });
    setPrompts(prev => {
      const next = [...prev];
      next.splice(insertAt, 0, buildStructuredPrompt('', insertAt, null, '', ''));
      return next;
    });
    setTranslatedScenes(prev => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      next.splice(insertAt, 0, '');
      return next;
    });
    // 삽입 위치 이후 이미지 인덱스를 +1씩 밀기
    setSceneImages(prev => {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const idx = Number(k);
        next[idx < insertAt ? idx : idx + 1] = v;
      }
      return next;
    });
    // nlEdits 인덱스도 +1씩 밀기
    setNlEdits(prev => {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const idx = Number(k);
        next[idx < insertAt ? idx : idx + 1] = v;
      }
      return next;
    });
    setSelectedIdx(insertAt);
  };

  // 프롬프트 변경 시 IndexedDB에 저장
  React.useEffect(() => {
    if (scenes.length === 0) return;
    const allPrompts = scenes.map((_, i) => {
      const sp = prompts[i];
      return nlEdits[i] !== undefined ? nlEdits[i] : (sp ? toFlatPrompt(sp) : '');
    });
    saveStateIDB('prompts', allPrompts);
    // 링크브라우저용 sessionStorage도 유지 (폴백)
    sessionStorage.setItem('ld_keyframe_prompts', JSON.stringify(allPrompts));
  }, [scenes, prompts, nlEdits]);

  // 링크브라우저에서 postMessage로 이미지 수신 (팝업 폴백용)
  React.useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== 'ld_image') return;
      const { sceneIdx, dataUrl } = e.data;
      setSceneImages(prev => ({ ...prev, [sceneIdx]: dataUrl }));
      fetch(dataUrl).then(r => r.blob()).then(blob => saveImageIDB(getSessionId(), sceneIdx, blob));
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // 링크브라우저 이미지 수신 — 윈도우 포커스 시 확인 (폴링 없음)
  // 링크브라우저 이미지 수신 — 포커스 시 + 초기 로드 시 확인
  const loadBrowserImages = React.useCallback(async () => {
    if (scenes.length === 0) return;
    try {
      const res = await fetch(`${API}/browser/submit-images`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.count > 0) {
        const t = Date.now();
        const newImages: Record<number, string> = {};
        for (let i = 0; i < data.count; i++) {
          newImages[i] = `${API}/browser/images/${i}?t=${t}`;
        }
        setSceneImages(prev => ({ ...prev, ...newImages }));
      }
    } catch (_) {}
  }, [scenes]);

  // 윈도우 포커스 시 자동 확인 (링크브라우저 닫힌 후)
  React.useEffect(() => {
    const onFocus = () => loadBrowserImages();
    window.addEventListener('focus', onFocus);
    // 초기 로드 시에도 1회 확인 (이전에 링크브라우저에서 업로드한 이미지 복원)
    loadBrowserImages();
    return () => window.removeEventListener('focus', onFocus);
  }, [loadBrowserImages]);

  React.useEffect(() => {
    (async () => {
      // 1. IndexedDB에서 저장된 상태 복원 시도
      const savedData = await loadStateIDB('keyframe_data');
      const savedArtId = await loadStateIDB('art_style_id');
      const savedNlEdits = await loadStateIDB('nl_edits');

      // 2. sessionStorage 폴백 (script 페이지에서 넘어온 경우)
      let data = savedData;
      if (!data) {
        try {
          const raw = sessionStorage.getItem('ld_keyframe_data');
          if (raw) data = JSON.parse(raw);
        } catch (_) {}
      }

      if (!data || !data.scenes?.length) return;

      const sceneList: string[] = data.scenes;
      setScenes(sceneList);
      setAnalysis(data.analysis || null);
      setIdea(data.idea || '');
      setPrompts(sceneList.map((_, i) => buildStructuredPrompt('', i, null, '', '')));

      // IndexedDB에 데이터 영구 저장 (sessionStorage → IDB 이관)
      await saveStateIDB('keyframe_data', data);

      // 화풍 복원: 저장된 화풍 → niche 자동 선택 → ghibli-real 폴백
      let selectedArt: ArtStyleDef | null = null;
      if (savedArtId) {
        selectedArt = ART_STYLES.find(a => a.id === savedArtId) || null;
      }
      if (!selectedArt) {
        const niche = data.analysis?.niche || '';
        const compatEntry = NICHE_COMPAT.find(e =>
          e.keywords.some(kw => niche.toLowerCase().includes(kw.toLowerCase()))
        );
        if (compatEntry && compatEntry.styles.length > 0) {
          selectedArt = ART_STYLES.find(a => a.id === compatEntry.styles[0]) || null;
        }
      }
      if (!selectedArt) selectedArt = ART_STYLES.find(a => a.id === 'ghibli-real') || null;
      if (selectedArt) setArtStyle(selectedArt);

      // 사용자 프롬프트 수정 복원
      if (savedNlEdits && Object.keys(savedNlEdits).length > 0) {
        setNlEdits(savedNlEdits);
      }

      // 세션 이미지 복원
      const sid = getSessionId();
      const imgs = await loadImagesIDB(sid, sceneList.length);
      if (Object.keys(imgs).length > 0) setSceneImages(imgs);
    })();
  }, []);

  // 자동 선택 화풍 → 초기 번역+프롬프트 빌드 (IndexedDB 캐시 우선, API 1회만)
  React.useEffect(() => {
    if (autoTranslated.current || scenes.length === 0 || !artStyle || translatedScenes.length > 0) return;
    autoTranslated.current = true;

    (async () => {
      // IndexedDB 캐시 확인
      const cached = await loadStateIDB('translated_scenes');
      const cachedStyleId = await loadStateIDB('translated_style_id');
      if (cached && Array.isArray(cached) && cached.length === scenes.length && cachedStyleId === artStyle.id) {
        setTranslatedScenes(cached);
        rebuildPrompts(cached, artStyle);
        return;
      }

      // 캐시 없거나 화풍 변경 → API 호출 (1회)
      setIsTranslating(true);
      try {
        const { visual_prompts: en, accents } = await translateScenesToVisual(scenes, nicheToGenreEn(analysis?.niche || ''), artStyle?.id || '');
        setTranslatedScenes(en);
        rebuildPrompts(en, artStyle);
        await saveStateIDB('translated_scenes', en);
        await saveStateIDB('translated_style_id', artStyle.id);
        await saveStateIDB('scene_accents', accents);
      } catch (_) {
        const fb = scenes.map((__, i) => `scene ${i + 1}`);
        setTranslatedScenes(fb);
        rebuildPrompts(fb, artStyle);
        await saveStateIDB('translated_scenes', fb);
        await saveStateIDB('translated_style_id', artStyle.id);
      } finally {
        setIsTranslating(false);
      }
    })()
      .finally(() => setIsTranslating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, artStyle]);

  const rebuildPrompts = (enScenes: string[], art: ArtStyleDef | null) => {
    const { qualityVal, negativeVal } = art ? getAutoOptions(art.id) : { qualityVal: '', negativeVal: '' };
    setPrompts(enScenes.map((en, i) => buildStructuredPrompt(en, i, art, qualityVal, negativeVal)));
    setNlEdits({});
  };

  const handleSelectArt = async (a: ArtStyleDef) => {
    const next = artStyle?.id === a.id ? null : a;
    setArtStyle(next);
    setArtStyleOpen(false);
    saveStateIDB('art_style_id', next?.id || null);
    setEditingIdx(null);
    // 화풍 변경 시 번역 캐시 무효화 (화풍별 키워드가 다름)
    saveStateIDB('translated_scenes', null);
    saveStateIDB('translated_style_id', null);
    setTranslatedScenes([]);

    let enScenes = translatedScenes;
    if (enScenes.length === 0) {
      setIsTranslating(true);
      try {
        const { visual_prompts, accents } = await translateScenesToVisual(scenes, nicheToGenreEn(analysis?.niche || ''), next?.id || '');
        enScenes = visual_prompts;
        setTranslatedScenes(enScenes);
        await saveStateIDB('scene_accents', accents);
      } catch (_) {
        enScenes = scenes.map((_, i) => `scene ${i + 1}`);
        setTranslatedScenes(enScenes);
      } finally {
        setIsTranslating(false);
      }
    }

    rebuildPrompts(enScenes, next);
  };

  const compatibleStyles = React.useMemo(() => getCompatibleStyles(analysis?.niche || ''), [analysis]);
  const autoOpts         = artStyle ? getAutoOptions(artStyle.id) : null;
  const selectedPrompt   = prompts[selectedIdx];
  const selectedNL       = nlEdits[selectedIdx] ?? (selectedPrompt ? toFlatPrompt(selectedPrompt) : '');

  const handleCopy = (idx: number, type: 'nl' | 'json') => {
    const sp = prompts[idx];
    if (!sp) return;
    const text = type === 'json'
      ? JSON.stringify(sp, null, 2)
      : (nlEdits[idx] ?? toFlatPrompt(sp));
    navigator.clipboard.writeText(text);
    setCopied({ idx, type });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleWebviewResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    webviewDragging.current = true;
    const startX = e.clientX;
    const startW = webviewWidth ?? window.innerWidth * 0.66;
    const onMove = (ev: MouseEvent) => {
      if (!webviewDragging.current) return;
      const next = Math.min(Math.max(startW + (startX - ev.clientX), window.innerWidth * 0.3), window.innerWidth * 0.92);
      setWebviewWidth(next);
    };
    const onUp = () => {
      webviewDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const updated = { ...nlEdits, [editingIdx]: editingPrompt };
    setNlEdits(updated);
    saveStateIDB('nl_edits', updated);
    setEditingIdx(null);
  };

  if (scenes.length === 0) {
    return (
      <div className="relative min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center">
        <Aurora colorStops={['#1e1b4b', '#312e81', '#1e1b4b']} amplitude={30} blend={0.4} />
        <div className="relative z-10 text-center p-12 max-w-lg">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-3xl mx-auto mb-6">🎬</div>
          <h2 className="text-2xl font-black mb-3">대본이 없습니다</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            먼저 <strong className="text-white">벤치마킹 & 대본</strong> 페이지에서<br />채널 분석 후 대본을 생성해주세요.
          </p>
          <Link href="/content/script" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:brightness-110 transition-all">
            <FontAwesomeIcon icon={faArrowLeft} /> 대본 만들러 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] text-white">
      <Aurora colorStops={['#1e1b4b', '#312e81', '#1e1b4b']} amplitude={30} blend={0.4} />

      {/* ── 모바일 차단 안내 (120UI 표준) ── */}
      {isMobile && (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-6 px-8 text-center">
          <span className="text-6xl">💻</span>
          <div className="space-y-2">
            <p className="text-xl font-black text-white">PC 환경에서 이용해 주세요</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              키프레임 이미지 제작은 화면이 넓은<br />PC에서 더 편리합니다.
            </p>
          </div>
          <Link
            href="/content/script"
            className="mt-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-sm font-black text-slate-300 hover:text-white transition-all"
          >
            ← 대본으로 돌아가기
          </Link>
        </div>
      )}

      {!isMobile && <main className="relative z-10 max-w-[1400px] mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/content/script" className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-black uppercase tracking-widest mb-1">
                <span>대본</span>
                <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                <span className="text-indigo-400">키프레임</span>
                <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                <span>영상 제작</span>
              </div>
              <h1 className="text-2xl font-black">키프레임 이미지 제작</h1>
            </div>
          </div>

          {/* 영상 제작 팁 배너 */}
          <div className="hidden lg:flex justify-center mb-4">
            <Link
              href="/content/keyframe/tips"
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/8 hover:from-amber-500/20 hover:border-amber-400/50 transition-all group w-[420px]"
            >
              <span className="text-lg shrink-0">💡</span>
              <span className="text-sm font-black text-amber-300">영상 수동 제작 팁</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-amber-600 text-xs ml-auto shrink-0 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          <div className="flex justify-end">
            <span className="text-xs text-slate-500 font-black">씬 <span className="text-white">{scenes.length}</span>개</span>
          </div>
        </div>

        {/* ── 화풍 선택 (아코디언) ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl mb-6 overflow-hidden">
          {/* 헤더 */}
          <button
            onClick={() => setArtStyleOpen(prev => !prev)}
            className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-all"
          >
            <FontAwesomeIcon icon={faPalette} className="text-fuchsia-400 shrink-0" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">화풍 · Art Style</h2>

            {/* 선택된 화풍 요약 (접혀있을 때만 표시) */}
            {!artStyleOpen && artStyle && (
              <div className="flex items-center gap-2 ml-1">
                {artStyle.bgImage && (
                  <div className="w-9 h-5 rounded overflow-hidden shrink-0" style={{ backgroundImage: `url(${artStyle.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
                <span className="text-xs font-black text-fuchsia-300 bg-fuchsia-500/15 border border-fuchsia-500/30 px-2.5 py-0.5 rounded-full">
                  {artStyle.label}
                </span>
              </div>
            )}
            {!artStyleOpen && !artStyle && (
              <span className="text-[11px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full font-black ml-1">미선택</span>
            )}

            <div className="ml-auto flex items-center gap-3">
              {isTranslating && (
                <svg className="w-3 h-3 animate-spin text-indigo-300 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeLinecap="round" className="opacity-30"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              )}
              <FontAwesomeIcon
                icon={faChevronRight}
                className={`text-slate-500 text-xs transition-transform duration-300 ${artStyleOpen ? 'rotate-90' : ''}`}
              />
            </div>
          </button>

          {/* 펼쳐진 내용 */}
          {artStyleOpen && (
            <div className="px-6 pb-6 border-t border-white/5">
              {autoOpts && (
                <div className="flex flex-wrap items-center gap-2 mt-4 mb-4 pl-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">자동 적용:</span>
                  <span className="text-[10px] font-black text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full">
                    ★ {autoOpts.qualityLabel}
                  </span>
                  {autoOpts.negativeLabel.split(' · ').map(l => (
                    <span key={l} className="text-[10px] font-black text-red-300 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                      ✕ {l}
                    </span>
                  ))}
                </div>
              )}

              {isTranslating && (
                <div className="flex items-center gap-2 mb-3 px-1 text-[11px] text-indigo-300 font-black">
                  <svg className="w-3 h-3 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeLinecap="round" className="opacity-30"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  씬 텍스트를 영문 비주얼 키워드로 변환 중...
                </div>
              )}

              {compatibleStyles && !isTranslating && (
                <p className="text-[11px] text-slate-500 mb-3 pl-1">
                  <span className="text-indigo-400 font-black">분석된 장르</span>
                  {' '}기준으로 적합한 화풍만 활성화되었습니다. 흐린 항목은 해당 장르와 맞지 않습니다.
                </p>
              )}

              {!autoOpts && !isTranslating && <div className="mt-4" />}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {ART_STYLES.map(a => (
                  <ArtStyleCard
                    key={a.id}
                    a={a}
                    selected={artStyle?.id === a.id}
                    disabled={compatibleStyles !== null && !compatibleStyles.has(a.id)}
                    onSelect={() => handleSelectArt(a)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 120UI: 씬 목록 + 프롬프트 ── */}
        <div className="flex gap-0 items-start">

          {/* 씬 목록 (좌측) */}
          <div className="w-72 shrink-0 sticky top-4 self-start mr-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.7)] bg-[#0d0d18]">
              <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500" />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 rounded-full bg-indigo-500" />
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">씬 목록</p>
                  <span className="ml-auto text-[10px] font-black text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">{scenes.length}개</span>
                </div>
                <div className="space-y-0">
                  {scenes.map((scene, i) => (
                    <React.Fragment key={i}>
                      <SceneCard
                        idx={i} scene={scene}
                        selected={selectedIdx === i}
                        imageUrl={sceneImages[i]}
                        onSelect={() => setSelectedIdx(i)}
                        onImageAdd={file => {
                          const url = URL.createObjectURL(file);
                          setSceneImages(prev => ({ ...prev, [i]: url }));
                          saveImageIDB(getSessionId(), i, file);
                        }}
                      />
                      {/* 씬 사이 + 버튼 */}
                      <div className="flex items-center justify-center h-5 group">
                        <button
                          onClick={() => addEmptyScene(i)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 text-indigo-300 text-[10px] font-black transition-all"
                          title="빈 씬 추가"
                        >
                          + 씬 추가
                        </button>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 프롬프트 패널 (우측) */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* 영상 제목 */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3">
              <span className="text-lg shrink-0">🎬</span>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">영상 제목</p>
                <p className="text-sm font-black text-white leading-snug truncate">{idea || '—'}</p>
              </div>
            </div>

            {/* 씬 원문 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-black text-white shrink-0">{selectedIdx + 1}</span>
                <p className="text-sm font-black text-slate-300">씬 {selectedIdx + 1} 원문</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {(scenes[selectedIdx] || '').replace(/\[씬\s*\d+\]/gi, '').trim()}
              </p>
            </div>

            {/* 자연어 프롬프트 */}
            <div className="bg-gradient-to-br from-indigo-950/60 to-fuchsia-950/40 border border-indigo-500/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faImage} className="text-fuchsia-400 text-sm" />
                  <p className="text-sm font-black text-white">자연어 프롬프트</p>
                  {!artStyle && (
                    <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full font-black">화풍 미선택</span>
                  )}
                  {nlEdits[selectedIdx] !== undefined && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black">수정됨</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingIdx === selectedIdx ? (
                    <>
                      <button onClick={saveEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black hover:bg-emerald-500/30 transition-all">
                        <FontAwesomeIcon icon={faSave} />저장
                      </button>
                      <button onClick={() => setEditingIdx(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-black hover:text-white transition-all">
                        <FontAwesomeIcon icon={faTimes} />취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditingIdx(selectedIdx); setEditingPrompt(selectedNL); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-black hover:text-white hover:border-white/20 transition-all"
                      >
                        <FontAwesomeIcon icon={faEdit} />수정
                      </button>
                      <button
                        onClick={() => handleCopy(selectedIdx, 'nl')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300 text-xs font-black hover:bg-fuchsia-500/30 transition-all"
                      >
                        <FontAwesomeIcon icon={copied?.idx === selectedIdx && copied.type === 'nl' ? faCheck : faCopy} />
                        {copied?.idx === selectedIdx && copied.type === 'nl' ? '복사됨!' : '복사'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingIdx === selectedIdx ? (
                <textarea
                  value={editingPrompt}
                  onChange={e => setEditingPrompt(e.target.value)}
                  className="w-full bg-black/30 border border-white/20 rounded-xl p-4 text-sm text-white leading-relaxed font-mono resize-none focus:outline-none focus:border-fuchsia-500/60"
                  rows={5}
                  autoFocus
                />
              ) : (
                <p className="text-sm text-slate-200 leading-relaxed font-mono bg-black/20 rounded-xl p-4 whitespace-pre-wrap break-all">
                  {selectedNL || <span className="text-slate-600 italic">화풍을 선택하면 프롬프트가 생성됩니다</span>}
                </p>
              )}
            </div>

            {/* JSON 구조 프롬프트 */}
            <div className="bg-gradient-to-br from-slate-950/80 to-indigo-950/30 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCode} className="text-cyan-400 text-sm" />
                  <p className="text-sm font-black text-white">JSON 구조 프롬프트</p>
                  <span className="text-[10px] text-cyan-400/60 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full font-black">읽기 전용</span>
                </div>
                <button
                  onClick={() => handleCopy(selectedIdx, 'json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black hover:bg-cyan-500/30 transition-all"
                >
                  <FontAwesomeIcon icon={copied?.idx === selectedIdx && copied.type === 'json' ? faCheck : faCopy} />
                  {copied?.idx === selectedIdx && copied.type === 'json' ? '복사됨!' : 'JSON 복사'}
                </button>
              </div>

              {selectedPrompt ? (
                <div className="bg-black/30 rounded-xl p-4 overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <tbody>
                      {(Object.entries(selectedPrompt) as [keyof StructuredPrompt, string][]).map(([key, val]) => (
                        <tr key={key} className="border-b border-white/5 last:border-0">
                          <td className="py-2 pr-4 text-cyan-400 whitespace-nowrap align-top w-52">
                            &quot;{key}&quot;:
                          </td>
                          <td className="py-2 text-slate-300 break-all leading-relaxed">
                            {val
                              ? <span className="text-amber-200">&quot;{val}&quot;</span>
                              : <span className="text-slate-600">&quot;&quot;</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-600 italic text-sm p-4">화풍을 선택하면 JSON 구조가 생성됩니다</p>
              )}

              <p className="text-xs text-slate-600 mt-3">
                💡 ComfyUI, SD WebUI, 커스텀 파이프라인의 파라미터 주입에 활용하세요
              </p>
            </div>

          </div>


        </div>

        {/* 하단 CTA — 음성 더빙 페이지로 이동 */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <Link href="/content/script" className="px-6 py-3 rounded-xl font-black text-sm text-slate-400 bg-white/5 border border-white/10 hover:text-white hover:border-white/20 transition-all">
            ← 대본으로 돌아가기
          </Link>
          {Object.keys(sceneImages).length === scenes.length && scenes.length > 0 ? (
            <Link
              href="/content/voice-dubbing"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 shadow-2xl border bg-gradient-to-r from-fuchsia-600 to-indigo-600 border-fuchsia-500/40 shadow-fuchsia-500/20 hover:brightness-110"
            >
              <FontAwesomeIcon icon={faFilm} />
              음성 더빙 + 영상 제작
              <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </Link>
          ) : (
            <div className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm text-slate-500 border bg-slate-800/50 border-slate-700 cursor-not-allowed">
              <FontAwesomeIcon icon={faFilm} />
              음성 더빙 + 영상 제작
              <span className="text-[10px] text-slate-600 ml-1">
                (이미지 {Object.keys(sceneImages).length}/{scenes.length})
              </span>
            </div>
          )}
        </div>

      </main>}

      {!isMobile && <p className="relative z-10 text-center mt-12 pb-8 text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]">
        키프레임 제작 · LinkDrop V2
      </p>}

      {/* ── 웹뷰 패널 ── */}
      {webviewTool && (
        <>
          {/* 배경 딤 */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
            onClick={() => setWebviewTool(null)}
          />

          {/* 패널 */}
          <div
            className="fixed top-0 right-0 h-full z-[201] flex flex-col bg-[#0a0a12] border-l border-white/10 shadow-[-24px_0_60px_rgba(0,0,0,0.7)]"
            style={{ width: webviewWidth ? `${webviewWidth}px` : '66vw' }}
          >
            {/* 리사이즈 핸들 */}
            <div
              onMouseDown={handleWebviewResizeStart}
              className="absolute left-0 top-0 w-2 h-full cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500/80 transition-colors z-10"
            />

            {/* 툴바 */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#0d0d18] shrink-0">
              {webviewTool.logoUrl
                ? <img src={webviewTool.logoUrl} alt={webviewTool.name} className="w-5 h-5 rounded object-contain shrink-0" />
                : <span className="text-base shrink-0">{webviewTool.icon}</span>
              }
              <span className="text-sm font-black text-white shrink-0">{webviewTool.name}</span>
              <span className="text-xs text-slate-600 truncate flex-1 hidden md:block">{webviewTool.url}</span>
              <button
                onClick={() => setWebviewTool(null)}
                className="w-8 h-8 rounded-full bg-white/5 text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center shrink-0"
              >✕</button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-8 px-8 py-12">

              {/* 로고 + 설명 */}
              <div className="flex flex-col items-center gap-4 text-center">
                {webviewTool.logoUrl
                  ? <img src={webviewTool.logoUrl} alt={webviewTool.name} className="w-16 h-16 rounded-2xl object-contain" />
                  : <span className="text-5xl">{webviewTool.icon}</span>
                }
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">{webviewTool.name}</h2>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-sm">{webviewTool.desc}</p>
                </div>
              </div>

              {/* 프롬프트 복사 확인 */}
              <div className="w-full max-w-md bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-5 py-3 flex items-center gap-3">
                <span className="text-indigo-400 text-lg shrink-0">✓</span>
                <p className="text-sm text-indigo-300 font-black">프롬프트가 클립보드에 복사되었습니다. 사이트에서 Ctrl+V 로 붙여넣기 하세요.</p>
              </div>

              {/* 사이트 열기 버튼 */}
              <button
                onClick={() => {
                  if (webviewTool.id === 'google-flow') {
                    // 화면 2/3 크기 팝업 — 링크드랍은 뒤에 유지 (새 탭 아님)
                    const pw = Math.round(window.screen.width  * 2 / 3);
                    const ph = Math.round(window.screen.height * 2 / 3);
                    const pl = Math.round((window.screen.width  - pw) / 2);
                    const pt = Math.round((window.screen.height - ph) / 2);
                    window.open(
                      webviewTool.url,
                      'google-flow-popup',
                      `width=${pw},height=${ph},left=${pl},top=${pt},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=yes`,
                    );
                  } else {
                    window.open(webviewTool.url, '_blank');
                  }
                }}
                className="flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-lg text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:brightness-110 active:scale-95 transition-all shadow-2xl shadow-indigo-500/30"
              >
                {webviewTool.nameKo} 열기
                <span className="text-xl">↗</span>
              </button>

            </div>
          </div>
        </>
      )}


      {/* ── 우측 고정 이미지 도구 책갈피 ── */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1.5">
        {KEYFRAME_TOOLS.map((tool, idx) => (
          <div key={tool.id} className="group relative flex items-center justify-end">

            {/* 툴팁 (마우스오버 시) */}
            <div className="absolute right-full mr-3 w-72 bg-[#0d1528] border border-white/15 rounded-2xl p-4
              opacity-0 invisible -translate-x-2
              group-hover:opacity-100 group-hover:visible group-hover:translate-x-0
              transition-all duration-200 shadow-2xl pointer-events-none">
              <p className="text-xs font-black text-white mb-2 flex items-center gap-2">
                {tool.logoUrl
                  ? <img src={tool.logoUrl} alt={tool.name} className="w-4 h-4 rounded object-contain" />
                  : <span>{tool.icon}</span>
                }
                {tool.name}
                <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-black ${tool.tier === 'free' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {tool.tier === 'free' ? '무료' : '유료'}
                </span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-line">{tool.tips}</p>
              <p className="text-[10px] text-indigo-400 font-black mt-2">클릭 시 프롬프트 복사 + 사이트 이동 →</p>
              {/* 우측 화살표 */}
              <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#0d1528] border-r border-t border-white/15 rotate-45" />
            </div>

            {/* 책갈피 탭 버튼 */}
            <button
              disabled={translatedScenes.length === 0}
              onClick={() => {
                if (translatedScenes.length === 0) return;
                if (selectedNL) {
                  navigator.clipboard.writeText(selectedNL);
                  setToolCopied(tool.id);
                  setTimeout(() => setToolCopied(null), 2000);
                }
                // 즉시 로딩 상태 표시 (클릭 피드백)
                setToolOpening(tool.id);
                // 링크브라우저(2분할 뷰) 실행
                // 현재 상태에서 프롬프트를 즉석 빌드 (번역 비동기 문제 방지)
                const opts = artStyle ? getAutoOptions(artStyle.id) : { qualityVal: '', negativeVal: '' };
                const allPrompts = scenes.map((_, i) => {
                  if (nlEdits[i] !== undefined) return nlEdits[i];
                  const en = translatedScenes[i] || '';
                  if (en && artStyle) {
                    return toFlatPrompt(buildStructuredPrompt(en, i, artStyle, opts.qualityVal, opts.negativeVal));
                  }
                  const sp = prompts[i];
                  return sp ? toFlatPrompt(sp) : '';
                });
                (async () => {
                  const savedAccents = await loadStateIDB('scene_accents') ?? [];
                  fetch(`${API}/browser/open`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      tool_url: tool.url,
                      tool_id: tool.id,
                      scene: selectedIdx,
                      scenes,
                      prompts: allPrompts,
                      accents: savedAccents,
                    }),
                  }).then(() => {
                    // pywebview 실행 시작됨 — 창 뜰 때까지 잠시 후 상태 해제
                    setTimeout(() => setToolOpening(null), 4000);
                  }).catch(() => {
                    setToolOpening(null);
                    // API 실패 시 팝업 폴백 (동기 클릭이 아니므로 팝업 차단될 수 있음)
                    const sw = window.screen.width;
                    const sh = window.screen.height;
                    window.open(
                      `/image-browser?scene=${selectedIdx}&tool=${tool.id}`,
                      'linkbrowser',
                      `width=400,height=${sh},left=0,top=0,resizable=yes,scrollbars=yes`,
                    );
                    window.open(
                      tool.url,
                      'linkbrowser-tool',
                      `width=${sw - 400},height=${sh},left=400,top=0,resizable=yes,scrollbars=yes`,
                    );
                  });
                })();
              }}
              style={{
                transition: `all 0.4s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.12}s, opacity 0.3s ease ${idx * 0.12}s`,
                transform: translatedScenes.length > 0 ? 'translateX(0)' : 'translateX(100%)',
                opacity: translatedScenes.length > 0 ? 1 : 0,
                pointerEvents: translatedScenes.length > 0 ? 'auto' : 'none',
              }}
              className={`relative flex flex-col items-center gap-2 px-3 py-4 rounded-l-2xl border-y border-l
                shadow-[-6px_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[-8px_6px_28px_rgba(0,0,0,0.7)]
                ${TOOL_COLORS[idx % 6]}
                ${toolOpening === tool.id ? 'animate-pulse scale-95 brightness-125' : toolCopied === tool.id ? 'scale-95 brightness-125' : 'hover:scale-105'}`}
            >
              {toolOpening === tool.id
                ? <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin text-white" />
                : tool.logoUrl
                  ? <img src={tool.logoUrl} alt={tool.name} className="w-6 h-6 rounded-md object-contain select-none" onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                  : <span className="text-xl leading-none select-none">{tool.icon}</span>
              }
              <span
                className="text-xs font-black text-white leading-none select-none"
                style={{ writingMode: 'vertical-rl', letterSpacing: '0.1em' }}
              >
                {toolOpening === tool.id ? '열리는중' : tool.nameKo}
              </span>
            </button>

          </div>
        ))}
      </div>

    </div>
  );
}
