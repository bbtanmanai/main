import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface IconGridItem {
  icon: string;   // 이모지
  label: string;
  desc?: string;
  highlight?: boolean;
}

export interface IconGridProps {
  title?: string;
  items: IconGridItem[];
  accentColor?: string;
}

const DEFAULT_ACCENT = '#6366f1';
const FONT = "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif";

export function IconGrid({
  title = '핵심 기능',
  items = [
    { icon: '🤖', label: 'AI 자동화',    desc: '반복 업무 제거',   highlight: true  },
    { icon: '⚡', label: '초고속 처리',  desc: '0.3초 응답'                         },
    { icon: '🔒', label: '보안 강화',    desc: '256비트 암호화'                     },
    { icon: '📊', label: '실시간 분석',  desc: '대시보드 제공'                      },
    { icon: '🌐', label: '글로벌 지원',  desc: '15개국 언어'                        },
    { icon: '💬', label: '24시간 지원',  desc: '전담 CS팀'                          },
  ],
  accentColor = DEFAULT_ACCENT,
}: IconGridProps) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const BASE   = Math.min(width, height);
  const isWide = width > height;

  const enterOp = interpolate(frame, [0, 18], [0, 1],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, 22], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitOp  = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(enterOp, exitOp);
  const float   = Math.sin((frame / 60) * Math.PI * 2) * 4;

  const visible = items.slice(0, isWide ? 8 : 6);
  const cols    = isWide
    ? (visible.length <= 3 ? 3 : visible.length <= 4 ? 4 : visible.length <= 6 ? 3 : 4)
    : (visible.length <= 4 ? 2 : 3);

  const ITEM_DELAY = 6;

  const cardW    = Math.round(width  * (isWide ? 0.84 : 0.88));
  const padX     = Math.round(BASE   * 0.040);
  const padY     = Math.round(BASE   * 0.034);
  const iconSize = Math.round(BASE   * (isWide ? 0.052 : 0.042));
  const labSize  = Math.round(BASE   * (isWide ? 0.022 : 0.018));
  const descSize = Math.round(BASE   * (isWide ? 0.016 : 0.013));
  const titleSize = Math.round(BASE  * 0.024);
  const itemPad  = Math.round(BASE   * 0.022);
  const gap      = Math.round(BASE   * 0.014);

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ opacity, transform: `translateY(${slideUp + float}px)`, width: cardW }}>

        <div style={{
          position: 'relative',
          borderRadius: 28,
          background: 'rgba(6,6,18,0.85)',
          border: '1.5px solid rgba(255,255,255,0.10)',
          boxShadow: `0 28px 90px rgba(0,0,0,0.65), 0 0 0 1px ${accentColor}1a`,
          backdropFilter: 'blur(18px)',
          overflow: 'hidden',
        }}>

          {/* 상단 글로우 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 20px ${accentColor}88`,
          }} />

          {/* shimmer */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `radial-gradient(ellipse at 50% 0%, ${accentColor}12 0%, transparent 55%)`,
          }} />

          {/* 제목 */}
          {title && (
            <div style={{
              padding: `${padY}px ${padX}px ${Math.round(padY * 0.5)}px`,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              fontSize: titleSize,
              fontWeight: 900,
              color: 'rgba(255,255,255,0.70)',
              letterSpacing: -0.3,
            }}>
              {title}
            </div>
          )}

          {/* 그리드 */}
          <div style={{
            padding: `${Math.round(padY * 0.7)}px ${padX}px ${padY}px`,
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap,
          }}>
            {visible.map((item, i) => {
              const delay    = i * ITEM_DELAY + 10;
              const itemOp   = interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const itemY    = interpolate(frame, [delay, delay + 16], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const iconSp   = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 12, stiffness: 140, mass: 0.5 } });
              const iconScale = interpolate(iconSp, [0, 1], [0.3, 1]);

              // 부유 효과 — 아이템마다 위상 다르게
              const itemFloat = Math.sin(((frame + i * 18) / 55) * Math.PI * 2) * 4;

              return (
                <div
                  key={i}
                  style={{
                    opacity: itemOp,
                    transform: `translateY(${itemY + itemFloat}px)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: itemPad,
                    borderRadius: 20,
                    background: item.highlight
                      ? `linear-gradient(135deg, ${accentColor}22, ${accentColor}0a)`
                      : 'rgba(255,255,255,0.03)',
                    border: item.highlight
                      ? `1.5px solid ${accentColor}55`
                      : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: item.highlight
                      ? `0 0 30px ${accentColor}22, inset 0 1px 0 ${accentColor}33`
                      : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* highlight 배지 */}
                  {item.highlight && (
                    <div style={{
                      position: 'absolute',
                      top: Math.round(BASE * 0.008),
                      right: Math.round(BASE * 0.010),
                      fontSize: Math.round(BASE * 0.012),
                      fontWeight: 900,
                      color: accentColor,
                      background: `${accentColor}22`,
                      border: `1px solid ${accentColor}44`,
                      borderRadius: 999,
                      padding: `1px ${Math.round(BASE * 0.008)}px`,
                      letterSpacing: 0.5,
                    }}>
                      ★
                    </div>
                  )}

                  {/* 아이콘 원형 배경 */}
                  <div style={{
                    width:  Math.round(iconSize * 1.7),
                    height: Math.round(iconSize * 1.7),
                    borderRadius: '50%',
                    background: item.highlight
                      ? `radial-gradient(circle, ${accentColor}33, ${accentColor}11)`
                      : 'rgba(255,255,255,0.06)',
                    border: item.highlight
                      ? `1.5px solid ${accentColor}44`
                      : '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: Math.round(BASE * 0.012),
                    transform: `scale(${iconScale})`,
                    boxShadow: item.highlight ? `0 0 20px ${accentColor}44` : 'none',
                  }}>
                    <span style={{ fontSize: iconSize, lineHeight: 1 }}>{item.icon}</span>
                  </div>

                  {/* 레이블 */}
                  <div style={{
                    fontSize: labSize,
                    fontWeight: item.highlight ? 900 : 800,
                    color: item.highlight ? '#fff' : 'rgba(255,255,255,0.82)',
                    letterSpacing: -0.3,
                    marginBottom: item.desc ? Math.round(BASE * 0.006) : 0,
                    wordBreak: 'keep-all',
                    lineHeight: 1.3,
                  }}>
                    {item.label}
                  </div>

                  {/* 설명 */}
                  {item.desc && (
                    <div style={{
                      fontSize: descSize,
                      fontWeight: 600,
                      color: item.highlight ? `${accentColor}cc` : 'rgba(255,255,255,0.38)',
                      wordBreak: 'keep-all',
                      lineHeight: 1.3,
                    }}>
                      {item.desc}
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
