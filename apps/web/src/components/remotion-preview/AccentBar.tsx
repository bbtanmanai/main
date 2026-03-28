import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface AccentBarItem { label: string; value: string }
export interface AccentBarProps {
  left?: AccentBarItem;
  right?: AccentBarItem;
  accentColor?: string;
}

const DEFAULT_ACCENT = '#6366f1';
const RIGHT_COLOR = '#10b981';
const FONT = "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif";

function parsePct(v: string): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 50 : Math.min(n, 100);
}

export function AccentBar({
  left  = { label: '달걀', value: '91%' },
  right = { label: '두부', value: '78%' },
  accentColor = DEFAULT_ACCENT,
}: AccentBarProps) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const BASE = Math.min(width, height);

  // Enter / Exit
  const enterOp  = interpolate(frame, [0, 18], [0, 1],  { extrapolateRight: 'clamp' });
  const slideUp  = interpolate(frame, [0, 22], [60, 0], { extrapolateRight: 'clamp' });
  const exitOp   = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity  = Math.min(enterOp, exitOp);

  // Bars fill after card appears
  const barFill = interpolate(frame, [12, 42], [0, 1], { extrapolateRight: 'clamp' });

  // Float
  const float = Math.sin((frame / 50) * Math.PI * 2) * 7;

  const sides = [
    { item: left,  color: accentColor, pct: parsePct(left.value)  },
    { item: right, color: RIGHT_COLOR, pct: parsePct(right.value) },
  ];
  const maxPct = Math.max(...sides.map(s => s.pct));

  const isWide = BASE >= 1080;
  const cardPadX = Math.round(BASE * (isWide ? 0.067 : 0.037));
  const cardPadY = Math.round(BASE * (isWide ? 0.048 : 0.033));
  const barH     = Math.round(BASE * (isWide ? 0.018 : 0.013));
  const valSize  = Math.round(BASE * (isWide ? 0.053 : 0.037));
  const labelSize = Math.round(BASE * (isWide ? 0.023 : 0.017));
  const barMaxW  = Math.round(BASE * (isWide ? 0.481 : 0.315));

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ opacity, transform: `translateY(${slideUp + float}px)`, width: isWide ? '64%' : '82%' }}>

        {/* Main card */}
        <div style={{
          position: 'relative',
          padding: `${cardPadY}px ${cardPadX}px`,
          borderRadius: 32,
          background: 'rgba(8,8,20,0.80)',
          border: '1.5px solid rgba(255,255,255,0.14)',
          boxShadow: '0 24px 100px rgba(0,0,0,0.65)',
          backdropFilter: 'blur(16px)',
          overflow: 'hidden',
        }}>
          {/* Top gradient bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(90deg, ${accentColor}, ${RIGHT_COLOR})`,
            boxShadow: `0 0 24px ${accentColor}66`,
          }} />
          {/* Inner shimmer */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(ellipse at 20% 30%, ${accentColor}18 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, ${RIGHT_COLOR}12 0%, transparent 55%)`,
            pointerEvents: 'none',
          }} />

          {sides.map(({ item, color, pct }, i) => {
            const barW = ((pct / maxPct) * barFill) * barMaxW;
            const valOp = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp' });

            return (
              <div key={i} style={{ marginBottom: i === 0 ? 36 : 0, position: 'relative' }}>
                {/* Label + value row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                  <span style={{ fontSize: labelSize, fontWeight: 800, color: 'rgba(255,255,255,0.85)', wordBreak: 'keep-all' }}>
                    {item.label}
                  </span>
                  <span style={{
                    fontSize: valSize, fontWeight: 950, color,
                    opacity: valOp,
                    textShadow: `0 0 30px ${color}88`,
                    letterSpacing: -1,
                  }}>
                    {item.value}
                  </span>
                </div>

                {/* Bar track */}
                <div style={{
                  width: '100%', height: barH,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: barH / 2,
                  overflow: 'hidden',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
                }}>
                  <div style={{
                    width: barW,
                    maxWidth: '100%',
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}66, ${color})`,
                    borderRadius: barH / 2,
                    boxShadow: `0 0 18px ${color}88`,
                    transition: 'none',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
