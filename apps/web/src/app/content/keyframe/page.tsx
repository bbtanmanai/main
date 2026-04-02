'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faImage, faArrowRight, faArrowLeft, faChevronRight,
  faCopy, faCheck, faFilm, faEdit, faSave, faTimes,
  faPalette, faCheckCircle, faCode, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import Aurora from '@/components/Aurora';
import { supabase } from '@/lib/supabase';
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
  character: string;
  background_and_location: string;
  style: string;
  color_palette: string;
  quality_boosters: string;
  negative_prompt: string;
}

// ── 캐릭터 (Supabase) ─────────────────────────────────────────────────────────
interface CharAsset { id: string; name: string; imageDataUrl: string; promptEn: string; faceGridUrl?: string; bodyGridUrl?: string; registeredAt: string; registeredBy?: string; }

async function loadCharAssets(): Promise<CharAsset[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, image_data_url, prompt_compact, face_grid_url, body_grid_url, registered_at, registered_by')
    .order('registered_by', { ascending: false })
    .order('registered_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row: any) => ({
    id:           row.id,
    name:         row.name,
    imageDataUrl: row.image_data_url,
    promptEn:     row.prompt_compact ?? '',
    faceGridUrl:  row.face_grid_url  ?? undefined,
    bodyGridUrl:  row.body_grid_url  ?? undefined,
    registeredAt: row.registered_at,
    registeredBy: row.registered_by,
  }));
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
  return new Promise<void>((res, rej) => {
    const tx  = db.transaction(IDB_STATE, 'readwrite');
    const req = tx.objectStore(IDB_STATE).put(value, key);
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
    req.onerror   = () => rej(req.error);
  });
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
  return new Promise<void>((res, rej) => {
    const tx  = db.transaction(IDB_IMAGES, 'readwrite');
    const req = tx.objectStore(IDB_IMAGES).put(blob, `${sessionId}_${idx}`);
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
    req.onerror   = () => rej(req.error);
  });
}

/** 익스텐션 썸네일 동기화 — IDB 저장과 동시에 서버에도 업로드 (fire-and-forget) */
function syncImageToServer(idx: number, blob: Blob) {
  const form = new FormData();
  form.append('scene_idx', String(idx));
  form.append('file', blob, `scene_${idx}.png`);
  fetch(`${API}/browser/upload-image`, { method: 'POST', body: form }).catch(() => {});
}


async function saveMp4IDB(sessionId: string, idx: number, blob: Blob) {
  const db = await openIDB();
  return new Promise<void>((res, rej) => {
    const tx  = db.transaction(IDB_IMAGES, 'readwrite');
    const req = tx.objectStore(IDB_IMAGES).put(blob, `${sessionId}_mp4_${idx}`);
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
    req.onerror   = () => rej(req.error);
  });
}

async function loadAllMp4sIDB(sessionId: string, count: number): Promise<Record<number, string>> {
  const db     = await openIDB();
  const result: Record<number, string> = {};
  const tx     = db.transaction(IDB_IMAGES, 'readonly');
  const store  = tx.objectStore(IDB_IMAGES);
  await Promise.all(
    Array.from({ length: count }, (_, i) =>
      new Promise<void>(res => {
        const req = store.get(`${sessionId}_mp4_${i}`);
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

const API = process.env.NEXT_PUBLIC_API_URL;

// ── 백엔드 번역 API로 씬 텍스트 → 영문 비주얼 키워드 + accent 변환 ──────────
async function translateScenesToVisual(
  scenes: string[], genreEn: string, artStyleId: string = ''
): Promise<{ visual_prompts: string[]; scene_visuals: string[]; accents: object[][]; scene_roles: string[] }> {
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
    scene_visuals: (data.scene_visuals ?? []) as string[],
    accents: (data.accents ?? []) as object[][],
    scene_roles: (data.scene_roles ?? []) as string[],
  };
}

// ── 구조화 프롬프트 생성 ──────────────────────────────────────────────────────
// 씬 역할별 시각 모디파이어 (구도+카메라 앵글만, 색온도 없음 → 화풍 일관성 유지)
const SCENE_ROLE_MODIFIERS: Record<string, string> = {
  hook:       'extreme close-up, dynamic diagonal composition, foreground subject dominant',
  intro:      'medium eye-level shot, centered subject, breathing room on both sides',
  explain:    'wide establishing shot, rule-of-thirds layout, infographic negative space',
  evidence:   'clean flat lay, symmetrical subject placement, sharp foreground detail',
  climax:     'low angle hero shot, expansive background, peak tension framing',
  cta:        'bold subject isolation, strong center anchor, minimal background clutter',
  conclusion: 'wide balanced frame, subject at rest, harmonious symmetry',
};

// 씬 인덱스 + 총 씬 수 → 역할 태그 자동 추론
function getSceneRole(idx: number, total: number): string {
  if (idx === 0) return 'hook';
  if (idx === 1) return 'intro';
  if (total <= 2) return 'conclusion';
  if (idx === total - 1) return 'conclusion';
  if (idx === total - 2) return 'cta';
  if (idx === total - 3) return 'climax';
  // 중간 씬: explain / evidence 교대
  return (idx % 2 === 0) ? 'explain' : 'evidence';
}

// scene_role → 얼굴 표정 힌트 (face_grid 등록 캐릭터 전용)
const SCENE_ROLE_FACE: Record<string, string> = {
  hook:       'shocked surprised wide-eyed expression',
  intro:      'warm confident friendly smile',
  explain:    'focused attentive thoughtful look',
  evidence:   'serious composed professional expression',
  climax:     'intense determined fierce expression',
  cta:        'enthusiastic excited energetic expression',
  conclusion: 'calm satisfied gentle smile',
};

// scene_role → 바디 앵글 힌트 (body_grid 등록 캐릭터 전용)
const SCENE_ROLE_BODY: Record<string, string> = {
  hook:       'front facing',
  intro:      'slight left angle',
  explain:    'front facing',
  evidence:   'front facing',
  climax:     'three-quarter dynamic angle',
  cta:        'front facing toward camera',
  conclusion: 'front facing relaxed posture',
};

function buildStructuredPrompt(
  sceneEn: string,
  idx: number,
  art: ArtStyleDef | null,
  quality: string,
  negative: string,
  characterPrompt = '',
  total = 0,
  roleOverride = '',
  hasFaceGrid = false,
  hasBodyGrid = false,
): StructuredPrompt {
  const def          = art ? STYLE_MAP[art.id] : null;
  const styleBase    = def?.customPrompt || 'dramatic cinematic environment, ultra-detailed, 4K';
  const role         = (roleOverride && SCENE_ROLE_MODIFIERS[roleOverride]) ? roleOverride : getSceneRole(idx, total > 0 ? total : idx + 1);
  const roleModifier = SCENE_ROLE_MODIFIERS[role];

  // 그리드 등록 캐릭터: 표정 + 앵글 힌트 자동 주입
  const faceHint = (hasFaceGrid && characterPrompt) ? SCENE_ROLE_FACE[role] ?? '' : '';
  const bodyHint = (hasBodyGrid && characterPrompt) ? SCENE_ROLE_BODY[role] ?? '' : '';
  const charFull = [characterPrompt, faceHint, bodyHint].filter(Boolean).join(', ');

  return {
    character:               charFull,
    background_and_location: (() => {
      const cleaned = sceneEn ? sceneEn.replace(/\[씬\s*\d+\]/gi, '').replace(/^scene\s+\d+[,.]?\s*/i, '').replace(/^[,\s]+/, '').trim() : '';
      return cleaned ? `${cleaned}, ${roleModifier}` : roleModifier;
    })(),
    style:                   styleBase,
    color_palette:           def?.colorPalette || '',
    quality_boosters:        quality,
    negative_prompt:         negative,
  };
}

// ── 자연어 프롬프트 조합 ──────────────────────────────────────────────────────
function toFlatPrompt(sp: StructuredPrompt): string {
  const parts = [
    sp.character,                 // 1. 캐릭터 외형 (압축 버전) — 최우선
    sp.background_and_location,  // 2. 씬 비주얼 키워드
    sp.style,                     // 3. 화풍 키워드
    sp.color_palette,             // 4. 색감
    sp.quality_boosters,          // 5. 퀄리티 부스터
  ].map(s => s.trim()).filter(Boolean);
  const positive = parts.join(', ').replace(/^[,\s]+/, '').trim();
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
function SceneCard({ idx, scene, selected, imageUrl, mp4Url, onSelect, onImageAdd, onMp4Add, mp4PageHref }: {
  idx: number; scene: string; selected: boolean; imageUrl?: string; mp4Url?: string;
  onSelect: () => void; onImageAdd: (file: File) => void; onMp4Add?: (file: File) => void;
  mp4PageHref?: string;
}) {
  const fileRef  = React.useRef<HTMLInputElement>(null);
  const mp4Ref   = React.useRef<HTMLInputElement>(null);
  const preview  = scene.replace(/\[씬\s*\d+\]/gi, '').trim().slice(0, 60);
  const hasMp4   = !!mp4Url;
  const showImg  = !hasMp4 && !!imageUrl;
  return (
    <div className={`w-full rounded-2xl border transition-all ${
      selected
        ? 'bg-indigo-950/60 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
        : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
    }`}>
      <div className="flex gap-3 p-3">

        {/* 1:1 미디어 영역 */}
        <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden relative group/img">
          {hasMp4 ? (
            <>
              <video src={mp4Url} className="w-full h-full object-cover" muted playsInline />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={e => { e.stopPropagation(); mp4Ref.current?.click(); }}
                  className="text-[10px] text-white font-black bg-white/20 px-2 py-1 rounded-lg"
                >교체</button>
              </div>
            </>
          ) : showImg ? (
            <>
              <img src={imageUrl} alt={`씬 ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <button
                  onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                  className="text-[9px] text-white font-black bg-white/20 px-2 py-0.5 rounded-lg hover:bg-white/30"
                >이미지</button>
                <button
                  onClick={e => { e.stopPropagation(); mp4Ref.current?.click(); }}
                  className="text-[9px] text-sky-300 font-black bg-sky-500/25 px-2 py-0.5 rounded-lg hover:bg-sky-500/40"
                >MP4</button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 bg-slate-800/60 border border-dashed border-slate-600 rounded-xl">
              <button
                onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                className="w-full flex flex-col items-center justify-center gap-0.5 hover:opacity-70 transition-opacity"
              >
                <span className="text-slate-500 text-base leading-none">＋</span>
                <span className="text-[9px] text-slate-500 font-black leading-tight">이미지<br/>추가</span>
              </button>
              <button
                onClick={e => { e.stopPropagation(); mp4Ref.current?.click(); }}
                className="text-[8px] text-sky-400 font-black hover:text-sky-300 transition-colors leading-tight"
              >MP4</button>
            </div>
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
            {hasMp4 && (
              <span className="ml-auto text-[9px] font-black text-sky-400 bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 rounded-full">MP4 ✓</span>
            )}
            {!hasMp4 && imageUrl && (
              <span className="ml-auto text-[9px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">이미지 ✓</span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{preview}…</p>
          {mp4PageHref && (
            <Link
              href={mp4PageHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg text-[10px] font-black text-sky-300 bg-sky-500/15 border border-sky-500/30 hover:bg-sky-500/25 transition-all"
            >
              🎬 MP4 생성
              {mp4Url && <span className="text-[9px] text-emerald-400 ml-0.5">✓</span>}
            </Link>
          )}
        </button>
      </div>

      <input
        ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onImageAdd(f); e.target.value = ''; }}
      />
      <input
        ref={mp4Ref} type="file" accept="video/mp4,video/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f && onMp4Add) onMp4Add(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function KeyframePageInner() {
  const searchParams = useSearchParams();
  const sampleLimit = searchParams.get('sample') ? parseInt(searchParams.get('sample')!, 10) : null;

  const [scenes, setScenes]       = React.useState<string[]>([]);
  const [analysis, setAnalysis]   = React.useState<any>(null);
  const [idea, setIdea]           = React.useState('');
  const [charAssets, setCharAssets]         = React.useState<CharAsset[]>([]);
  const [charAssetsReady, setCharAssetsReady] = React.useState(false);
  const [selectedCharId, setSelectedCharId] = React.useState<string>('');
  const [selectedIdx, setSelectedIdx]           = React.useState(0);
  const [artStyle, setArtStyle]                 = React.useState<ArtStyleDef | null>(null);
  const [artStyleOpen, setArtStyleOpen]         = React.useState(false);
  const [prompts, setPrompts]                   = React.useState<StructuredPrompt[]>([]);
  const [nlEdits, setNlEdits]                   = React.useState<Record<number, string>>({});
  const [translatedScenes, setTranslatedScenes] = React.useState<string[]>([]);
  const [sceneVisuals, setSceneVisuals]         = React.useState<string[]>([]);
  const [sceneRoles, setSceneRoles]             = React.useState<string[]>([]);
  const [isTranslating, setIsTranslating]       = React.useState(false);
  const [translateProgress, setTranslateProgress] = React.useState(0);
  const translateTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [sceneImages, setSceneImages]           = React.useState<Record<number, string>>({});
  const [sceneMp4s, setSceneMp4s]               = React.useState<Record<number, string>>({});
  // 서버 이미지 슬롯 매핑: serverIdx → sceneIdx (씬 삽입 시 같이 시프트)
  const [serverImageSlots, setServerImageSlots] = React.useState<Record<number, number>>({});
  const [editingIdx, setEditingIdx]             = React.useState<number | null>(null);
  const [editingPrompt, setEditingPrompt]       = React.useState('');
  const [copied, setCopied]                     = React.useState<{ idx: number; type: 'nl' | 'json' } | null>(null);
  const [toolCopied, setToolCopied]             = React.useState<string | null>(null);
  const autoTranslated                          = React.useRef(false);
  const [isMobile, setIsMobile]                 = React.useState(false);

  React.useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // objectURL 메모리 누수 방지 — 언마운트 시 전체 revoke
  React.useEffect(() => {
    return () => {
      Object.values(sceneImages).forEach(url => { if (url) URL.revokeObjectURL(url); });
      Object.values(sceneMp4s).forEach(url => { if (url) URL.revokeObjectURL(url); });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 캐릭터 목록 로드
  React.useEffect(() => {
    loadCharAssets().then(list => { setCharAssets(list); setCharAssetsReady(true); });
  }, []);

  // 캐릭터 변경 또는 로드 완료 시 프롬프트 재빌드 + sessionStorage 갱신
  React.useEffect(() => {
    if (translatedScenes.length === 0 || !charAssetsReady) return;
    const charPrompt = charAssets.find(c => c.id === selectedCharId)?.promptEn ?? '';
    rebuildPrompts(translatedScenes, artStyle, charPrompt, sceneRoles, sceneVisuals);
    // 링크브라우저 폴백용 sessionStorage 즉시 갱신
    const opts = artStyle ? getAutoOptions(artStyle.id) : { qualityVal: '', negativeVal: '' };
    const selChar = charAssets.find(c => c.id === selectedCharId);
    const hasFace = !!selChar?.faceGridUrl;
    const hasBody = !!selChar?.bodyGridUrl;
    const allPrompts = translatedScenes.map((en, i) =>
      toFlatPrompt(buildStructuredPrompt(sceneVisuals[i] || en, i, artStyle, opts.qualityVal, opts.negativeVal, charPrompt, translatedScenes.length, sceneRoles[i] ?? '', hasFace, hasBody))
    );
    sessionStorage.setItem('ld_keyframe_prompts', JSON.stringify(allPrompts));
    saveStateIDB('prompts', allPrompts);
  }, [selectedCharId, charAssetsReady]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const _selChar = charAssets.find(c => c.id === selectedCharId);
      next.splice(insertAt, 0, buildStructuredPrompt('', insertAt, null, '', '', _selChar?.promptEn ?? '', next.length, '', !!_selChar?.faceGridUrl, !!_selChar?.bodyGridUrl));
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
    // 서버 이미지 슬롯 매핑도 +1씩 밀기 (새 씬은 매핑 없음 → loadBrowserImages 미할당)
    setServerImageSlots(prev => {
      const next: Record<number, number> = {};
      for (const [k, v] of Object.entries(prev)) {
        const sceneIdx = Number(v);
        next[Number(k)] = sceneIdx < insertAt ? sceneIdx : sceneIdx + 1;
      }
      return next;
    });
    setSelectedIdx(insertAt);
  };

  // 씬 삭제 (최소 1개 유지)
  const deleteScene = (delIdx: number) => {
    if (scenes.length <= 1) return;
    const newScenes = scenes.filter((_, i) => i !== delIdx);
    setScenes(newScenes);
    setPrompts(prev => prev.filter((_, i) => i !== delIdx));
    setTranslatedScenes(prev => prev.length ? prev.filter((_, i) => i !== delIdx) : prev);
    // 삭제 위치 이후 이미지 인덱스 -1씩 당기기
    setSceneImages(prev => {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const idx = Number(k);
        if (idx === delIdx) continue;
        next[idx < delIdx ? idx : idx - 1] = v;
      }
      return next;
    });
    setNlEdits(prev => {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const idx = Number(k);
        if (idx === delIdx) continue;
        next[idx < delIdx ? idx : idx - 1] = v;
      }
      return next;
    });
    setServerImageSlots(prev => {
      const next: Record<number, number> = {};
      for (const [k, v] of Object.entries(prev)) {
        const sceneIdx = Number(v);
        if (sceneIdx === delIdx) continue;
        next[Number(k)] = sceneIdx < delIdx ? sceneIdx : sceneIdx - 1;
      }
      return next;
    });
    setSelectedIdx(prev => Math.max(0, Math.min(prev, scenes.length - 2)));
    // localStorage 씬 목록 갱신
    try {
      const raw = localStorage.getItem('ld_keyframe_data');
      if (raw) {
        const data = JSON.parse(raw);
        data.scenes = data.scenes.filter((_: any, i: number) => i !== delIdx);
        localStorage.setItem('ld_keyframe_data', JSON.stringify(data));
      }
    } catch (_) {}
    // IDB keyframe_data 씬 목록 갱신 (addEmptyScene과 동일한 방식)
    loadStateIDB('keyframe_data').then(saved => {
      if (saved) saveStateIDB('keyframe_data', { ...saved, scenes: newScenes });
    });
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

  // sceneImages 변경 시 익스텐션 썸네일 서버 동기화 (objectURL → blob → upload)
  React.useEffect(() => {
    Object.entries(sceneImages).forEach(([idxStr, url]) => {
      if (!url) return;
      const idx = Number(idxStr);
      fetch(url)
        .then(r => r.blob())
        .then(blob => syncImageToServer(idx, blob))
        .catch(() => {});
    });
  }, [sceneImages]);

  // 씬 변경(삭제/추가) 시 익스텐션용 세션 파일 자동 갱신
  const sessionSyncRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (scenes.length === 0) return;
    // 프롬프트가 아직 빌드 안 된 상태면 저장 스킵
    if (prompts.length === 0) return;
    if (sessionSyncRef.current) clearTimeout(sessionSyncRef.current);
    sessionSyncRef.current = setTimeout(async () => {
      const allPrompts = scenes.map((_, i) => {
        const sp = prompts[i];
        return nlEdits[i] !== undefined ? nlEdits[i] : (sp ? toFlatPrompt(sp) : '');
      });
      const savedAccents = await loadStateIDB('scene_accents') ?? [];
      fetch(`${API}/browser/session-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes, prompts: allPrompts, accents: savedAccents, tool_id: '', scene: 0, script_id: localStorage.getItem('ld_script_id') ?? '' }),
      }).catch(() => {});
    }, 800); // 연속 변경 디바운스
  }, [scenes, prompts, nlEdits]);

  // 링크브라우저에서 postMessage로 이미지 수신 (팝업 폴백용)
  React.useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== 'ld_image') return;
      const { sceneIdx, dataUrl } = e.data;
      setSceneImages(prev => ({ ...prev, [sceneIdx]: dataUrl }));
      fetch(dataUrl).then(r => r.blob()).then(blob => { saveImageIDB(getSessionId(), sceneIdx, blob); syncImageToServer(sceneIdx, blob); });
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
        const sessionId = getSessionId();
        const newImages: Record<number, string> = {};
        await Promise.all(
          Array.from({ length: data.count }, async (_, i) => {
            const sceneIdx = serverImageSlots[i] ?? i;
            try {
              const imgRes = await fetch(`${API}/browser/images/${i}?t=${Date.now()}`);
              if (!imgRes.ok) return;
              const blob = await imgRes.blob();
              await saveImageIDB(sessionId, sceneIdx, blob);
              newImages[sceneIdx] = URL.createObjectURL(blob);
            } catch (_) {}
          })
        );
        if (Object.keys(newImages).length > 0) {
          setSceneImages(prev => ({ ...prev, ...newImages }));
        }
      }
    } catch (_) {}
  }, [scenes, serverImageSlots]);

  // 윈도우 포커스 시 확인 (링크브라우저에서 돌아올 때)
  React.useEffect(() => {
    const onFocus = () => loadBrowserImages();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadBrowserImages]);

  // 초기 1회 서버 이미지 로드 — scenes가 처음 채워진 직후 실행
  const _initialServerLoadDone = React.useRef(false);
  React.useEffect(() => {
    if (scenes.length > 0 && !_initialServerLoadDone.current) {
      _initialServerLoadDone.current = true;
      loadBrowserImages();
    }
  }, [scenes.length, loadBrowserImages]);

  React.useEffect(() => {
    (async () => {
      // 1. localStorage에서 대본 데이터 로드 (script 페이지가 저장, 텍스트 전용)
      let data: any = null;
      try {
        const raw = localStorage.getItem('ld_keyframe_data');
        if (raw) data = JSON.parse(raw);
      } catch (_) {}

      if (!data || !data.scenes?.length) return;

      // 2. script_id 비교 → 새 대본 여부 판단
      const scriptId = localStorage.getItem('ld_script_id') || '';
      const lastScriptId = localStorage.getItem('ld_img_script_id') || '';
      const isNewScript = scriptId !== lastScriptId;

      if (isNewScript) {
        // 새 대본: 이미지 세션 교체 + IDB 파생 캐시 초기화 + 서버 이미지 초기화
        localStorage.setItem('ld_img_session', crypto.randomUUID());
        localStorage.setItem('ld_img_script_id', scriptId);
        await saveStateIDB('translated_scenes', null);
        await saveStateIDB('translated_style_id', null);
        await saveStateIDB('nl_edits', null);
        await saveStateIDB('scene_accents', null);
        fetch(`${API}/browser/clear-images`, { method: 'DELETE' }).catch(() => {});
      }

      // 3. IDB에서 파생 상태 복원 (번역, 화풍, 프롬프트 수정)
      const savedArtId = await loadStateIDB('art_style_id');
      const savedNlEdits = isNewScript ? null : await loadStateIDB('nl_edits');

      const sceneList: string[] = sampleLimit ? data.scenes.slice(0, sampleLimit) : data.scenes;
      setScenes(sceneList);
      // 서버 이미지 슬롯 초기화: serverIdx → sceneIdx (1:1 매핑)
      const initSlots: Record<number, number> = {};
      for (let i = 0; i < sceneList.length; i++) initSlots[i] = i;
      setServerImageSlots(initSlots);
      setAnalysis(data.analysis || null);
      setIdea(data.idea || '');
      setPrompts(sceneList.map((_, i) => buildStructuredPrompt('', i, null, '', '', '', sceneList.length)));

      // 4. 화풍 복원: 저장된 화풍 → niche 자동 선택 → ghibli-real 폴백
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

      // 5. 프롬프트 수정 복원
      if (savedNlEdits && Object.keys(savedNlEdits).length > 0) {
        setNlEdits(savedNlEdits);
      }

      // 6. IDB 이미지 복원 (현재 세션 기준 — 새 대본이면 새 세션이므로 자동 빈 상태)
      const sid = getSessionId();
      const imgs = await loadImagesIDB(sid, sceneList.length);
      if (Object.keys(imgs).length > 0) setSceneImages(imgs);

      // 7. IDB MP4 복원 (전체 씬)
      const mp4s = await loadAllMp4sIDB(sid, sceneList.length);
      if (Object.keys(mp4s).length > 0) setSceneMp4s(mp4s);
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
      const cachedRoles   = await loadStateIDB('scene_roles') ?? [];
      const cachedVisuals = await loadStateIDB('scene_visuals') ?? [];
      if (cached && Array.isArray(cached) && cached.length === scenes.length && cachedStyleId === artStyle.id) {
        setTranslatedScenes(cached);
        setSceneRoles(cachedRoles);
        setSceneVisuals(cachedVisuals);
        rebuildPrompts(cached, artStyle, charAssets.find(c => c.id === selectedCharId)?.promptEn ?? '', cachedRoles, cachedVisuals);
        return;
      }

      // 캐시 없거나 화풍 변경 → API 호출 (1회)
      startTranslating();
      try {
        const { visual_prompts: en, scene_visuals: visuals, accents, scene_roles: roles } = await translateScenesToVisual(scenes, nicheToGenreEn(analysis?.niche || ''), artStyle?.id || '');
        setTranslatedScenes(en);
        setSceneVisuals(visuals);
        setSceneRoles(roles);
        rebuildPrompts(en, artStyle, charAssets.find(c => c.id === selectedCharId)?.promptEn ?? '', roles, visuals);
        await saveStateIDB('translated_scenes', en);
        await saveStateIDB('translated_style_id', artStyle.id);
        await saveStateIDB('scene_accents', accents);
        await saveStateIDB('scene_roles', roles);
        await saveStateIDB('scene_visuals', visuals);
        // translate 결과 accent를 SESSION_FILE에 즉시 반영 — Remotion 페이지 이중 Gemini 호출 방지
        fetch(`${API}/browser/session-accents`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accents: accents ?? [] }),
        }).catch(() => {});
      } catch (_) {
        const fb = scenes.map((__, i) => `scene ${i + 1}`);
        setTranslatedScenes(fb);
        rebuildPrompts(fb, artStyle);
        await saveStateIDB('translated_scenes', fb);
        await saveStateIDB('translated_style_id', artStyle.id);
      } finally {
        stopTranslating();
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, artStyle]);

  const startTranslating = () => {
    setTranslateProgress(0);
    setIsTranslating(true);
    if (translateTimerRef.current) clearInterval(translateTimerRef.current);
    translateTimerRef.current = setInterval(() => {
      setTranslateProgress(p => p < 88 ? p + (Math.random() * 6 + 2) : p);
    }, 400);
  };

  const stopTranslating = () => {
    if (translateTimerRef.current) clearInterval(translateTimerRef.current);
    setTranslateProgress(100);
    setTimeout(() => { setIsTranslating(false); setTranslateProgress(0); }, 500);
  };

  const rebuildPrompts = (enScenes: string[], art: ArtStyleDef | null, charPrompt = '', roles: string[] = [], visuals: string[] = [], clearEdits: boolean = false) => {
    const { qualityVal, negativeVal } = art ? getAutoOptions(art.id) : { qualityVal: '', negativeVal: '' };
    const selChar = charAssets.find(c => c.id === selectedCharId);
    const hasFace = !!selChar?.faceGridUrl;
    const hasBody = !!selChar?.bodyGridUrl;
    setPrompts(enScenes.map((en, i) => buildStructuredPrompt(visuals[i] || en, i, art, qualityVal, negativeVal, charPrompt, enScenes.length, roles[i] ?? '', hasFace, hasBody)));
    if (clearEdits) setNlEdits({});
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
      startTranslating();
      try {
        const { visual_prompts, scene_visuals: visuals, accents, scene_roles: roles } = await translateScenesToVisual(scenes, nicheToGenreEn(analysis?.niche || ''), next?.id || '');
        enScenes = visual_prompts;
        setTranslatedScenes(enScenes);
        setSceneVisuals(visuals);
        setSceneRoles(roles);
        await saveStateIDB('scene_accents', accents);
        await saveStateIDB('scene_roles', roles);
        await saveStateIDB('scene_visuals', visuals);
        fetch(`${API}/browser/session-accents`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accents: accents ?? [] }),
        }).catch(() => {});
      } catch (_) {
        enScenes = scenes.map((_, i) => `scene ${i + 1}`);
        setTranslatedScenes(enScenes);
      } finally {
        stopTranslating();
      }
    }

    rebuildPrompts(enScenes, next, charAssets.find(c => c.id === selectedCharId)?.promptEn ?? '', sceneRoles, sceneVisuals, true);
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

  const saveEdit = async () => {
    if (editingIdx === null) return;
    const updated = { ...nlEdits, [editingIdx]: editingPrompt };
    setNlEdits(updated);
    setEditingIdx(null);
    try {
      await saveStateIDB('nl_edits', updated);
    } catch (e) {
      console.error('[saveEdit] IDB 저장 실패:', e);
    }
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

  // SVG 원형 프로그레시바 상수
  const RADIUS = 54;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDash = CIRCUMFERENCE - (translateProgress / 100) * CIRCUMFERENCE;

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] text-white">
      <Aurora colorStops={['#1e1b4b', '#312e81', '#1e1b4b']} amplitude={30} blend={0.4} />

      {/* ── 프롬프트 분석 중 모달 ── */}
      {isTranslating && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* 트랙 */}
                <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="8" />
                {/* 진행 */}
                <circle
                  cx="60" cy="60" r={RADIUS}
                  fill="none"
                  stroke="url(#pgGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDash}
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="pgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#e879f9" />
                  </linearGradient>
                </defs>
              </svg>
              {/* 중앙 퍼센트 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-white tabular-nums">
                  {Math.min(100, Math.round(translateProgress))}%
                </span>
              </div>
              {/* 외곽 글로우 */}
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 40px rgba(168,85,247,0.35)' }} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-white font-black text-sm">프롬프트 분석 중</p>
              <p className="text-slate-400 text-xs">씬 텍스트를 비주얼 키워드로 변환하고 있습니다</p>
            </div>
          </div>
        </div>
      )}

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
            <button
              onClick={() => window.open('/keyframe-extension-guide.html', '_blank')}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-violet-500/8 hover:from-indigo-500/20 hover:border-indigo-400/50 transition-all group w-[420px]"
            >
              <span className="text-lg shrink-0">🧩</span>
              <span className="text-sm font-black text-indigo-300">익스텐션 설치 방법</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-indigo-600 text-xs ml-auto shrink-0 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          <div className="flex justify-end">
            <span className="text-xs text-slate-500 font-black">씬 <span className="text-white">{scenes.length}</span>개</span>
          </div>
        </div>

        {/* ── 캐릭터 + 화풍 1줄 ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl mb-6 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-white/10">

            {/* 캐릭터 */}
            <div className="px-4 py-3 flex items-center gap-3">
              <span className="text-base shrink-0">🎭</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-400 mb-1">캐릭터</p>
                <select
                  value={selectedCharId}
                  onChange={e => setSelectedCharId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#a78bfa]/50 transition-all"
                >
                  <option value="">없음</option>
                  {charAssets.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.registeredBy === 'admin' ? '⭐ ' : ''}{c.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCharId && (() => {
                const selChar = charAssets.find(c => c.id === selectedCharId);
                return (
                  <>
                    <img
                      src={selChar?.imageDataUrl}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                  </>
                );
              })()}
              {charAssets.length === 0 && (
                <a href="/content/characterimage" target="_blank" className="text-[10px] text-[#a78bfa] hover:text-violet-300 font-bold whitespace-nowrap shrink-0">등록 →</a>
              )}
            </div>

            {/* 화풍 */}
            <button
              onClick={() => setArtStyleOpen(prev => !prev)}
              className="px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-all text-left"
            >
              <FontAwesomeIcon icon={faPalette} className="text-fuchsia-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-400 mb-1">화풍 · Art Style</p>
                {artStyle ? (
                  <div className="flex items-center gap-1.5">
                    {artStyle.bgImage && (
                      <div className="w-8 h-4 rounded overflow-hidden shrink-0" style={{ backgroundImage: `url(${artStyle.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    )}
                    <span className="text-xs font-black text-fuchsia-300 truncate">{artStyle.label}</span>
                  </div>
                ) : (
                  <span className="text-xs text-orange-400 font-black">미선택</span>
                )}
              </div>
              <FontAwesomeIcon
                icon={faChevronRight}
                className={`text-slate-500 text-xs transition-transform duration-300 shrink-0 ${artStyleOpen ? 'rotate-90' : ''}`}
              />
            </button>
          </div>

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
                      <div className="relative group/scene">
                        <SceneCard
                          idx={i} scene={scene}
                          selected={selectedIdx === i}
                          imageUrl={sceneImages[i]}
                          mp4Url={sceneMp4s[i]}
                          onSelect={() => setSelectedIdx(i)}
                          onImageAdd={file => {
                            const url = URL.createObjectURL(file);
                            setSceneImages(prev => ({ ...prev, [i]: url }));
                            saveImageIDB(getSessionId(), i, file);
                            syncImageToServer(i, file);
                          }}
                          onMp4Add={file => {
                            const url = URL.createObjectURL(file);
                            setSceneMp4s(prev => ({ ...prev, [i]: url }));
                            saveMp4IDB(getSessionId(), i, file);
                          }}
                          mp4PageHref="/content/mp4-prompt-generator"
                        />
                        {scenes.length > 1 && (
                          <button
                            onClick={() => deleteScene(i)}
                            className="absolute top-1 right-1 opacity-0 group-hover/scene:opacity-100 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 text-white text-[9px] font-black flex items-center justify-center transition-all z-10"
                            title="씬 삭제"
                          >✕</button>
                        )}
                      </div>
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
                <span className="ml-auto text-[11px] text-slate-500 font-bold">
                  {(scenes[selectedIdx] || '').replace(/\[씬\s*\d+\]/gi, '').trim().length}자
                </span>
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
                  {selectedCharId && charAssets.find(c => c.id === selectedCharId)?.faceGridUrl && (
                    <span className="text-[12px] font-black text-[#FF0000]">페이스 8종 그리드 이미지를 첨부 후 해당 프롬프트를 사용하세요</span>
                  )}
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
                  {selectedNL ? (() => {
                    const charPrompt = selectedCharId ? (charAssets.find(c => c.id === selectedCharId)?.promptEn ?? '') : '';
                    if (charPrompt && selectedNL.startsWith(charPrompt)) {
                      const rest = selectedNL.slice(charPrompt.length);
                      return <><span className="text-violet-300 bg-violet-500/10 rounded px-0.5">{charPrompt}</span>{rest}</>;
                    }
                    return selectedNL;
                  })() : <span className="text-slate-600 italic">화풍을 선택하면 프롬프트가 생성됩니다</span>}
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
        <div className="flex items-center justify-center gap-4 mt-12 flex-wrap">
          <Link href="/content/script" className="px-6 py-3 rounded-xl font-black text-sm text-slate-400 bg-white/5 border border-white/10 hover:text-white hover:border-white/20 transition-all">
            ← 대본으로 돌아가기
          </Link>
          {(() => {
            // 씬1은 MP4 또는 이미지 중 하나만 있어도 충족
            const filledCount = scenes.reduce((acc, _, i) => {
              if (i === 0) return acc + (sceneMp4s[0] || sceneImages[0] ? 1 : 0);
              return acc + (sceneImages[i] ? 1 : 0);
            }, 0);
            const allFilled = filledCount === scenes.length && scenes.length > 0;
            return allFilled ? (
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
                  (미디어 {filledCount}/{scenes.length})
                </span>
              </div>
            );
          })()}
        </div>

      </main>}

      {!isMobile && <p className="relative z-10 text-center mt-12 pb-8 text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]">
        키프레임 제작 · LinkDrop V2
      </p>}

      {/* ── 하단 고정 이미지 도구 책갈피 (가로형) ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex flex-row gap-1.5 pb-0">
        {KEYFRAME_TOOLS.map((tool, idx) => (
          <button
            key={tool.id}
            disabled={translatedScenes.length === 0 || !charAssetsReady}
            onClick={() => {
              if (translatedScenes.length === 0 || !charAssetsReady) return;
              if (selectedNL) {
                navigator.clipboard.writeText(selectedNL);
                setToolCopied(tool.id);
                setTimeout(() => setToolCopied(null), 2000);
              }
              const opts = artStyle ? getAutoOptions(artStyle.id) : { qualityVal: '', negativeVal: '' };
              const _sc = charAssets.find(c => c.id === selectedCharId);
              const allPrompts = scenes.map((_, i) => {
                if (nlEdits[i] !== undefined) return nlEdits[i];
                const en = translatedScenes[i] || '';
                if (en && artStyle) {
                  return toFlatPrompt(buildStructuredPrompt(en, i, artStyle, opts.qualityVal, opts.negativeVal, _sc?.promptEn ?? '', scenes.length, sceneRoles[i] ?? '', !!_sc?.faceGridUrl, !!_sc?.bodyGridUrl));
                }
                const sp = prompts[i];
                return sp ? toFlatPrompt(sp) : '';
              });
              (async () => {
                const savedAccents = await loadStateIDB('scene_accents') ?? [];
                fetch(`${API}/browser/session-save`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tool_id: tool.id,
                    scene: selectedIdx,
                    scenes,
                    prompts: allPrompts,
                    accents: savedAccents,
                  }),
                }).catch(() => {});
                window.open(tool.url, '_blank');
              })();
            }}
            style={{
              transition: `all 0.4s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.08}s, opacity 0.3s ease ${idx * 0.08}s`,
              transform: translatedScenes.length > 0 ? 'translateY(0)' : 'translateY(100%)',
              opacity: translatedScenes.length > 0 ? 1 : 0,
              pointerEvents: translatedScenes.length > 0 ? 'auto' : 'none',
            }}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-t-2xl border-x border-t
              shadow-[0_-4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_-6px_28px_rgba(0,0,0,0.6)]
              ${TOOL_COLORS[idx % 6]}
              ${toolCopied === tool.id ? 'scale-95 brightness-125' : 'hover:scale-105 hover:-translate-y-1'}`}
          >
            {tool.logoUrl
              ? <img src={tool.logoUrl} alt={tool.name} className="w-5 h-5 rounded-md object-contain select-none" onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
              : <span className="text-base leading-none select-none">{tool.icon}</span>
            }
            <span className="text-xs font-black text-white leading-none select-none tracking-wide">
              {tool.nameKo}
            </span>
          </button>
        ))}
      </div>

    </div>
  );
}

export default function KeyframePage() {
  return (
    <Suspense>
      <KeyframePageInner />
    </Suspense>
  );
}
