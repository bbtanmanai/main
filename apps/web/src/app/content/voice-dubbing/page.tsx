'use client';

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faPause, faSpinner,
  faVolumeUp, faArrowLeft, faDownload,
} from '@fortawesome/free-solid-svg-icons';
import voicesRaw from '@/data/voices.json';

const API = process.env.NEXT_PUBLIC_API_URL;

type Voice = { id: string; name: string; voice_id: string; engine?: string; gender: string; age: string; language: string; preview: string };
const VOICES = voicesRaw as Voice[];

export default function VoiceDubbingPage() {
  const [scenes, setScenes]         = React.useState<string[]>([]);
  const [idea, setIdea]             = React.useState('');
  const [selectedVoice, setSelectedVoice] = React.useState('ko-KR-InJoonNeural');
  const [voiceAccordionOpen, setVoiceAccordionOpen] = React.useState(false);
  const [ttsSpeed, setTtsSpeed]   = React.useState(1.0);
  const [ttsStatus, setTtsStatus]   = React.useState<Record<number, 'idle' | 'generating' | 'done' | 'error'>>({});
  const [playingIdx, setPlayingIdx] = React.useState<number | null>(null);
  const [previewingVoice, setPreviewingVoice] = React.useState<string | null>(null);
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // IndexedDB 헬퍼 (TTS MP3 저장/복원)
  const IDB_NAME = 'ld_voice_dubbing';
  const IDB_STORE = 'tts';

  const openIDB = React.useCallback(() => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }, []);

  const saveTtsIDB = React.useCallback(async (idx: number, blob: Blob, sceneText: string) => {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(blob, `tts_${idx}`);
    store.put(sceneText, `tts_text_${idx}`);
    store.put(localStorage.getItem('ld_script_id') ?? '', 'tts_script_id');
  }, [openIDB]);

  const clearTtsIDB = React.useCallback(async (idx: number) => {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.delete(`tts_${idx}`);
    store.delete(`tts_text_${idx}`);
  }, [openIDB]);

  const loadAllTtsIDB = React.useCallback(async (sceneList: string[]): Promise<Record<number, boolean>> => {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const result: Record<number, boolean> = {};
    await Promise.all(
      sceneList.map((scene, i) =>
        new Promise<void>(res => {
          const blobReq = store.get(`tts_${i}`);
          blobReq.onsuccess = () => {
            if (!blobReq.result) { res(); return; }
            const textReq = store.get(`tts_text_${i}`);
            textReq.onsuccess = () => {
              // 저장된 텍스트와 현재 씬이 일치할 때만 복원
              if (textReq.result === scene.replace(/\[씬\s*\d+\]/gi, '').trim()) {
                result[i] = true;
              }
              res();
            };
            textReq.onerror = () => res();
          };
          blobReq.onerror = () => res();
        })
      )
    );
    return result;
  }, [openIDB]);

  const getTtsBlobUrl = React.useCallback(async (idx: number): Promise<string | null> => {
    const db = await openIDB();
    return new Promise(res => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(`tts_${idx}`);
      req.onsuccess = () => { res(req.result ? URL.createObjectURL(req.result) : null); };
      req.onerror = () => res(null);
    });
  }, [openIDB]);

  // 씬 데이터 로드 + 저장된 TTS 복원 (변경된 씬 자동 무효화)
  const loadSession = React.useCallback(async () => {
    try {
      const r = await fetch(`${API}/browser/session`);
      const data = await r.json();
      if (data.scenes?.length) {
        const SCENE_LIMIT = 3;
        const sceneList: string[] = data.scenes.slice(0, SCENE_LIMIT);
        setScenes(sceneList);

        // script_id 비교 — 새 대본이면 전체 TTS 무효화
        const sessionScriptId = data.script_id ?? '';
        const db = await openIDB();
        const storedScriptId: string = await new Promise(res => {
          const tx = db.transaction(IDB_STORE, 'readonly');
          const req = tx.objectStore(IDB_STORE).get('tts_script_id');
          req.onsuccess = () => res(req.result ?? '');
          req.onerror  = () => res('');
        });

        if (sessionScriptId && sessionScriptId !== storedScriptId) {
          // 새 대본 → IDB 전체 삭제 + status 초기화
          await Promise.all(
            sceneList.map((_, i) => clearTtsIDB(i))
          );
          setTtsStatus({});
        } else {
          // 동일 대본 → 씬별 텍스트 비교 (부분 수정 감지)
          const saved = await loadAllTtsIDB(sceneList);
          await Promise.all(
            sceneList.map(async (_: string, i: number) => {
              if (!saved[i]) await clearTtsIDB(i);
            })
          );
          const restored: Record<number, 'done'> = {};
          for (const idx of Object.keys(saved)) restored[Number(idx)] = 'done';
          setTtsStatus(restored);
        }
      }
    } catch (_) {}
    try {
      const raw = localStorage.getItem('ld_keyframe_data');
      if (raw) { const d = JSON.parse(raw); setIdea(d.idea || ''); }
    } catch (_) {}
  }, [openIDB, loadAllTtsIDB, clearTtsIDB]);

  React.useEffect(() => {
    loadSession();
    // 탭 복귀 시 대본 변경 감지
    const onVisible = () => { if (document.visibilityState === 'visible') loadSession(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadSession]);

  const cleanScene = (s: string) => s.replace(/\[씬\s*\d+\]/gi, '').trim();

  // 성우 미리듣기 (정적 파일)
  const previewVoice = (voice: Voice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewAudioRef.current) { previewAudioRef.current.pause(); }
    if (previewingVoice === voice.id) { setPreviewingVoice(null); return; }
    const audio = new Audio(voice.preview);
    audio.onended = () => setPreviewingVoice(null);
    audio.play();
    previewAudioRef.current = audio;
    setPreviewingVoice(voice.id);
  };

  // 씬별 TTS 생성
  const generateTts = async (idx: number) => {
    setTtsStatus(prev => ({ ...prev, [idx]: 'generating' }));
    try {
      const formData = new FormData();
      formData.append('scene_idx', String(idx));
      formData.append('text', cleanScene(scenes[idx]));
      const voice = VOICES.find(v => v.id === selectedVoice);
      formData.append('voice', voice?.voice_id || selectedVoice);
      formData.append('engine', voice?.engine || 'supertone');
      formData.append('speed', String(ttsSpeed));
      const res = await fetch(`${API}/video/tts`, { method: 'POST', body: formData });
      if (res.ok) {
        const mp3Res = await fetch(`${API}/video/tts/${idx}?t=${Date.now()}`);
        if (mp3Res.ok) {
          const blob = await mp3Res.blob();
          await saveTtsIDB(idx, blob, cleanScene(scenes[idx]));
        }
        setTtsStatus(prev => ({ ...prev, [idx]: 'done' }));
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error(`TTS 실패 씬${idx + 1}:`, errData);
        throw new Error(errData.detail || 'TTS 생성 실패');
      }
    } catch (e: any) {
      console.error(`TTS 에러 씬${idx + 1}:`, e);
      setTtsStatus(prev => ({ ...prev, [idx]: 'error' }));
    }
  };

  // 미리듣기 (IndexedDB 캐시 우선)
  const playTts = async (idx: number) => {
    if (audioRef.current) { audioRef.current.pause(); }
    if (playingIdx === idx) { setPlayingIdx(null); return; }
    const cachedUrl = await getTtsBlobUrl(idx);
    const audio = new Audio(cachedUrl || `${API}/video/tts/${idx}?t=${Date.now()}`);
    audio.onended = () => setPlayingIdx(null);
    audio.play();
    audioRef.current = audio;
    setPlayingIdx(idx);
  };

  // 렌더 상태
  const [renderJob, setRenderJob] = React.useState<{ id: string; ratio: string; percent: number; step: string; outputDir?: string } | null>(null);
  const [renderError, setRenderError] = React.useState<string | null>(null);

  const startRender = React.useCallback(async (ratio: '16:9' | '9:16') => {
    setRenderError(null);
    setRenderJob(null);
    try {
      // 씬 accents + subtitle_chunks 가져오기
      const sceneRes = await fetch(`${API}/browser/scenes-with-accents`);
      if (!sceneRes.ok) throw new Error('씬 데이터 로드 실패');
      const sceneData = await sceneRes.json();
      const scenesWithAccents = sceneData.scenes ?? [];
      if (!scenesWithAccents.length) throw new Error('씬 데이터가 없습니다');

      const body = {
        scenes: scenesWithAccents.map((s: any) => ({
          index:           s.index,
          text:            s.text,
          accents:         s.accents ?? [],
          subtitle_chunks: s.subtitle_chunks ?? [],
          tts_duration:    s.tts_duration ?? 5,
          has_image:       s.has_image ?? true,
          has_mp4:         s.has_mp4 ?? false,
        })),
        ratio,
        accent_color: '#6366f1',
        video_title:  idea,
      };

      const res = await fetch(`${API}/video/render-remotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail ?? '렌더 요청 실패'); }
      const { job_id } = await res.json();
      setRenderJob({ id: job_id, ratio, percent: 0, step: '렌더 시작' });

      const poll = setInterval(async () => {
        try {
          const st = await fetch(`${API}/video/status/${job_id}`).then(r => r.json());
          setRenderJob(prev => prev ? { ...prev, percent: st.percent ?? 0, step: st.step ?? '', outputDir: st.output_dir } : prev);
          if (st.step === 'done' || st.step === 'error' || st.percent >= 100) {
            clearInterval(poll);
            if (st.step === 'error') {
              setRenderError(st.message ?? '렌더링 오류');
              setRenderJob(null);
            }
          }
        } catch { clearInterval(poll); }
      }, 1500);
    } catch (e: any) {
      setRenderError(e.message);
    }
  }, [idea]);

  const selectedVoiceObj = VOICES.find(v => v.id === selectedVoice);
  const isSupertoneSelected = selectedVoiceObj?.engine !== 'edge-tts';

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white relative">

      {/* ── 배경 블롭 ── */}
      <div className="lg-scene" aria-hidden="true">
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/content/keyframe" className="text-slate-500 hover:text-white transition-all text-sm">
            <FontAwesomeIcon icon={faArrowLeft} /> 키프레임
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="text-2xl font-black">음성 더빙</h1>
        </div>
        <p className="text-slate-400 text-sm mb-8">씬별 TTS 음성을 생성하고 미리듣기 후 영상을 제작합니다.</p>

        {/* ── 성우 선택 아코디언 — Glass ── */}
        <div className="lg-glass rounded-2xl mb-6">
          <button
            onClick={() => setVoiceAccordionOpen(o => !o)}
            className="relative z-[2] w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-colors rounded-2xl"
          >
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faVolumeUp} className="text-[var(--lg-aqua)]" />
              <span className="text-sm font-black text-white">성우 선택</span>
              {(() => {
                const v = VOICES.find(v => v.id === selectedVoice);
                return v ? (
                  <span className="flex items-center gap-1 ml-2 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15">
                    <span className={`text-xs font-black ${v.gender === 'female' ? 'text-pink-400' : 'text-sky-400'}`}>
                      {v.gender === 'female' ? '♀' : '♂'}
                    </span>
                    <span className="text-xs font-black text-white">{v.name}</span>
                  </span>
                ) : null;
              })()}
            </div>
            <span className={`text-slate-400 text-xs transition-transform duration-300 ${voiceAccordionOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {voiceAccordionOpen && (
            <div className="relative z-[2] px-5 pt-3 pb-5 space-y-4 border-t border-white/[0.08]">
              {(['청년', '중년', '시니어', '아이'] as const).map(ageGroup => {
                const group = VOICES.filter(v => v.age === ageGroup);
                if (!group.length) return null;
                return (
                  <div key={ageGroup}>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">{ageGroup}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {group.map((v) => (
                        <div
                          key={v.id}
                          onClick={() => { setSelectedVoice(v.id); setVoiceAccordionOpen(false); }}
                          role="button"
                          tabIndex={0}
                          className={`relative p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                            selectedVoice === v.id
                              ? 'bg-[rgba(94,231,223,0.12)] border-[rgba(94,231,223,0.45)] shadow-[0_0_16px_rgba(94,231,223,0.15)]'
                              : 'bg-white/[0.04] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-black ${v.gender === 'female' ? 'text-pink-400' : 'text-sky-400'}`}>
                              {v.gender === 'female' ? '♀' : '♂'}
                            </span>
                            <span className="text-sm font-black text-white">{v.name}</span>
                            {v.engine === 'edge-tts' && (
                              <span className="ml-1 px-1 py-0 text-[8px] font-black rounded bg-emerald-600/40 text-emerald-300 leading-4">무료</span>
                            )}
                            {v.preview && (
                              <button
                                onClick={(e) => previewVoice(v, e)}
                                className={`ml-auto w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                  previewingVoice === v.id
                                    ? 'bg-[var(--lg-aqua)] text-[#0A0A0F]'
                                    : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'
                                }`}
                                title="미리듣기"
                              >
                                <FontAwesomeIcon icon={previewingVoice === v.id ? faPause : faPlay} className="text-[8px]" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 영상 제목 + 더빙 속도 — Glass Card ── */}
        <div className="lg-glass lg-card rounded-2xl px-5 py-4 flex items-center gap-4 mb-6">
          {/* 영상 제목 2/3 */}
          <div className="relative z-[2] flex items-center gap-3 min-w-0 flex-[2]">
            <span className="text-lg shrink-0">🎬</span>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">영상 제목</p>
              <p className="text-sm font-black text-white leading-snug truncate">{idea || '—'}</p>
            </div>
          </div>
          {/* 더빙 속도 1/3 */}
          <div className="relative z-[2] flex-[1] shrink-0">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">더빙 속도</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.8" max="1.5" step="0.1"
                value={ttsSpeed}
                onChange={e => setTtsSpeed(Number(e.target.value))}
                className="flex-1 h-1.5 cursor-pointer"
                style={{ accentColor: 'var(--lg-aqua)' }}
              />
              <span className="text-sm font-black text-[var(--lg-aqua)] w-10 text-right">{ttsSpeed}x</span>
            </div>
          </div>
        </div>

        {/* ── 씬 목록 ── */}
        <div className="space-y-3">
          {scenes.map((scene, idx) => (
            <div
              key={idx}
              className={`lg-glass lg-card rounded-2xl p-4 flex gap-4 transition-all ${
                ttsStatus[idx] === 'done'
                  ? '!bg-[rgba(52,211,153,0.07)] !border-[rgba(52,211,153,0.25)] !shadow-[0_4px_24px_rgba(52,211,153,0.1)]'
                  : ttsStatus[idx] === 'error'
                    ? '!bg-[rgba(239,68,68,0.06)] !border-[rgba(239,68,68,0.2)]'
                    : ''
              }`}
            >
              {/* 씬 이미지 */}
              <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-white/[0.06] border border-white/[0.08]">
                <img
                  src={`${API}/browser/images/${idx}?t=1`}
                  alt={`씬 ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>

              {/* 씬 텍스트 */}
              <div className="relative z-[2] flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 border ${
                    ttsStatus[idx] === 'done'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/[0.06] border-white/[0.10] text-slate-400'
                  }`}>{idx + 1}</span>
                  {idx === 0 && (
                    <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded-full">
                      오프닝 후크
                    </span>
                  )}
                  {ttsStatus[idx] === 'done' && <span className="text-[10px] font-black text-emerald-400">✓ 생성됨</span>}
                  {ttsStatus[idx] === 'generating' && <span className="text-[10px] font-black text-[var(--lg-aqua)] animate-pulse">생성 중...</span>}
                  {ttsStatus[idx] === 'error' && <span className="text-[10px] font-black text-red-400">실패</span>}
                </div>
                <textarea
                  value={cleanScene(scene)}
                  onChange={e => {
                    const updated = [...scenes];
                    updated[idx] = `[씬${idx + 1}] ${e.target.value}`;
                    setScenes(updated);
                    if (ttsStatus[idx] === 'done') setTtsStatus(prev => ({ ...prev, [idx]: 'idle' }));
                  }}
                  className="w-full text-xs text-slate-300 leading-relaxed bg-transparent border border-transparent hover:border-white/[0.10] focus:border-[rgba(94,231,223,0.4)] focus:bg-white/[0.03] rounded-lg px-2 py-1.5 outline-none resize-none transition-all"
                  rows={Math.min(6, Math.ceil(cleanScene(scene).length / 60) + 1)}
                />
              </div>

              {/* 버튼 */}
              <div className="relative z-[2] flex items-center gap-2 shrink-0">
                {ttsStatus[idx] === 'done' && (
                  <button
                    onClick={() => playTts(idx)}
                    className={`lg-btn w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                      playingIdx === idx
                        ? 'bg-[rgba(94,231,223,0.3)] border border-[rgba(94,231,223,0.5)] text-[var(--lg-aqua)]'
                        : 'lg-btn-ghost text-slate-400 hover:text-white'
                    }`}
                  >
                    <FontAwesomeIcon icon={playingIdx === idx ? faPause : faPlay} className="text-xs" />
                  </button>
                )}
                {isSupertoneSelected ? (
                  <span className="px-3 py-2 rounded-xl text-[11px] font-black bg-white/[0.04] border border-white/[0.08] text-slate-500 cursor-not-allowed">
                    🔒 유료 전용
                  </span>
                ) : (
                  <button
                    onClick={() => generateTts(idx)}
                    disabled={ttsStatus[idx] === 'generating'}
                    className={`lg-btn px-4 py-2 rounded-xl text-[11px] font-black text-white ${
                      ttsStatus[idx] === 'generating'
                        ? 'opacity-50 cursor-wait bg-white/[0.06] border border-white/[0.10]'
                        : ttsStatus[idx] === 'done'
                          ? 'lg-btn-ghost'
                          : 'lg-btn-primary'
                    }`}
                  >
                    {ttsStatus[idx] === 'generating' ? (
                      <><FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" />생성중</>
                    ) : ttsStatus[idx] === 'done' ? '재생성' : 'TTS 생성'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── 하단 — 영상 제작 ── */}
        <div className="mt-10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-4">영상 제작</p>

          {/* 렌더 진행 중 */}
          {renderJob && (
            <div className="lg-glass rounded-2xl px-5 py-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black text-white">
                  {renderJob.ratio} 렌더 중
                </span>
                <span className="text-sm font-black text-[var(--lg-aqua)]">{renderJob.percent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${renderJob.percent}%`, background: 'var(--lg-aqua)' }}
                />
              </div>
              <p className="text-xs text-slate-400">{renderJob.step}</p>
              {renderJob.percent >= 100 && renderJob.outputDir && (
                <a
                  href={`${API}/video/download/${renderJob.id}`}
                  className="mt-3 flex items-center justify-center gap-2 lg-btn lg-btn-primary px-5 py-2.5 rounded-xl font-black text-sm text-white w-full"
                  download
                >
                  <FontAwesomeIcon icon={faDownload} />
                  완성 영상 다운로드
                </a>
              )}
            </div>
          )}

          {/* 에러 */}
          {renderError && (
            <div className="text-xs text-red-400 text-center mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
              {renderError}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/content/keyframe"
              className="lg-btn lg-btn-ghost px-5 py-3 rounded-xl font-black text-sm text-slate-300"
            >
              ← 키프레임으로
            </Link>
            <Link
              href="/content/remotion"
              className="lg-btn lg-btn-primary px-6 py-3 rounded-xl font-black text-sm text-white"
            >
              🎬 리모션 제작
            </Link>
            <button
              onClick={() => startRender('16:9')}
              disabled={!!renderJob && renderJob.percent < 100}
              className={`lg-btn px-6 py-3 rounded-xl font-black text-sm text-white ${
                renderJob && renderJob.percent < 100 ? 'opacity-50 cursor-wait bg-white/[0.06] border border-white/[0.10]' : 'lg-btn-primary'
              }`}
            >
              {renderJob?.ratio === '16:9' && renderJob.percent < 100
                ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1.5" />렌더 중...</>
                : '📐 16:9 영상 제작'}
            </button>
            <button
              onClick={() => startRender('9:16')}
              disabled={!!renderJob && renderJob.percent < 100}
              className={`lg-btn px-6 py-3 rounded-xl font-black text-sm text-white ${
                renderJob && renderJob.percent < 100 ? 'opacity-50 cursor-wait bg-white/[0.06] border border-white/[0.10]' : 'lg-btn-fuchsia'
              }`}
              style={!renderJob || renderJob.percent >= 100 ? { background: 'rgba(168,85,247,0.25)', border: '1px solid rgba(168,85,247,0.45)' } : {}}
            >
              {renderJob?.ratio === '9:16' && renderJob.percent < 100
                ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1.5" />렌더 중...</>
                : '📱 9:16 영상 제작'}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
