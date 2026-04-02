'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faImage, faArrowRight, faArrowLeft, faChevronRight,
  faCopy, faCheck, faFilm,
  faPalette, faCheckCircle, faCode, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import Aurora from '@/components/Aurora';
import { supabase } from '@/lib/supabase';
import styleConfig from '@/data/content_styleimage.json';
import keyframeStyleData from '@/data/keyframe_style.json';
import keyframeToolsData from '@/data/keyframe_tools.json';
import Mp4PromptPanel from '@/components/mp4-prompt/Mp4PromptPanel';

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

// ── 최종 프롬프트 타입 ───────────────────────────────────────────────────────
interface FinalPrompt {
  positive: string;
  negative: string;
  subject: string; // hint_en + scene_visual (씬 기본설명 — 강조 색상 표시용)
}

// ── 이미지 옵션 통합 타입 ──────────────────────────────────────────────────────
interface ImgOptions {
  composition: string; // 'auto' 또는 구체적 ID
  depth: string;       // 'auto' 또는 구체적 ID
  lighting: string;    // 구체적 ID (auto 없음)
  lens: string;        // 구체적 ID (auto 없음)
}
const DEFAULT_IMG_OPTIONS: ImgOptions = { composition: 'auto', depth: 'auto', lighting: 'golden-hour', lens: '35mm' };

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
const IDB_VERSION = 3;

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_IMAGES)) db.createObjectStore(IDB_IMAGES);
      if (!db.objectStoreNames.contains(IDB_STATE))  db.createObjectStore(IDB_STATE);
      // v3: 기존 prompts/nl_edits 캐시 초기화 (타입 변경으로 인한 호환성 파괴)
      if (e.oldVersion < 3 && db.objectStoreNames.contains(IDB_STATE)) {
        const tx = (e.target as IDBOpenDBRequest).transaction!;
        const store = tx.objectStore(IDB_STATE);
        store.delete('prompts');
        store.delete('nl_edits');
      }
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
): Promise<{ visual_prompts: string[]; scene_visuals: string[]; accents: object[][]; scene_roles: string[]; scene_hints_en: string[] }> {
  const apiKey = localStorage.getItem('ld_google_api_key') ?? '';
  const res = await fetch(`${API}/translate/scenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenes, genre_en: genreEn, art_style: artStyleId, api_key: apiKey }),
  });
  if (!res.ok) throw new Error('번역 API 오류');
  const data = await res.json();
  return {
    visual_prompts:  data.visual_prompts as string[],
    scene_visuals:   (data.scene_visuals   ?? []) as string[],
    accents:         (data.accents         ?? []) as object[][],
    scene_roles:     (data.scene_roles     ?? []) as string[],
    scene_hints_en:  (data.scene_hints_en  ?? []) as string[],
  };
}

// ── 프롬프트 빌드 함수 ──────────────────────────────────────────────────────

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

/** 씬 배열 → 간단한 해시 문자열 (캐시 키용) */
function scenesHash(scenes: string[]): string {
  const s = scenes.map(sc => sc.slice(0, 30)).join('|');
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
  return (h >>> 0).toString(36);
}

/** role + compositionOverride → 단일 카메라 디렉티브 */
function getCameraDirective(role: string, compositionOverride?: string): string {
  const ROLE_CAMERA: Record<string, string> = {
    hook:       'extreme close-up, dynamic diagonal composition, foreground subject dominant',
    intro:      'medium shot, centered subject, breathing room on both sides',
    explain:    'wide establishing shot, rule-of-thirds layout',
    evidence:   'clean flat lay, symmetrical subject placement, sharp foreground detail',
    climax:     'low angle hero shot, expansive background, peak tension framing',
    cta:        'bold subject isolation, strong center anchor, minimal background clutter',
    conclusion: 'wide balanced frame, subject at rest, harmonious symmetry',
  };
  if (compositionOverride && compositionOverride !== 'auto') {
    const found = IMG_COMPOSITION.find(o => o.id === compositionOverride);
    if (found) return found.prompt;
  }
  return ROLE_CAMERA[role] ?? ROLE_CAMERA['explain'];
}

/** buildStructuredPrompt + toFlatPrompt + buildImgEnhancedPrompt 통합 단일 함수 */
function buildFinalPrompt(
  sceneVisual: string,
  hintEn: string,
  sceneRole: string,
  art: ArtStyleDef | null,
  charPrompt: string,
  hasFaceGrid: boolean,
  hasBodyGrid: boolean,
  opts: ImgOptions = DEFAULT_IMG_OPTIONS,
): FinalPrompt {
  const role = (sceneRole && SCENE_ROLE_FACE[sceneRole]) ? sceneRole : 'explain';
  const def = art ? STYLE_MAP[art.id] : null;

  // 1. Subject: hint_en + scene_visual 결합
  const hint   = hintEn.trim();
  const visual = sceneVisual.replace(/\[씬\s*\d+\]/gi, '').replace(/^scene\s+\d+[,.]?\s*/i, '').trim();
  const subject = hint && visual ? `${hint}. ${visual}` : hint || visual;

  // 2. Character (있을 때만)
  const faceHint = (hasFaceGrid && charPrompt) ? SCENE_ROLE_FACE[role] ?? '' : '';
  const bodyHint = (hasBodyGrid && charPrompt) ? SCENE_ROLE_BODY[role] ?? '' : '';
  const charFull = [charPrompt, faceHint, bodyHint].filter(Boolean).join(', ');
  const charPart = charFull ? `${charFull} is the subject of this scene` : '';

  // 3. Camera (통합 단일 디렉티브)
  const camera = getCameraDirective(role, opts.composition);

  // 4. Lens
  const lensPart = IMG_LENS.find(o => o.id === opts.lens)?.prompt ?? '';

  // 5. Depth of field
  const roleDepth = (['hook', 'climax', 'cta'].includes(role)) ? 'shallow' : 'deep';
  const depthId   = (opts.depth && opts.depth !== 'auto') ? opts.depth : roleDepth;
  const depthPart = IMG_DEPTH.find(o => o.id === depthId)?.prompt ?? '';

  // 6. Lighting
  const lightingPart = IMG_LIGHTING.find(o => o.id === opts.lighting)?.prompt ?? '';

  // 7. Art Style + Color Palette
  const stylePart  = def?.customPrompt ?? 'dramatic cinematic environment, ultra-detailed, 4K';
  const colorPart  = def?.colorPalette ?? '';
  const styleLine  = colorPart ? `Art style: ${stylePart}. Color palette: ${colorPart}.` : `Art style: ${stylePart}.`;

  // 8. Quality
  const qualityPart = def?.qualityId ? (QUALITY_MAP[def.qualityId] ?? '') : '';

  // Positive 조립
  const positiveParts = [subject, charPart, camera, lensPart, depthPart, lightingPart, styleLine, qualityPart].filter(Boolean);
  const positive = positiveParts.join(', ');

  // Negative: Set 기반 중복 제거
  const negSet = new Set<string>();
  if (def?.negativeIds) {
    def.negativeIds.forEach(id => {
      const kw = NEGATIVE_MAP[id];
      if (kw) kw.split(',').map(s => s.trim()).filter(Boolean).forEach(k => negSet.add(k));
    });
  }
  const autoNeg = computeImgAutoNeg(opts.composition, opts.lighting, depthId, art?.id ?? '');
  autoNeg.forEach(id => {
    const kw = IMG_NEGATIVE.find(o => o.id === id)?.prompt ?? '';
    kw.split(',').map(s => s.trim()).filter(Boolean).forEach(k => negSet.add(k));
  });
  const negative = Array.from(negSet).join(', ');

  return { positive, negative, subject };
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
function SceneCard({ idx, scene, selected, imageUrl, mp4Url, onSelect, onImageAdd, onMp4Add, onImageDelete, onMp4Delete, mode = 'hybrid', confirmed = false, onCancelConfirm, onConfirm, onDelete }: {
  idx: number; scene: string; selected: boolean; imageUrl?: string; mp4Url?: string;
  onSelect: () => void; onImageAdd: (file: File) => void; onMp4Add?: (file: File) => void;
  onImageDelete?: () => void; onMp4Delete?: () => void;
  mode?: 'hybrid' | 'all-mp4'; confirmed?: boolean; onCancelConfirm?: () => void;
  onConfirm?: () => void; onDelete?: () => void;
}) {
  const mediaRef = React.useRef<HTMLInputElement>(null);
  const hasMp4   = !!mp4Url;
  const showImg  = mode === 'all-mp4' ? false : (!hasMp4 && !!imageUrl);
  const currentDelete = hasMp4 ? onMp4Delete : (showImg ? onImageDelete : undefined);

  const handleMediaFile = (file: File) => {
    if (file.type.startsWith('video/')) { if (onMp4Add) onMp4Add(file); }
    else onImageAdd(file);
  };

  return (
    <div className={`group/card w-full rounded-xl border transition-all ${
      selected
        ? 'bg-indigo-950/60 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
        : confirmed
          ? 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500/50'
          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
    }`}>

      {/* ── 메인 행 ── */}
      <div className="flex items-center gap-2 p-2">

        {/* 썸네일 (호버 → 교체/삭제 오버레이) */}
        <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden relative group/img">
          {hasMp4 ? (
            <video src={mp4Url} className="w-full h-full object-cover" muted playsInline />
          ) : showImg ? (
            <img src={imageUrl} alt={`씬 ${idx + 1}`} className="w-full h-full object-cover" />
          ) : (
            <button
              onClick={e => { e.stopPropagation(); mediaRef.current?.click(); }}
              className="w-full h-full flex flex-col items-center justify-center gap-0.5 bg-slate-800/60 border border-dashed border-slate-600 rounded-xl hover:border-slate-400 hover:bg-slate-700/60 transition-all"
            >
              <span className="text-slate-400 text-lg leading-none">＋</span>
              <span className="text-[9px] text-slate-400 font-black leading-tight text-center">미디어<br/>추가</span>
            </button>
          )}
          {(hasMp4 || showImg) && (
            <div className="absolute inset-0 bg-black/65 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <button onClick={e => { e.stopPropagation(); mediaRef.current?.click(); }}
                className="text-[9px] text-white font-black bg-white/20 px-2 py-0.5 rounded hover:bg-white/35">교체</button>
              {currentDelete && (
                <button onClick={e => { e.stopPropagation(); currentDelete(); }}
                  className="text-[9px] text-red-300 font-black bg-red-500/30 px-2 py-0.5 rounded hover:bg-red-500/50">삭제</button>
              )}
            </div>
          )}
        </div>

        {/* 씬 번호 + 상태 */}
        <button onClick={onSelect} className="flex-1 min-w-0 text-left flex items-center gap-1.5">
          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${selected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>{idx + 1}</span>
          <span className={`text-[10px] font-black truncate ${selected ? 'text-indigo-300' : confirmed ? 'text-emerald-300' : 'text-slate-400'}`}>
            {confirmed ? `씬${idx + 1} 확정 ✓` : selected ? '편집 중' : `씬 ${idx + 1}`}
          </span>
          {(hasMp4 || (mode === 'hybrid' && imageUrl)) && (
            <span className={`ml-auto shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
              hasMp4 ? 'text-sky-400 bg-sky-500/15 border border-sky-500/30' : 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
            }`}>{hasMp4 ? 'MP4' : 'IMG'}</span>
          )}
        </button>
      </div>

      {/* ── 하단 액션 바 (카드 호버 시 슬라이드 오픈) ── */}
      <div className="overflow-hidden max-h-0 group-hover/card:max-h-10 transition-all duration-200">
        <div className="flex gap-1 px-2 pb-2">
          {!confirmed ? (
            <button
              onClick={e => { e.stopPropagation(); onConfirm?.(); }}
              className="flex-1 py-1 rounded-lg text-[10px] font-black text-emerald-300 transition-all hover:brightness-125"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
            >✓ 확정</button>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onCancelConfirm?.(); }}
              className="flex-1 py-1 rounded-lg text-[10px] font-black text-slate-400 transition-all hover:brightness-125"
              style={{ background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.3)' }}
            >↩ 확정취소</button>
          )}
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="px-3 py-1 rounded-lg text-[10px] font-black text-red-400 transition-all hover:brightness-125"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
            >✕ 씬 삭제</button>
          )}
        </div>
      </div>

      <input ref={mediaRef} type="file" accept="image/*,video/mp4,video/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaFile(f); e.target.value = ''; }} />
    </div>
  );
}

// ── 화풍별 조명·렌즈 기본값 ───────────────────────────────────────────────────
function getDefaultLighting(artStyleId: string): string {
  const map: Record<string, string> = {
    'ghibli-real':       'soft-diffuse',   // customPrompt에 golden hour glow 포함 → 중복 방지
    'ghibli-night':      'moonlight',
    'reality':           'soft-diffuse',
    'anime-sf':          'neon',           // customPrompt neon-lit과 일치
    'pixar-3d':          'studio',
    'health-senior-1':   'soft-diffuse',
    'health-senior-2':   'soft-diffuse',
    'tech-trend-1':      'volumetric',     // 홀로그래픽 비주얼에 volumetric이 자연스러움
    'tech-trend-2':      'neon',           // violet energy burst → neon 계열
    'stock-news-1':      'dramatic-low',
    'stock-news-2':      'dramatic-low',
    'news-anchor':       'studio',
    'economy-global':    'studio',
    'wisdom-quotes-1':   'volumetric',
    'wisdom-quotes-2':   'volumetric',
    'lifestyle-1':       'golden-hour',
    'lifestyle-2':       'soft-diffuse',
    'econ-infographic':  'studio',
    'econ-documentary':  'soft-diffuse',
    'econ-abstract':     'volumetric',
    'econ-dark-drama':   'backlit',        // customPrompt에 chiaroscuro 포함 → 다른 조명 선택
    'econ-corporate':    'studio',
  };
  return map[artStyleId] ?? 'golden-hour';
}

function getDefaultLens(artStyleId: string): string {
  const map: Record<string, string> = {
    'ghibli-real':       '35mm',
    'ghibli-night':      '35mm',
    'reality':           '35mm',
    'anime-sf':          '24mm',
    'pixar-3d':          '50mm',
    'health-senior-1':   '85mm',
    'health-senior-2':   '85mm',
    'tech-trend-1':      '35mm',
    'tech-trend-2':      '35mm',
    'stock-news-1':      '50mm',
    'stock-news-2':      '50mm',
    'news-anchor':       '85mm',
    'economy-global':    '24mm',
    'wisdom-quotes-1':   '50mm',
    'wisdom-quotes-2':   '50mm',
    'lifestyle-1':       '35mm',
    'lifestyle-2':       '35mm',
    'econ-infographic':  '50mm',
    'econ-documentary':  '35mm',
    'econ-abstract':     '24mm',
    'econ-dark-drama':   '35mm',
    'econ-corporate':    '50mm',
  };
  return map[artStyleId] ?? '35mm';
}

// ── 이미지 생성 옵션 데이터 ──────────────────────────────────────────────────
interface ImgOption { id: string; label: string; prompt: string; desc: string; }

const IMG_COMPOSITION: ImgOption[] = [
  { id: 'close-up',     label: '클로즈업',   prompt: 'extreme close-up shot, filling the frame',                    desc: '피사체를 화면 가득 채워 감정·디테일을 강조' },
  { id: 'medium',       label: '미디엄샷',   prompt: 'medium shot, waist-up framing',                               desc: '허리 위를 담는 표준 샷. 인물과 배경을 균형 있게 표현' },
  { id: 'wide',         label: '와이드샷',   prompt: 'wide establishing shot, full environment visible',            desc: '넓은 환경을 한눈에 보여주는 배경 설정 샷' },
  { id: 'birds-eye',    label: '버즈아이뷰', prompt: "bird's eye view, directly overhead",                          desc: '정수리 위 정면에서 내려다보는 시점. 전체 구도 파악에 탁월' },
  { id: 'low-angle',    label: '로우앵글',   prompt: 'low angle shot, looking up at subject',                       desc: '피사체를 아래에서 올려다봐 웅장함·위압감 표현' },
  { id: 'dutch',        label: '더치앵글',   prompt: 'dutch angle, tilted horizon, dynamic diagonal',               desc: '수평선을 기울여 긴장감·불안정감을 연출' },
  { id: 'symmetry',     label: '대칭',       prompt: 'symmetrical centered composition, balanced framing',          desc: '좌우 대칭으로 안정적이고 격식 있는 화면 구성' },
  { id: 'rule-thirds',  label: '삼분할',     prompt: 'rule of thirds composition, subject off-center',             desc: '화면을 3등분해 피사체를 교차점에 배치. 자연스러운 시선 유도' },
];

const IMG_LIGHTING: ImgOption[] = [
  { id: 'golden-hour',   label: '골든아워',      prompt: 'golden hour warm sunlight, amber glow, long shadows',          desc: '일출·일몰 직후의 황금빛 햇살. 따뜻하고 낭만적인 분위기' },
  { id: 'studio',        label: '스튜디오',      prompt: 'professional studio lighting, three-point setup',              desc: '3점 조명으로 피사체를 입체감 있게 또렷이 표현' },
  { id: 'backlit',       label: '역광',          prompt: 'strong backlight, rim light, silhouette, lens flare',          desc: '뒤에서 비추는 빛으로 실루엣·빛망울 효과 연출' },
  { id: 'dramatic-low',  label: '드라마틱 저키', prompt: 'dramatic low-key chiaroscuro lighting, deep shadows',          desc: '강한 명암 대비로 긴장감·극적 분위기 강조' },
  { id: 'soft-diffuse',  label: '소프트',        prompt: 'soft diffused natural light, no harsh shadows',                desc: '부드럽게 퍼진 자연광. 그림자 없이 포근한 느낌' },
  { id: 'neon',          label: '네온',          prompt: 'neon-lit, vibrant color cast, electric glow, urban night',     desc: '네온 사인 빛의 강렬한 색감. 사이버펑크·도시 야경 분위기' },
  { id: 'volumetric',    label: '볼류메트릭',    prompt: 'volumetric light rays, god rays, atmospheric shafts',          desc: '빛기둥이 공기 중에 퍼지는 신성하고 웅장한 효과' },
  { id: 'moonlight',     label: '달빛',          prompt: 'moonlit scene, cool blue ambient, silver highlights',          desc: '달빛의 차가운 청색 분위기. 고요하고 신비로운 야경' },
];

const IMG_DEPTH: ImgOption[] = [
  { id: 'shallow',    label: '보케 (얕은 심도)', prompt: 'shallow depth of field, beautiful bokeh, blurred background', desc: '배경을 흐리게 날려 피사체를 선명하게 부각. 감성적 느낌' },
  { id: 'deep',       label: '팬포커스',         prompt: 'deep focus, everything sharp from foreground to background',   desc: '전경부터 후경까지 모두 선명하게 표현. 정보량 극대화' },
  { id: 'macro',      label: '매크로',           prompt: 'macro photography, paper-thin depth of field, extreme detail', desc: '초접사 촬영. 미세한 디테일을 극단적으로 확대' },
  { id: 'tilt-shift', label: '틸트시프트',       prompt: 'tilt-shift miniature effect, selective focus band',            desc: '띠 형태의 선택 초점으로 미니어처처럼 보이는 효과' },
];

const IMG_MOOD: ImgOption[] = [
  { id: 'none',       label: '자동',     prompt: '',                                                               desc: '씬 내용이 분위기를 결정합니다 (기본값)' },
  { id: 'warm',       label: '따뜻함',   prompt: 'warm cozy atmosphere, amber tones, inviting',                    desc: '호박빛 색조의 포근하고 아늑한 분위기' },
  { id: 'cold',       label: '차가움',   prompt: 'cold austere atmosphere, blue-grey tones, crisp',               desc: '청회색 톤의 서늘하고 단정한 분위기' },
  { id: 'mystical',   label: '신비',     prompt: 'mystical ethereal atmosphere, dreamlike haze, soft glow',       desc: '몽환적인 안개와 빛으로 신비롭고 초현실적인 느낌' },
  { id: 'suspense',   label: '서스펜스', prompt: 'suspenseful tense atmosphere, ominous shadows',                 desc: '불길한 그림자와 긴장감으로 스릴러적 분위기 연출' },
  { id: 'vibrant',    label: '활기',     prompt: 'vibrant energetic atmosphere, saturated colors, dynamic',       desc: '채도 높은 색감과 역동적인 에너지감. 생기 넘치는 분위기' },
  { id: 'melancholy', label: '우울',     prompt: 'melancholic somber atmosphere, muted palette, quiet sadness',   desc: '낮은 채도의 절제된 색감으로 조용한 슬픔 표현' },
  { id: 'epic',       label: '장엄',     prompt: 'epic grand scale, awe-inspiring vastness, monumental',          desc: '압도적인 규모와 장대함. 경이로움을 자아내는 스케일' },
  { id: 'serene',     label: '평온',     prompt: 'serene peaceful atmosphere, tranquil, still',                   desc: '고요하고 평화로운 분위기. 마음이 편안해지는 정적인 느낌' },
];

const IMG_LENS: ImgOption[] = [
  { id: '24mm',    label: '24mm 광각',  prompt: 'shot on 24mm wide-angle lens, expansive perspective',            desc: '넓은 화각으로 공간을 크게 담음. 환경 묘사에 적합' },
  { id: '35mm',    label: '35mm',       prompt: 'shot on 35mm lens, natural perspective, documentary feel',       desc: '눈으로 보는 것과 가장 유사한 자연스러운 시각' },
  { id: '50mm',    label: '50mm',       prompt: 'shot on 50mm lens, natural human eye perspective',               desc: '인간 눈의 화각과 동일. 가장 중립적인 표준 렌즈' },
  { id: '85mm',    label: '85mm 인물',  prompt: 'shot on 85mm portrait lens, flattering compression, creamy bokeh', desc: '인물 촬영 최적화. 얼굴을 자연스럽고 아름답게 표현' },
  { id: '135mm',   label: '135mm 망원', prompt: 'shot on 135mm telephoto, strong background compression',         desc: '원근감 압축으로 배경과 피사체가 가까워 보이는 효과' },
  { id: 'fisheye', label: '어안',       prompt: 'fisheye lens, extreme barrel distortion, 180-degree FOV',        desc: '180도 초광각 왜곡 효과. 독특하고 실험적인 시각' },
];

interface ImgNegOption { id: string; label: string; prompt: string; desc: string; }
const IMG_NEGATIVE: ImgNegOption[] = [
  { id: 'blur',        label: '흐림',      prompt: 'blurry, out of focus, soft focus',                              desc: '초점이 맞지 않는 흐릿한 이미지를 생성하지 않도록 제한' },
  { id: 'lowqual',     label: '저화질',    prompt: 'low quality, pixelated, jpeg artifacts',                        desc: '픽셀 뭉개짐·압축 노이즈 등 저품질 결과물 방지' },
  { id: 'watermark',   label: '워터마크',  prompt: 'watermark, text overlay, signature',                            desc: '워터마크·서명·로고 등 불필요한 오버레이 제거' },
  { id: 'text',        label: '텍스트',    prompt: 'text, letters, words, captions',                                desc: '이미지 내 글자·캡션이 생성되지 않도록 방지' },
  { id: 'distort',     label: '왜곡',      prompt: 'distorted, warped, morphing',                                   desc: '형태가 뒤틀리거나 변형되는 왜곡 현상 방지' },
  { id: 'bad-anatomy', label: '신체 오류', prompt: 'bad anatomy, extra limbs, mutated hands, deformed fingers',     desc: '팔다리 개수 오류·손가락 변형 등 신체 묘사 오류 방지' },
  { id: 'bad-face',    label: '얼굴 손상', prompt: 'distorted face, deformed features, uncanny valley',             desc: '얼굴 비율·이목구비 왜곡 및 불쾌한 골짜기 현상 방지' },
  { id: 'cgi',         label: 'CGI',       prompt: 'artificial, CGI look, plastic, unnatural',                      desc: '플라스틱 재질감이나 CG 티가 나는 부자연스러운 표현 방지' },
  { id: 'cartoon',     label: '만화',      prompt: 'cartoon style, anime, illustrated, painted',                    desc: '만화·애니·일러스트 스타일이 섞이지 않도록 방지' },
  { id: '3d-render',   label: '3D 렌더',   prompt: '3D render, computer generated, virtual',                        desc: '컴퓨터 생성 3D 렌더링 느낌이 나지 않도록 방지' },
  { id: 'noise',       label: '노이즈',    prompt: 'noise, grain, film grain, static',                              desc: '과도한 필름 그레인·노이즈 입자 방지' },
  { id: 'overexp',     label: '과노출',    prompt: 'overexposed, washed out, blown highlights',                     desc: '하이라이트가 날아가 밝은 부분 디테일이 사라지는 현상 방지' },
];

function computeImgAutoNeg(
  composition: string, lighting: string, depth: string, artStyleId?: string
): Set<string> {
  const ids = new Set<string>();
  ids.add('watermark');
  ids.add('text');
  if (composition === 'close-up') { ids.add('bad-face'); ids.add('distort'); }
  if (depth === 'macro') { ids.add('blur'); ids.add('noise'); }
  if (depth === 'shallow') ids.add('noise');
  if (lighting === 'dramatic-low') ids.add('overexp');
  if (lighting === 'neon') { ids.add('overexp'); }
  if (lighting === 'backlit') ids.add('overexp');
  const flatStyles = ['econ-infographic', 'pixar-3d'];
  if (artStyleId && flatStyles.includes(artStyleId)) ids.add('3d-render');
  const photoStyles = ['reality', 'econ-documentary'];
  if (artStyleId && photoStyles.includes(artStyleId)) { ids.add('cartoon'); ids.add('cgi'); }
  return ids;
}

// ── 툴팁 컴포넌트 ────────────────────────────────────────────────────────────
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [visible, setVisible] = React.useState(false);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  return (
    <div className="relative inline-block"
      onMouseEnter={e => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ x: r.left + r.width / 2, y: r.top });
        setVisible(true);
      }}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {mounted && visible && createPortal(
        <div className="pointer-events-none fixed z-[99999] px-2.5 py-1.5 rounded-lg text-[11px] leading-snug text-white max-w-[220px] text-center"
          style={{
            left: pos.x, top: pos.y - 8, transform: 'translate(-50%, -100%)',
            background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}
        >
          {text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
            style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgba(15,15,25,0.95)' }} />
        </div>,
        document.body
      )}
    </div>
  );
}

// ── 씬 역할 + 화풍 → 이미지 옵션 자동 추론 ─────────────────────────────────
function getAutoImgOptions(role: string, artStyleId: string = '') {
  // mood는 씬 내용 기반으로 결정되어야 하므로 자동 설정 금지 — 기본값 'none'(미적용)
  // composition, lighting, depth, lens만 role+style 기반 자동 추론
  type Opts = { composition: string; lighting: string; depth: string; mood: string; lens: string };
  const byRole: Record<string, Opts> = {
    hook:       { composition: 'close-up',    lighting: 'dramatic-low', depth: 'shallow', mood: 'none', lens: '85mm'  },
    intro:      { composition: 'medium',      lighting: 'soft-diffuse', depth: 'deep',    mood: 'none', lens: '50mm'  },
    explain:    { composition: 'wide',        lighting: 'studio',       depth: 'deep',    mood: 'none', lens: '35mm'  },
    evidence:   { composition: 'rule-thirds', lighting: 'soft-diffuse', depth: 'deep',    mood: 'none', lens: '50mm'  },
    climax:     { composition: 'low-angle',   lighting: 'backlit',      depth: 'shallow', mood: 'none', lens: '35mm'  },
    cta:        { composition: 'medium',      lighting: 'studio',       depth: 'shallow', mood: 'none', lens: '85mm'  },
    conclusion: { composition: 'wide',        lighting: 'golden-hour',  depth: 'deep',    mood: 'none', lens: '50mm'  },
  };
  const base: Opts = byRole[role] ?? byRole['intro'];
  const styleOverrides: Record<string, Partial<Opts>> = {
    'ghibli-real':      { lighting: 'soft-diffuse' },
    'ghibli-night':     { lighting: 'moonlight'    },
    'reality':          { lighting: 'soft-diffuse', lens: '35mm' },
    'anime-sf':         { lighting: 'neon'          },
    'pixar-3d':         { lighting: 'studio'        },
    'econ-documentary': { lighting: 'soft-diffuse', lens: '35mm' },
    'econ-dark-drama':  { lighting: 'dramatic-low'  },
  };
  return { ...base, ...(styleOverrides[artStyleId] ?? {}) };
}

// ── Main ──────────────────────────────────────────────────────────────────────
function KeyframePageInner() {
  const searchParams = useSearchParams();
  const sampleLimit = searchParams.get('sample') ? parseInt(searchParams.get('sample')!, 10) : null;

  const [scenes, setScenes]       = React.useState<string[]>([]);
  const [confirmedScenes, setConfirmedScenes] = React.useState<Set<number>>(new Set());
  const [confirmedPrompts, setConfirmedPrompts] = React.useState<Record<number, { positive: string; negative: string }>>({});
  const [apiGenStatus, setApiGenStatus] = React.useState<Record<number, 'idle' | 'generating' | 'done' | 'error'>>({});
  const [apiGenErrors, setApiGenErrors] = React.useState<Record<number, string>>({});
  const [apiKey, setApiKey] = React.useState<string>('');
  const [apiKeyInput, setApiKeyInput] = React.useState<string>('');
  const [apiKeyEditing, setApiKeyEditing] = React.useState(false);
  const [apiAspectRatio, setApiAspectRatio] = React.useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [apiLightboxIdx, setApiLightboxIdx] = React.useState<number | null>(null);
  const [outputFolder, setOutputFolder] = React.useState<string>('');
  const [analysis, setAnalysis]   = React.useState<any>(null);
  const [idea, setIdea]           = React.useState('');
  const [charAssets, setCharAssets]         = React.useState<CharAsset[]>([]);
  const [charAssetsReady, setCharAssetsReady] = React.useState(false);
  const [selectedCharId, setSelectedCharId] = React.useState<string>('');
  const [selectedIdx, setSelectedIdx]           = React.useState(0);
  const [artStyle, setArtStyle]                 = React.useState<ArtStyleDef | null>(null);
  const [artStyleOpen, setArtStyleOpen]         = React.useState(false);
  const [prompts, setPrompts]                   = React.useState<FinalPrompt[]>([]);
  const [nlPositiveEdits, setNlPositiveEdits]   = React.useState<Record<number, string>>({});
  const [nlNegativeEdits, setNlNegativeEdits]   = React.useState<Record<number, string>>({});
  const [translatedScenes, setTranslatedScenes] = React.useState<string[]>([]);
  const [sceneVisuals, setSceneVisuals]         = React.useState<string[]>([]);
  const [sceneRoles, setSceneRoles]             = React.useState<string[]>([]);
  const [sceneHintsEn, setSceneHintsEn]         = React.useState<string[]>([]); // [장면힌트] 영문 번역 (보장된 주입)
  const [isTranslating, setIsTranslating]       = React.useState(false);
  const [translateProgress, setTranslateProgress] = React.useState(0);
  const translateTimerRef    = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef   = React.useRef<AbortController | null>(null);
  const translateTimeoutRef  = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sceneImages, setSceneImages]           = React.useState<Record<number, string>>({});
  const [sceneMp4s, setSceneMp4s]               = React.useState<Record<number, string>>({});
  const sceneImagesRef = React.useRef<Record<number, string>>({});
  const sceneMp4sRef   = React.useRef<Record<number, string>>({});
  // 서버 이미지 슬롯 매핑: serverIdx → sceneIdx (씬 삽입 시 같이 시프트)
  const [serverImageSlots, setServerImageSlots] = React.useState<Record<number, number>>({});
  const [copied, setCopied]                     = React.useState<{ idx: number; type: 'nl' | 'json' } | null>(null);
  const [toolCopied, setToolCopied]             = React.useState<string | null>(null);
  const autoTranslated                          = React.useRef(false);
  const [isMobile, setIsMobile]                 = React.useState(false);
  const [tabMode, setTabMode]                   = React.useState<'hybrid' | 'api' | 'all-mp4'>('hybrid');
  const [sceneIds, setSceneIds]                 = React.useState<string[]>([]);

  // 이미지 생성 옵션 (단일 ref + version counter 패턴 — stale closure 방지)
  const imgOptionsRef = React.useRef<ImgOptions>({ ...DEFAULT_IMG_OPTIONS });
  const [imgOptionsVersion, setImgOptionsVersion] = React.useState(0);
  const setImgOption = React.useCallback(<K extends keyof ImgOptions>(key: K, val: ImgOptions[K]) => {
    imgOptionsRef.current = { ...imgOptionsRef.current, [key]: val };
    setImgOptionsVersion(v => v + 1);
  }, []);
  const [imgCopiedPos,   setImgCopiedPos]   = React.useState(false);
  const [imgCopiedNeg,   setImgCopiedNeg]   = React.useState(false);

  // stale closure 방지용 ref — 매 렌더마다 최신 값으로 갱신
  const scenesRef              = React.useRef(scenes);
  const promptsRef             = React.useRef(prompts);
  const nlPositiveEditsRef     = React.useRef(nlPositiveEdits);
  const translatedScenesRef    = React.useRef(translatedScenes);
  const artStyleRef            = React.useRef(artStyle);
  const sceneRolesRef          = React.useRef(sceneRoles);
  const sceneVisualsRef        = React.useRef(sceneVisuals);
  const sceneHintsEnRef        = React.useRef(sceneHintsEn);
  scenesRef.current              = scenes;
  promptsRef.current             = prompts;
  nlPositiveEditsRef.current     = nlPositiveEdits;
  translatedScenesRef.current    = translatedScenes;
  artStyleRef.current            = artStyle;
  sceneRolesRef.current          = sceneRoles;
  sceneVisualsRef.current        = sceneVisuals;
  sceneHintsEnRef.current        = sceneHintsEn;

  React.useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Google API Key 로드
  React.useEffect(() => {
    const saved = localStorage.getItem('ld_google_api_key') ?? '';
    setApiKey(saved);
  }, []);

  // objectURL 메모리 누수 방지 — 언마운트 시 전체 revoke (ref 기반으로 최신 URL 맵 유지)
  React.useEffect(() => {
    return () => {
      Object.values(sceneImagesRef.current).forEach(url => { if (url) URL.revokeObjectURL(url); });
      Object.values(sceneMp4sRef.current).forEach(url => { if (url) URL.revokeObjectURL(url); });
      if (translateTimeoutRef.current) clearTimeout(translateTimeoutRef.current);
    };
  }, []);

  // 이미지 교체 시 이전 objectURL revoke 후 교체
  const updateSceneImage = React.useCallback((idx: number, newUrl: string) => {
    const prev = sceneImagesRef.current[idx];
    if (prev && prev !== newUrl && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
    const next = { ...sceneImagesRef.current };
    if (newUrl) next[idx] = newUrl; else delete next[idx];
    sceneImagesRef.current = next;
    setSceneImages(next);
  }, []);

  const mergeSceneImages = React.useCallback((newImages: Record<number, string>) => {
    for (const [k, newUrl] of Object.entries(newImages)) {
      const idx = Number(k);
      const prev = sceneImagesRef.current[idx];
      if (prev && prev !== newUrl && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
    }
    sceneImagesRef.current = { ...sceneImagesRef.current, ...newImages };
    setSceneImages(sceneImagesRef.current);
  }, []);

  const updateSceneMp4 = React.useCallback((idx: number, newUrl: string) => {
    const prev = sceneMp4sRef.current[idx];
    if (prev && prev !== newUrl && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
    const next = { ...sceneMp4sRef.current };
    if (newUrl) next[idx] = newUrl; else delete next[idx];
    sceneMp4sRef.current = next;
    setSceneMp4s(next);
  }, []);

  // 캐릭터 레퍼런스 이미지 — selectedCharId의 faceGridUrl을 base64 data URL로 자동 로드
  const [charRefImage, setCharRefImage] = React.useState<string>('');
  React.useEffect(() => {
    if (!selectedCharId) { setCharRefImage(''); return; }
    const char = charAssets.find(c => c.id === selectedCharId);
    const url = char?.faceGridUrl || char?.imageDataUrl || '';
    if (!url) { setCharRefImage(''); return; }
    if (url.startsWith('data:')) { setCharRefImage(url); return; }
    fetch(url)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = e => { if (e.target?.result) setCharRefImage(e.target.result as string); };
        reader.readAsDataURL(blob);
      })
      .catch(() => setCharRefImage(''));
  }, [selectedCharId, charAssets]);

  // 출력 폴더명 생성 (대본 고유ID + 날짜 + 시간 + 해상도, 배치 첫 이미지 시점에 1회 고정)
  const getOrCreateOutputFolder = React.useCallback(() => {
    if (outputFolder) return outputFolder;
    const scriptId = (localStorage.getItem('ld_script_id') || '').slice(0, 8);
    const now = new Date();
    const pad = (n: number, l = 2) => String(n).padStart(l, '0');
    const date = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const ratio = apiAspectRatio.replace(':', 'x');
    const folder = scriptId ? `${scriptId}_${date}_${time}_${ratio}` : `${date}_${time}_${ratio}`;
    setOutputFolder(folder);
    return folder;
  }, [outputFolder, apiAspectRatio]);

  // API 이미지 생성
  const generateSceneImage = React.useCallback(async (sceneIdx: number) => {
    setApiGenStatus(prev => ({ ...prev, [sceneIdx]: 'generating' }));
    setApiGenErrors(prev => { const n = { ...prev }; delete n[sceneIdx]; return n; });

    try {
      const { positive, negative } = confirmedPrompts[sceneIdx] ?? { positive: '', negative: '' };
      const folder = getOrCreateOutputFolder();

      let charImgBase64 = '';
      let charImgMime = 'image/png';
      if (charRefImage) {
        const match = charRefImage.match(/^data:([^;]+);base64,(.+)$/);
        if (match) { charImgMime = match[1]; charImgBase64 = match[2]; }
      }

      const res = await fetch(`${API}/image/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: positive,
          negative,
          api_key: apiKey,
          aspect_ratio: apiAspectRatio,
          output_folder: folder,
          scene_num: sceneIdx + 1,
          character_image_base64: charImgBase64,
          character_image_mime: charImgMime,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.detail || data.error || '생성 실패');
      }

      // base64 → Blob → objectURL
      const byteChars = atob(data.image_base64);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: data.mime_type || 'image/png' });
      const url = URL.createObjectURL(blob);

      updateSceneImage(sceneIdx, url);
      await saveImageIDB(getSessionId(), sceneIdx, blob);
      syncImageToServer(sceneIdx, blob);
      setApiGenStatus(prev => ({ ...prev, [sceneIdx]: 'done' }));

    } catch (err: any) {
      setApiGenStatus(prev => ({ ...prev, [sceneIdx]: 'error' }));
      setApiGenErrors(prev => ({ ...prev, [sceneIdx]: err.message ?? '생성 실패' }));
    }
  }, [confirmedPrompts, apiKey, apiAspectRatio, updateSceneImage, getOrCreateOutputFolder, charRefImage]);

  // 씬 이미지 삭제
  const deleteSceneImage = React.useCallback((sceneIdx: number) => {
    updateSceneImage(sceneIdx, '');
    setApiGenStatus(prev => ({ ...prev, [sceneIdx]: 'idle' }));
    setApiGenErrors(prev => { const n = { ...prev }; delete n[sceneIdx]; return n; });
    if (outputFolder) {
      fetch(`${API}/image/scene/${outputFolder}/${sceneIdx + 1}`, { method: 'DELETE' }).catch(() => {});
    }
  }, [updateSceneImage, outputFolder]);

  // 씬 이미지 교체 — hidden input 연동
  const replaceInputRef = React.useRef<HTMLInputElement>(null);
  const replaceTargetRef = React.useRef<number>(-1);

  const triggerReplace = React.useCallback((sceneIdx: number) => {
    replaceTargetRef.current = sceneIdx;
    replaceInputRef.current?.click();
  }, []);

  const handleReplaceFile = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const idx = replaceTargetRef.current;
    if (!file || idx < 0) return;
    e.target.value = '';

    const url = URL.createObjectURL(file);
    updateSceneImage(idx, url);
    setApiGenStatus(prev => ({ ...prev, [idx]: 'done' }));
    await saveImageIDB(getSessionId(), idx, file);

    const folder = getOrCreateOutputFolder();
    const form = new FormData();
    form.append('file', file);
    form.append('output_folder', folder);
    form.append('scene_num', String(idx + 1));
    fetch(`${API}/image/save`, { method: 'POST', body: form }).catch(() => {});
  }, [updateSceneImage, getOrCreateOutputFolder]);

  // 캐릭터 목록 로드
  React.useEffect(() => {
    loadCharAssets().then(list => { setCharAssets(list); setCharAssetsReady(true); });
  }, []);

  // 화풍 변경 시 조명·렌즈 자동 선택 (사용자가 수동 변경 전까지 화풍에 맞는 기본값 유지)
  React.useEffect(() => {
    if (!artStyle) {
      imgOptionsRef.current = { ...imgOptionsRef.current, lighting: 'golden-hour', lens: '35mm' };
    } else {
      imgOptionsRef.current = { ...imgOptionsRef.current, lighting: getDefaultLighting(artStyle.id), lens: getDefaultLens(artStyle.id) };
    }
    setImgOptionsVersion(v => v + 1);
  }, [artStyle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // imgOptions 변경 시 prompts 즉시 재빌드
  React.useEffect(() => {
    if (translatedScenes.length === 0 && scenes.length === 0) return;
    const enScenes  = translatedScenes.length > 0 ? translatedScenes : scenes;
    const charPrompt = charAssets.find(c => c.id === selectedCharId)?.promptEn ?? '';
    rebuildPrompts(enScenes, artStyle, charPrompt, sceneRoles, sceneVisuals, false, undefined, sceneHintsEn);
  }, [imgOptionsVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // 캐릭터 변경 또는 로드 완료 시 프롬프트 재빌드 + sessionStorage 갱신
  // ref 사용으로 stale closure 방지 (translatedScenes, artStyle 등 최신값 보장)
  React.useEffect(() => {
    if (!charAssetsReady || scenesRef.current.length === 0) return;
    const _scenes    = scenesRef.current;
    const _trans     = translatedScenesRef.current;
    const _art       = artStyleRef.current;
    const _roles     = sceneRolesRef.current;
    const _visuals   = sceneVisualsRef.current;
    const enScenes   = _trans.length > 0 ? _trans : _scenes.map((_, i) => `scene ${i + 1}`);
    const charPrompt = charAssets.find(c => c.id === selectedCharId)?.promptEn ?? '';
    rebuildPrompts(enScenes, _art, charPrompt, _roles, _visuals);
    // 링크브라우저 폴백용 sessionStorage 즉시 갱신
    const selChar = charAssets.find(c => c.id === selectedCharId);
    const hasFace = !!selChar?.faceGridUrl;
    const hasBody = !!selChar?.bodyGridUrl;
    const _hintsEn = sceneHintsEnRef.current;
    const allPrompts = enScenes.map((_, i) =>
      buildFinalPrompt(_visuals[i] || '', _hintsEn[i] ?? '', _roles[i] ?? '', _art, charPrompt, hasFace, hasBody,
        imgOptionsRef.current).positive
    );
    sessionStorage.setItem('ld_keyframe_prompts', JSON.stringify(allPrompts));
    saveStateIDB('prompts', allPrompts);
  }, [selectedCharId, charAssetsReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // 씬 삽입 (afterIdx 다음에 빈 씬 추가)
  const addEmptyScene = async (afterIdx: number) => {
    const insertAt = afterIdx + 1;
    // updater 대신 ref에서 직접 계산하여 경쟁 조건 방지
    const insertedScenes = [...scenesRef.current];
    insertedScenes.splice(insertAt, 0, '');
    setScenes(insertedScenes);

    // keyframe_data의 scenes도 IDB에 즉시 반영 (확정된 insertedScenes 사용)
    const saved = await loadStateIDB('keyframe_data');
    if (saved) await saveStateIDB('keyframe_data', { ...saved, scenes: insertedScenes });
    setPrompts(prev => {
      const next = [...prev];
      const _selChar = charAssets.find(c => c.id === selectedCharId);
      next.splice(insertAt, 0, buildFinalPrompt('', '', '', null, _selChar?.promptEn ?? '', !!_selChar?.faceGridUrl, !!_selChar?.bodyGridUrl,
        imgOptionsRef.current));
      return next;
    });
    setTranslatedScenes(prev => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      next.splice(insertAt, 0, '');
      return next;
    });
    // 삽입 위치 이후 이미지 인덱스를 +1씩 밀기
    {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(sceneImagesRef.current)) {
        const idx = Number(k);
        next[idx < insertAt ? idx : idx + 1] = v;
      }
      sceneImagesRef.current = next;
      setSceneImages(next);
    }
    // 삽입 위치 이후 MP4 인덱스도 +1씩 밀기
    {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(sceneMp4sRef.current)) {
        const idx = Number(k);
        next[idx < insertAt ? idx : idx + 1] = v;
      }
      sceneMp4sRef.current = next;
      setSceneMp4s(next);
    }
    // nlPositiveEdits / nlNegativeEdits 인덱스도 +1씩 밀기
    setNlPositiveEdits(prev => {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const idx = Number(k);
        next[idx < insertAt ? idx : idx + 1] = v;
      }
      return next;
    });
    setNlNegativeEdits(prev => {
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
    setSceneIds(prev => {
      const next = [...prev];
      next.splice(insertAt, 0, crypto.randomUUID());
      return next;
    });
    setSelectedIdx(insertAt);
  };

  // 씬 삭제 (최소 1개 유지)
  const deleteScene = (delIdx: number) => {
    if (scenes.length <= 1) return;
    const newScenes = scenes.filter((_, i) => i !== delIdx);
    setScenes(newScenes);
    setSceneIds(prev => prev.filter((_, i) => i !== delIdx));
    setPrompts(prev => prev.filter((_, i) => i !== delIdx));
    setTranslatedScenes(prev => prev.length ? prev.filter((_, i) => i !== delIdx) : prev);
    // 삭제 위치 이후 이미지 인덱스 -1씩 당기기 (삭제된 URL revoke 포함)
    {
      const deleted = sceneImagesRef.current[delIdx];
      if (deleted && deleted.startsWith('blob:')) URL.revokeObjectURL(deleted);
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(sceneImagesRef.current)) {
        const idx = Number(k);
        if (idx === delIdx) continue;
        next[idx < delIdx ? idx : idx - 1] = v;
      }
      sceneImagesRef.current = next;
      setSceneImages(next);
    }
    // 삭제 위치 이후 MP4 인덱스 -1씩 당기기 (삭제된 URL revoke 포함)
    {
      const deletedMp4 = sceneMp4sRef.current[delIdx];
      if (deletedMp4 && deletedMp4.startsWith('blob:')) URL.revokeObjectURL(deletedMp4);
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(sceneMp4sRef.current)) {
        const idx = Number(k);
        if (idx === delIdx) continue;
        next[idx < delIdx ? idx : idx - 1] = v;
      }
      sceneMp4sRef.current = next;
      setSceneMp4s(next);
    }
    setNlPositiveEdits(prev => {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const idx = Number(k);
        if (idx === delIdx) continue;
        next[idx < delIdx ? idx : idx - 1] = v;
      }
      return next;
    });
    setNlNegativeEdits(prev => {
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
      return nlPositiveEdits[i] !== undefined ? nlPositiveEdits[i] : (sp?.positive ?? '');
    });
    saveStateIDB('prompts', allPrompts);
    // 링크브라우저용 sessionStorage도 유지 (폴백)
    sessionStorage.setItem('ld_keyframe_prompts', JSON.stringify(allPrompts));
  }, [scenes, prompts, nlPositiveEdits]);

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
      // ref를 통해 최신 값 참조 — setTimeout 클로저의 stale capture 방지
      const _scenes         = scenesRef.current;
      const _prompts        = promptsRef.current;
      const _nlPositiveEdits = nlPositiveEditsRef.current;
      const allPrompts = _scenes.map((_, i) => {
        const sp = _prompts[i];
        return _nlPositiveEdits[i] !== undefined ? _nlPositiveEdits[i] : (sp?.positive ?? '');
      });
      const savedAccents = await loadStateIDB('scene_accents') ?? [];
      fetch(`${API}/browser/session-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: _scenes, prompts: allPrompts, accents: savedAccents, tool_id: '', scene: 0, script_id: localStorage.getItem('ld_script_id') ?? '',
          mp4_prompts: _scenes.map((s, i) => {
            const en = (translatedScenesRef.current[i] || '').replace(/\[씬\s*\d+\]/gi, '').replace(/^scene\s+\d+[,.]?\s*/i, '').trim();
            if (en) return en;
            const vis = (sceneVisualsRef.current[i] || '').trim();
            if (vis) return vis;
            return s.replace(/\[씬\s*\d+\]/g, '').trim();
          }),
        }),
      }).catch(() => {});
    }, 800); // 연속 변경 디바운스
  }, [scenes, prompts, nlPositiveEdits]);

  // 링크브라우저에서 postMessage로 이미지 수신 (팝업 폴백용)
  React.useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== 'ld_image') return;
      const { sceneIdx, dataUrl } = e.data;
      updateSceneImage(sceneIdx, dataUrl);
      fetch(dataUrl).then(r => r.blob()).then(blob => { saveImageIDB(getSessionId(), sceneIdx, blob); syncImageToServer(sceneIdx, blob); });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [updateSceneImage]);

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
          mergeSceneImages(newImages);
        }
      }
    } catch (_) {}
  }, [scenes, serverImageSlots, mergeSceneImages]);

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
      setSceneIds(sceneList.map(() => crypto.randomUUID()));
      // 서버 이미지 슬롯 초기화: serverIdx → sceneIdx (1:1 매핑)
      const initSlots: Record<number, number> = {};
      for (let i = 0; i < sceneList.length; i++) initSlots[i] = i;
      setServerImageSlots(initSlots);
      setAnalysis(data.analysis || null);
      setIdea(data.idea || '');
      setPrompts(sceneList.map(() => buildFinalPrompt('', '', '', null, '', false, false)));

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

      // 5. 프롬프트 수정 복원 (nl_edits는 positive 단일 값으로 저장되어 있었음 → nlPositiveEdits로 복원)
      if (savedNlEdits && Object.keys(savedNlEdits).length > 0) {
        setNlPositiveEdits(savedNlEdits);
      }

      // 6. IDB 이미지 복원 (현재 세션 기준 — 새 대본이면 새 세션이므로 자동 빈 상태)
      const sid = getSessionId();
      const imgs = await loadImagesIDB(sid, sceneList.length);
      if (Object.keys(imgs).length > 0) { sceneImagesRef.current = imgs; setSceneImages(imgs); }

      // 7. IDB MP4 복원 (전체 씬)
      const mp4s = await loadAllMp4sIDB(sid, sceneList.length);
      if (Object.keys(mp4s).length > 0) { sceneMp4sRef.current = mp4s; setSceneMp4s(mp4s); }
    })();
  }, []);

  // 자동 선택 화풍 → 초기 번역+프롬프트 빌드 (IndexedDB 캐시 우선, API 1회만)
  React.useEffect(() => {
    if (autoTranslated.current || scenes.length === 0 || !artStyle || translatedScenes.length > 0) return;
    autoTranslated.current = true;

    // 이전 번역 요청 취소
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    (async () => {
      // IndexedDB 캐시 확인
      const cached = await loadStateIDB('translated_scenes');
      const cachedStyleId = await loadStateIDB('translated_style_id');
      const cachedRoles    = await loadStateIDB('scene_roles')    ?? [];
      const cachedVisuals  = await loadStateIDB('scene_visuals')  ?? [];
      const cachedHintsEn  = await loadStateIDB('scene_hints_en') ?? [];
      if (controller.signal.aborted) return;
      const cachedScenesHash = await loadStateIDB('scenes_hash');
      const currentHash = scenesHash(scenes);
      const cacheValid = cached && Array.isArray(cached) && cached.length === scenes.length
        && cachedStyleId === artStyle.id && cachedScenesHash === currentHash
        && cached.some((s: string) => s && s.trim().length > 0); // 모두 빈 문자열이면 재번역
      if (cacheValid) {
        setTranslatedScenes(cached);
        setSceneRoles(cachedRoles);
        setSceneVisuals(cachedVisuals);
        setSceneHintsEn(cachedHintsEn);
        rebuildPrompts(cached, artStyle, charAssets.find(c => c.id === selectedCharId)?.promptEn ?? '', cachedRoles, cachedVisuals, false, undefined, cachedHintsEn);
        return;
      }

      // 캐시 없거나 화풍 변경 → API 호출 (1회)
      startTranslating();
      try {
        const { visual_prompts: en, scene_visuals: visuals, accents, scene_roles: roles, scene_hints_en: hintsEn } = await translateScenesToVisual(scenes, nicheToGenreEn(analysis?.niche || ''), artStyle?.id || '');
        if (controller.signal.aborted) return;
        setTranslatedScenes(en);
        setSceneVisuals(visuals);
        setSceneRoles(roles);
        setSceneHintsEn(hintsEn);
        rebuildPrompts(en, artStyle, charAssets.find(c => c.id === selectedCharId)?.promptEn ?? '', roles, visuals, false, undefined, hintsEn);
        await saveStateIDB('translated_scenes', en);
        await saveStateIDB('translated_style_id', artStyle.id);
        await saveStateIDB('scenes_hash', scenesHash(scenes));
        await saveStateIDB('scene_accents', accents);
        await saveStateIDB('scene_roles', roles);
        await saveStateIDB('scene_visuals', visuals);
        await saveStateIDB('scene_hints_en', hintsEn);
        // translate 결과 accent를 SESSION_FILE에 즉시 반영 — Remotion 페이지 이중 Gemini 호출 방지
        fetch(`${API}/browser/session-accents`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accents: accents ?? [] }),
        }).catch(() => {});
      } catch (_) {
        if (controller.signal.aborted) return;
        const fb = scenes.map(s => s);  // 번역 실패 시 한글 원문 유지 ('scene N' 폴백 제거)
        setTranslatedScenes(fb);
        // 번역 실패 시에도 기존 ref 값(roles/visuals/hintsEn)으로 rebuildPrompts 호출하여 subject 파트 보존
        const _roles   = sceneRolesRef.current;
        const _visuals = sceneVisualsRef.current;
        const _hints   = sceneHintsEnRef.current;
        rebuildPrompts(fb, artStyle, charAssets.find(c => c.id === selectedCharId)?.promptEn ?? '', _roles, _visuals, false, undefined, _hints);
        await saveStateIDB('translated_scenes', fb);
        await saveStateIDB('translated_style_id', artStyle.id);
        // 빈 배열이라도 명시 저장 — 다음 캐시 유효성 체크가 정상 동작하도록
        await saveStateIDB('scene_roles',    _roles);
        await saveStateIDB('scene_visuals',  _visuals);
        await saveStateIDB('scene_hints_en', _hints);
      } finally {
        if (!controller.signal.aborted) stopTranslating();
      }
    })();
    return () => { controller.abort(); };
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
    if (translateTimeoutRef.current) clearTimeout(translateTimeoutRef.current);
    translateTimeoutRef.current = setTimeout(() => { setIsTranslating(false); setTranslateProgress(0); }, 500);
  };

  const rebuildPrompts = (
    enScenes: string[],
    art: ArtStyleDef | null,
    charPrompt = '',
    roles: string[] = [],
    visuals: string[] = [],
    clearEdits = false,
    overrideCharId?: string,
    hintsEn: string[] = [],
  ) => {
    const charId  = overrideCharId !== undefined ? overrideCharId : selectedCharId;
    const selChar = charAssets.find(c => c.id === charId);
    const hasFace = !!selChar?.faceGridUrl;
    const hasBody = !!selChar?.bodyGridUrl;
    const hints   = hintsEn.length > 0 ? hintsEn : sceneHintsEnRef.current;
    setPrompts(enScenes.map((_, i) =>
      buildFinalPrompt(
        visuals[i] || '',
        hints[i] ?? '',
        roles[i] ?? '',
        art,
        charPrompt,
        hasFace,
        hasBody,
        imgOptionsRef.current,
      )
    ));
    if (clearEdits) { setNlPositiveEdits({}); setNlNegativeEdits({}); }
  };

  const handleSelectArt = async (a: ArtStyleDef) => {
    const next = artStyle?.id === a.id ? null : a;
    setArtStyle(next);
    setArtStyleOpen(false);
    saveStateIDB('art_style_id', next?.id || null);
    // 화풍 변경 시 번역 캐시 무효화만 수행 — 실제 번역은 자동번역 useEffect([scenes, artStyle])가 담당
    // (직접 호출 시 자동번역 useEffect와 동시 호출되어 race condition 발생하므로 여기서는 캐시만 초기화)
    await saveStateIDB('translated_scenes', null);
    await saveStateIDB('translated_style_id', null);
    autoTranslated.current = false;
    setTranslatedScenes([]);
  };

  const compatibleStyles    = React.useMemo(() => getCompatibleStyles(analysis?.niche || ''), [analysis]);
  const autoOpts            = artStyle ? getAutoOptions(artStyle.id) : null;
  const selectedPrompt      = prompts[selectedIdx];
  const selectedPositive    = nlPositiveEdits[selectedIdx] ?? selectedPrompt?.positive ?? '';
  const selectedNegative    = nlNegativeEdits[selectedIdx] ?? selectedPrompt?.negative ?? '';

  const handleCopy = (idx: number, type: 'nl' | 'json') => {
    const sp = prompts[idx];
    if (!sp) return;
    const text = type === 'json'
      ? JSON.stringify(sp, null, 2)
      : (nlPositiveEdits[idx] ?? sp.positive);
    navigator.clipboard.writeText(text);
    setCopied({ idx, type });
    setTimeout(() => setCopied(null), 2000);
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
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-amber-500/30 transition-all group w-[420px]"
              style={{ backgroundColor: '#121212' }}
            >
              <span className="text-lg shrink-0">💡</span>
              <span className="text-sm font-black text-amber-300">영상 수동 제작 팁</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-amber-600 text-xs ml-auto shrink-0 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
            <button
              onClick={() => window.open('/keyframe-extension-guide.html', '_blank')}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-indigo-500/30 transition-all group w-[420px]"
              style={{ backgroundColor: '#232323' }}
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

        {/* ── Tabs Pro ── */}
        <div className="relative z-10 max-w-[1160px] mx-auto w-full px-5 pt-4 pb-4">
          <div className="flex gap-1 p-1 rounded-2xl"
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}>
            {([
              { id: 'hybrid',  icon: '🖼️', label: '이미지 프롬프트', desc: '씬1 훅영상 + 씬2~N 이미지' },
              { id: 'api',     icon: '✨',  label: 'API 사용',          desc: 'AI 이미지 자동 생성' },
              { id: 'all-mp4', icon: '📹', label: 'MP4 제작',          desc: '모든 씬을 MP4로 등록' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setTabMode(tab.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-black transition-all"
                style={tabMode === tab.id ? {
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.90), rgba(139,92,246,0.90))',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                } : {
                  color: 'rgba(148,163,184,0.9)',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tabMode !== tab.id && (
                  <span className="text-[10px] font-normal opacity-60 hidden sm:inline">{tab.desc}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── API 사용 탭 ── */}
        {tabMode === 'api' && (
          <div className="relative z-10 max-w-[1160px] mx-auto w-full px-5 py-6 flex flex-col gap-4">

            {/* 상단 행: API Key (33%) + 캐릭터 레퍼런스 (33%) + 해상도 옵션 (34%) */}
            <div className="flex gap-4">

              {/* API Key 섹션 — 33% */}
              <div className="w-1/3 rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                {apiKeyEditing ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs shrink-0">API Key</span>
                    <input type="text" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-violet-500/60 min-w-0"
                    />
                    <button onClick={() => { const t = apiKeyInput.trim(); localStorage.setItem('ld_google_api_key', t); setApiKey(t); setApiKeyEditing(false); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-black text-white shrink-0"
                      style={{ background: 'rgba(139,92,246,0.8)', border: '1px solid rgba(139,92,246,0.4)' }}>저장</button>
                    <button onClick={() => { setApiKeyInput(apiKey); setApiKeyEditing(false); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-black text-slate-400 shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>취소</button>
                  </div>
                ) : apiKey ? (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-sm">✅</span>
                    <span className="text-slate-300 text-xs font-mono truncate">{apiKey.slice(0, 8)}{'•'.repeat(8)}</span>
                    <button onClick={() => { setApiKeyInput(apiKey); setApiKeyEditing(true); }}
                      className="ml-auto px-2.5 py-1 rounded-lg text-xs font-black text-slate-400 shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>변경</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-xs shrink-0">⚠️ API Key 필요</span>
                    <input type="text" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-violet-500/60 min-w-0"
                    />
                    <button onClick={() => { const t = apiKeyInput.trim(); localStorage.setItem('ld_google_api_key', t); setApiKey(t); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-black text-white shrink-0"
                      style={{ background: 'rgba(139,92,246,0.8)', border: '1px solid rgba(139,92,246,0.4)' }}>저장</button>
                  </div>
                )}
              </div>

              {/* 캐릭터 레퍼런스 — 33% */}
              {(() => {
                const selChar = charAssets.find(c => c.id === selectedCharId);
                return (
                  <div className="w-1/3 rounded-2xl p-4"
                    style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${selChar && charRefImage ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.10)'}` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-400 shrink-0">캐릭터</span>
                      {selChar && charRefImage ? (
                        <>
                          <div className="relative shrink-0">
                            <img src={charRefImage} alt={selChar.name} className="w-9 h-9 rounded-lg object-cover border border-violet-500/40" />
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-violet-500 flex items-center justify-center">
                              <span className="text-[8px] text-white font-black">✓</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-violet-300 font-black truncate">{selChar.name}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">img2img 활성화</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-slate-500 flex-1">
                            {selChar ? '이미지 로딩 중...' : '선택된 캐릭터 없음'}
                          </span>
                          <button onClick={() => setTabMode('hybrid')}
                            className="px-2 py-1 rounded-lg text-[10px] font-black text-slate-400 shrink-0"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                            선택하기
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 해상도 옵션 — 34% */}
              <div className="flex-1 rounded-2xl p-4 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <span className="text-xs font-black text-slate-400 shrink-0">해상도</span>
                {(['16:9', '9:16', '1:1'] as const).map(ratio => (
                  <button key={ratio} onClick={() => { setApiAspectRatio(ratio); setOutputFolder(''); }}
                    className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
                    style={apiAspectRatio === ratio
                      ? { background: 'rgba(139,92,246,0.85)', border: '1px solid rgba(139,92,246,0.5)', color: '#fff', boxShadow: '0 0 12px rgba(139,92,246,0.35)' }
                      : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(148,163,184,0.8)' }
                    }>
                    {ratio}
                    {ratio === '16:9' && <span className="ml-1 text-[9px] opacity-60">기본</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 2-column 본문 */}
            <div className="flex gap-4 items-start">

              {/* ── 좌측 패널: 씬 목록 ── */}
              <div className="w-[200px] shrink-0 rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* 헤더 */}
                <div className="px-3 py-2.5 flex items-center gap-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                  <div className="w-1 h-3.5 rounded-full bg-indigo-500" />
                  <span className="text-xs font-black text-slate-300 uppercase tracking-widest">씬 목록</span>
                  <span className="ml-auto text-[10px] font-black text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">{scenes.length}개</span>
                </div>
                {/* 씬 리스트 */}
                <div className="flex flex-col">
                  {scenes.map((scene, i) => {
                    const isConfirmed = confirmedScenes.has(i);
                    const status = apiGenStatus[i] ?? 'idle';
                    const statusColor =
                      !isConfirmed      ? 'rgba(100,116,139,0.5)' :
                      status === 'done' ? 'rgba(16,185,129,0.8)'  :
                      status === 'generating' ? 'rgba(245,158,11,0.8)' :
                      status === 'error'      ? 'rgba(239,68,68,0.8)'  :
                      'rgba(139,92,246,0.7)';
                    const hasImage = !!sceneImages[i];
                    return (
                      <div key={i}
                        className="group/row flex flex-col transition-all"
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: hasImage
                            ? 'rgba(16,185,129,0.05)'
                            : isConfirmed ? 'rgba(139,92,246,0.06)' : 'transparent',
                        }}>
                        {/* 메인 행 */}
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          {/* 상태 인디케이터 */}
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColor }} />
                          {/* 썸네일 또는 빈 슬롯 */}
                          {hasImage ? (
                            <img src={sceneImages[i]} alt={`씬${i+1}`}
                              className="w-7 h-7 rounded object-cover shrink-0 border border-emerald-500/30" />
                          ) : (
                            <div className="w-7 h-7 rounded shrink-0 flex items-center justify-center"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)' }}>
                              <span className="text-[9px] text-slate-600">—</span>
                            </div>
                          )}
                          {/* 씬 번호 */}
                          <span className={`text-xs font-black shrink-0 ${hasImage ? 'text-emerald-300' : isConfirmed ? 'text-white' : 'text-slate-500'}`}>
                            씬{i + 1}
                          </span>
                          {/* 상태 뱃지 */}
                          {hasImage && (
                            <span className="ml-auto text-[9px] font-black text-emerald-400">IMG</span>
                          )}
                          {!hasImage && isConfirmed && status === 'generating' && (
                            <FontAwesomeIcon icon={faSpinner} className="ml-auto text-amber-400 text-[9px] animate-spin" />
                          )}
                          {!hasImage && isConfirmed && status === 'error' && (
                            <span className="ml-auto text-[9px] font-black text-red-400">!</span>
                          )}
                          {!hasImage && isConfirmed && status === 'idle' && (
                            <span className="ml-auto text-[9px] font-black text-violet-400">확정</span>
                          )}
                          {!hasImage && !isConfirmed && (
                            <span className="ml-auto text-[9px] text-slate-600">미확정</span>
                          )}
                        </div>
                        {/* 호버 액션 바 — 이미지가 있을 때만 */}
                        {hasImage && (
                          <div className="overflow-hidden max-h-0 group-hover/row:max-h-8 transition-all duration-150">
                            <div className="flex gap-1 px-2 pb-2">
                              <button onClick={() => triggerReplace(i)}
                                className="flex-1 py-1 rounded text-[9px] font-black text-sky-400"
                                style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)' }}>
                                교체
                              </button>
                              <button onClick={() => deleteSceneImage(i)}
                                className="flex-1 py-1 rounded text-[9px] font-black text-red-400"
                                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                                삭제
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* 요약 푸터 */}
                <div className="px-3 py-2.5"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.15)' }}>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">확정</span>
                    <span className="text-violet-400 font-black">{confirmedScenes.size}개</span>
                  </div>
                  <div className="flex justify-between text-[10px] mt-0.5">
                    <span className="text-slate-500">이미지</span>
                    <span className="text-emerald-400 font-black">
                      {Object.values(sceneImages).filter(Boolean).length}개
                    </span>
                  </div>
                </div>
              </div>

              {/* ── 우측 패널: 메인 콘텐츠 ── */}
              <div className="flex-1 min-w-0 flex flex-col gap-4">

                {/* 요약 바 */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-black text-emerald-300"
                    style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    확정된 씬 {confirmedScenes.size}개
                  </span>
                  <button
                    disabled={confirmedScenes.size === 0 || !apiKey}
                    onClick={() => { Array.from(confirmedScenes).filter(i => apiGenStatus[i] !== 'done').forEach(i => generateSceneImage(i)); }}
                    className="px-5 py-2 rounded-xl text-sm font-black text-white"
                    style={{
                      background: confirmedScenes.size > 0 && apiKey ? 'rgba(139,92,246,0.85)' : 'rgba(139,92,246,0.3)',
                      border: '1px solid rgba(139,92,246,0.4)',
                      opacity: confirmedScenes.size === 0 || !apiKey ? 0.5 : 1,
                      cursor: confirmedScenes.size === 0 || !apiKey ? 'not-allowed' : 'pointer',
                    }}>
                    ▶ 전체 생성
                  </button>
                </div>

                {/* 씬 없음 안내 — 확정도 없고 업로드도 없을 때만 */}
                {confirmedScenes.size === 0 && !scenes.some((_, i) => sceneImages[i] || sceneMp4s[i]) && (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <p className="text-slate-400 text-sm text-center">이미지 프롬프트 탭에서 씬을 먼저 확정해 주세요.</p>
                    <button onClick={() => setTabMode('hybrid')}
                      className="px-5 py-2 rounded-xl text-sm font-black text-white"
                      style={{ background: 'rgba(139,92,246,0.7)', border: '1px solid rgba(139,92,246,0.4)' }}>
                      이미지 프롬프트 탭으로 이동
                    </button>
                  </div>
                )}

                {/* 씬 카드 그리드 — 확정 씬 + 미디어 업로드된 미확정 씬 */}
                {(confirmedScenes.size > 0 || scenes.some((_, i) => sceneImages[i] || sceneMp4s[i])) && (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                    {scenes.map((scene, i) => {
                      const isConfirmed = confirmedScenes.has(i);
                      const hasMedia = !!(sceneImages[i] || sceneMp4s[i]);
                      if (!isConfirmed && !hasMedia) return null;

                      const status = apiGenStatus[i] ?? 'idle';
                      const posPrompt = confirmedPrompts[i]?.positive ?? '';

                      return (
                        <div key={i} className="rounded-2xl overflow-hidden flex flex-col"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: isConfirmed
                              ? '1px solid rgba(255,255,255,0.10)'
                              : '1px solid rgba(100,116,139,0.25)',
                          }}>

                          {/* 카드 헤더 */}
                          <div className="px-3 py-2 flex items-center gap-2"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black text-indigo-300"
                              style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>씬{i + 1}</span>
                            {isConfirmed
                              ? <span className="px-2 py-0.5 rounded-full text-[10px] font-black text-emerald-300"
                                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>확정</span>
                              : <span className="px-2 py-0.5 rounded-full text-[10px] font-black text-sky-300"
                                  style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)' }}>
                                  {sceneMp4s[i] ? 'MP4' : '이미지'} 업로드됨
                                </span>
                            }
                            <span className="text-xs text-slate-400 truncate flex-1 min-w-0">
                              {scene.replace(/\[씬\s*\d+\]/gi, '').trim().slice(0, 28)}…
                            </span>
                          </div>

                          {/* 프롬프트 미리보기 — 확정 씬만 */}
                          {isConfirmed && (
                            <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                              <p className="text-[10px] font-mono text-fuchsia-300/80 line-clamp-2 leading-relaxed">
                                {posPrompt || '(프롬프트 없음)'}
                              </p>
                            </div>
                          )}

                          {/* 이미지 영역 — 해상도 비율 동적 적용 */}
                          <div className="relative w-full" style={{
                            paddingBottom: apiAspectRatio === '16:9' ? '56.25%' : apiAspectRatio === '9:16' ? '177.78%' : '100%'
                          }}>
                            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }}>

                              {/* ── 미확정 + 업로드된 미디어 ── */}
                              {!isConfirmed && sceneMp4s[i] && (
                                <video src={sceneMp4s[i]} className="w-full h-full object-cover cursor-zoom-in"
                                  muted playsInline loop
                                  onClick={() => setApiLightboxIdx(i)} />
                              )}
                              {!isConfirmed && !sceneMp4s[i] && sceneImages[i] && (
                                <img src={sceneImages[i]} alt={`씬${i + 1}`}
                                  className="w-full h-full object-cover cursor-zoom-in"
                                  onClick={() => setApiLightboxIdx(i)} />
                              )}

                              {/* ── 확정 씬 생성 상태 ── */}
                              {isConfirmed && status === 'idle' && (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                  <span className="text-2xl">✨</span>
                                  <button onClick={() => generateSceneImage(i)}
                                    className="px-4 py-1.5 rounded-lg text-xs font-black text-white"
                                    style={{ background: 'rgba(139,92,246,0.8)', border: '1px solid rgba(139,92,246,0.4)' }}>
                                    생성하기
                                  </button>
                                </div>
                              )}
                              {isConfirmed && status === 'generating' && (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                  <FontAwesomeIcon icon={faSpinner} className="text-violet-400 text-2xl animate-spin" />
                                  <span className="text-xs text-slate-400">생성 중...</span>
                                </div>
                              )}
                              {isConfirmed && status === 'done' && sceneImages[i] && (
                                <>
                                  <img src={sceneImages[i]} alt={`씬${i + 1}`}
                                    className="w-full h-full object-cover cursor-zoom-in"
                                    onClick={() => setApiLightboxIdx(i)} />
                                  <div className="absolute bottom-2 right-2 flex gap-1">
                                    <button onClick={() => triggerReplace(i)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-black text-sky-300"
                                      style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(14,165,233,0.35)' }}>
                                      교체
                                    </button>
                                    <button onClick={() => deleteSceneImage(i)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-black text-red-400"
                                      style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(239,68,68,0.35)' }}>
                                      삭제
                                    </button>
                                  </div>
                                </>
                              )}
                              {isConfirmed && status === 'error' && (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-3">
                                  <span className="text-xl">❌</span>
                                  <p className="text-[10px] text-red-400 text-center line-clamp-2">{apiGenErrors[i] ?? '생성 실패'}</p>
                                  <button onClick={() => generateSceneImage(i)}
                                    className="px-4 py-1.5 rounded-lg text-xs font-black text-white"
                                    style={{ background: 'rgba(139,92,246,0.8)', border: '1px solid rgba(139,92,246,0.4)' }}>
                                    재시도
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 카드 푸터 */}
                          <div className="px-3 py-2 flex items-center justify-between"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            {!isConfirmed ? (
                              <span className="text-[11px] font-black text-sky-400">업로드됨</span>
                            ) : (
                              <>
                                <span className={`text-[11px] font-black ${
                                  status === 'idle' ? 'text-slate-500' : status === 'generating' ? 'text-amber-400' : status === 'done' ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                  {status === 'idle' ? '대기' : status === 'generating' ? '생성 중' : status === 'done' ? '완료 ✓' : '실패'}
                                </span>
                                <div>
                                  {(status === 'idle' || status === 'error') && (
                                    <button onClick={() => generateSceneImage(i)}
                                      className="px-3 py-1 rounded-lg text-[11px] font-black text-white"
                                      style={{ background: 'rgba(139,92,246,0.8)', border: '1px solid rgba(139,92,246,0.4)' }}>
                                      {status === 'error' ? '재시도' : '생성'}
                                    </button>
                                  )}
                                  {status === 'done' && (
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => generateSceneImage(i)}
                                        className="px-2 py-1 rounded-lg text-[11px] font-black text-slate-400"
                                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                                        재생성
                                      </button>
                                      <button onClick={() => triggerReplace(i)}
                                        className="px-2 py-1 rounded-lg text-[11px] font-black text-sky-400"
                                        style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)' }}>
                                        교체
                                      </button>
                                      <button onClick={() => deleteSceneImage(i)}
                                        className="px-2 py-1 rounded-lg text-[11px] font-black text-red-400"
                                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                                        삭제
                                      </button>
                                    </div>
                                  )}
                                  {status === 'generating' && (
                                    <span className="text-[11px] text-amber-400/60">처리중...</span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 이미지 교체용 hidden file input */}
        <input ref={replaceInputRef} type="file" accept="image/*" className="hidden" onChange={handleReplaceFile} />


        {/* ── API 탭 라이트박스 ── */}
        {apiLightboxIdx !== null && sceneImages[apiLightboxIdx] && (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
            onClick={() => setApiLightboxIdx(null)}
          >
            <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <img
                src={sceneImages[apiLightboxIdx]}
                alt={`씬${apiLightboxIdx + 1}`}
                className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain"
                style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}
              />
              {/* 씬 번호 뱃지 */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-black text-white"
                style={{ background: 'rgba(99,102,241,0.85)', backdropFilter: 'blur(8px)' }}>
                씬{apiLightboxIdx + 1}
              </div>
              {/* 닫기 버튼 */}
              <button
                onClick={() => setApiLightboxIdx(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm"
                style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}
              >✕</button>
              {/* 이전/다음 네비게이션 */}
              {(() => {
                const confirmed = Array.from(confirmedScenes).sort((a, b) => a - b);
                const cur = confirmed.indexOf(apiLightboxIdx);
                const prev = cur > 0 ? confirmed[cur - 1] : null;
                const next = cur < confirmed.length - 1 ? confirmed[cur + 1] : null;
                return (
                  <>
                    {prev !== null && sceneImages[prev] && (
                      <button onClick={() => setApiLightboxIdx(prev)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white font-black"
                        style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}>‹</button>
                    )}
                    {next !== null && sceneImages[next] && (
                      <button onClick={() => setApiLightboxIdx(next)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white font-black"
                        style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}>›</button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── 캐릭터 + 화풍 1줄 ── */}
        {tabMode === 'hybrid' && <div className="bg-white/5 border border-white/10 rounded-2xl mb-6 overflow-hidden">
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

          {/* 재번역 버튼 — 번역 캐시 수동 초기화 */}
          {artStyle && !isTranslating && translatedScenes.length > 0 && (
            <div className="px-4 pb-2 flex justify-end">
              <button
                onClick={async () => {
                  await saveStateIDB('translated_scenes', null);
                  await saveStateIDB('translated_style_id', null);
                  await saveStateIDB('scenes_hash', null);
                  await saveStateIDB('scene_hints_en', null);
                  autoTranslated.current = false;
                  setTranslatedScenes([]);
                  setSceneVisuals([]);
                  setSceneHintsEn([]);
                }}
                className="text-[10px] font-black text-slate-500 hover:text-fuchsia-400 transition-colors px-2 py-1 rounded border border-white/5 hover:border-fuchsia-400/30"
              >
                ↺ 프롬프트 재번역
              </button>
            </div>
          )}

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
        </div>}

        {/* ── 120UI: 씬 목록 + 프롬프트 ── */}
        {tabMode !== 'api' && <div className="flex gap-0">

          {/* 씬 목록 (좌측) */}
          <div className="shrink-0 w-1/3">
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
                    <React.Fragment key={sceneIds[i] ?? i}>
                      <div>
                        <SceneCard
                          idx={i} scene={scene}
                          selected={selectedIdx === i}
                          confirmed={confirmedScenes.has(i)}
                          onConfirm={() => {
                            const basePositive = nlPositiveEdits[i] ?? prompts[i]?.positive ?? '';
                            const baseNegative = nlNegativeEdits[i] ?? prompts[i]?.negative ?? '';
                            setConfirmedPrompts(prev => ({ ...prev, [i]: { positive: basePositive, negative: baseNegative } }));
                            setConfirmedScenes(prev => { const next = new Set(prev); next.add(i); return next; });
                          }}
                          onCancelConfirm={() => {
                            setConfirmedScenes(prev => { const next = new Set(prev); next.delete(i); return next; });
                            setConfirmedPrompts(prev => { const next = { ...prev }; delete next[i]; return next; });
                            setApiGenStatus(prev => { const next = { ...prev }; delete next[i]; return next; });
                            setApiGenErrors(prev => { const next = { ...prev }; delete next[i]; return next; });
                          }}
                          onDelete={scenes.length > 1 ? () => deleteScene(i) : undefined}
                          imageUrl={sceneImages[i]}
                          mp4Url={sceneMp4s[i]}
                          onSelect={() => setSelectedIdx(i)}
                          onImageAdd={file => {
                            const url = URL.createObjectURL(file);
                            updateSceneImage(i, url);
                            saveImageIDB(getSessionId(), i, file);
                            syncImageToServer(i, file);
                          }}
                          onMp4Add={file => {
                            const url = URL.createObjectURL(file);
                            updateSceneMp4(i, url);
                            saveMp4IDB(getSessionId(), i, file);
                          }}
                          onImageDelete={async () => {
                            updateSceneImage(i, '');
                            const db = await openIDB();
                            await new Promise<void>(res => {
                              const tx = db.transaction(IDB_IMAGES, 'readwrite');
                              tx.objectStore(IDB_IMAGES).delete(`${getSessionId()}_${i}`);
                              tx.oncomplete = () => res();
                              tx.onerror = () => res();
                            });
                            await fetch(`${API}/browser/image/${i}`, { method: 'DELETE' }).catch(() => {});
                            setServerImageSlots(prev => {
                              const next: Record<number, number> = {};
                              for (const [k, v] of Object.entries(prev)) {
                                if (Number(v) !== i) next[Number(k)] = Number(v);
                              }
                              return next;
                            });
                          }}
                          onMp4Delete={() => {
                            updateSceneMp4(i, '');
                            openIDB().then(db => {
                              const tx = db.transaction(IDB_IMAGES, 'readwrite');
                              tx.objectStore(IDB_IMAGES).delete(`${getSessionId()}_mp4_${i}`);
                            });
                          }}
                          mode={tabMode}
                        />
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
          {tabMode === 'all-mp4' ? (
            <div className="w-2/3 min-w-0">
              <Mp4PromptPanel
                key={selectedIdx}
                embedded
                selectedIdx={selectedIdx}
                sceneKo={(scenes[selectedIdx] || '').replace(/\[씬\s*\d+\]/gi, '').replace(/^scene\s+\d+[,.]?\s*/i, '').trim()}
                sceneEn={(() => {
                  const strip = (s: string) =>
                    s.replace(/\[씬\s*\d+\]/gi, '').replace(/^scene\s+\d+[,.]?\s*/i, '').replace(/^[,\s]+/, '').trim();
                  const edited = nlPositiveEdits[selectedIdx]?.trim() ?? '';
                  if (edited) return strip(edited);
                  const trans = translatedScenes[selectedIdx]?.trim() ?? '';
                  return strip(trans);
                })()}
                artStyleId={artStyle?.id}
                injectedCharAssets={charAssets}
                injectedCharId={selectedCharId}
                onCharIdChange={(id) => {
                  setSelectedCharId(id);
                  const found = charAssets.find(c => c.id === id);
                  rebuildPrompts(
                    translatedScenes, artStyle,
                    found?.promptEn ?? '',
                    sceneRoles, sceneVisuals,
                    false, id,
                  );
                }}
              />
            </div>
          ) : (
          <div className="flex-1 min-w-0 flex gap-0">

            {/* 중간 패널 (33%): 이미지 생성 옵션 */}
            <div className="w-1/2 shrink-0 p-3">
              <div className="lg-glass rounded-2xl overflow-hidden">
                <div className="relative z-[2] px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-fuchsia-500 flex items-center justify-center text-[10px] font-black text-white">1</span>
                    <span className="text-sm font-black text-white">이미지 옵션 설정</span>
                  </div>
                </div>
                <div className="relative z-[2] p-3 flex flex-col gap-3">

                  {/* 구도 */}
                  <div>
                    <p className="text-xs font-bold mb-2 flex items-center gap-1.5 text-gray-300"><span>🖼️</span>구도</p>
                    <div className="flex flex-wrap gap-1.5">
                      {IMG_COMPOSITION.map(o => (
                        <Tooltip key={o.id} text={o.desc}>
                          <button onClick={() => setImgOption('composition', o.id)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-normal transition-all"
                            style={imgOptionsRef.current.composition === o.id
                              ? { background: 'rgba(99,102,241,0.28)', border: '1px solid rgba(99,102,241,0.65)', color: '#a5b4fc', boxShadow: '0 0 14px rgba(99,102,241,0.35)', backdropFilter: 'blur(8px)' }
                              : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(8px)' }
                            }
                          >{o.label}</button>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                  {/* 심도 */}
                  <div>
                    <p className="text-xs font-bold mb-2 flex items-center gap-1.5 text-gray-300"><span>🔍</span>피사계 심도</p>
                    <div className="flex flex-wrap gap-1.5">
                      {IMG_DEPTH.map(o => (
                        <Tooltip key={o.id} text={o.desc}>
                          <button onClick={() => setImgOption('depth', o.id)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-normal transition-all"
                            style={imgOptionsRef.current.depth === o.id
                              ? { background: 'rgba(99,102,241,0.28)', border: '1px solid rgba(99,102,241,0.65)', color: '#a5b4fc', boxShadow: '0 0 14px rgba(99,102,241,0.35)', backdropFilter: 'blur(8px)' }
                              : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(8px)' }
                            }
                          >{o.label}</button>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                  {/* 조명 */}
                  <div>
                    <p className="text-xs font-bold mb-2 flex items-center gap-1.5 text-gray-300"><span>💡</span>조명</p>
                    <div className="flex flex-wrap gap-1.5">
                      {IMG_LIGHTING.map(o => (
                        <Tooltip key={o.id} text={o.desc}>
                          <button onClick={() => setImgOption('lighting', o.id)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-normal transition-all"
                            style={imgOptionsRef.current.lighting === o.id
                              ? { background: 'rgba(99,102,241,0.28)', border: '1px solid rgba(99,102,241,0.65)', color: '#a5b4fc', boxShadow: '0 0 14px rgba(99,102,241,0.35)', backdropFilter: 'blur(8px)' }
                              : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(8px)' }
                            }
                          >{o.label}</button>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                  {/* 렌즈 */}
                  <div>
                    <p className="text-xs font-bold mb-2 flex items-center gap-1.5 text-gray-300"><span>📷</span>렌즈</p>
                    <div className="flex flex-wrap gap-1.5">
                      {IMG_LENS.map(o => (
                        <Tooltip key={o.id} text={o.desc}>
                          <button onClick={() => setImgOption('lens', o.id)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-normal transition-all"
                            style={imgOptionsRef.current.lens === o.id
                              ? { background: 'rgba(99,102,241,0.28)', border: '1px solid rgba(99,102,241,0.65)', color: '#a5b4fc', boxShadow: '0 0 14px rgba(99,102,241,0.35)', backdropFilter: 'blur(8px)' }
                              : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(8px)' }
                            }
                          >{o.label}</button>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                  {/* 네거티브 (자동 적용 표시) */}
                  <div>
                    <p className="text-xs font-bold mb-2 flex items-center gap-1.5 text-gray-300">
                      <span>🚫</span>네거티브
                      <span className="font-normal text-gray-400">(화풍·구도 기반 자동 적용)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {IMG_NEGATIVE.map(o => {
                        const autoNeg = computeImgAutoNeg(imgOptionsRef.current.composition, '', imgOptionsRef.current.depth, artStyle?.id);
                        const isAuto  = autoNeg.has(o.id);
                        if (!isAuto) return null;
                        return (
                          <Tooltip key={o.id} text={o.desc}>
                            <span
                              className="px-3 py-1.5 rounded-lg text-[12px] font-normal flex items-center gap-1"
                              style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.45)', color: '#fcd34d', backdropFilter: 'blur(8px)' }}
                            >
                              {o.label}
                              <span className="text-[9px] font-black px-1 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.25)', color: '#fde68a' }}>자동</span>
                            </span>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>


                </div>
              </div>
            </div>

            {/* 우측 패널 (60%): 프롬프트 출력 */}
            <div className="w-[60%] min-w-0 flex flex-col gap-3 p-3">

            {/* 이미지 프롬프트 */}
            {(() => {
              const sceneKo = (scenes[selectedIdx] || '').replace(/\[씬\s*\d+\]/gi, '').trim();
              const selCharName = charAssets.find(c => c.id === selectedCharId)?.name || '';
              const def = artStyle ? STYLE_MAP[artStyle.id] : null;
              const stylePart = def ? [def.customPrompt, def.colorPalette].filter(Boolean).join(', Color palette: ') : '';

              return (
                <div className="bg-gradient-to-br from-fuchsia-950/60 to-indigo-950/40 border border-fuchsia-500/30 rounded-2xl p-5">
                  {/* 헤더 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-fuchsia-500 flex items-center justify-center text-[10px] font-black text-white">2</span>
                      <p className="text-sm font-black text-white">이미지 프롬프트</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { navigator.clipboard.writeText(selectedPositive).catch(() => {}); setImgCopiedPos(true); setTimeout(() => setImgCopiedPos(false), 2000); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all"
                        style={{ background: 'rgba(217,70,239,0.85)', color: '#fff', border: '1px solid rgba(217,70,239,0.5)' }}
                      >{imgCopiedPos ? '✓ 복사됨' : '프롬프트 복사'}</button>
                      {selectedNegative && (
                        <button onClick={() => { navigator.clipboard.writeText(selectedNegative).catch(() => {}); setImgCopiedNeg(true); setTimeout(() => setImgCopiedNeg(false), 2000); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all"
                          style={{ background: 'rgba(239,68,68,0.20)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.40)' }}
                        >{imgCopiedNeg ? '✓ 복사됨' : '네거티브 복사'}</button>
                      )}
                    </div>
                  </div>

                  {/* 레이어 정보 */}
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] font-black tracking-widest text-slate-400">구성 레이어</span>
                      <span className="text-slate-600 text-xs">→</span>
                    </div>
                    <div className="flex flex-col gap-2 pl-3 border-l-2 border-slate-700/60">
                      {selCharName && (
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-black shrink-0 w-14 pt-0.5 text-emerald-400">캐릭터</span>
                          <p className="text-[11px] leading-relaxed break-words rounded-lg px-2 py-1 font-mono text-emerald-300"
                            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.30)' }}>
                            {selCharName}
                          </p>
                        </div>
                      )}
                      {artStyle && stylePart && (
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-black shrink-0 w-14 pt-0.5 text-fuchsia-400">화풍</span>
                          <p className="text-[11px] leading-relaxed break-words rounded-lg px-2 py-1 font-mono text-fuchsia-300"
                            style={{ background: 'rgba(217,70,239,0.12)', border: '1px solid rgba(217,70,239,0.30)' }}>
                            {artStyle.label}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 씬 한글 설명 */}
                  {sceneKo && (
                    <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] font-black text-gray-500 mb-1.5">씬 한글 설명</p>
                      <p className="text-[11px] text-gray-300 leading-relaxed">{sceneKo}</p>
                    </div>
                  )}

                  {/* 최종 조합 프롬프트 */}
                  <div className="bg-black/30 rounded-xl p-4 font-mono text-xs leading-6">
                    {selectedPositive && (
                      <p className="break-words">
                        {(() => {
                          const subj = selectedPrompt?.subject;
                          if (subj && selectedPositive.startsWith(subj) && subj.length > 0) {
                            const rest = selectedPositive.slice(subj.length);
                            return (
                              <>
                                <span className="text-amber-200">{subj}</span>
                                <span className="text-fuchsia-300">{rest}</span>
                              </>
                            );
                          }
                          return <span className="text-fuchsia-300">{selectedPositive}</span>;
                        })()}
                      </p>
                    )}
                    {selectedNegative && <><p className="text-gray-500 text-[10px] mt-2 mb-1">— negative —</p><p className="text-red-400 break-words">{selectedNegative}</p></>}
                  </div>
                </div>
              );
            })()}

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
                      {(Object.entries(selectedPrompt) as [keyof FinalPrompt, string][]).map(([key, val]) => (
                        <tr key={key} className="border-b border-white/5 last:border-0">
                          <td className="py-2 pr-4 text-cyan-400 whitespace-nowrap align-top w-24">
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
                <p className="text-slate-600 italic text-sm p-4">화풍을 선택하면 프롬프트가 생성됩니다</p>
              )}

              <p className="text-xs text-slate-600 mt-3">
                💡 ComfyUI, SD WebUI, 커스텀 파이프라인의 파라미터 주입에 활용하세요
              </p>
            </div>

            </div>
          </div>
          )}


        </div>}

        {/* 하단 CTA — 음성 더빙 페이지로 이동 */}
        {tabMode !== 'api' && <div className="flex items-center justify-center gap-4 mt-12 flex-wrap">
          <Link href="/content/script" className="px-6 py-3 rounded-xl font-black text-sm text-slate-400 bg-white/5 border border-white/10 hover:text-white hover:border-white/20 transition-all">
            ← 대본으로 돌아가기
          </Link>
          {(() => {
            // tabMode별 filledCount 계산
            const filledCount = scenes.reduce((acc, _, i) => {
              if (tabMode === 'all-mp4') {
                return acc + (sceneMp4s[i] ? 1 : 0);
              }
              // hybrid — 이미지 or MP4
              return acc + (sceneImages[i] || sceneMp4s[i] ? 1 : 0);
            }, 0);
            const allFilled = filledCount === scenes.length && scenes.length > 0;
            const ctaLabel = tabMode === 'all-mp4' ? '영상 합치기' : '음성 더빙 + 영상 제작';
            const ctaDesc  = tabMode === 'all-mp4' ? 'FFmpeg으로 씬 MP4를 하나로 합칩니다' : null;
            return allFilled ? (
              <Link
                href={tabMode === 'all-mp4' ? '/content/remotion' : '/content/voice-dubbing'}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 shadow-2xl border bg-gradient-to-r from-fuchsia-600 to-indigo-600 border-fuchsia-500/40 shadow-fuchsia-500/20 hover:brightness-110"
              >
                <FontAwesomeIcon icon={faFilm} />
                {ctaLabel}
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm text-slate-500 border bg-slate-800/50 border-slate-700 cursor-not-allowed">
                  <FontAwesomeIcon icon={faFilm} />
                  {ctaLabel}
                  <span className="text-[10px] text-slate-600 ml-1">
                    (미디어 {filledCount}/{scenes.length})
                  </span>
                </div>
                {ctaDesc && <p className="text-[11px] text-slate-600">{ctaDesc}</p>}
              </div>
            );
          })()}
        </div>}

      </main>}

      {!isMobile && <p className="relative z-10 text-center mt-12 pb-8 text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]">
        키프레임 제작 · LinkDrop V2
      </p>}

      {/* ── 하단 고정 이미지 도구 책갈피 (가로형) ── */}
      {tabMode === 'hybrid' && <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex flex-row gap-1.5 pb-0">
        {KEYFRAME_TOOLS.map((tool, idx) => (
          <button
            key={tool.id}
            disabled={!charAssetsReady}
            onClick={() => {
              if (!charAssetsReady) return;
              if (selectedPositive) {
                navigator.clipboard.writeText(selectedPositive);
                setToolCopied(tool.id);
                setTimeout(() => setToolCopied(null), 2000);
              }
              const _sc = charAssets.find(c => c.id === selectedCharId);
              const allPrompts = scenes.map((_, i) => {
                if (nlPositiveEdits[i] !== undefined) return nlPositiveEdits[i];
                const sp = prompts[i];
                if (sp?.positive) return sp.positive;
                if (translatedScenes[i] && artStyle) {
                  return buildFinalPrompt(sceneVisuals[i] || translatedScenes[i], sceneHintsEn[i] ?? '', sceneRoles[i] ?? '', artStyle, _sc?.promptEn ?? '', !!_sc?.faceGridUrl, !!_sc?.bodyGridUrl,
                    imgOptionsRef.current).positive;
                }
                return sp?.positive ?? '';
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
                    mp4_prompts: scenes.map((s, i) => {
                    const en = (translatedScenesRef.current[i] || '').replace(/\[씬\s*\d+\]/gi, '').replace(/^scene\s+\d+[,.]?\s*/i, '').trim();
                    if (en) return en;
                    const vis = (sceneVisualsRef.current[i] || '').trim();
                    if (vis) return vis;
                    return s.replace(/\[씬\s*\d+\]/g, '').trim(); // 한국어 원문 최종 fallback
                  }),
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
      </div>}

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
