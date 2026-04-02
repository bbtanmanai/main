import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface SplitSide {
  label: string;
  value?: string;
  points?: string[];
  color?: string;
}

export interface SplitScreenProps {
  title?: string;
  left: SplitSide;
  right: SplitSide;
  accentColor?: string;
}

const DEFAULT_ACCENT = '#6366f1';
const RIGHT_COLOR    = '#10b981';
const FONT           = "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif";

export function SplitScreen({
  title = '비포 vs 애프터',
  left  = {
    label: 'Before',
    value: '3시간',
    points: ['수동 반복 작업', '실수 잦음', '야근 일상화'],
    color: '#f43f5e',
  },
  right = {
    label: 'After',
    value: '15분',
    points: ['자동화 완료', '오류 제로', '칼퇴 실현'],
    color: '#10b981',
  },
  accentColor = DEFAULT_ACCENT,
}: SplitScreenProps) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const BASE   = Math.min(width, height);
  const isWide = width > height;

  // 진입 / 퇴장
  const enterOp = interpolate(frame, [0, 18], [0, 1],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitOp  = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(enterOp, exitOp);
  const float   = Math.sin((frame / 58) * Math.PI * 2) * 5;

  // 중앙 분리선 slide-down
  const dividerH = interpolate(frame, [5, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 좌우 패널 슬라이드
  const leftX  = interpolate(frame, [8, 26],  [-60, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rightX = interpolate(frame, [8, 26],  [60,  0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // VS 뱃지 pop
  const vsSp    = spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 12, stiffness: 130, mass: 0.5 } });
  const vsScale = interpolate(vsSp, [0, 1], [0, 1]);

  const POINT_DELAY = 6;

  const cardW    = Math.round(width  * (isWide ? 0.86 : 0.90));
  const padX     = Math.round(BASE   * 0.040);
  const padY     = Math.round(BASE   * 0.036);
  const headSize = Math.round(BASE   * 0.030);
  const valSize  = Math.round(BASE   * (isWide ? 0.064 : 0.052));
  const ptSize   = Math.round(BASE   * (isWide ? 0.020 : 0.017));
  const titleSize = Math.round(BASE  * 0.024);
  const dotSize  = Math.round(BASE   * 0.010);

  const leftColor  = left.color  ?? accentColor;
  const rightColor = right.color ?? RIGHT_COLOR;

  const renderPoints = (points: string[], color: string, startDelay: number, align: 'left' | 'right') =>
    points.slice(0, 4).map((pt, i) => {
      const d   = startDelay + i * POINT_DELAY;
      const op  = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const tx  = interpolate(frame, [d, d + 14], [align === 'left' ? -16 : 16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return (
        <div key={i} style={{
          opacity: op,
          transform: `translateX(${tx}px)`,
          display: 'flex',
          alignItems: 'center',
          gap: Math.round(BASE * 0.010),
          flexDirection: align === 'right' ? 'row-reverse' : 'row',
          marginBottom: Math.round(BASE * 0.010),
        }}>
          <div style={{
            width: dotSize, height: dotSize,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}88`,
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: ptSize,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.80)',
            wordBreak: 'keep-all',
            textAlign: align,
          }}>
            {pt}
          </span>
        </div>
      );
    });

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ opacity, transform: `translateY(${float}px)`, width: cardW }}>

        <div style={{
          position: 'relative',
          borderRadius: 28,
          background: 'rgba(6,6,18,0.85)',
          border: '1.5px solid rgba(255,255,255,0.10)',
          boxShadow: `0 28px 90px rgba(0,0,0,0.65)`,
          backdropFilter: 'blur(18px)',
          overflow: 'hidden',
        }}>

          {/* 상단 2색 라인 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, ${leftColor}, ${rightColor})`,
          }} />

          {/* shimmer */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `radial-gradient(ellipse at 15% 40%, ${leftColor}10 0%, transparent 45%), radial-gradient(ellipse at 85% 40%, ${rightColor}10 0%, transparent 45%)`,
          }} />

          {/* 제목 */}
          {title && (
            <div style={{
              textAlign: 'center',
              padding: `${padY}px ${padX}px ${Math.round(padY * 0.5)}px`,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              fontSize: titleSize,
              fontWeight: 900,
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: -0.3,
            }}>
              {title}
            </div>
          )}

          {/* 좌우 패널 */}
          <div style={{ display: 'flex', position: 'relative' }}>

            {/* 왼쪽 */}
            <div style={{
              flex: 1,
              padding: `${padY}px ${padX}px`,
              transform: `translateX(${leftX}px)`,
              borderRight: 'none',
            }}>
              {/* 헤더 */}
              <div style={{
                fontSize: headSize,
                fontWeight: 950,
                color: leftColor,
                textShadow: `0 0 24px ${leftColor}88`,
                marginBottom: Math.round(BASE * 0.014),
                textAlign: 'left',
              }}>
                {left.label}
              </div>

              {/* 핵심 수치 */}
              {left.value && (
                <div style={{
                  fontSize: valSize,
                  fontWeight: 950,
                  color: '#fff',
                  letterSpacing: -2,
                  lineHeight: 1.0,
                  marginBottom: Math.round(BASE * 0.018),
                  WebkitTextStroke: `${Math.round(BASE * 0.003)}px ${leftColor}66`,
                }}>
                  {left.value}
                </div>
              )}

              {/* 포인트 */}
              {left.points && renderPoints(left.points, leftColor, 20, 'left')}
            </div>

            {/* 중앙 분리선 + VS 뱃지 */}
            <div style={{
              position: 'relative',
              width: Math.round(BASE * 0.004),
              background: 'rgba(255,255,255,0.08)',
              flexShrink: 0,
              overflow: 'visible',
            }}>
              {/* 분리선 */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${dividerH * 100}%`,
                background: `linear-gradient(180deg, ${leftColor}66, ${rightColor}66)`,
                boxShadow: `0 0 12px rgba(255,255,255,0.15)`,
              }} />

              {/* VS 뱃지 */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${vsScale})`,
                width:  Math.round(BASE * 0.052),
                height: Math.round(BASE * 0.052),
                borderRadius: '50%',
                background: 'rgba(8,8,20,0.95)',
                border: '2px solid rgba(255,255,255,0.20)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: Math.round(BASE * 0.016),
                fontWeight: 950,
                color: 'rgba(255,255,255,0.80)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                zIndex: 10,
                letterSpacing: -0.5,
              }}>
                VS
              </div>
            </div>

            {/* 오른쪽 */}
            <div style={{
              flex: 1,
              padding: `${padY}px ${padX}px`,
              transform: `translateX(${rightX}px)`,
            }}>
              {/* 헤더 */}
              <div style={{
                fontSize: headSize,
                fontWeight: 950,
                color: rightColor,
                textShadow: `0 0 24px ${rightColor}88`,
                marginBottom: Math.round(BASE * 0.014),
                textAlign: 'right',
              }}>
                {right.label}
              </div>

              {/* 핵심 수치 */}
              {right.value && (
                <div style={{
                  fontSize: valSize,
                  fontWeight: 950,
                  color: '#fff',
                  letterSpacing: -2,
                  lineHeight: 1.0,
                  marginBottom: Math.round(BASE * 0.018),
                  textAlign: 'right',
                  WebkitTextStroke: `${Math.round(BASE * 0.003)}px ${rightColor}66`,
                }}>
                  {right.value}
                </div>
              )}

              {/* 포인트 */}
              {right.points && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  {renderPoints(right.points, rightColor, 28, 'right')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
