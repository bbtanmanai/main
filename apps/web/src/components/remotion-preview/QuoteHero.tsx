import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface QuoteHeroProps {
  quote: string;
  speaker?: string;
  role?: string;
  accentColor?: string;
}

const DEFAULT_ACCENT = '#6366f1';
const FONT = "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif";

/** 텍스트 길이 기반 자동 폰트 크기 */
function autoQuoteSize(text: string, maxW: number, baseSize: number, minSize: number): number {
  const len = text.length || 1;
  // 한글 1자 ≈ baseSize * 0.85px 기준으로 2줄 허용
  const maxPerLine = Math.floor(maxW / (baseSize * 0.85));
  const lines = Math.ceil(len / maxPerLine);
  if (lines <= 2) return baseSize;
  return Math.max(Math.floor(baseSize * (2 / lines)), minSize);
}

export function QuoteHero({
  quote   = '한 번의 실험이 천 번의 이론보다 가치 있다',
  speaker = '알버트 아인슈타인',
  role    = '물리학자',
  accentColor = DEFAULT_ACCENT,
}: QuoteHeroProps) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const BASE   = Math.min(width, height);
  const isWide = width > height;

  // 진입 / 퇴장
  const enterOp  = interpolate(frame, [0, 20], [0, 1],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitOp   = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity  = Math.min(enterOp, exitOp);
  const float    = Math.sin((frame / 60) * Math.PI * 2) * 5;

  // 따옴표 spring pop-in
  const quoteSp  = spring({ frame, fps, config: { damping: 14, stiffness: 120, mass: 0.6 } });
  const quoteScale = interpolate(quoteSp, [0, 1], [0.3, 1]);

  // 텍스트 글자별 순차 등장 (타이핑 효과)
  const charDelay = 2; // 프레임당 몇 글자
  const startFrame = 10;
  const charsVisible = Math.floor(Math.max(0, frame - startFrame) / charDelay * 2.5);

  // 하단 라인 slide-in
  const lineW = interpolate(frame, [30, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 발언자 fade-in
  const speakerOp = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const speakerX  = interpolate(frame, [50, 70], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 크기
  const cardW     = Math.round(width  * (isWide ? 0.78 : 0.86));
  const cardPadX  = Math.round(BASE   * 0.055);
  const cardPadY  = Math.round(BASE   * 0.048);
  const openSize  = Math.round(BASE   * (isWide ? 0.16 : 0.12));
  const maxTextW  = cardW - cardPadX * 2;
  const quoteSize = autoQuoteSize(quote, maxTextW, Math.round(BASE * (isWide ? 0.048 : 0.038)), Math.round(BASE * 0.026));
  const speakerSize = Math.round(BASE * 0.022);
  const roleSize    = Math.round(BASE * 0.018);

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ opacity, transform: `translateY(${float}px)`, width: cardW }}>

        {/* 카드 */}
        <div style={{
          position: 'relative',
          padding: `${cardPadY}px ${cardPadX}px`,
          borderRadius: 32,
          background: 'rgba(6,6,18,0.85)',
          border: `1.5px solid ${accentColor}40`,
          boxShadow: `0 32px 100px rgba(0,0,0,0.65), 0 0 80px ${accentColor}18`,
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }}>

          {/* 왼쪽 세로 글로우 바 */}
          <div style={{
            position: 'absolute', top: cardPadY, left: 0, bottom: cardPadY,
            width: Math.round(BASE * 0.005),
            background: `linear-gradient(180deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 24px ${accentColor}`,
          }} />

          {/* 배경 shimmer */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `radial-gradient(ellipse at 10% 50%, ${accentColor}12 0%, transparent 55%), radial-gradient(ellipse at 90% 50%, ${accentColor}08 0%, transparent 55%)`,
          }} />

          {/* 여는 따옴표 */}
          <div style={{
            transform: `scale(${quoteScale})`,
            transformOrigin: 'left top',
            fontSize: openSize,
            fontWeight: 950,
            color: accentColor,
            lineHeight: 0.8,
            marginBottom: Math.round(BASE * 0.012),
            textShadow: `0 0 40px ${accentColor}88`,
            display: 'inline-block',
          }}>
            "
          </div>

          {/* 본문 인용 */}
          <div style={{
            fontSize: quoteSize,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.95)',
            lineHeight: 1.65,
            letterSpacing: -0.5,
            wordBreak: 'keep-all',
            marginBottom: Math.round(BASE * 0.032),
            paddingLeft: Math.round(BASE * 0.008),
          }}>
            {quote.split('').map((char, i) => (
              <span
                key={i}
                style={{
                  opacity: i < charsVisible ? 1 : 0,
                  display: 'inline',
                }}
              >
                {char}
              </span>
            ))}
          </div>

          {/* 닫는 따옴표 — 오른쪽 정렬 */}
          <div style={{
            textAlign: 'right',
            fontSize: openSize * 0.85,
            fontWeight: 950,
            color: `${accentColor}88`,
            lineHeight: 0.8,
            marginBottom: Math.round(BASE * 0.028),
            textShadow: `0 0 30px ${accentColor}66`,
          }}>
            "
          </div>

          {/* 구분선 */}
          <div style={{
            height: 1.5,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}00)`,
            width: `${lineW * 100}%`,
            marginBottom: Math.round(BASE * 0.022),
            boxShadow: `0 0 12px ${accentColor}66`,
          }} />

          {/* 발언자 */}
          <div style={{
            opacity: speakerOp,
            transform: `translateX(${speakerX}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: Math.round(BASE * 0.016),
          }}>
            {/* 아바타 원형 */}
            <div style={{
              width:  Math.round(BASE * 0.042),
              height: Math.round(BASE * 0.042),
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}66)`,
              border: `2px solid ${accentColor}88`,
              boxShadow: `0 0 18px ${accentColor}66`,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: Math.round(BASE * 0.020),
              color: '#fff',
              fontWeight: 900,
            }}>
              {speaker ? speaker[0] : '?'}
            </div>

            <div>
              <div style={{
                fontSize: speakerSize,
                fontWeight: 900,
                color: 'rgba(255,255,255,0.90)',
                letterSpacing: -0.3,
              }}>
                {speaker}
              </div>
              {role && (
                <div style={{
                  fontSize: roleSize,
                  fontWeight: 600,
                  color: accentColor,
                  marginTop: 2,
                }}>
                  {role}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
