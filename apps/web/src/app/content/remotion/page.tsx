'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faFilm, faExternalLinkAlt, faEye, faSpinner, faRefresh, faTimes, faExpand,
} from '@fortawesome/free-solid-svg-icons';
import Aurora from '@/components/Aurora';
import type { TimedAccent } from '@/components/remotion-preview/RemotionPreviewPlayer';
import type { AccentCompositionProps } from '@/components/remotion-preview/AccentComposition';
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

const API = 'http://localhost:8000/api/v1';
const REMOTION_STUDIO_URL = 'http://localhost:3001';

interface SceneData {
  index: number;
  text: string;
  accents: TimedAccent[];
  tts_duration: number;
  has_image: boolean;
}

const ACCENT_LABEL: Record<string, { label: string; color: string }> = {
  num:  { label: '숫자',   color: '#6366f1' },
  bar:  { label: '비교바', color: '#10b981' },
  flow: { label: '단계',   color: '#8b5cf6' },
  list: { label: '목록',   color: '#f43f5e' },
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
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
        <div className="text-slate-400 text-xs font-bold">
          씬 {modal.sceneIdx + 1} · {modal.ratio} · {modal.data.tts_duration.toFixed(1)}s
        </div>

        {/* 플레이어 */}
        <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 0 80px rgba(0,0,0,0.8)' }}>
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
              const color = { num: '#6366f1', bar: '#10b981', flow: '#8b5cf6', list: '#f43f5e' }[a.accentType];
              const label = a.accentType === 'num' ? a.value
                : a.accentType === 'bar' ? `${a.left?.value} vs ${a.right?.value}`
                : a.accentType === 'list' ? (a.items?.[0] ?? 'list')
                : (a.steps?.[0] ?? 'flow');
              return (
                <button key={i}
                  className="text-[11px] px-3 py-1 rounded-full font-bold transition-all hover:opacity-80 active:scale-95"
                  style={{ background: `${color}22`, color, border: `1px solid ${color}44`, cursor: 'pointer' }}
                  onClick={() => {
                    const frame = Math.max(0, Math.floor((a.start_sec + 0.5) * 30));
                    setSeekToFrame(f => f === frame ? frame + 1 : frame); // 같은 값 재클릭 허용
                  }}>
                  {Math.floor(a.start_sec)}s · {a.accentType} · {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 씬 행 ──────────────────────────────────────────────────────────────────────
function SceneRow({
  scene, rowIdx, videoTitle, accentColor, onPreviewClick,
}: {
  scene: SceneData; rowIdx: number; videoTitle: string; accentColor: string;
  onPreviewClick: (data: AccentCompositionProps, ratio: '16:9' | '9:16', sceneIdx: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), rowIdx * 150);
    return () => clearTimeout(t);
  }, [rowIdx]);

  const bgImage  = scene.has_image ? `${API}/browser/images/${scene.index}` : undefined;
  const audioSrc = scene.tts_duration > 0 ? `${API}/browser/audio/${scene.index}` : undefined;
  const hasTts   = scene.tts_duration > 0;

  // 테이블 미리보기: 오디오 없음 (동시 재생 방지)
  const previewData: AccentCompositionProps = {
    accents: scene.accents,
    tts_duration: scene.tts_duration,
    bgImage,
    videoTitle,
    accentColor,
  };

  // 모달 확대: 오디오 포함
  const modalData: AccentCompositionProps = { ...previewData, audioSrc };

  const isScene1 = scene.index === 0;

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">

      {/* 씬번호 */}
      <td className="px-4 py-3 text-center align-top w-16">
        <div className="w-8 h-8 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-xs font-black text-slate-300 mx-auto">
          {scene.index + 1}
        </div>
        {isScene1 && (
          <div className="mt-1 text-[9px] text-orange-400 font-bold text-center">mp4</div>
        )}
      </td>

      {/* 대본 */}
      <td className="px-4 py-3 align-top min-w-[300px] max-w-[520px]">
        <p className="text-sm text-slate-300 leading-relaxed">{scene.text}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {isScene1 ? (
            <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full text-orange-400 bg-orange-400/10 border border-orange-400/20">
              mp4 교체 예정
            </span>
          ) : scene.accents.length === 0 ? (
            <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full text-slate-600 bg-white/4 border border-white/8">
              강조 없음
            </span>
          ) : scene.accents.map((a, i) => {
            const info = ACCENT_LABEL[a.accentType];
            return (
              <span key={i} className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${info.color}22`, color: info.color, border: `1px solid ${info.color}44` }}>
                {a.start_sec}s · {info.label}
                {a.accentType === 'num' ? ` · ${a.value}` : ''}
              </span>
            );
          })}
          {hasTts && !isScene1 && (
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full text-slate-500 bg-white/3 border border-white/8">
              {scene.tts_duration.toFixed(1)}s
            </span>
          )}
        </div>
      </td>

      {/* 16:9 */}
      <td className="px-4 py-3 align-top w-[360px]">
        <div
          onClick={() => !isScene1 && mounted && onPreviewClick(modalData, '16:9', scene.index)}
          style={{ width: 340, height: 191, borderRadius: 8, overflow: 'hidden', background: '#050508', border: '1px solid rgba(255,255,255,0.06)', cursor: isScene1 ? 'default' : 'pointer', position: 'relative' }}
          className={!isScene1 ? 'group' : ''}
        >
          {isScene1 ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-orange-400/50">
              <span className="text-xs font-bold">mp4 교체 예정</span>
            </div>
          ) : mounted ? (
            <>
              <RemotionPreviewPlayer data={previewData} ratio="16:9" displayWidth={340} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <FontAwesomeIcon icon={faExpand} className="text-white text-2xl drop-shadow" />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-black/40 animate-pulse" />
          )}
        </div>
      </td>

      {/* 9:16 */}
      <td className="px-4 py-3 align-top w-[170px]">
        <div
          onClick={() => !isScene1 && mounted && onPreviewClick(modalData, '9:16', scene.index)}
          style={{ width: 150, height: 267, borderRadius: 8, overflow: 'hidden', background: '#050508', border: '1px solid rgba(255,255,255,0.06)', cursor: isScene1 ? 'default' : 'pointer', position: 'relative' }}
          className={!isScene1 ? 'group' : ''}
        >
          {isScene1 ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-orange-400/50">
              <span className="text-[10px] font-bold">mp4 예정</span>
            </div>
          ) : mounted ? (
            <>
              <RemotionPreviewPlayer data={previewData} ratio="9:16" displayWidth={150} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <FontAwesomeIcon icon={faExpand} className="text-white text-xl drop-shadow" />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-black/40 animate-pulse" />
          )}
        </div>
      </td>
    </tr>
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

  const openModal = useCallback((data: AccentCompositionProps, ratio: '16:9' | '9:16', sceneIdx: number) => {
    setModal({ data, ratio, sceneIdx });
  }, []);

  const loadScenes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/browser/scenes-with-accents`);
      if (!res.ok) throw new Error(`API 오류 ${res.status}`);
      const data = await res.json();
      setScenes(data.scenes ?? []);
      setVideoTitle(data.videoTitle ?? '');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadScenes(); }, []);

  return (
    <div className="relative min-h-screen bg-[#0f0f1a] text-white">
      {modal && <PreviewModal modal={modal} onClose={() => setModal(null)} />}
      <Aurora colorStops={['#1e1b4b', '#312e81', '#1e1b4b']} amplitude={0.6} blend={0.15} />

      {/* 헤더 */}
      <div className="relative z-10 border-b border-white/8 bg-[#0f0f1a]/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/content/longform" className="text-slate-500 hover:text-slate-300 transition-colors">
            <FontAwesomeIcon icon={faArrowLeft} />
          </Link>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faFilm} className="text-indigo-400" />
              Remotion 강조 비주얼
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              TTS 타이밍 동기화 · 씬별 accent 자동감지 · 16:9 / 9:16 미리보기
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 강조 색상 선택 */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white/4 border border-white/8 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 mr-1">색상</span>
            {ACCENT_PRESETS.map(p => (
              <button
                key={p.color}
                title={p.label}
                onClick={() => setAccentColor(p.color)}
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: p.color,
                  border: accentColor === p.color ? `2px solid #fff` : '2px solid transparent',
                  boxShadow: accentColor === p.color ? `0 0 8px ${p.color}` : 'none',
                  cursor: 'pointer', flexShrink: 0,
                }}
              />
            ))}
          </div>
          <button
            onClick={loadScenes}
            className="flex items-center gap-2 px-3 py-2 bg-white/6 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all"
          >
            <FontAwesomeIcon icon={faRefresh} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
          <button
            onClick={() => window.open(REMOTION_STUDIO_URL, '_blank', 'width=1440,height=900')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-500/20"
          >
            <FontAwesomeIcon icon={faEye} />
            Remotion 스튜디오
            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[9px] opacity-70" />
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div className="relative z-10 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span className="text-sm">대본 불러오는 중...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
            <p className="text-sm text-red-400">{error}</p>
            <p className="text-xs">API 서버(port 8000)가 실행 중인지 확인하세요.</p>
            <button onClick={loadScenes} className="mt-2 px-4 py-2 bg-white/8 rounded-lg text-xs hover:bg-white/12 transition-all">
              다시 시도
            </button>
          </div>
        ) : scenes.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-slate-600 text-sm">
            대본 없음 — 키프레임 페이지에서 대본을 먼저 생성하세요.
          </div>
        ) : (
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                <th className="px-4 py-3 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider w-16">씬</th>
                <th className="px-4 py-3 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">대본 · accent 타이밍</th>
                <th className="px-4 py-3 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider w-[360px]">16:9</th>
                <th className="px-4 py-3 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider w-[170px]">9:16</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((scene, i) => (
                <SceneRow key={scene.index} scene={scene} rowIdx={i}
                  videoTitle={videoTitle} accentColor={accentColor} onPreviewClick={openModal} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
