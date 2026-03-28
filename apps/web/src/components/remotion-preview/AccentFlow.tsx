import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface AccentFlowProps {
  steps?: string[];
  accentColor?: string;
}

const DEFAULT_ACCENT = '#6366f1';
const FONT = "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif";

export function AccentFlow({ steps = ['준비 단계', '실행 시작', '결과 확인'], accentColor = DEFAULT_ACCENT }: AccentFlowProps) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const BASE = Math.min(width, height);

  // Wrapper enter/exit
  const enterOp = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, 20], [50, 0], { extrapolateRight: 'clamp' });
  const exitOp  = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(enterOp, exitOp);
  const float   = Math.sin((frame / 50) * Math.PI * 2) * 7;

  const visible = steps.slice(0, 4);
  const isWide  = BASE >= 1080;

  // Horizontal for 16:9, vertical for 9:16
  const isHoriz = isWide;

  const circleSize = Math.round(BASE * (isWide ? 0.053 : 0.043));
  const boxFont    = Math.round(BASE * (isWide ? 0.020 : 0.015));
  const boxPadV    = Math.round(BASE * (isWide ? 0.018 : 0.013));
  const boxPadH    = Math.round(BASE * (isWide ? 0.024 : 0.017));
  const boxPad     = `${boxPadV}px ${boxPadH}px`;
  const arrowFont  = Math.round(BASE * (isWide ? 0.033 : 0.024));
  const STEP_DELAY = 10;

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ opacity, transform: `translateY(${slideUp + float}px)` }}>

        {/* Outer card */}
        <div style={{
          position: 'relative',
          padding: isWide ? `${Math.round(BASE*0.048)}px ${Math.round(BASE*0.059)}px` : `${Math.round(BASE*0.037)}px ${Math.round(BASE*0.041)}px`,
          borderRadius: 32,
          background: 'rgba(8,8,20,0.80)',
          border: `1.5px solid ${accentColor}47`,
          boxShadow: `0 24px 100px rgba(0,0,0,0.65), 0 0 60px ${accentColor}1a`,
          backdropFilter: 'blur(16px)',
          overflow: 'hidden',
        }}>
          {/* Top bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 20px ${accentColor}`,
          }} />
          {/* Shimmer */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(ellipse at 30% 30%, ${accentColor}14 0%, transparent 55%)`,
            pointerEvents: 'none',
          }} />

          {/* Steps layout */}
          <div style={{
            display: 'flex',
            flexDirection: isHoriz ? 'row' : 'column',
            alignItems: 'center',
            gap: 0,
          }}>
            {visible.map((step, i) => {
              const sf = Math.max(0, frame - i * STEP_DELAY);
              const stepOp = interpolate(sf, [0, 16], [0, 1], { extrapolateRight: 'clamp' });
              const stepY  = interpolate(sf, [0, 16], [isHoriz ? 0 : 20, 0], { extrapolateRight: 'clamp' });
              const stepX  = interpolate(sf, [0, 16], [isHoriz ? 0 : 0, 0], { extrapolateRight: 'clamp' });
              const stepScale = interpolate(sf, [0, 16], [0.75, 1], { extrapolateRight: 'clamp' });

              return (
                <div key={i} style={{ display: 'flex', flexDirection: isHoriz ? 'row' : 'column', alignItems: 'center' }}>
                  {/* Step node */}
                  <div style={{
                    opacity: stepOp,
                    transform: `translate(${stepX}px, ${stepY}px) scale(${stepScale})`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 14,
                    margin: isHoriz ? '0' : '0 0 0 0',
                  }}>
                    {/* Circle */}
                    <div style={{
                      width: circleSize, height: circleSize,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${accentColor} 0%, rgba(109,40,217,0.9) 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: circleSize * 0.38,
                      fontWeight: 950,
                      color: '#fff',
                      boxShadow: `0 0 28px ${accentColor}70, 0 14px 50px rgba(0,0,0,0.4)`,
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    {/* Box */}
                    <div style={{
                      background: `${accentColor}${Math.round((0.10 + i * 0.06) * 255).toString(16).padStart(2,'0')}`,
                      border: `1.5px solid ${accentColor}73`,
                      borderRadius: 18,
                      padding: boxPad,
                      textAlign: 'center',
                      boxShadow: `0 8px 40px rgba(0,0,0,0.35)`,
                      minWidth: Math.round(BASE * (isWide ? 0.148 : 0.111)),
                      maxWidth: Math.round(BASE * (isWide ? 0.185 : 0.148)),
                    }}>
                      <div style={{ fontSize: boxFont, fontWeight: 850, color: 'rgba(255,255,255,0.92)', lineHeight: 1.35, wordBreak: 'keep-all' }}>
                        {step}
                      </div>
                    </div>
                  </div>

                  {/* Arrow connector */}
                  {i < visible.length - 1 && (
                    <div style={{
                      opacity: stepOp,
                      color: accentColor,
                      fontSize: arrowFont,
                      fontWeight: 900,
                      margin: isHoriz ? '0 16px' : '10px 0',
                      transform: isHoriz ? 'none' : 'rotate(90deg)',
                      textShadow: `0 0 20px ${accentColor}`,
                      flexShrink: 0,
                      lineHeight: 1,
                    }}>
                      →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
