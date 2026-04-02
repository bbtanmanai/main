import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface StatItem {
  value: string;
  label: string;
  trend?: '↑' | '↓' | '→';
}

export interface StatCardProps {
  title?: string;
  stats: StatItem[];
  accentColor?: string;
}

const DEFAULT_ACCENT = '#6366f1';
const FONT = "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif";

const TREND_COLOR: Record<string, string> = {
  '↑': '#10b981',
  '↓': '#f43f5e',
  '→': '#f59e0b',
};

function parseNumber(raw: string): number {
  const m = raw.match(/([\d,.]+)/);
  if (!m) return 0;
  return parseFloat(m[1].replace(/,/g, ''));
}

function formatNum(n: number, original: string): string {
  const hasDecimal = original.includes('.');
  const suffix = original.replace(/^[\d,.\s]+/, '');
  const str = hasDecimal ? n.toFixed(1) : Math.round(n).toLocaleString('ko-KR');
  return str + suffix;
}

export function StatCard({
  title = '핵심 지표',
  stats = [
    { value: '2,847만', label: '월간 사용자',  trend: '↑' },
    { value: '94.2%',   label: '만족도',        trend: '↑' },
    { value: '1.3초',   label: '평균 응답속도', trend: '↓' },
  ],
  accentColor = DEFAULT_ACCENT,
}: StatCardProps) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const BASE   = Math.min(width, height);
  const isWide = width > height;
  const count  = stats.length;

  // 진입 / 퇴장
  const enterOp = interpolate(frame, [0, 18], [0, 1],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, 22], [50, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitOp  = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(enterOp, exitOp);
  const float   = Math.sin((frame / 55) * Math.PI * 2) * 6;

  // 크기 계산
  const cardW     = Math.round(width  * (isWide ? 0.82 : 0.88));
  const cardPadX  = Math.round(BASE   * 0.048);
  const cardPadY  = Math.round(BASE   * 0.038);
  const titleSize = Math.round(BASE   * 0.026);
  const valSize   = Math.round(BASE   * (count <= 2 ? 0.072 : count <= 3 ? 0.058 : 0.044));
  const labSize   = Math.round(BASE   * 0.020);
  const trendSize = Math.round(BASE   * 0.022);
  const gapPx     = Math.round(BASE   * 0.018);

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ opacity, transform: `translateY(${slideUp + float}px)`, width: cardW }}>

        {/* 카드 */}
        <div style={{
          position: 'relative',
          padding: `${cardPadY}px ${cardPadX}px`,
          borderRadius: 28,
          background: 'rgba(8,8,20,0.82)',
          border: '1.5px solid rgba(255,255,255,0.12)',
          boxShadow: `0 24px 80px rgba(0,0,0,0.60), 0 0 0 1px ${accentColor}22`,
          backdropFilter: 'blur(18px)',
          overflow: 'hidden',
        }}>

          {/* 상단 글로우 라인 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 20px ${accentColor}88`,
          }} />

          {/* 배경 shimmer */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `radial-gradient(ellipse at 15% 20%, ${accentColor}14 0%, transparent 55%), radial-gradient(ellipse at 85% 80%, ${accentColor}0a 0%, transparent 55%)`,
          }} />

          {/* 제목 */}
          {title && (
            <div style={{
              fontSize: titleSize,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: Math.round(BASE * 0.030),
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              paddingBottom: Math.round(BASE * 0.016),
            }}>
              {title}
            </div>
          )}

          {/* 스탯 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(count, isWide ? 4 : 2)}, 1fr)`,
            gap: gapPx,
          }}>
            {stats.map((stat, i) => {
              // 각 카드 stagger 진입
              const delay = i * 6;
              const itemOp = interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const itemSlide = interpolate(frame, [delay, delay + 18], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

              // 숫자 롤링 spring
              const rawNum = parseNumber(stat.value);
              const canRoll = rawNum > 0;
              const sp = spring({ frame: Math.max(0, frame - delay - 8), fps, config: { damping: 16, stiffness: 90, mass: 0.9 } });
              const rollingVal = canRoll ? formatNum(sp * rawNum, stat.value) : stat.value;

              const trendColor = stat.trend ? (TREND_COLOR[stat.trend] ?? 'rgba(255,255,255,0.5)') : undefined;
              const itemPadX = Math.round(BASE * 0.024);
              const itemPadY = Math.round(BASE * 0.020);

              return (
                <div
                  key={i}
                  style={{
                    opacity: itemOp,
                    transform: `translateY(${itemSlide}px)`,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 18,
                    padding: `${itemPadY}px ${itemPadX}px`,
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* 카드 내부 글로우 */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    backgroundImage: `radial-gradient(ellipse at 50% 0%, ${accentColor}18 0%, transparent 60%)`,
                  }} />

                  {/* 수치 */}
                  <div style={{
                    fontSize: valSize,
                    fontWeight: 950,
                    color: '#fff',
                    letterSpacing: -1.5,
                    lineHeight: 1.1,
                    textShadow: `0 2px 20px ${accentColor}66`,
                    marginBottom: Math.round(BASE * 0.008),
                  }}>
                    {rollingVal}
                    {stat.trend && (
                      <span style={{
                        fontSize: trendSize,
                        color: trendColor,
                        marginLeft: Math.round(BASE * 0.008),
                        textShadow: `0 0 12px ${trendColor}99`,
                      }}>
                        {stat.trend}
                      </span>
                    )}
                  </div>

                  {/* 레이블 */}
                  <div style={{
                    fontSize: labSize,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.50)',
                    letterSpacing: 0.2,
                    wordBreak: 'keep-all',
                    lineHeight: 1.3,
                  }}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
