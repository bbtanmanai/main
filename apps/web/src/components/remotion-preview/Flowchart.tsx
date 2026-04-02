import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export type FlowNodeType = 'start' | 'process' | 'decision' | 'end';

export interface FlowNode {
  label: string;
  desc?: string;
  type?: FlowNodeType;
}

export interface FlowchartProps {
  title?: string;
  nodes: FlowNode[];
  accentColor?: string;
}

const DEFAULT_ACCENT = '#6366f1';
const FONT = "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif";

const TYPE_COLORS: Record<FlowNodeType, string> = {
  start:    '#10b981',
  process:  '',        // accentColor (filled at render)
  decision: '#f59e0b',
  end:      '#f43f5e',
};

export function Flowchart({
  title = '처리 흐름',
  nodes = [
    { label: '시작',         type: 'start'    },
    { label: '데이터 수집',  desc: 'API 호출', type: 'process'  },
    { label: '검증 통과?',   type: 'decision' },
    { label: '결과 처리',    desc: '분석 완료', type: 'process'  },
    { label: '완료',         type: 'end'      },
  ],
  accentColor = DEFAULT_ACCENT,
}: FlowchartProps) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const BASE   = Math.min(width, height);
  const isWide = width > height;

  const enterOp = interpolate(frame, [0, 18], [0, 1],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, 22], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitOp  = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(enterOp, exitOp);
  const float   = Math.sin((frame / 62) * Math.PI * 2) * 4;

  const visible   = nodes.slice(0, isWide ? 7 : 5);
  const NODE_DELAY = 8;

  const cardW     = Math.round(width  * (isWide ? 0.72 : 0.88));
  const padX      = Math.round(BASE   * 0.038);
  const padY      = Math.round(BASE   * 0.032);
  const nodeW     = Math.round(BASE   * (isWide ? 0.36 : 0.50));
  const nodeH     = Math.round(BASE   * (isWide ? 0.068 : 0.058));
  const arrowH    = Math.round(BASE   * (isWide ? 0.032 : 0.028));
  const labSize   = Math.round(BASE   * (isWide ? 0.022 : 0.018));
  const descSize  = Math.round(BASE   * (isWide ? 0.015 : 0.013));
  const titleSize = Math.round(BASE   * 0.024);

  const getNodeColor = (type: FlowNodeType = 'process') =>
    type === 'process' ? accentColor : TYPE_COLORS[type];

  const getNodeShape = (type: FlowNodeType = 'process') => {
    if (type === 'start' || type === 'end') return { borderRadius: nodeH / 2 };
    if (type === 'decision') return { borderRadius: 12 };
    return { borderRadius: 16 };
  };

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
              textAlign: 'center',
            }}>
              {title}
            </div>
          )}

          {/* 노드 흐름 */}
          <div style={{
            padding: `${Math.round(padY * 0.8)}px ${padX}px ${padY}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {visible.map((node, i) => {
              const type    = node.type ?? 'process';
              const color   = getNodeColor(type);
              const shape   = getNodeShape(type);
              const delay   = i * NODE_DELAY + 8;

              const nodeOp  = interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const nodeY   = interpolate(frame, [delay, delay + 16], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const nodeSp  = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 130, mass: 0.5 } });
              const nodeScale = interpolate(nodeSp, [0, 1], [0.8, 1]);

              // 화살표 draw 애니메이션
              const arrowDelay = delay + 6;
              const arrowW = interpolate(frame, [arrowDelay, arrowDelay + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

              const isDecision = type === 'decision';

              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  {/* 노드 */}
                  <div style={{
                    opacity: nodeOp,
                    transform: `translateY(${nodeY}px) scale(${nodeScale})`,
                    width: isDecision ? Math.round(nodeW * 1.1) : nodeW,
                    minHeight: nodeH,
                    ...shape,
                    background: isDecision
                      ? `linear-gradient(135deg, ${color}22, ${color}0a)`
                      : `linear-gradient(135deg, ${color}33, ${color}15)`,
                    border: `1.5px solid ${color}55`,
                    boxShadow: `0 0 20px ${color}22, inset 0 1px 0 ${color}33`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: `${Math.round(BASE * 0.012)}px ${Math.round(BASE * 0.020)}px`,
                    position: 'relative',
                  }}>
                    {/* 타입 인디케이터 점 */}
                    <div style={{
                      position: 'absolute',
                      top: Math.round(BASE * 0.008),
                      left: Math.round(BASE * 0.010),
                      width: Math.round(BASE * 0.008),
                      height: Math.round(BASE * 0.008),
                      borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 6px ${color}`,
                    }} />

                    <div style={{
                      fontSize: labSize,
                      fontWeight: 800,
                      color: type === 'start' || type === 'end'
                        ? '#fff'
                        : 'rgba(255,255,255,0.90)',
                      letterSpacing: -0.3,
                      textAlign: 'center',
                      wordBreak: 'keep-all',
                      lineHeight: 1.3,
                    }}>
                      {node.label}
                    </div>

                    {node.desc && (
                      <div style={{
                        fontSize: descSize,
                        fontWeight: 600,
                        color: `${color}cc`,
                        marginTop: Math.round(BASE * 0.004),
                        textAlign: 'center',
                        wordBreak: 'keep-all',
                        lineHeight: 1.3,
                      }}>
                        {node.desc}
                      </div>
                    )}
                  </div>

                  {/* 화살표 (마지막 노드 제외) */}
                  {i < visible.length - 1 && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: arrowH,
                      opacity: nodeOp,
                    }}>
                      {/* 선 */}
                      <div style={{
                        width: 2,
                        height: `${arrowW * (arrowH - Math.round(BASE * 0.010)) * 100 / arrowH}%`,
                        background: `linear-gradient(180deg, ${color}66, ${getNodeColor(visible[i + 1]?.type ?? 'process')}66)`,
                        borderRadius: 1,
                      }} />
                      {/* 화살표 머리 */}
                      <div style={{
                        opacity: arrowW,
                        width: 0,
                        height: 0,
                        borderLeft: `${Math.round(BASE * 0.005)}px solid transparent`,
                        borderRight: `${Math.round(BASE * 0.005)}px solid transparent`,
                        borderTop: `${Math.round(BASE * 0.010)}px solid ${getNodeColor(visible[i + 1]?.type ?? 'process')}88`,
                      }} />
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
