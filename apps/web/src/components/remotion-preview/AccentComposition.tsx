'use client';

import type React from 'react';
import { AbsoluteFill, Audio, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { AccentNum } from './AccentNum';
import { AccentBar } from './AccentBar';
import { AccentFlow } from './AccentFlow';
import { AccentList } from './AccentList';
import { StatCard, type StatItem } from './StatCard';
import { QuoteHero } from './QuoteHero';
import { ComparisonTable, type ComparisonRow } from './ComparisonTable';
import { Timeline, type TimelineItem } from './Timeline';
import { RankingList, type RankingItem } from './RankingList';
import { SplitScreen, type SplitSide } from './SplitScreen';
import { IconGrid, type IconGridItem } from './IconGrid';
import { Flowchart, type FlowNode } from './Flowchart';
import { FullImage } from './FullImage';

export interface TimedAccent {
  accentType: 'num' | 'bar' | 'flow' | 'list' | 'stat_card' | 'quote_hero' | 'comparison_table' | 'timeline' | 'ranking_list' | 'split_screen' | 'icon_grid' | 'flowchart' | 'full_image' | 'key_point' | 'contrast_statement';
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
  // stat_card
  title?: string;
  stats?: StatItem[];
  // quote_hero
  quote?: string;
  speaker?: string;
  role?: string;
  // comparison_table
  leftLabel?: string;
  rightLabel?: string;
  rows?: ComparisonRow[];
  // timeline
  timelineItems?: TimelineItem[];
  // ranking_list
  rankingTitle?: string;
  rankingItems?: RankingItem[];
  rankingUnit?: string;
  // split_screen
  splitTitle?: string;
  splitLeft?: SplitSide;
  splitRight?: SplitSide;
  // icon_grid
  iconGridTitle?: string;
  iconGridItems?: IconGridItem[];
  // flowchart
  flowchartTitle?: string;
  flowchartNodes?: FlowNode[];
  // full_image
  imageSrc?: string;
  imageCaption?: string;
  // key_point
  text?: string;
  emphasis?: string;
  // contrast_statement
  before?: string;
  after?: string;
}

export interface WordTimestamp {
  word: string;
  start: number; // 초
  end: number;   // 초
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
  /** 서버 사전계산 자막 청크 (33자 단위) */
  subtitleChunks?: SubtitleChunk[];
}

export interface SubtitleChunk {
  text: string;
  start: number;
  end: number;
}

export const DEFAULT_ACCENT_COLOR = '#6366f1';

const OVERLAY_BY_TYPE: Record<string, string> = {
  num:  'radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.18) 0%, transparent 58%), radial-gradient(ellipse at 72% 75%, rgba(139,92,246,0.12) 0%, transparent 58%)',
  bar:  'radial-gradient(ellipse at 20% 30%, rgba(99,102,241,0.14) 0%, transparent 55%), radial-gradient(ellipse at 80% 65%, rgba(16,185,129,0.16) 0%, transparent 55%)',
  flow: 'radial-gradient(ellipse at 70% 35%, rgba(139,92,246,0.18) 0%, transparent 55%), radial-gradient(ellipse at 25% 72%, rgba(99,102,241,0.12) 0%, transparent 55%)',
  list: 'radial-gradient(ellipse at 30% 25%, rgba(244,63,94,0.18) 0%, transparent 55%), radial-gradient(ellipse at 74% 68%, rgba(249,115,22,0.12) 0%, transparent 55%)',
};

/** 배경 이미지 — 줌인 + 좌→우 슬라이딩 루프 애니메이션
 *
 * 루프 주기(LOOP_SEC)마다 코사인 기반으로 seamless 반복.
 * cos(0)=-1(왼쪽) → cos(π)=+1(오른쪽) → cos(2π)=-1(왼쪽) 자연스럽게 루프.
 * 줌도 동일 주기로 1.04↔1.12 oscillation → 끊김 없음.
 */
const LOOP_SEC = 20; // 루프 주기(초) — 짧을수록 움직임 빠름

function KenBurnsImage({ src }: { src: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const loopFrames = LOOP_SEC * fps;
  // 0~2π 반복 — 경계에서 수학적으로 연속
  const phase = ((frame % loopFrames) / loopFrames) * Math.PI * 2;

  // 줌: 1.04 ~ 1.12 (코사인 기반 부드러운 펄스)
  const scale = 1.04 + 0.04 * (1 - Math.cos(phase)) / 2;

  // 좌→우 슬라이딩: -5% ~ +5% (코사인: 시작=왼쪽, 반주기=오른쪽, 종료=왼쪽)
  const tx = -5 * Math.cos(phase);

  // 미세 수직: -1.5% ~ +1.5% (반주기 오프셋으로 zoom과 타이밍 엇갈림)
  const ty = 1.5 * Math.sin(phase + Math.PI / 3);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt=""
      style={{
        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
        transform: `scale(${scale.toFixed(4)}) translate(${tx.toFixed(3)}%, ${ty.toFixed(3)}%)`,
        transformOrigin: 'center center',
        willChange: 'transform',
      }} />
  );
}

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

/** 제목을 1줄/2줄+로 분리: 1줄=흰색, 2줄+=accentColor */
function splitTitleLines(title: string, charsPerLine: number): [string, string] {
  if (title.length <= charsPerLine) return [title, ''];
  // 마지막 공백 기준으로 자연스러운 줄바꿈
  let breakAt = charsPerLine;
  while (breakAt > 0 && title[breakAt] !== ' ') breakAt--;
  if (breakAt === 0) breakAt = charsPerLine; // 공백 없으면 강제 분리
  return [title.slice(0, breakAt).trim(), title.slice(breakAt).trim()];
}

/** 상단 제목 바 */
function TitleBar({ title, accentColor }: { title: string; accentColor: string }) {
  const { width, height } = useVideoConfig();

  const topPad  = Math.round(height * 0.025);
  const padH    = Math.round(width  * 0.05);
  const padLeft = Math.round(width  * 0.018);
  const fontSize = Math.round(height * 0.030);

  // 9:16: ~17자/줄, 16:9: ~55자/줄
  const availableWidth = width * 0.882;
  const charsPerLine = Math.floor(availableWidth / (fontSize * 0.95));
  const [line1, line2] = splitTitleLines(title, charsPerLine);

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
      <p style={{ ...textStyle, color: 'rgba(255,255,255,0.96)' }}>{line1}</p>
      {line2 && <p style={{ ...textStyle, color: accentColor }}>{line2}</p>}
    </div>
  );
}

/** 하단 자막 바 — 서버 사전계산 22자 청크 기반 */
function SubtitleBar({ subtitleChunks, accentColor }: { subtitleChunks?: SubtitleChunk[]; accentColor: string }) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const isPortrait = height > width;
  const currentSec = frame / fps;

  const bottomMargin = Math.round(height * (isPortrait ? 0.22 : 0.11));
  const fontSize  = Math.round(height * 0.030) + (isPortrait ? 0 : 1);
  const strokeWidth = Math.round(fontSize * 0.06) + 1; // 테두리 굵기

  const chunks = subtitleChunks ?? [];

  // gap-aware 탐색: 다음 청크 start 이전까지만 현재 청크 표시
  let cur: SubtitleChunk | undefined;
  for (let ci = 0; ci < chunks.length; ci++) {
    const c = chunks[ci];
    const nextStart = chunks[ci + 1]?.start ?? c.end;
    if (currentSec >= c.start && currentSec < nextStart && currentSec <= c.end) {
      cur = c;
      break;
    }
  }
  const fullText = cur?.text ?? '';

  // 한 글자씩 등장 애니메이션: 청크 지속 시간의 60% 동안 reveal, 나머지 40%는 홀드
  const visibleText = (() => {
    if (!cur || !fullText) return '';
    const elapsed      = currentSec - cur.start;
    const revealDur    = (cur.end - cur.start) * 0.6;
    const visibleCount = Math.min(fullText.length, Math.ceil((elapsed / revealDur) * fullText.length));
    return fullText.slice(0, Math.max(1, visibleCount));
  })();

  if (!visibleText) return null;

  const textStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.96)', fontSize, fontWeight: 900,
    fontFamily: "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif",
    lineHeight: 1.55, textAlign: 'center', wordBreak: 'keep-all',
    margin: 0, letterSpacing: -0.3,
    // 텍스트 테두리 — accent 색상
    WebkitTextStroke: `${strokeWidth}px ${accentColor}`,
    paintOrder: 'stroke fill',
    textShadow: `0 2px 8px rgba(0,0,0,0.85), 0 0 20px ${accentColor}55`,
  };

  return (
    <div style={{
      position: 'absolute', bottom: bottomMargin, left: 0, right: 0,
      display: 'flex', justifyContent: 'center', pointerEvents: 'none',
    }}>
      <p style={{ ...textStyle, maxWidth: '80%' }}>{visibleText}</p>
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
  accentColor = DEFAULT_ACCENT_COLOR, subtitleChunks,
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

  // full_image: 전체화면 이미지 — 독립 렌더
  if (activeAccent?.accentType === 'full_image') {
    return (
      <AbsoluteFill style={{ opacity: accentOpacity }}>
        <FullImage src={activeAccent.imageSrc} caption={activeAccent.imageCaption} accentColor={accentColor} />
      </AbsoluteFill>
    );
  }

  // simple 모드: 배경 + accent 패널만 (썸네일용)
  if (simple) {
    return (
      <AbsoluteFill>
        {bgImage ? (
          <AbsoluteFill>
            <KenBurnsImage src={bgImage} />
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
            {activeAccent?.accentType === 'stat_card' && activeAccent.stats && (
              <StatCard title={activeAccent.title} stats={activeAccent.stats} accentColor={accentColor} />
            )}
            {activeAccent?.accentType === 'quote_hero' && activeAccent.quote && (
              <QuoteHero quote={activeAccent.quote} speaker={activeAccent.speaker} role={activeAccent.role} accentColor={accentColor} />
            )}
            {activeAccent?.accentType === 'comparison_table' && activeAccent.rows && (
              <ComparisonTable leftLabel={activeAccent.leftLabel} rightLabel={activeAccent.rightLabel} rows={activeAccent.rows} accentColor={accentColor} />
            )}
            {activeAccent?.accentType === 'timeline' && activeAccent.timelineItems && (
              <Timeline items={activeAccent.timelineItems} accentColor={accentColor} />
            )}
            {activeAccent?.accentType === 'ranking_list' && activeAccent.rankingItems && (
              <RankingList title={activeAccent.rankingTitle} items={activeAccent.rankingItems} unit={activeAccent.rankingUnit} accentColor={accentColor} />
            )}
            {activeAccent?.accentType === 'split_screen' && activeAccent.splitLeft && activeAccent.splitRight && (
              <SplitScreen title={activeAccent.splitTitle} left={activeAccent.splitLeft} right={activeAccent.splitRight} accentColor={accentColor} />
            )}
            {activeAccent?.accentType === 'icon_grid' && activeAccent.iconGridItems && (
              <IconGrid title={activeAccent.iconGridTitle} items={activeAccent.iconGridItems} accentColor={accentColor} />
            )}
            {activeAccent?.accentType === 'flowchart' && activeAccent.flowchartNodes && (
              <Flowchart title={activeAccent.flowchartTitle} nodes={activeAccent.flowchartNodes} accentColor={accentColor} />
            )}
            {activeAccent?.accentType === 'key_point' && activeAccent.text && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', padding:'0 8%' }}>
                <p style={{ margin:0, fontSize:'clamp(28px,5vw,64px)', fontWeight:900, fontFamily:"'Noto Sans KR','Malgun Gothic',sans-serif", lineHeight:1.4, textAlign:'center', wordBreak:'keep-all', color:'#fff', textShadow:`0 0 40px ${accentColor}99` }}>
                  {activeAccent.emphasis
                    ? activeAccent.text.split(activeAccent.emphasis).map((part, i, arr) =>
                        i < arr.length - 1
                          ? <span key={i}>{part}<span style={{ color: accentColor, textShadow:`0 0 24px ${accentColor}` }}>{activeAccent.emphasis}</span></span>
                          : <span key={i}>{part}</span>
                      )
                    : activeAccent.text}
                </p>
              </div>
            )}
            {activeAccent?.accentType === 'contrast_statement' && activeAccent.before && activeAccent.after && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', gap:'6%', padding:'0 6%' }}>
                <p style={{ margin:0, fontSize:'clamp(20px,3.5vw,48px)', fontWeight:700, fontFamily:"'Noto Sans KR','Malgun Gothic',sans-serif", textAlign:'center', wordBreak:'keep-all', color:'rgba(255,255,255,0.55)', textDecoration:'line-through' }}>{activeAccent.before}</p>
                <div style={{ width:'40%', height:2, background:`linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
                <p style={{ margin:0, fontSize:'clamp(24px,4.5vw,60px)', fontWeight:900, fontFamily:"'Noto Sans KR','Malgun Gothic',sans-serif", textAlign:'center', wordBreak:'keep-all', color:'#fff', textShadow:`0 0 32px ${accentColor}` }}>{activeAccent.after}</p>
              </div>
            )}
          </div>
        </div>

        {/* 제목 바 — 항상 표시 */}
        <TitleBar title={title} accentColor={accentColor} />

        {/* 자막 바 — TTS 싱크 */}
        <SubtitleBar subtitleChunks={subtitleChunks} accentColor={accentColor} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {/* ① 배경 */}
      {bgImage ? (
        <AbsoluteFill>
          <KenBurnsImage src={bgImage} />
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
          {activeAccent?.accentType === 'stat_card' && activeAccent.stats && (
            <StatCard title={activeAccent.title} stats={activeAccent.stats} accentColor={accentColor} />
          )}
          {activeAccent?.accentType === 'quote_hero' && activeAccent.quote && (
            <QuoteHero quote={activeAccent.quote} speaker={activeAccent.speaker} role={activeAccent.role} accentColor={accentColor} />
          )}
          {activeAccent?.accentType === 'comparison_table' && activeAccent.rows && (
            <ComparisonTable leftLabel={activeAccent.leftLabel} rightLabel={activeAccent.rightLabel} rows={activeAccent.rows} accentColor={accentColor} />
          )}
          {activeAccent?.accentType === 'timeline' && activeAccent.timelineItems && (
            <Timeline items={activeAccent.timelineItems} accentColor={accentColor} />
          )}
          {activeAccent?.accentType === 'ranking_list' && activeAccent.rankingItems && (
            <RankingList title={activeAccent.rankingTitle} items={activeAccent.rankingItems} unit={activeAccent.rankingUnit} accentColor={accentColor} />
          )}
          {activeAccent?.accentType === 'split_screen' && activeAccent.splitLeft && activeAccent.splitRight && (
            <SplitScreen title={activeAccent.splitTitle} left={activeAccent.splitLeft} right={activeAccent.splitRight} accentColor={accentColor} />
          )}
          {activeAccent?.accentType === 'icon_grid' && activeAccent.iconGridItems && (
            <IconGrid title={activeAccent.iconGridTitle} items={activeAccent.iconGridItems} accentColor={accentColor} />
          )}
          {activeAccent?.accentType === 'flowchart' && activeAccent.flowchartNodes && (
            <Flowchart title={activeAccent.flowchartTitle} nodes={activeAccent.flowchartNodes} accentColor={accentColor} />
          )}
          {activeAccent?.accentType === 'key_point' && activeAccent.text && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', padding:'0 8%' }}>
              <p style={{ margin:0, fontSize:'clamp(28px,5vw,64px)', fontWeight:900, fontFamily:"'Noto Sans KR','Malgun Gothic',sans-serif", lineHeight:1.4, textAlign:'center', wordBreak:'keep-all', color:'#fff', textShadow:`0 0 40px ${accentColor}99` }}>
                {activeAccent.emphasis
                  ? activeAccent.text.split(activeAccent.emphasis).map((part, i, arr) =>
                      i < arr.length - 1
                        ? <span key={i}>{part}<span style={{ color: accentColor, textShadow:`0 0 24px ${accentColor}` }}>{activeAccent.emphasis}</span></span>
                        : <span key={i}>{part}</span>
                    )
                  : activeAccent.text}
              </p>
            </div>
          )}
          {activeAccent?.accentType === 'contrast_statement' && activeAccent.before && activeAccent.after && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', gap:'6%', padding:'0 6%' }}>
              <p style={{ margin:0, fontSize:'clamp(20px,3.5vw,48px)', fontWeight:700, fontFamily:"'Noto Sans KR','Malgun Gothic',sans-serif", textAlign:'center', wordBreak:'keep-all', color:'rgba(255,255,255,0.55)', textDecoration:'line-through' }}>{activeAccent.before}</p>
              <div style={{ width:'40%', height:2, background:`linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
              <p style={{ margin:0, fontSize:'clamp(24px,4.5vw,60px)', fontWeight:900, fontFamily:"'Noto Sans KR','Malgun Gothic',sans-serif", textAlign:'center', wordBreak:'keep-all', color:'#fff', textShadow:`0 0 32px ${accentColor}` }}>{activeAccent.after}</p>
            </div>
          )}
        </div>
      </div>

      {/* ④ 상단 제목 바 */}
      <TitleBar title={title} accentColor={accentColor} />

      {/* ⑤ 하단 자막 바 — TTS 싱크 */}
      <SubtitleBar subtitleChunks={subtitleChunks} accentColor={accentColor} />

      {/* ⑥ TTS 오디오 */}
      {audioSrc && <Audio src={audioSrc} />}
    </AbsoluteFill>
  );
}
