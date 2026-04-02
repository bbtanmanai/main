'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faFilm, faExternalLinkAlt, faEye, faSpinner, faRefresh, faTimes, faExpand,
  faMinus, faPlus, faWandMagicSparkles, faVideo, faDownload,
} from '@fortawesome/free-solid-svg-icons';
import Aurora from '@/components/Aurora';
import type { TimedAccent } from '@/components/remotion-preview/RemotionPreviewPlayer';
import type { AccentCompositionProps, SubtitleChunk } from '@/components/remotion-preview/AccentComposition';
import { DEFAULT_ACCENT_COLOR } from '@/components/remotion-preview/AccentComposition';

const ACCENT_PRESETS = [
  { color: '#6366f1', label: '인디고' },
  { color: '#8b5cf6', label: '바이올렛' },
  { color: '#ec4899', label: '핑크' },
  { color: '#f43f5e', label: '로즈' },
  { color: '#f97316', label: '오렌지' },
  { color: '#eab308', label: '옐로' },
  { color: '#10b981', label: '에메랄드' },
  { color: '#06b6d4', label: '사이안' },
];

const RemotionPreviewPlayer = dynamic(
  () => import('@/components/remotion-preview/RemotionPreviewPlayer').then(m => m.RemotionPreviewPlayer),
  { ssr: false, loading: () => <div className="w-full h-full bg-black/40 rounded-lg animate-pulse" /> }
);

const API = process.env.NEXT_PUBLIC_API_URL;
const REMOTION_STUDIO_URL = 'http://localhost:3001';

interface SceneData {
  index: number;
  text: string;
  accents: TimedAccent[];
  tts_duration: number;
  has_image: boolean;
  has_mp4: boolean;
  subtitle_chunks: SubtitleChunk[];
}

const ACCENT_LABEL: Record<string, { label: string; color: string }> = {
  num:              { label: '숫자',      color: '#6366f1' },
  bar:              { label: '비교바',    color: '#10b981' },
  flow:             { label: '단계',      color: '#8b5cf6' },
  list:             { label: '목록',      color: '#f43f5e' },
  split_screen:     { label: '비포애프터', color: '#f97316' },
  stat_card:        { label: '지표패널',  color: '#06b6d4' },
  comparison_table: { label: '비교표',    color: '#eab308' },
  ranking_list:     { label: '랭킹',      color: '#FFD700' },
  timeline:         { label: '타임라인',  color: '#a78bfa' },
  icon_grid:        { label: '기능그리드', color: '#34d399' },
  flowchart:        { label: '플로우차트', color: '#fb923c' },
  quote_hero:       { label: '인용구',    color: '#f472b6' },
};

// ── 확대 모달 ──────────────────────────────────────────────────────────────────
interface ModalState {
  data: AccentCompositionProps;
  ratio: '16:9' | '9:16';
  sceneIdx: number;
}

function PreviewModal({ modal, onClose }: { modal: ModalState; onClose: () => void }) {
  const [seekToFrame, setSeekToFrame] = useState<number | undefined>(undefined);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const is169 = modal.ratio === '16:9';
  const displayWidth = is169 ? 960 : 405;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center gap-4"
        onClick={e => e.stopPropagation()}
      >
        {/* 닫기 */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-slate-400 hover:text-white transition-colors text-lg"
        >
          <FontAwesomeIcon icon={faTimes} />
          <span className="ml-2 text-sm">ESC</span>
        </button>

        {/* 씬 번호 + 비율 */}
        <div
          className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-300"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
          }}
        >
          씬 {modal.sceneIdx + 1} · {modal.ratio} · {modal.data.tts_duration.toFixed(1)}s
        </div>

        {/* 플레이어 */}
        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 0 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.1)' }}>
          <RemotionPreviewPlayer
            data={modal.data}
            ratio={modal.ratio}
            displayWidth={displayWidth}
            expanded
            seekToFrame={seekToFrame}
          />
        </div>

        {/* accent 타이밍 점프 버튼 */}
        {modal.data.accents.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {modal.data.accents.map((a, i) => {
              const info = ACCENT_LABEL[a.accentType] ?? { label: a.accentType, color: '#94a3b8' };
              const color = info.color;
              const label = a.accentType === 'num' ? (a as any).value
                : a.accentType === 'bar' ? `${(a as any).left?.value} vs ${(a as any).right?.value}`
                : a.accentType === 'list' ? ((a as any).items?.[0] ?? 'list')
                : a.accentType === 'flow' ? ((a as any).steps?.[0] ?? 'flow')
                : info.label;
              return (
                <button key={i}
                  className="text-[11px] px-3 py-1 rounded-full font-bold transition-all hover:opacity-80 active:scale-95"
                  style={{ background: `${color}22`, color, border: `1px solid ${color}44`, cursor: 'pointer', backdropFilter: 'blur(8px)' }}
                  onClick={() => {
                    const frame = Math.max(0, Math.floor((a.start_sec + 0.5) * 30));
                    setSeekToFrame(f => f === frame ? frame + 1 : frame);
                  }}>
                  {Math.floor(a.start_sec)}s · {a.accentType} · {label}
                </button>
              );
            })}
          </div>
        )}

        {/* 하단 닫기 버튼 */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold text-slate-300 hover:text-white transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
          닫기
        </button>
      </div>
    </div>
  );
}

// ── 씬 카드 ────────────────────────────────────────────────────────────────────
function SceneCard({
  scene, rowIdx, videoTitle, accentColor, onPreviewClick,
  onRedetect, onDeleteAccent, onAdjustTiming, isRedetecting,
}: {
  scene: SceneData; rowIdx: number; videoTitle: string; accentColor: string;
  onPreviewClick: (data: AccentCompositionProps, ratio: '16:9' | '9:16', sceneIdx: number) => void;
  onRedetect: (sceneIdx: number) => Promise<void>;
  onDeleteAccent: (sceneIdx: number, accentIdx: number) => void;
  onAdjustTiming: (sceneIdx: number, accentIdx: number, delta: number) => void;
  isRedetecting: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), rowIdx * 150);
    return () => clearTimeout(t);
  }, [rowIdx]);

  const bgImage  = scene.has_image ? `${API}/browser/images/${scene.index}` : undefined;
  const audioSrc = scene.tts_duration > 0 ? `${API}/browser/audio/${scene.index}` : undefined;
  const hasTts   = scene.tts_duration > 0;
  const mp4Src   = scene.has_mp4 ? `${API}/browser/video/${scene.index}` : undefined;

  const previewData: AccentCompositionProps = {
    accents: scene.accents,
    tts_duration: scene.tts_duration,
    bgImage,
    videoTitle,
    accentColor,
    subtitleChunks: scene.subtitle_chunks,
  };
  const modalData: AccentCompositionProps = { ...previewData, audioSrc };

  return (
    <div className="lg-glass lg-card rounded-2xl">
      <div className="flex items-stretch gap-0">

        {/* ── 열 1: 씬번호 + 대본 ── */}
        <div className="flex-1 min-w-0 px-5 py-5 flex gap-4">
          {/* 씬 번호 배지 */}
          <div className="flex-shrink-0 pt-0.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-indigo-300"
              style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                boxShadow: '0 0 12px rgba(99,102,241,0.2)',
              }}
            >
              {scene.index + 1}
            </div>
          </div>

          {/* 대본 + 태그 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 leading-relaxed">{scene.text}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              {scene.has_mp4 ? (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-orange-400 bg-orange-400/10 border border-orange-400/30">
                  MP4 · Remotion 미적용
                </span>
              ) : scene.accents.length === 0 ? (
                <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full text-slate-600"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  강조 없음
                </span>
              ) : scene.accents.map((a, i) => {
                const info = ACCENT_LABEL[a.accentType] ?? { label: a.accentType, color: '#94a3b8' };
                return (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold pl-1.5 pr-1 py-0.5 rounded-full"
                    style={{ background: `${info.color}22`, color: info.color, border: `1px solid ${info.color}44` }}>
                    {/* 타이밍 - */}
                    <button
                      onClick={() => onAdjustTiming(scene.index, i, -0.5)}
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                      style={{ background: `${info.color}33` }}
                      title="-0.5s"
                    >
                      <FontAwesomeIcon icon={faMinus} style={{ fontSize: 7 }} />
                    </button>
                    <span>{a.start_sec}s · {info.label}{a.accentType === 'num' ? ` · ${(a as any).value}` : ''}</span>
                    {/* 타이밍 + */}
                    <button
                      onClick={() => onAdjustTiming(scene.index, i, 0.5)}
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                      style={{ background: `${info.color}33` }}
                      title="+0.5s"
                    >
                      <FontAwesomeIcon icon={faPlus} style={{ fontSize: 7 }} />
                    </button>
                    {/* 삭제 */}
                    <button
                      onClick={() => onDeleteAccent(scene.index, i)}
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 hover:text-red-400 transition-all"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                      title="삭제"
                    >
                      <FontAwesomeIcon icon={faTimes} style={{ fontSize: 7 }} />
                    </button>
                  </span>
                );
              })}
              {hasTts && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full text-slate-500"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {scene.tts_duration.toFixed(1)}s
                </span>
              )}
              {/* 재감지 버튼 */}
              {!scene.has_mp4 && (
                <button
                  onClick={() => onRedetect(scene.index)}
                  disabled={isRedetecting}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-indigo-400 transition-all hover:text-indigo-200 disabled:opacity-40"
                  style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.25)' }}
                >
                  <FontAwesomeIcon icon={isRedetecting ? faSpinner : faWandMagicSparkles} className={isRedetecting ? 'animate-spin' : ''} style={{ fontSize: 9 }} />
                  {isRedetecting ? '감지 중' : 'accent 재감지'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 세로 구분선 */}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

        {/* ── 열 2: 16:9 미리보기 ── */}
        <div className="flex-shrink-0 px-4 py-4 flex flex-col items-center gap-2">
          <p className="text-[10px] font-bold text-slate-600 tracking-widest">16:9</p>
          {scene.has_mp4 ? (
            <video
              src={mp4Src}
              controls
              style={{ width: 320, height: 180, borderRadius: 10, background: '#050508', border: '1px solid rgba(255,255,255,0.08)', display: 'block' }}
            />
          ) : (
            <div
              onClick={() => mounted && onPreviewClick(modalData, '16:9', scene.index)}
              style={{ width: 320, height: 180, borderRadius: 10, overflow: 'hidden', background: '#050508', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', position: 'relative',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
              className="group"
            >
              {mounted ? (
                <>
                  <RemotionPreviewPlayer data={previewData} ratio="16:9" displayWidth={320} />
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}
                    >
                      <FontAwesomeIcon icon={faExpand} className="text-white text-lg" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-black/40 animate-pulse" />
              )}
            </div>
          )}
        </div>

        {/* 세로 구분선 */}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

        {/* ── 열 3: 9:16 미리보기 ── */}
        <div className="flex-shrink-0 px-4 py-4 flex flex-col items-center gap-2">
          <p className="text-[10px] font-bold text-slate-600 tracking-widest">9:16</p>
          {scene.has_mp4 ? (
            <div
              style={{ width: 101, height: 180, borderRadius: 10, background: '#050508', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span className="text-[10px] text-slate-600">MP4 적용</span>
            </div>
          ) : (
            <div
              onClick={() => mounted && onPreviewClick(modalData, '9:16', scene.index)}
              style={{ width: 101, height: 180, borderRadius: 10, overflow: 'hidden', background: '#050508', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', position: 'relative',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
              className="group"
            >
              {mounted ? (
                <>
                  <RemotionPreviewPlayer data={previewData} ratio="9:16" displayWidth={101} />
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}
                    >
                      <FontAwesomeIcon icon={faExpand} className="text-white" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-black/40 animate-pulse" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 메인 ───────────────────────────────────────────────────────────────────────
export default function RemotionPage() {
  const [scenes, setScenes] = useState<SceneData[]>([]);
  const [videoTitle, setVideoTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);
  const [redetectingScenes, setRedetectingScenes] = useState<Set<number>>(new Set());
  const [renderJob, setRenderJob] = useState<{ id: string; ratio: string; percent: number; step: string; outputDir?: string } | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const openModal = useCallback((data: AccentCompositionProps, ratio: '16:9' | '9:16', sceneIdx: number) => {
    setModal({ data, ratio, sceneIdx });
  }, []);

  // 편집된 timed accents를 서버에 동기화
  const syncAccents = useCallback(async (updatedScenes: SceneData[], sceneIdx: number) => {
    const timed = updatedScenes[sceneIdx]?.accents ?? [];
    await fetch(`${API}/browser/scene-accent-edit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene_idx: sceneIdx, timed_accents: timed }),
    });
  }, []);

  const handleRedetect = useCallback(async (sceneIdx: number) => {
    setRedetectingScenes(prev => new Set(prev).add(sceneIdx));
    try {
      const res = await fetch(`${API}/browser/scene-accent-redetect/${sceneIdx}`, { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setScenes(prev => prev.map((s, i) => i === sceneIdx ? { ...s, accents: data.accents } : s));
        setModal(null);
      }
    } finally {
      setRedetectingScenes(prev => { const n = new Set(prev); n.delete(sceneIdx); return n; });
    }
  }, []);

  const handleDeleteAccent = useCallback((sceneIdx: number, accentIdx: number) => {
    setScenes(prev => {
      const next = prev.map((s, i) => {
        if (i !== sceneIdx) return s;
        const newAccents = s.accents.filter((_, ai) => ai !== accentIdx);
        return { ...s, accents: newAccents };
      });
      syncAccents(next, sceneIdx);
      return next;
    });
    setModal(null);
  }, [syncAccents]);

  const handleAdjustTiming = useCallback((sceneIdx: number, accentIdx: number, delta: number) => {
    setScenes(prev => {
      const next = prev.map((s, i) => {
        if (i !== sceneIdx) return s;
        const newAccents = s.accents.map((a, ai) => {
          if (ai !== accentIdx) return a;
          const newStart = Math.max(0, Math.min(+(a.start_sec + delta).toFixed(1), s.tts_duration));
          const newEnd   = Math.max(0, Math.min(+(a.end_sec + delta).toFixed(1), s.tts_duration));
          return { ...a, start_sec: newStart, end_sec: newEnd };
        });
        return { ...s, accents: newAccents };
      });
      syncAccents(next, sceneIdx);
      return next;
    });
  }, [syncAccents]);

  const startRender = useCallback(async (ratio: '16:9' | '9:16') => {
    if (!scenes.length) return;
    setRenderError(null);
    const body = {
      scenes: scenes.map(s => ({
        index:           s.index,
        text:            s.text,
        accents:         s.accents,
        subtitle_chunks: s.subtitle_chunks ?? [],
        tts_duration:    s.tts_duration,
        has_image:       s.has_image ?? true,
        has_mp4:         s.has_mp4 ?? false,
      })),
      ratio,
      accent_color: accentColor,
      video_title:  videoTitle,
    };
    try {
      const res = await fetch(`${API}/video/render-remotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail ?? '렌더 실패'); }
      const { job_id } = await res.json();
      setRenderJob({ id: job_id, ratio, percent: 0, step: 'start' });
      // 폴링
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
  }, [scenes]);

  const loadScenes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/browser/scenes-with-accents`);
      if (!res.ok) throw new Error(`API 오류 ${res.status}`);
      const data = await res.json();
      setScenes(data.scenes ?? []);
      // idea(대본 제목)를 우선 사용, 없으면 API videoTitle 폴백
      try {
        const kd = localStorage.getItem('ld_keyframe_data');
        const idea = kd ? JSON.parse(kd).idea : '';
        setVideoTitle(idea || data.videoTitle || '');
      } catch (_) {
        setVideoTitle(data.videoTitle ?? '');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadScenes(); }, []);

  return (
    <div className="relative min-h-screen bg-[#0b0e1a] text-white">
      {modal && <PreviewModal modal={modal} onClose={() => setModal(null)} />}
      <Aurora colorStops={['#1e1b4b', '#312e81', '#1e1b4b']} amplitude={0.6} blend={0.15} />

      {/* ── 헤더 — Glass ── */}
      <div
        className="relative z-10 px-6 py-4 flex items-center justify-between"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(11,14,26,0.65)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/content/voice-dubbing"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-slate-400 text-sm" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faFilm} className="text-indigo-400" />
              Remotion 강조 비주얼
            </h1>
            {videoTitle ? (
              <p className="text-sm font-black text-indigo-300 mt-0.5 truncate max-w-xl">{videoTitle}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5">TTS 타이밍 동기화 · 씬별 accent 자동감지 · 16:9 / 9:16 미리보기</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 강조 색상 선택 — Glass pill */}
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
            }}
          >
            <span className="text-[10px] font-bold text-slate-500 mr-1">색상</span>
            {ACCENT_PRESETS.map(p => (
              <button
                key={p.color}
                title={p.label}
                onClick={() => setAccentColor(p.color)}
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: p.color,
                  border: accentColor === p.color ? '2px solid #fff' : '2px solid transparent',
                  boxShadow: accentColor === p.color ? `0 0 10px ${p.color}88` : 'none',
                  cursor: 'pointer', flexShrink: 0,
                  transition: 'box-shadow 200ms, border-color 200ms, transform 200ms',
                  transform: accentColor === p.color ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {/* 새로고침 — Ghost glass btn */}
          <button
            onClick={loadScenes}
            className="lg-btn lg-btn-ghost flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white"
          >
            <FontAwesomeIcon icon={faRefresh} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>

          {/* Remotion 스튜디오 — Violet glass btn */}
          <button
            onClick={() => window.open(REMOTION_STUDIO_URL, '_blank', 'width=1440,height=900')}
            className="lg-btn lg-btn-violet flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white"
          >
            <FontAwesomeIcon icon={faEye} />
            Remotion 스튜디오
            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[9px] opacity-70" />
          </button>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div className="relative z-10 overflow-x-auto">
        <div className="max-w-[1200px] mx-auto px-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-400" />
            <span className="text-sm">대본 불러오는 중...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div
              className="px-6 py-5 rounded-2xl text-center"
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <p className="text-sm text-red-400 mb-1">{error}</p>
              <p className="text-xs text-slate-500 mb-4">API 서버(port 8000)가 실행 중인지 확인하세요.</p>
              <button
                onClick={loadScenes}
                className="lg-btn lg-btn-ghost px-4 py-2 rounded-xl text-xs font-bold text-slate-300"
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : scenes.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-slate-600 text-sm">
            대본 없음 — 키프레임 페이지에서 대본을 먼저 생성하세요.
          </div>
        ) : (
          <div className="py-6 space-y-4 pb-32">
            {scenes.map((scene, i) => (
              <SceneCard key={scene.index} scene={scene} rowIdx={i}
                videoTitle={videoTitle} accentColor={accentColor} onPreviewClick={openModal}
                onRedetect={handleRedetect} onDeleteAccent={handleDeleteAccent}
                onAdjustTiming={handleAdjustTiming} isRedetecting={redetectingScenes.has(scene.index)} />
            ))}
          </div>
        )}
        </div>
      </div>

      {/* ── 하단 영상 제작 바 ── */}
      {scenes.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 px-6 py-4"
          style={{
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            background: 'rgba(11,14,26,0.80)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div className="max-w-[1200px] mx-auto flex items-center gap-4">
            {/* 진행 상태 */}
            {renderJob && (
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${renderJob.percent}%`,
                      background: renderJob.ratio === '16:9'
                        ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                        : 'linear-gradient(90deg, #ec4899, #8b5cf6)',
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {renderJob.step === 'done' ? '완료' : `${renderJob.percent}% · ${renderJob.step}`}
                </span>
                {renderJob.step === 'done' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`${API}/video/download/${renderJob.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-emerald-300 transition-all hover:text-white"
                      style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
                      download
                    >
                      <FontAwesomeIcon icon={faDownload} />
                      MP4 다운로드
                    </a>
                    {renderJob.outputDir && (
                      <span className="text-[10px] text-slate-500 truncate max-w-[320px]" title={renderJob.outputDir}>
                        📁 {renderJob.outputDir}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 에러 */}
            {renderError && (
              <p className="flex-1 text-xs text-red-400">{renderError}</p>
            )}

            {!renderJob && !renderError && (
              <div className="flex-1 flex items-center gap-2">
                <FontAwesomeIcon icon={faVideo} className="text-slate-600 text-sm" />
                <span className="text-xs text-slate-600">씬 {scenes.length}개 · accent 편집 완료 후 영상을 제작하세요</span>
              </div>
            )}

            {/* 16:9 제작 */}
            <button
              onClick={() => startRender('16:9')}
              disabled={!!renderJob && renderJob.step !== 'done'}
              className="lg-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4))',
                border: '1px solid rgba(139,92,246,0.4)',
                boxShadow: '0 0 20px rgba(99,102,241,0.25)',
              }}
            >
              <FontAwesomeIcon icon={faVideo} />
              16:9 영상 제작
            </button>

            {/* 9:16 제작 */}
            <button
              onClick={() => startRender('9:16')}
              disabled={!!renderJob && renderJob.step !== 'done'}
              className="lg-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, rgba(236,72,153,0.5), rgba(139,92,246,0.4))',
                border: '1px solid rgba(236,72,153,0.4)',
                boxShadow: '0 0 20px rgba(236,72,153,0.25)',
              }}
            >
              <FontAwesomeIcon icon={faVideo} />
              9:16 영상 제작
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
