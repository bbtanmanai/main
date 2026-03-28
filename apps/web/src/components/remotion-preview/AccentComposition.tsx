'use client';

import { AbsoluteFill, Audio, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { AccentNum } from './AccentNum';
import { AccentBar } from './AccentBar';
import { AccentFlow } from './AccentFlow';
import { AccentList } from './AccentList';

export interface TimedAccent {
  accentType: 'num' | 'bar' | 'flow' | 'list';
  start_sec: number;
  end_sec: number;
  // num
  value?: string;
  label?: string;
  // bar
  left?: { label: string; value: string };
  right?: { label: string; value: string };
  // flow
  steps?: string[];
  // list
  items?: string[];
}

export interface AccentCompositionProps {
  accents: TimedAccent[];
  tts_duration: number;
  bgImage?: string;
  videoTitle?: string;
  audioSrc?: string;
  /** true: 배경+액센트만 표시 (테이블 썸네일용) */
  simple?: boolean;
  /** 강조 색상 (제목 글로우 + 주요 accent 색상) */
  accentColor?: string;
}

export const DEFAULT_ACCENT_COLOR = '#6366f1';

const OVERLAY_BY_TYPE: Record<string, string> = {
  num:  'radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.18) 0%, transparent 58%), radial-gradient(ellipse at 72% 75%, rgba(139,92,246,0.12) 0%, transparent 58%)',
  bar:  'radial-gradient(ellipse at 20% 30%, rgba(99,102,241,0.14) 0%, transparent 55%), radial-gradient(ellipse at 80% 65%, rgba(16,185,129,0.16) 0%, transparent 55%)',
  flow: 'radial-gradient(ellipse at 70% 35%, rgba(139,92,246,0.18) 0%, transparent 55%), radial-gradient(ellipse at 25% 72%, rgba(99,102,241,0.12) 0%, transparent 55%)',
  list: 'radial-gradient(ellipse at 30% 25%, rgba(244,63,94,0.18) 0%, transparent 55%), radial-gradient(ellipse at 74% 68%, rgba(249,115,22,0.12) 0%, transparent 55%)',
};

function AnimatedOverlay({ accentType }: { accentType: string }) {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 240], [0, 1], { extrapolateRight: 'extend' });
  const sheenX = Math.sin(drift * Math.PI * 2) * 36;
  const sheenY = Math.cos(drift * Math.PI * 2) * 20;
  return (
    <>
      <AbsoluteFill style={{
        backgroundImage: OVERLAY_BY_TYPE[accentType] ?? OVERLAY_BY_TYPE['num'],
        mixBlendMode: 'screen',
        opacity: 0.85,
        transform: `translate(${sheenX}px, ${sheenY}px)`,
      }} />
      <AbsoluteFill style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(0,0,0,0.55) 100%)',
      }} />
    </>
  );
}

/** 상단 제목 바 */
function TitleBar({ title, accentColor }: { title: string; accentColor: string }) {
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;

  const topPad  = Math.round(height * 0.025);
  const padH    = Math.round(width  * 0.05);
  const padLeft = Math.round(width  * 0.018);
  const fontSize = Math.round(height * 0.030);

  const textStyle = {
    margin: 0, fontSize, fontWeight: 900 as const,
    fontFamily: "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif",
    lineHeight: 1.35, letterSpacing: -0.5,
    wordBreak: 'keep-all' as const, paddingLeft: padLeft,
  };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      background: 'rgba(0,0,0,0.88)',
      padding: `${topPad}px ${padH}px ${Math.round(topPad * 0.85)}px`,
      pointerEvents: 'none',
    }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.10)' }} />
      <div style={{
        position: 'absolute', top: topPad * 0.6, bottom: topPad * 0.6, left: 0,
        width: Math.round(width * 0.006),
        background: `linear-gradient(180deg, ${accentColor}, ${accentColor}88)`,
        boxShadow: `0 0 18px ${accentColor}cc`,
      }} />
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <p style={{ ...textStyle, color: accentColor, overflow: 'hidden' }}>{title}</p>
        <p style={{
          ...textStyle, color: 'rgba(255,255,255,0.96)',
          position: 'absolute', top: 0, left: 0, right: 0,
          overflow: 'hidden',
        }}>{title}</p>
      </div>
    </div>
  );
}

/** 하단 자막 바 */
function SubtitleBar({ text }: { text: string }) {
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;
  const bottomMargin = Math.round(height * (isPortrait ? 0.22 : 0.11));
  const fontSize  = Math.round(height * 0.030);
  const barW      = Math.round(width  * 0.88);
  const barPadV   = Math.round(height * 0.018);
  const barPadH   = Math.round(width  * 0.04);
  const barRadius = Math.round(height * 0.014);

  return (
    <div style={{
      position: 'absolute', bottom: bottomMargin, left: 0, right: 0,
      display: 'flex', justifyContent: 'center', pointerEvents: 'none',
    }}>
      <div style={{
        width: barW, background: 'rgba(0,0,0,0.82)',
        borderRadius: barRadius, padding: `${barPadV}px ${barPadH}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{
          color: 'rgba(255,255,255,0.92)', fontSize, fontWeight: 700,
          fontFamily: "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif",
          lineHeight: 1.55, textAlign: 'center', wordBreak: 'keep-all',
          margin: 0, letterSpacing: -0.3,
        }}>{text}</p>
      </div>
    </div>
  );
}

function getTitleBarH(height: number, width: number): number {
  const isPortrait = height > width;
  const topPad = Math.round(height * 0.025);
  const fontSize = Math.round(height * 0.030);
  const lineH = fontSize * 1.35;
  const lines = isPortrait ? 2 : 1;
  return Math.round(topPad * 1.85 + lineH * lines);
}

const FADE_FRAMES = 8;

export function AccentComposition({
  accents = [], tts_duration, bgImage, videoTitle, audioSrc, simple = false,
  accentColor = DEFAULT_ACCENT_COLOR,
}: AccentCompositionProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const isPortrait = height > width;
  const currentSec = frame / fps;

  // 현재 프레임에서 활성 accent 찾기
  const activeAccent = accents.find(
    a => currentSec >= a.start_sec && currentSec < a.end_sec
  ) ?? null;

  // 활성 accent의 fade in/out opacity
  const accentOpacity = activeAccent ? (() => {
    const sf = activeAccent.start_sec * fps;
    const ef = activeAccent.end_sec   * fps;
    const fadeIn  = interpolate(frame, [sf, sf + FADE_FRAMES], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [ef - FADE_FRAMES, ef], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return Math.min(fadeIn, fadeOut);
  })() : 0;

  const titleH          = getTitleBarH(height, width);
  const subtitleBottom  = Math.round(height * (isPortrait ? 0.22 : 0.11));
  const subtitleBarH    = Math.round(height * 0.030 * 1.55) + Math.round(height * 0.018) * 2;
  const accentTopSafe    = titleH;
  const accentBottomSafe = subtitleBottom + subtitleBarH;

  const title = videoTitle ?? '영상 제목이 이 자리에 표시됩니다 — 길어지면 두 번째 줄에 색상이 달라집니다';

  // simple 모드: 배경 + accent 패널만 (썸네일용)
  if (simple) {
    return (
      <AbsoluteFill>
        {bgImage ? (
          <AbsoluteFill>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bgImage} alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </AbsoluteFill>
        ) : (
          <>
            <AbsoluteFill style={{ background: 'linear-gradient(135deg, #08081a 0%, #0e0e22 50%, #08081a 100%)' }} />
            <AbsoluteFill style={{
              backgroundImage: 'radial-gradient(rgba(99,102,241,0.10) 1px, transparent 1px)',
              backgroundSize: '52px 52px',
            }} />
          </>
        )}
        {/* accent 패널 — title/subtitle safe zone 안에 배치 */}
        <div style={{
          position: 'absolute',
          top: accentTopSafe, left: 0, right: 0, bottom: accentBottomSafe,
          opacity: accentOpacity,
        }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {activeAccent?.accentType === 'num'  && (
              <AccentNum value={activeAccent.value ?? ''} label={activeAccent.label ?? ''} startSec={activeAccent.start_sec} endSec={activeAccent.end_sec} accentColor={accentColor} />
            )}
            {activeAccent?.accentType === 'bar'  && activeAccent.left && activeAccent.right && (
              <AccentBar left={activeAccent.left} right={activeAccent.right} accentColor={accentColor} />
            )}
            {activeAccent?.accentType === 'flow' && activeAccent.steps && (
              <AccentFlow steps={activeAccent.steps} accentColor={accentColor} />
            )}
            {activeAccent?.accentType === 'list' && activeAccent.items && (
              <AccentList items={activeAccent.items} accentColor={accentColor} />
            )}
          </div>
        </div>

        {/* 제목 바 — 항상 표시 */}
        <TitleBar title={title} accentColor={accentColor} />

        {/* 자막 바 — 항상 표시 */}
        <SubtitleBar text="자막이 이 위치에 표시됩니다." />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {/* ① 배경 */}
      {bgImage ? (
        <AbsoluteFill>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bgImage} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </AbsoluteFill>
      ) : (
        <>
          <AbsoluteFill style={{ background: 'linear-gradient(135deg, #08081a 0%, #0e0e22 50%, #08081a 100%)' }} />
          <AbsoluteFill style={{
            backgroundImage: 'radial-gradient(rgba(99,102,241,0.10) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }} />
        </>
      )}

      {/* ② 컬러 오버레이 + 비네트 */}
      <AnimatedOverlay accentType={activeAccent?.accentType ?? 'num'} />

      {/* ③ accent 패널 — TTS 타이밍에 맞게 fade in/out */}
      <div style={{
        position: 'absolute',
        top: accentTopSafe, left: 0, right: 0, bottom: accentBottomSafe,
        opacity: accentOpacity,
      }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {activeAccent?.accentType === 'num'  && (
            <AccentNum value={activeAccent.value ?? ''} label={activeAccent.label ?? ''} startSec={activeAccent.start_sec} endSec={activeAccent.end_sec} />
          )}
          {activeAccent?.accentType === 'bar'  && activeAccent.left && activeAccent.right && (
            <AccentBar left={activeAccent.left} right={activeAccent.right} />
          )}
          {activeAccent?.accentType === 'flow' && activeAccent.steps && (
            <AccentFlow steps={activeAccent.steps} />
          )}
          {activeAccent?.accentType === 'list' && activeAccent.items && (
            <AccentList items={activeAccent.items} />
          )}
        </div>
      </div>

      {/* ④ 상단 제목 바 */}
      <TitleBar title={title} accentColor={accentColor} />

      {/* ⑤ 하단 자막 바 */}
      <SubtitleBar text="자막이 이 위치에 표시됩니다." />

      {/* ⑥ TTS 오디오 */}
      {audioSrc && <Audio src={audioSrc} />}
    </AbsoluteFill>
  );
}
