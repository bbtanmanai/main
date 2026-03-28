import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface AccentListProps {
  items?: string[];
  accentColor?: string;
}

const DEFAULT_ACCENT = '#f43f5e';
const FONT = "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif";
const RANK_COLORS = ['#f43f5e', '#f97316', '#eab308', '#10b981'];
const RANK_MEDALS = ['①', '②', '③', '④'];

export function AccentList({ items = ['아침 산책 30분', '비타민 D 복용', '충분한 수면'], accentColor = DEFAULT_ACCENT }: AccentListProps) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const BASE = Math.min(width, height);

  // Wrapper enter/exit
  const enterOp = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: 'clamp' });
  const exitOp  = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(enterOp, exitOp);
  const float   = Math.sin((frame / 55) * Math.PI * 2) * 7;

  const visible   = items.slice(0, 4);
  const isWide    = BASE >= 1080;
  const ITEM_DELAY = 9;

  const itemFontSize  = Math.round(BASE * (isWide ? 0.025 : 0.018));
  const itemPadV      = Math.round(BASE * (isWide ? 0.018 : 0.014));
  const itemPadH      = Math.round(BASE * (isWide ? 0.026 : 0.019));
  const itemPad       = `${itemPadV}px ${itemPadH}px`;
  const badgeSize     = Math.round(BASE * (isWide ? 0.047 : 0.037));
  const badgeFont     = Math.round(BASE * (isWide ? 0.022 : 0.017));
  const cardPadV      = Math.round(BASE * (isWide ? 0.048 : 0.033));
  const cardPadH      = Math.round(BASE * (isWide ? 0.059 : 0.041));
  const cardPad       = `${cardPadV}px ${cardPadH}px`;

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ opacity, transform: `translateY(${slideUp + float}px)`, width: isWide ? '64%' : '82%' }}>

        {/* Main card */}
        <div style={{
          position: 'relative',
          padding: cardPad,
          borderRadius: 32,
          background: 'rgba(8,8,20,0.80)',
          border: `1.5px solid ${accentColor}38`,
          boxShadow: `0 24px 100px rgba(0,0,0,0.65), 0 0 60px ${accentColor}1a`,
          backdropFilter: 'blur(16px)',
          overflow: 'hidden',
        }}>
          {/* Left accent bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 6,
            background: `linear-gradient(180deg, ${accentColor} 0%, rgba(249,115,22,0.8) 100%)`,
            boxShadow: `0 0 26px ${accentColor}90`,
          }} />
          {/* Top bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          }} />
          {/* Shimmer */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(ellipse at 80% 20%, ${accentColor}12 0%, transparent 55%)`,
            pointerEvents: 'none',
          }} />

          {/* Items */}
          {visible.map((item, i) => {
            const sf = Math.max(0, frame - i * ITEM_DELAY);
            const itemOp    = interpolate(sf, [0, 14], [0, 1],  { extrapolateRight: 'clamp' });
            const slideX    = interpolate(sf, [0, 14], [-40, 0], { extrapolateRight: 'clamp' });
            const isTop     = i === 0;
            const color     = isTop ? accentColor : RANK_COLORS[i % RANK_COLORS.length];

            return (
              <div key={i} style={{
                opacity: itemOp,
                transform: `translateX(${slideX}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: Math.round(BASE * (isWide ? 0.020 : 0.015)),
                marginBottom: i < visible.length - 1 ? Math.round(BASE * (isWide ? 0.017 : 0.012)) : 0,
                padding: itemPad,
                background: isTop ? `${accentColor}1a` : 'rgba(255,255,255,0.04)',
                borderRadius: 20,
                border: `1px solid ${isTop ? `${accentColor}59` : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isTop ? `0 8px 40px rgba(0,0,0,0.3)` : '0 4px 20px rgba(0,0,0,0.2)',
                overflow: 'hidden',
                position: 'relative',
              }}>
                {/* Inner gradient for top item */}
                {isTop && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `linear-gradient(135deg, ${color}1a 0%, transparent 55%)`,
                    pointerEvents: 'none',
                  }} />
                )}

                {/* Badge */}
                <div style={{
                  position: 'relative',
                  width: badgeSize, height: badgeSize,
                  borderRadius: '50%',
                  background: isTop
                    ? `linear-gradient(135deg, ${color} 0%, rgba(249,115,22,0.85) 100%)`
                    : `rgba(255,255,255,0.07)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: badgeFont,
                  fontWeight: 950,
                  color: '#fff',
                  boxShadow: isTop ? `0 0 24px ${color}70` : '0 4px 14px rgba(0,0,0,0.3)',
                  flexShrink: 0,
                }}>
                  {RANK_MEDALS[i]}
                </div>

                {/* Text */}
                <div style={{ position: 'relative', flex: 1 }}>
                  <div style={{
                    fontSize: itemFontSize,
                    fontWeight: 850,
                    color: 'rgba(255,255,255,0.93)',
                    lineHeight: 1.35,
                    wordBreak: 'keep-all',
                    letterSpacing: -0.3,
                  }}>
                    {item}
                  </div>
                </div>

                {/* Right accent dot for top item */}
                {isTop && (
                  <div style={{
                    position: 'relative',
                    width: Math.round(BASE * (isWide ? 0.009 : 0.007)),
                    height: Math.round(BASE * (isWide ? 0.044 : 0.035)),
                    borderRadius: 999,
                    background: `linear-gradient(180deg, ${color} 0%, rgba(249,115,22,0.8) 100%)`,
                    boxShadow: `0 0 18px ${color}80`,
                    flexShrink: 0,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
