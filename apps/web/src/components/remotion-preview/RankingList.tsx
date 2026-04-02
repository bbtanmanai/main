import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface RankingItem {
  rank?: number;
  label: string;
  value?: string;
  desc?: string;
}

export interface RankingListProps {
  title?: string;
  items: RankingItem[];
  accentColor?: string;
  unit?: string;
}

const DEFAULT_ACCENT = '#6366f1';
const FONT = "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif";

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_EMOJI  = ['🥇', '🥈', '🥉'];

function parseNum(v: string): number {
  const m = v.match(/([\d,]+(?:\.\d+)?)/);
  return m ? parseFloat(m[1].replace(/,/g, '')) : 0;
}

export function RankingList({
  title      = 'TOP 순위',
  items = [
    { label: '삼성전자',  value: '4,823억',  desc: '반도체·모바일' },
    { label: 'SK하이닉스', value: '2,914억', desc: 'DRAM·낸드' },
    { label: 'LG에너지솔루션', value: '1,880억', desc: '배터리' },
    { label: '현대차',    value: '1,422억',  desc: '완성차·로봇' },
    { label: '카카오',    value: '891억',    desc: '플랫폼·콘텐츠' },
  ],
  accentColor = DEFAULT_ACCENT,
  unit,
}: RankingListProps) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const BASE   = Math.min(width, height);
  const isWide = width > height;

  const enterOp = interpolate(frame, [0, 18], [0, 1],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, 22], [50, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitOp  = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(enterOp, exitOp);
  const float   = Math.sin((frame / 58) * Math.PI * 2) * 5;

  const visible   = items.slice(0, 5);
  const ITEM_DELAY = 7;

  // 최대값 기준 바 너비 계산
  const maxVal = Math.max(...visible.map(it => it.value ? parseNum(it.value) : 0), 1);

  const cardW    = Math.round(width  * (isWide ? 0.78 : 0.88));
  const padX     = Math.round(BASE   * 0.042);
  const padY     = Math.round(BASE   * 0.034);
  const rowH     = Math.round(BASE   * (isWide ? 0.072 : 0.062));
  const rankSize = Math.round(BASE   * (isWide ? 0.034 : 0.028));
  const labSize  = Math.round(BASE   * (isWide ? 0.024 : 0.020));
  const valSize  = Math.round(BASE   * (isWide ? 0.026 : 0.022));
  const descSize = Math.round(BASE   * (isWide ? 0.016 : 0.014));
  const titleSize = Math.round(BASE  * 0.024);
  const barH     = Math.round(BASE   * 0.008);
  const barMaxW  = Math.round(BASE   * (isWide ? 0.32 : 0.20));

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
            backgroundImage: `radial-gradient(ellipse at 80% 20%, ${accentColor}10 0%, transparent 50%)`,
          }} />

          {/* 제목 */}
          <div style={{
            padding: `${padY}px ${padX}px ${Math.round(padY * 0.5)}px`,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', gap: Math.round(BASE * 0.012),
          }}>
            <span style={{ fontSize: titleSize * 1.1 }}>🏆</span>
            <span style={{
              fontSize: titleSize,
              fontWeight: 900,
              color: 'rgba(255,255,255,0.80)',
              letterSpacing: -0.5,
            }}>
              {title}
            </span>
            {unit && (
              <span style={{ fontSize: descSize, color: 'rgba(255,255,255,0.30)', marginLeft: 4 }}>
                (단위: {unit})
              </span>
            )}
          </div>

          {/* 랭킹 목록 */}
          <div style={{ padding: `${Math.round(padY * 0.4)}px 0` }}>
            {visible.map((item, i) => {
              const rank     = item.rank ?? (i + 1);
              const delay    = i * ITEM_DELAY + 10;
              const itemOp   = interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const itemX    = interpolate(frame, [delay, delay + 16], [-28, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

              // 바 채우기 spring
              const barSp    = spring({ frame: Math.max(0, frame - delay - 4), fps, config: { damping: 18, stiffness: 80, mass: 1.0 } });
              const barRatio = item.value ? (parseNum(item.value) / maxVal) : 0;
              const barW     = barSp * barRatio * barMaxW;

              // 값 카운터 spring
              const valSp    = spring({ frame: Math.max(0, frame - delay - 4), fps, config: { damping: 16, stiffness: 90, mass: 0.9 } });
              const rawNum   = item.value ? parseNum(item.value) : 0;
              const suffix   = item.value ? item.value.replace(/^[\d,.\s]+/, '') : '';
              const displayVal = item.value
                ? (Math.round(valSp * rawNum)).toLocaleString('ko-KR') + suffix
                : '';

              const isTop3   = rank <= 3;
              const rankColor = isTop3 ? RANK_COLORS[rank - 1] : 'rgba(255,255,255,0.30)';
              const isEven   = i % 2 === 0;

              return (
                <div
                  key={i}
                  style={{
                    opacity: itemOp,
                    transform: `translateX(${itemX}px)`,
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: rowH,
                    padding: `${Math.round(BASE * 0.008)}px ${padX}px`,
                    background: isEven ? 'rgba(255,255,255,0.02)' : 'transparent',
                    gap: Math.round(BASE * 0.018),
                  }}
                >
                  {/* 순위 */}
                  <div style={{
                    width: Math.round(BASE * 0.048),
                    textAlign: 'center',
                    flexShrink: 0,
                  }}>
                    {isTop3 ? (
                      <span style={{ fontSize: rankSize }}>{RANK_EMOJI[rank - 1]}</span>
                    ) : (
                      <span style={{
                        fontSize: rankSize * 0.85,
                        fontWeight: 900,
                        color: rankColor,
                      }}>
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* 레이블 + 설명 + 바 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(BASE * 0.010), marginBottom: item.value ? Math.round(BASE * 0.006) : 0 }}>
                      <span style={{
                        fontSize: labSize,
                        fontWeight: isTop3 ? 900 : 750,
                        color: isTop3 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
                        letterSpacing: -0.3,
                        wordBreak: 'keep-all',
                      }}>
                        {item.label}
                      </span>
                      {item.desc && (
                        <span style={{
                          fontSize: descSize,
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.30)',
                          wordBreak: 'keep-all',
                        }}>
                          · {item.desc}
                        </span>
                      )}
                    </div>

                    {/* 진행 바 */}
                    {item.value && (
                      <div style={{
                        width: barMaxW,
                        height: barH,
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: barH / 2,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: barW,
                          height: '100%',
                          background: isTop3
                            ? `linear-gradient(90deg, ${rankColor}88, ${rankColor})`
                            : `linear-gradient(90deg, ${accentColor}55, ${accentColor}99)`,
                          borderRadius: barH / 2,
                          boxShadow: isTop3 ? `0 0 10px ${rankColor}88` : `0 0 8px ${accentColor}66`,
                        }} />
                      </div>
                    )}
                  </div>

                  {/* 값 */}
                  {item.value && (
                    <div style={{
                      flexShrink: 0,
                      fontSize: valSize,
                      fontWeight: 950,
                      color: isTop3 ? rankColor : 'rgba(255,255,255,0.60)',
                      textShadow: isTop3 ? `0 0 18px ${rankColor}88` : 'none',
                      letterSpacing: -0.5,
                      minWidth: Math.round(BASE * 0.090),
                      textAlign: 'right',
                    }}>
                      {displayVal}
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
