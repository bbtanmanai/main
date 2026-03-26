'use client';

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faPause, faSpinner, faCheckCircle,
  faVolumeUp, faFilm, faArrowRight, faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import voiceData from '@/data/voice-dubbing.json';

const API = 'http://localhost:8000/api/v1';

type Voice = { id: string; name: string; gender: string; age: string; engine: string; preview: string };
const VOICES = voiceData.voices as Voice[];

export default function VoiceDubbingPage() {
  const [scenes, setScenes]         = React.useState<string[]>([]);
  const [idea, setIdea]             = React.useState('');
  const [selectedVoice, setSelectedVoice] = React.useState('ko-KR-SunHiNeural');
  const [ttsSpeed, setTtsSpeed]   = React.useState(1.0);
  const [ttsStatus, setTtsStatus]   = React.useState<Record<number, 'idle' | 'generating' | 'done' | 'error'>>({});
  const [playingIdx, setPlayingIdx] = React.useState<number | null>(null);
  const [previewingVoice, setPreviewingVoice] = React.useState<string | null>(null);
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const [renderJob, setRenderJob]   = React.useState<string | null>(null);
  const [renderProgress, setRenderProgress] = React.useState<any>(null);
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

  const saveTtsIDB = React.useCallback(async (idx: number, blob: Blob) => {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(blob, `tts_${idx}`);
  }, [openIDB]);

  const loadAllTtsIDB = React.useCallback(async (count: number): Promise<Record<number, boolean>> => {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const result: Record<number, boolean> = {};
    await Promise.all(
      Array.from({ length: count }, (_, i) =>
        new Promise<void>(res => {
          const req = store.get(`tts_${i}`);
          req.onsuccess = () => { if (req.result) result[i] = true; res(); };
          req.onerror = () => res();
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

  // 씬 데이터 로드 + 저장된 TTS 복원
  React.useEffect(() => {
    fetch(`${API}/browser/session`)
      .then(r => r.json())
      .then(async data => {
        if (data.scenes?.length) {
          setScenes(data.scenes);
          // 저장된 TTS 복원
          const saved = await loadAllTtsIDB(data.scenes.length);
          const restored: Record<number, 'done'> = {};
          for (const idx of Object.keys(saved)) restored[Number(idx)] = 'done';
          if (Object.keys(restored).length > 0) setTtsStatus(restored);
        }
      });
    try {
      const raw = sessionStorage.getItem('ld_keyframe_data');
      if (raw) { const d = JSON.parse(raw); setIdea(d.idea || ''); }
    } catch (_) {}
  }, [loadAllTtsIDB]);

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
      formData.append('voice', selectedVoice);
      formData.append('engine', voice?.engine || 'edge-tts');
      formData.append('speed', String(ttsSpeed));
      const res = await fetch(`${API}/video/tts`, { method: 'POST', body: formData });
      if (res.ok) {
        // 생성된 MP3를 IndexedDB에 저장
        const mp3Res = await fetch(`${API}/video/tts/${idx}?t=${Date.now()}`);
        if (mp3Res.ok) {
          const blob = await mp3Res.blob();
          await saveTtsIDB(idx, blob);
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

  // 전체 TTS 일괄 생성
  const generateAll = async () => {
    for (let i = 0; i < scenes.length; i++) {
      await generateTts(i);
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

  const allDone = scenes.length > 0 && scenes.every((_, i) => ttsStatus[i] === 'done');

  // 렌더링 시작
  const startRender = async (ratio: '16:9' | '9:16') => {
    const formData = new FormData();
    formData.append('scenes_json', JSON.stringify(scenes));
    formData.append('ratio', ratio);
    try {
      const res = await fetch(`${API}/video/render`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.job_id) {
        setRenderJob(data.job_id);
        setRenderProgress({ step: 'start', percent: 0 });
      } else {
        alert(data.detail || '렌더링 시작 실패');
      }
    } catch (_) {
      alert('서버 연결 실패');
    }
  };

  // 진행률 폴링
  React.useEffect(() => {
    if (!renderJob) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/video/status/${renderJob}`);
        const data = await res.json();
        setRenderProgress(data);
        if (data.step === 'done' || data.step === 'error') clearInterval(interval);
      } catch (_) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [renderJob]);

  const doneCount = Object.values(ttsStatus).filter(s => s === 'done').length;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/content/keyframe" className="text-slate-500 hover:text-white transition-all text-sm">
            <FontAwesomeIcon icon={faArrowLeft} /> 키프레임
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="text-2xl font-black">음성 더빙</h1>
        </div>
        <p className="text-slate-400 text-sm mb-8">씬별 TTS 음성을 생성하고 미리듣기 후 영상을 제작합니다.</p>

        {/* 성우 선택 카드 */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faVolumeUp} className="text-indigo-400" />
              <h2 className="text-sm font-black text-white">성우 선택</h2>
            </div>
            <button
              onClick={generateAll}
              disabled={scenes.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm bg-indigo-600 text-white hover:brightness-110 active:scale-95 transition-all"
            >
              전체 TTS 생성 ({doneCount}/{scenes.length})
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {VOICES.map((v, vi) => (
              <div
                key={`${v.id}-${vi}`}
                onClick={() => setSelectedVoice(v.id)}
                role="button"
                tabIndex={0}
                className={`relative p-3 rounded-xl border text-left transition-all ${
                  selectedVoice === v.id
                    ? 'bg-indigo-600/20 border-indigo-500/60 ring-1 ring-indigo-500/30'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                {selectedVoice === v.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-white text-[8px]" />
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black ${v.gender === 'F' ? 'text-pink-400' : 'text-sky-400'}`}>
                    {v.gender === 'F' ? '♀' : '♂'}
                  </span>
                  <span className="text-sm font-black text-white">{v.name}</span>
                  <span className="text-[10px] text-slate-500">-</span>
                  <span className="text-[11px] text-slate-400">
                    {v.age === '20-30' ? '20대' : v.age === '40-50' ? '40대' : v.age === '50-60' ? '50대' : '시니어'} {v.gender === 'F' ? '여성' : '남성'}
                  </span>
                  {v.preview ? (
                    <button
                      onClick={(e) => previewVoice(v, e)}
                      className={`ml-auto w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        previewingVoice === v.id
                          ? 'bg-fuchsia-500 text-white'
                          : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'
                      }`}
                      title="미리듣기"
                    >
                      <FontAwesomeIcon icon={previewingVoice === v.id ? faPause : faPlay} className="text-[8px]" />
                    </button>
                  ) : (
                    <span className="ml-auto text-[9px] text-slate-600 font-black">준비중</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 영상 제목 + 더빙 속도 */}
        <div className="mb-6 bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-4">
          {/* 영상 제목 2/3 */}
          <div className="flex items-center gap-3 min-w-0 flex-[2]">
            <span className="text-lg shrink-0">🎬</span>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">영상 제목</p>
              <p className="text-sm font-black text-white leading-snug truncate">{idea || '—'}</p>
            </div>
          </div>
          {/* 더빙 속도 1/3 */}
          <div className="flex-[1] shrink-0">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">더빙 속도</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.8" max="1.5" step="0.1"
                value={ttsSpeed}
                onChange={e => setTtsSpeed(Number(e.target.value))}
                className="flex-1 h-1.5 accent-indigo-500 cursor-pointer"
              />
              <span className="text-sm font-black text-indigo-300 w-10 text-right">{ttsSpeed}x</span>
            </div>
          </div>
        </div>

        {/* 씬 목록 */}
        <div className="space-y-3">
          {scenes.map((scene, idx) => (
            <div key={idx} className={`flex gap-4 p-4 rounded-2xl border transition-all ${
              ttsStatus[idx] === 'done'
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : 'bg-white/[0.03] border-white/10'
            }`}>
              {/* 씬 이미지 */}
              <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-800">
                <img
                  src={`${API}/browser/images/${idx}?t=1`}
                  alt={`씬 ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>

              {/* 씬 텍스트 (편집 가능) */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                    ttsStatus[idx] === 'done' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>{idx + 1}</span>
                  {idx === 0 && <span className="text-[10px] font-black text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-full">오프닝 후크</span>}
                  {ttsStatus[idx] === 'done' && <span className="text-[10px] font-black text-emerald-400">✓ 생성됨</span>}
                  {ttsStatus[idx] === 'generating' && <span className="text-[10px] font-black text-indigo-400 animate-pulse">생성 중...</span>}
                  {ttsStatus[idx] === 'error' && <span className="text-[10px] font-black text-red-400">실패</span>}
                </div>
                <textarea
                  value={cleanScene(scene)}
                  onChange={e => {
                    const updated = [...scenes];
                    updated[idx] = `[씬${idx + 1}] ${e.target.value}`;
                    setScenes(updated);
                    // 편집 시 TTS 재생성 필요 표시
                    if (ttsStatus[idx] === 'done') setTtsStatus(prev => ({ ...prev, [idx]: 'idle' }));
                  }}
                  className="w-full text-xs text-slate-300 leading-relaxed bg-transparent border border-transparent hover:border-white/10 focus:border-indigo-500/50 focus:bg-white/[0.03] rounded-lg px-2 py-1.5 outline-none resize-none transition-all"
                  rows={Math.min(6, Math.ceil(cleanScene(scene).length / 60) + 1)}
                />
              </div>

              {/* 버튼 */}
              <div className="flex items-center gap-2 shrink-0">
                {ttsStatus[idx] === 'done' && (
                  <button
                    onClick={() => playTts(idx)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      playingIdx === idx
                        ? 'bg-fuchsia-600 text-white'
                        : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    <FontAwesomeIcon icon={playingIdx === idx ? faPause : faPlay} className="text-xs" />
                  </button>
                )}
                <button
                  onClick={() => generateTts(idx)}
                  disabled={ttsStatus[idx] === 'generating'}
                  className={`px-4 py-2 rounded-lg text-[11px] font-black transition-all ${
                    ttsStatus[idx] === 'generating'
                      ? 'bg-indigo-500/30 text-indigo-300 cursor-wait'
                      : ttsStatus[idx] === 'done'
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-indigo-600 text-white hover:brightness-110'
                  }`}
                >
                  {ttsStatus[idx] === 'generating' ? (
                    <><FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" /> 생성중</>
                  ) : ttsStatus[idx] === 'done' ? '재생성' : 'TTS 생성'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 — 렌더링 */}
        <div className="mt-10 space-y-4">
          {renderProgress?.step === 'done' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 text-emerald-400">
                <FontAwesomeIcon icon={faCheckCircle} className="text-2xl" />
                <span className="text-lg font-black">영상 제작 완료!</span>
              </div>
              <a
                href={`${API}/video/download/${renderJob}`}
                download
                className="flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-base text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 transition-all shadow-2xl shadow-emerald-500/30"
              >
                <FontAwesomeIcon icon={faFilm} /> 영상 다운로드 <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </a>
              <button onClick={() => { setRenderJob(null); setRenderProgress(null); }}
                className="text-sm text-slate-500 hover:text-slate-300 transition-all">다시 제작하기</button>
            </div>
          ) : renderProgress?.step === 'error' ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-red-400 font-black">렌더링 오류: {renderProgress.message}</p>
              <button onClick={() => { setRenderJob(null); setRenderProgress(null); }}
                className="text-sm text-slate-500 hover:text-slate-300 transition-all">다시 시도</button>
            </div>
          ) : renderJob ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 text-indigo-300">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                <span className="font-black">
                  {renderProgress?.step === 'tts' && `씬 ${renderProgress.scene}/${renderProgress.total} 클립 생성 중...`}
                  {renderProgress?.step === 'concat' && '클립 합치기 + BGM 믹싱 중...'}
                  {renderProgress?.step === 'start' && '렌더링 준비 중...'}
                </span>
              </div>
              <div className="w-80 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full transition-all duration-700"
                  style={{ width: `${renderProgress?.percent || 0}%` }} />
              </div>
              <span className="text-xs text-slate-500">{renderProgress?.percent || 0}%</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <Link href="/content/keyframe" className="px-6 py-3 rounded-xl font-black text-sm text-slate-400 bg-white/5 border border-white/10 hover:text-white hover:border-white/20 transition-all">
                ← 키프레임으로
              </Link>
              <button
                onClick={() => startRender('16:9')}
                disabled={!allDone}
                className={`flex items-center gap-3 px-7 py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 shadow-xl border ${
                  allDone
                    ? 'bg-gradient-to-r from-indigo-600 to-slate-700 border-indigo-500/40 shadow-indigo-500/20 hover:brightness-110'
                    : 'bg-slate-800 border-slate-700 opacity-40 cursor-not-allowed'
                }`}
              >
                <FontAwesomeIcon icon={faFilm} /> 16:9 영상 제작
              </button>
              <button
                onClick={() => startRender('9:16')}
                disabled={!allDone}
                className={`flex items-center gap-3 px-7 py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 shadow-2xl border ${
                  allDone
                    ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 border-fuchsia-500/40 shadow-fuchsia-500/20 hover:brightness-110'
                    : 'bg-slate-800 border-slate-700 opacity-40 cursor-not-allowed'
                }`}
              >
                <FontAwesomeIcon icon={faFilm} /> 9:16 영상 제작
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
