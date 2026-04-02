'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// ── 타입 ──────────────────────────────────────────────────────────────────────
interface RegisteredCharacter {
  id: string;
  name: string;
  imageDataUrl: string;
  promptCompact: string; // 최대 250자, AI 이미지 생성용
  promptFull: string;    // 최대 500자, 씬 조합 + 사용자 복사용
  faceGridUrl?: string;  // 8감정 그리드 이미지 (선택)
  bodyGridUrl?: string;  // 4뷰 전신 그리드 이미지 (선택)
  registeredAt: string;
  registeredBy: string; // 'admin' | session_key UUID
}

// DB row → 앱 타입 변환
function rowToChar(row: Record<string, unknown>): RegisteredCharacter {
  return {
    id:             row.id as string,
    name:           row.name as string,
    imageDataUrl:   row.image_data_url as string,
    promptCompact:  row.prompt_compact as string,
    promptFull:     row.prompt_full as string,
    faceGridUrl:    (row.face_grid_url as string) || undefined,
    bodyGridUrl:    (row.body_grid_url as string) || undefined,
    registeredAt:   row.registered_at as string,
    registeredBy:   row.registered_by as string,
  };
}

// ── 세션키 / 관리자 헬퍼 ──────────────────────────────────────────────────────
function getSessionKey(): string {
  let key = localStorage.getItem('ld_session_key');
  if (!key) { key = crypto.randomUUID(); localStorage.setItem('ld_session_key', key); }
  return key;
}
function isAdmin(): boolean {
  return !!localStorage.getItem('ld_admin_token');
}

// ── Supabase CRUD ─────────────────────────────────────────────────────────────
async function loadCharsFromDB(sessionKey: string, admin: boolean): Promise<RegisteredCharacter[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('registered_by', { ascending: false }) // admin 먼저
    .order('registered_at', { ascending: false });

  if (error || !data) return [];

  const all = data.map(rowToChar);
  if (admin) return all;
  return all.filter(c => c.registeredBy === 'admin' || c.registeredBy === sessionKey);
}

async function saveCharToDB(char: RegisteredCharacter): Promise<void> {
  const { error } = await supabase.from('characters').upsert({
    id:              char.id,
    name:            char.name,
    image_data_url:  char.imageDataUrl,
    prompt_compact:  char.promptCompact,
    prompt_full:     char.promptFull,
    face_grid_url:   char.faceGridUrl ?? null,
    body_grid_url:   char.bodyGridUrl ?? null,
    registered_by:   char.registeredBy,
    registered_at:   char.registeredAt,
  });
  if (error) throw error;
}

async function deleteCharFromDB(id: string): Promise<void> {
  const { error } = await supabase.from('characters').delete().eq('id', id);
  if (error) throw error;
}

// ── Gemini 분석 (compact + full 병렬) ────────────────────────────────────────
async function analyzeCharacterPrompts(
  dataUrl: string,
  apiKey: string
): Promise<{ compact: string; full: string }> {
  const base64   = dataUrl.split(',')[1];
  const mimeType = dataUrl.split(';')[0].split(':')[1];

  const callGemini = async (promptText: string) => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { data: base64, mimeType } },
              { text: promptText }
            ]
          }]
        })
      }
    );
    const data = await res.json();
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
    if (!text) throw new Error('분석 결과가 없습니다.');
    return text;
  };

  const [compact, full] = await Promise.all([
    callGemini(`You are a character prompt engineer for AI image and video generation tools (Midjourney, Flux, Kling AI, Runway).

Analyze this character image and output a COMPACT English character description prompt.

Requirements:
- Maximum 250 characters total
- Comma-separated key identifiers only
- Order: gender+age → art style → hair → face feature → clothing → mood
- Be specific but brief (e.g. "dark chestnut bob" not just "brown hair")
- No sentences, no explanations, output the prompt only

Example:
Korean woman 40s, semi-realistic style, short dark chestnut bob with side part, warm deep brown almond eyes, fair skin, ivory white formal blouse, small pearl earrings, gentle trustworthy expression`),

    callGemini(`You are a character prompt engineer for AI image and video generation tools (Midjourney, Flux, Kling AI, Runway).

Analyze this character image and output a FULL English character description prompt for combining with scene prompts.

Requirements:
- Maximum 500 characters total
- Comma-separated descriptors
- Order: gender+age → art style → hair (color+length+style) → eyes (color+shape) → face features → skin → clothing (color+type) → accessories → mood/expression
- Include enough detail so the character stays consistent across multiple scene images
- No sentences, no explanations, output the prompt only

Example:
Korean woman in her 40s, semi-realistic 3D CGI style, short dark chestnut bob with side part swept behind ear, warm deep brown almond-shaped eyes with subtle double eyelid, gentle smile lines around mouth, fair porcelain skin with natural blush, ivory white fitted formal blouse with collar, small round pearl stud earrings, calm trustworthy and warm expression, soft studio lighting`)
  ]);

  return {
    compact: compact.slice(0, 250),
    full:    full.slice(0, 500),
  };
}

// ── 그리드 프롬프트 빌더 (AI 호출 없음, 캐릭터 compact 재조합) ──────────────
function buildFaceGridPrompt(compact: string): string {
  return `character expression reference sheet, 8 emotions in 2x4 grid layout, white background, full body head to toe in every panel, same character in every panel, ${compact}, panels labeled: happy, sad, angry, surprised, neutral, shy, excited, fearful, consistent art style, no background elements, clean flat illustration --no upper body only, half body, bust shot, cropped legs, portrait only`;
}

function buildBodyGridPrompt(compact: string): string {
  return `character turnaround reference sheet, 4 full body views in 1x4 horizontal grid layout, wide 16:9 format, white background, full body head to toe, complete legs and feet visible, ${compact}, panels left to right: front view, left side view, right side view, back view, consistent art style, no background elements, clean flat illustration --no upper body only, half body, bust shot, cropped legs, waist up`;
}

// ── 상세 모달 ─────────────────────────────────────────────────────────────────
function CharDetailModal({ char, onClose, onDelete, onUpdate }: {
  char: RegisteredCharacter;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updated: RegisteredCharacter) => void;
}) {
  const [editName,    setEditName]    = React.useState(char.name);
  const [editCompact, setEditCompact] = React.useState(char.promptCompact);
  const [editFull,    setEditFull]    = React.useState(char.promptFull);
  const [activeTab,   setActiveTab]   = React.useState<'compact' | 'full'>('compact');
  const [saving,      setSaving]      = React.useState(false);
  const [saved,       setSaved]       = React.useState(false);
  const [copied,      setCopied]      = React.useState(false);

  const isDirty = editName.trim() !== char.name
    || editCompact.trim() !== char.promptCompact
    || editFull.trim() !== char.promptFull;

  const handleSave = async () => {
    if (!editName.trim() || !editCompact.trim() || !editFull.trim()) return;
    setSaving(true);
    try {
      const updated: RegisteredCharacter = {
        ...char,
        name:          editName.trim(),
        promptCompact: editCompact.trim().slice(0, 250),
        promptFull:    editFull.trim().slice(0, 500),
      };
      await saveCharToDB(updated);
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    const text = activeTab === 'compact' ? editCompact : editFull;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <div className="lg-glass rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <p className="text-base font-black text-white">캐릭터 편집</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        {/* 본문 */}
        <div className="p-6 flex gap-6 overflow-y-auto flex-1">

          {/* 좌: 이미지 */}
          <div className="shrink-0 w-44">
            <img src={char.imageDataUrl} alt={char.name} className="w-full rounded-xl object-contain bg-black/30 border border-white/5" />
            <p className="text-xs text-slate-600 mt-2 text-center">등록일: {new Date(char.registeredAt).toLocaleDateString('ko-KR')}</p>
          </div>

          {/* 우: 편집 필드 */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">

            {/* 이름 */}
            <div>
              <label className="text-sm font-black text-slate-400 mb-1.5 block">캐릭터 이름</label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#a78bfa]/50 transition-all"
              />
            </div>

            {/* 프롬프트 탭 */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-1 mb-2">
                <button
                  onClick={() => setActiveTab('compact')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'compact' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  압축 <span className="opacity-60">({editCompact.length}/250)</span>
                </button>
                <button
                  onClick={() => setActiveTab('full')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'full' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  전체 <span className="opacity-60">({editFull.length}/500)</span>
                </button>
                <button onClick={handleCopy} className="ml-auto text-xs text-[#a78bfa] hover:text-violet-300 font-bold transition-colors">
                  {copied ? '✓ 복사됨' : '복사'}
                </button>
              </div>

              {activeTab === 'compact' ? (
                <>
                  <textarea
                    value={editCompact}
                    onChange={e => setEditCompact(e.target.value.slice(0, 250))}
                    rows={4}
                    className="w-full bg-slate-900 border border-violet-500/40 rounded-xl px-4 py-3 text-sm font-mono text-violet-300 leading-relaxed focus:outline-none focus:border-violet-400 transition-all resize-none"
                  />
                  <p className="text-xs text-slate-600 mt-1">AI 이미지 생성용 (Kling·Runway) · {editCompact.length}/250자</p>
                </>
              ) : (
                <>
                  <textarea
                    value={editFull}
                    onChange={e => setEditFull(e.target.value.slice(0, 500))}
                    rows={7}
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-4 py-3 text-sm font-mono text-emerald-300 leading-relaxed focus:outline-none focus:border-emerald-400 transition-all resize-none"
                  />
                  <p className="text-xs text-slate-600 mt-1">씬 조합·복사용 · {editFull.length}/500자</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between shrink-0">
          <button
            onClick={() => { onDelete(char.id); onClose(); }}
            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/30 text-sm font-black transition-all border border-red-500/20"
          >
            삭제
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving || !editName.trim() || !editCompact.trim() || !editFull.trim()}
            className={`lg-btn px-6 py-2 rounded-xl text-sm font-black
              ${isDirty && editName.trim() && editCompact.trim() && editFull.trim()
                ? 'lg-btn-violet text-white'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
          >
            {saving ? '저장 중...' : saved ? '✓ 저장 완료' : '수정 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CharacterImagePage() {
  const [chars,         setChars]         = useState<RegisteredCharacter[]>([]);
  const [name,          setName]          = useState('');
  const [promptCompact, setPromptCompact] = useState('');
  const [promptFull,    setPromptFull]    = useState('');
  const [activeTab,     setActiveTab]     = useState<'compact' | 'full'>('compact');
  const [imageUrl,      setImageUrl]      = useState<string | null>(null);
  const [imageData,     setImageData]     = useState<string | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [dragOver,      setDragOver]      = useState(false);
  const [analyzing,     setAnalyzing]     = useState(false);
  const [analyzeErr,    setAnalyzeErr]    = useState<string | null>(null);
  const errTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const setErrWithTimeout = React.useCallback((msg: string | null) => {
    if (errTimerRef.current) clearTimeout(errTimerRef.current);
    setAnalyzeErr(msg);
    if (msg) errTimerRef.current = setTimeout(() => setAnalyzeErr(null), 10000);
  }, []);
  const [modalChar,     setModalChar]     = useState<RegisteredCharacter | null>(null);
  const [loadErr,       setLoadErr]       = useState<string | null>(null);
  const [faceGridData,  setFaceGridData]  = useState<string | null>(null);
  const [bodyGridData,  setBodyGridData]  = useState<string | null>(null);
  const [copiedFace,    setCopiedFace]    = useState(false);
  const [copiedBody,    setCopiedBody]    = useState(false);
  const fileRef     = useRef<HTMLInputElement>(null);
  const faceGridRef = useRef<HTMLInputElement>(null);
  const bodyGridRef = useRef<HTMLInputElement>(null);

  const canSubmit = name.trim() && promptCompact.trim() && promptFull.trim() && imageData && faceGridData && bodyGridData;
  const sessionKey = typeof window !== 'undefined' ? getSessionKey() : '';
  const admin      = typeof window !== 'undefined' ? isAdmin() : false;

  useEffect(() => {
    loadCharsFromDB(sessionKey, admin)
      .then(setChars)
      .catch(() => setLoadErr('캐릭터 목록을 불러오지 못했습니다. Supabase 연결을 확인하세요.'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const analyzeCharacter = async (dataUrl: string) => {
    const apiKey = localStorage.getItem('ld_google_api_key') ?? '';
    if (!apiKey) {
      setErrWithTimeout('Google API Key가 없습니다. 키프레임 페이지 설정에서 먼저 등록하세요.');
      return;
    }
    setAnalyzing(true);
    setAnalyzeErr(null);
    setPromptCompact('');
    setPromptFull('');
    try {
      const { compact, full } = await analyzeCharacterPrompts(dataUrl, apiKey);
      setPromptCompact(compact);
      setPromptFull(full);
    } catch (e: unknown) {
      setErrWithTimeout(e instanceof Error ? e.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      setImageUrl(data);
      setImageData(data);
      analyzeCharacter(data);
    };
    reader.readAsDataURL(file);
  };

  const handleGridImage = (file: File, type: 'face' | 'body') => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      if (type === 'face') setFaceGridData(data);
      else setBodyGridData(data);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const char: RegisteredCharacter = {
        id:            crypto.randomUUID(),
        name:          name.trim(),
        imageDataUrl:  imageData!,
        promptCompact: promptCompact.trim().slice(0, 250),
        promptFull:    promptFull.trim().slice(0, 500),
        faceGridUrl:   faceGridData ?? undefined,
        bodyGridUrl:   bodyGridData ?? undefined,
        registeredAt:  new Date().toISOString(),
        registeredBy:  admin ? 'admin' : sessionKey,
      };
      await saveCharToDB(char);
      setChars(prev => [char, ...prev]);
      setName(''); setPromptCompact(''); setPromptFull('');
      setImageUrl(null); setImageData(null);
      setFaceGridData(null); setBodyGridData(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      setErrWithTimeout(`저장 실패: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCharFromDB(id);
    setChars(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="bg-[#0f0f1a] min-h-screen text-white pb-24 font-sans antialiased">

      {/* 배경 블롭 */}
      <div className="lg-scene">
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />
      </div>

      {/* Hero Header */}
      <header
        className="relative pt-24 pb-32 text-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/img/content/character/characterimage_top_bg.webp')" }}
      >
        <div className="absolute inset-0 bg-[#0f0f1a]/70" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#6366f1_0%,transparent_70%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#a78bfa] text-[8px] font-bold tracking-wider mb-6">
            🎭 AI CHARACTER STUDIO
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tighter">
            나만의 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] to-[#6366f1]">AI 캐릭터</span> 등록
          </h1>
          <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            대표이미지를 업로드하면 AI가 캐릭터 외형을 자동 분석합니다.<br />
            등록된 캐릭터는 키프레임 생성과 MP4 프롬프트 생성기에서 자동으로 활용됩니다.
          </p>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 -mt-16 relative z-20 flex flex-col gap-8 pb-12">

        {/* DB 연결 오류 */}
        {loadErr && (
          <div className="lg-glass rounded-2xl p-4 text-sm text-red-400 font-bold" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)' }}>
            ⚠️ {loadErr}
          </div>
        )}

        {/* ── 등록 폼 ── */}
        <section className="lg-glass rounded-[2rem] p-8">

          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 text-white text-sm">✦</div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-widest">새 캐릭터 등록</h2>
              <p className="text-sm text-slate-500 mt-0.5">이름 · 이미지 · 프롬프트 3가지 모두 입력해야 등록됩니다</p>
            </div>
            <div className="ml-auto text-sm text-slate-500">{chars.length}개 등록됨</div>
          </div>

          <div className="grid md:grid-cols-[1fr_2fr] gap-8">

            {/* LEFT: 이미지 + 이름 + 등록 버튼 */}
            <div className="flex flex-col gap-5">

              {/* 이미지 업로드 */}
              <div>
                <label className="text-sm font-black text-slate-400 flex items-center gap-1.5 mb-2">
                  대표이미지 <span className="text-red-400">*</span>
                  <span className="font-normal text-slate-600">정면 전신샷</span>
                </label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f); e.target.value = ''; }} />
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleImage(f); }}
                  className={`relative cursor-pointer rounded-2xl border-2 border-dashed overflow-hidden transition-all flex items-center justify-center
                    ${imageUrl ? 'h-60 border-[#a78bfa]/60' : 'h-44'}
                    ${dragOver ? 'border-[#a78bfa] bg-[#a78bfa]/10' : !imageUrl ? 'border-slate-700 hover:border-slate-500 bg-black/20' : ''}`}
                >
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt="" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all flex items-center justify-center">
                        <span className="opacity-0 hover:opacity-100 text-sm font-black text-white bg-black/60 px-3 py-1 rounded-lg">교체</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center p-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-slate-400">🖼️</div>
                      <p className="text-sm font-black text-white">클릭 또는 파일을 드래그</p>
                      <p className="text-xs text-slate-500">JPG · PNG · WEBP</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT: 프롬프트 출력 */}
            <div className="flex flex-col gap-4">

              {/* 안내 (이미지 없을 때) */}
              {!imageData && !analyzing && (
                <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'rgba(10,10,20,0.75)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                  <p className="text-sm font-black text-[#a78bfa]">📌 대표 이미지를 먼저 업로드하세요</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    이미지를 업로드하면 AI가 캐릭터 외형을 자동 분석하여
                    <span className="text-white font-bold"> 압축(250자) + 전체(500자)</span> 영문 프롬프트를 동시에 생성합니다.
                  </p>
                  <div className="border-t border-white/5 pt-3">
                    <p className="text-xs font-black text-amber-400 mb-2">★ 등록 전 필수 확인</p>
                    <ul className="flex flex-col gap-1.5">
                      <li className="text-xs text-slate-500 leading-relaxed">• 대표이미지는 <b className="text-slate-300">정면 전신샷</b>으로 등록하세요 — 측면·반신은 분석 품질이 낮아집니다</li>
                      <li className="text-xs text-slate-500 leading-relaxed">• 배경·소품·다른 인물이 포함된 이미지는 <b className="text-slate-300">프롬프트가 오염</b>됩니다</li>

                      <li className="text-xs text-slate-500 leading-relaxed">• Face Grid는 <b className="text-slate-300">동일 캐릭터 · 흰 배경 · 8칸 균등 배치</b>로 생성해야 씬 적용 시 일관성이 유지됩니다</li>
                      <li className="text-xs text-slate-500 leading-relaxed">• Body Grid는 <b className="text-slate-300">전신 · 흰 배경 · 4칸 가로 배치(16:9)</b>로 생성하세요 — 부분 신체 이미지는 등록 불가</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* 분석 중 */}
              {analyzing && (
                <div className="lg-glass rounded-2xl p-8 flex flex-col items-center gap-4" style={{ borderColor: 'rgba(167,139,250,0.3)' }}>
                  <span className="inline-block w-10 h-10 border-4 border-[#a78bfa]/20 border-t-[#a78bfa] rounded-full animate-spin" />
                  <p className="text-[8px] font-black text-[#a78bfa]">캐릭터 외형 분석 중...</p>
                  <p className="text-[8px] text-slate-500">압축 프롬프트 + 전체 프롬프트 동시 생성 중</p>
                </div>
              )}

              {/* 오류 */}
              {analyzeErr && (
                <div className="lg-glass rounded-2xl p-4 flex items-start gap-3" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)' }}>
                  <span className="text-red-400 text-[8px] shrink-0">⚠️</span>
                  <div>
                    <p className="text-[8px] font-black text-red-400">오류</p>
                    <p className="text-[8px] text-red-400/70 mt-1">{analyzeErr}</p>
                    {imageData && (
                      <button
                        onClick={() => analyzeCharacter(imageData)}
                        className="mt-2 text-[8px] font-bold text-red-400 hover:text-red-300 underline"
                      >
                        다시 시도
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 프롬프트 탭 */}
              {(imageData || promptCompact) && !analyzing && (
                <div className="flex-1 flex flex-col gap-2">

                  {/* 탭 헤더 */}
                  <div className="flex items-center gap-1 mb-1">
                    <button
                      onClick={() => setActiveTab('compact')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'compact' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      압축 프롬프트 <span className="opacity-60 font-normal">({promptCompact.length}/250)</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('full')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'full' ? 'bg-emerald-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      전체 프롬프트 <span className="opacity-60 font-normal">({promptFull.length}/500)</span>
                    </button>
                    {(promptCompact || promptFull) && (
                      <span className="ml-auto text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        ✓ AI 분석 완료
                      </span>
                    )}
                  </div>

                  {activeTab === 'compact' ? (
                    <>
                      <textarea
                        value={promptCompact}
                        onChange={e => setPromptCompact(e.target.value.slice(0, 250))}
                        rows={4}
                        placeholder="이미지 업로드 시 자동으로 채워집니다..."
                        className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all resize-none leading-relaxed font-mono bg-slate-900 border border-violet-500/40 text-violet-300 focus:border-violet-400"
                      />
                      <p className="text-xs text-slate-600">AI 이미지 생성용 (Kling·Runway) · 직접 수정 가능</p>
                    </>
                  ) : (
                    <>
                      <textarea
                        value={promptFull}
                        onChange={e => setPromptFull(e.target.value.slice(0, 500))}
                        rows={7}
                        placeholder="이미지 업로드 시 자동으로 채워집니다..."
                        className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all resize-none leading-relaxed font-mono bg-slate-900 border border-emerald-500/40 text-emerald-300 focus:border-emerald-400"
                      />
                      <p className="text-xs text-slate-600">씬 조합 및 외부 툴 복사용 · 직접 수정 가능</p>
                    </>
                  )}

                  <div className="flex items-center justify-end">
                    {(promptCompact || promptFull) && (
                      <button
                        onClick={() => imageData && analyzeCharacter(imageData)}
                        className="text-xs text-[#a78bfa] hover:text-violet-300 font-bold transition-colors"
                      >
                        재분석
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 그리드 이미지 생성 프롬프트 ── */}
          {promptCompact && !analyzing && (
            <div className="mt-8 pt-8 border-t border-white/8">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🎨</span>
                <p className="text-sm font-black text-white">그리드 이미지 생성</p>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                아래 프롬프트를 복사해 미드저니에서 이미지 생성 후 업로드 &nbsp;·&nbsp;
                <span className="text-amber-400 font-black">반드시 16:9 가로형 이미지로 생성하세요</span>
                <span className="text-slate-600"> (예: --ar 16:9)</span>
              </p>

              <div className="grid md:grid-cols-2 gap-4">

                {/* Face Grid */}
                <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-[#a78bfa]">😊 Face Grid</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">8가지 감정 표정 · 2×4 그리드</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(buildFaceGridPrompt(promptCompact)).catch(() => {});
                        setCopiedFace(true);
                        setTimeout(() => setCopiedFace(false), 2000);
                      }}
                      className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all active:scale-95"
                      style={copiedFace
                        ? { background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)', color: '#6ee7b7' }
                        : { background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: '#c4b5fd' }}
                    >
                      {copiedFace ? '✓ 복사됨' : '📋 복사'}
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-400 font-mono leading-relaxed bg-black/30 rounded-xl p-3 whitespace-pre-wrap break-all select-all">
                    {buildFaceGridPrompt(promptCompact)}
                  </pre>
                  {/* 업로드 슬롯 */}
                  <input ref={faceGridRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleGridImage(f, 'face'); e.target.value = ''; }} />
                  <div
                    onClick={() => faceGridRef.current?.click()}
                    className="cursor-pointer rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all hover:border-[#a78bfa]/60"
                    style={{ borderColor: faceGridData ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)', minHeight: faceGridData ? 120 : 56 }}
                  >
                    {faceGridData ? (
                      <div className="relative w-full">
                        <img src={faceGridData} alt="face grid" className="w-full rounded-xl object-contain max-h-40" />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/50 rounded-xl flex items-center justify-center transition-all">
                          <span className="opacity-0 hover:opacity-100 text-[10px] font-black text-white bg-black/60 px-2 py-1 rounded-lg">교체</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] font-bold py-4"><span className="text-red-400">*</span> <span className="text-slate-400">생성한 Face Grid 이미지 업로드 (필수)</span></p>
                    )}
                  </div>
                </div>

                {/* Body Grid */}
                <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-indigo-400">🧍 Body Grid</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">4방향 전신 · 4×1 그리드</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(buildBodyGridPrompt(promptCompact)).catch(() => {});
                        setCopiedBody(true);
                        setTimeout(() => setCopiedBody(false), 2000);
                      }}
                      className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all active:scale-95"
                      style={copiedBody
                        ? { background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)', color: '#6ee7b7' }
                        : { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc' }}
                    >
                      {copiedBody ? '✓ 복사됨' : '📋 복사'}
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-400 font-mono leading-relaxed bg-black/30 rounded-xl p-3 whitespace-pre-wrap break-all select-all">
                    {buildBodyGridPrompt(promptCompact)}
                  </pre>
                  {/* 업로드 슬롯 */}
                  <input ref={bodyGridRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleGridImage(f, 'body'); e.target.value = ''; }} />
                  <div
                    onClick={() => bodyGridRef.current?.click()}
                    className="cursor-pointer rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all hover:border-indigo-500/60"
                    style={{ borderColor: bodyGridData ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)', minHeight: bodyGridData ? 120 : 56 }}
                  >
                    {bodyGridData ? (
                      <div className="relative w-full">
                        <img src={bodyGridData} alt="body grid" className="w-full rounded-xl object-contain max-h-40" />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/50 rounded-xl flex items-center justify-center transition-all">
                          <span className="opacity-0 hover:opacity-100 text-[10px] font-black text-white bg-black/60 px-2 py-1 rounded-lg">교체</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] font-bold py-4"><span className="text-red-400">*</span> <span className="text-slate-400">생성한 Body Grid 이미지 업로드 (필수)</span></p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── 캐릭터 이름 + 등록 버튼 ── */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4 items-end">
            <div className="md:w-1/3">
              <label className="text-sm font-black text-slate-400 flex items-center gap-1.5 mb-2">
                캐릭터 이름 <span className="text-red-400">*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="예: 건강박사 김선생, 동화 할머니"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#a78bfa]/50 transition-all"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className={`lg-btn shrink-0 px-10 py-3 rounded-2xl text-base font-black flex items-center justify-center gap-2 transition-all duration-200
                ${canSubmit && !saving
                  ? 'text-white active:scale-95'
                  : 'bg-slate-800/60 text-slate-600 cursor-not-allowed border border-white/5'}`}
              style={canSubmit && !saving ? {
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #6d28d9 100%)',
                border: '1px solid rgba(167,139,250,0.5)',
                boxShadow: '0 0 24px rgba(124,58,237,0.5), 0 8px 32px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
              } : undefined}
            >
              {saving ? (
                <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />저장 중...</>
              ) : saved ? (
                <>✓ 등록 완료!</>
              ) : !imageData ? (
                <>대표이미지 필요</>
              ) : !faceGridData ? (
                <>Face Grid 필요</>
              ) : !bodyGridData ? (
                <>Body Grid 필요</>
              ) : !name.trim() ? (
                <>이름 입력 필요</>
              ) : (
                <>🎭 캐릭터 등록</>
              )}
            </button>
          </div>

        </section>

        {/* ── 등록된 캐릭터 목록 ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-base font-black text-white">등록된 캐릭터</h2>
            <span className="text-sm font-bold text-[#a78bfa] bg-[#a78bfa]/10 border border-[#a78bfa]/20 px-2.5 py-0.5 rounded-full">{chars.length}개</span>
            <span className="text-sm text-slate-600">— 키프레임 · MP4 프롬프트 생성기에서 자동 사용됩니다</span>
          </div>

          {chars.length === 0 ? (
            <div className="lg-glass rounded-[2rem] p-16 text-center" style={{ borderStyle: 'dashed' }}>
              <p className="text-4xl mb-3 opacity-20">🎭</p>
              <p className="text-sm font-bold text-slate-500">아직 등록된 캐릭터가 없습니다</p>
              <p className="text-sm text-slate-600 mt-1">위 폼에서 첫 번째 캐릭터를 등록해 보세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {chars.map(ch => (
                <div
                  key={ch.id}
                  onClick={() => setModalChar(ch)}
                  className="lg-glass lg-card group relative rounded-2xl overflow-hidden cursor-pointer hover:border-[#a78bfa]/40"
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <img src={ch.imageDataUrl} alt={ch.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-black text-white truncate">{ch.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ch.promptCompact}</p>
                  </div>
                  <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-full ${ch.registeredBy === 'admin' ? 'bg-amber-400/85' : 'bg-[#a78bfa]/80'}`}>
                    <span className="text-xs font-black text-white">
                      {ch.registeredBy === 'admin' ? '공용' : '내 캐릭터'}
                    </span>
                  </div>
                  {(admin || ch.registeredBy === sessionKey) && (
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(ch.id); }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-slate-400 hover:bg-red-600 hover:text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* 편집 모달 */}
      {modalChar && (
        <CharDetailModal
          char={modalChar}
          onClose={() => setModalChar(null)}
          onDelete={handleDelete}
          onUpdate={updated => {
            setChars(prev => prev.map(c => c.id === updated.id ? updated : c));
            setModalChar(updated);
          }}
        />
      )}
    </div>
  );
}
