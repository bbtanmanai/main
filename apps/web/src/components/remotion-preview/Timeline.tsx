import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface TimelineItem {
  year: string;
  title: string;
  desc?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  accentColor?: string;
}

const DEFAULT_ACCENT = '#6366f1';
const FONT = "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif";

export function Timeline({
  items = [
    { year: '2020', title: '서비스 론칭',    desc: '베타 사용자 1만 명 달성'    },
    { year: '2021', title: '시리즈 A 투자',  desc: '50억 원 투자 유치'           },
    { year: '2022', title: '글로벌 확장',    desc: '일본·동남아 진출'            },
    { year: '2023', title: '사용자 100만',   desc: '누적 사용자 100만 돌파'      },
  ],
  accentColor = DEFAULT_ACCENT,
}: TimelineProps) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const BASE   = Math.min(width, height);
  const isWide = width > height;

  // 진입 / 퇴장
  const enterOp = interpolate(frame, [0, 18], [0, 1],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, 22], [50, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitOp  = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(enterOp, exitOp);
  const float   = Math.sin((frame / 60) * Math.PI * 2) * 5;

  const visible   = items.slice(0, isWide ? 5 : 4);
  const ITEM_DELAY = 8;

  // 중앙 연결선 진행 — 아이템 순차 등장에 맞춰 늘어남
  const lineProgress = interpolate(
    frame,
    [8, 8 + visible.length * ITEM_DELAY + 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // 크기
  const cardW    = Math.round(width  * (isWide ? 0.88 : 0.88));
  const padX     = Math.round(BASE   * 0.044);
  const padY     = Math.round(BASE   * 0.038);
  const dotSize  = Math.round(BASE   * 0.036);
  const yearSize = Math.round(BASE   * (isWide ? 0.024 : 0.020));
  const titSize  = Math.round(BASE   * (isWide ? 0.026 : 0.022));
  const descSize = Math.round(BASE   * (isWide ? 0.018 : 0.015));
  const lineThick = Math.round(BASE  * 0.004);

  // 가로(16:9) vs 세로(9:16) 레이아웃 분기
  if (isWide) {
    // ── 가로: 아이템 좌우 교차 배치 ──────────────────────────────────────────
    const itemW = Math.round((cardW - padX * 2) / visible.length);

    return (
      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
        <div style={{ opacity, transform: `translateY(${slideUp + float}px)`, width: cardW }}>
          <div style={{
            position: 'relative',
            padding: `${padY}px ${padX}px`,
            borderRadius: 28,
            background: 'rgba(6,6,18,0.84)',
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

            {/* 중앙 수평 연결선 */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: padX,
              width: `${lineProgress * (cardW - padX * 2)}px`,
              height: lineThick,
              background: `linear-gradient(90deg, ${accentColor}88, ${accentColor}44)`,
              boxShadow: `0 0 12px ${accentColor}66`,
              transform: 'translateY(-50%)',
            }} />

            {/* 아이템 행 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              {visible.map((item, i) => {
                const delay   = i * ITEM_DELAY + 8;
                const itemOp  = interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                const itemY   = interpolate(frame, [delay, delay + 16], [i % 2 === 0 ? -30 : 30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                const dotScale = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

                const isTop = i % 2 === 0;
                const itemH = Math.round(BASE * 0.18);

                return (
                  <div
                    key={i}
                    style={{
                      width: itemW,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      opacity: itemOp,
                      transform: `translateY(${itemY}px)`,
                    }}
                  >
                    {/* 위쪽 콘텐츠 (짝수 인덱스) */}
                    <div style={{ height: itemH, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: Math.round(BASE * 0.016) }}>
                      {isTop && (
                        <ItemContent item={item} yearSize={yearSize} titSize={titSize} descSize={descSize} accentColor={accentColor} align="center" i={i} total={visible.length} />
                      )}
                    </div>

                    {/* 도트 */}
                    <div style={{
                      width: dotSize, height: dotSize,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`,
                      border: `${Math.round(BASE * 0.004)}px solid rgba(255,255,255,0.9)`,
                      boxShadow: `0 0 24px ${accentColor}, 0 0 8px rgba(255,255,255,0.5)`,
                      transform: `scale(${dotScale})`,
                      flexShrink: 0,
                      zIndex: 2,
                    }} />

                    {/* 아래쪽 콘텐츠 (홀수 인덱스) */}
                    <div style={{ height: itemH, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', paddingTop: Math.round(BASE * 0.016) }}>
                      {!isTop && (
                        <ItemContent item={item} yearSize={yearSize} titSize={titSize} descSize={descSize} accentColor={accentColor} align="center" i={i} total={visible.length} />
                      )}
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

  // ── 세로(9:16): 수직 타임라인 ──────────────────────────────────────────────
  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ opacity, transform: `translateY(${slideUp + float}px)`, width: cardW }}>
        <div style={{
          position: 'relative',
          padding: `${padY}px ${padX}px`,
          borderRadius: 28,
          background: 'rgba(6,6,18,0.84)',
          border: '1.5px solid rgba(255,255,255,0.10)',
          boxShadow: `0 28px 90px rgba(0,0,0,0.65)`,
          backdropFilter: 'blur(18px)',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          }} />

          {/* 수직 연결선 */}
          <div style={{
            position: 'absolute',
            left: padX + Math.round(dotSize / 2),
            top: padY + dotSize,
            width: lineThick,
            height: `${lineProgress * (visible.length - 1) * Math.round(BASE * 0.110)}px`,
            background: `linear-gradient(180deg, ${accentColor}88, ${accentColor}22)`,
            boxShadow: `0 0 10px ${accentColor}44`,
          }} />

          {/* 아이템 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(BASE * 0.022) }}>
            {visible.map((item, i) => {
              const delay   = i * ITEM_DELAY + 8;
              const itemOp  = interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const itemX   = interpolate(frame, [delay, delay + 16], [-24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const dotScale = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: Math.round(BASE * 0.022), opacity: itemOp, transform: `translateX(${itemX}px)` }}>
                  {/* 도트 */}
                  <div style={{
                    width: dotSize, height: dotSize,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`,
                    border: `${Math.round(BASE * 0.004)}px solid rgba(255,255,255,0.85)`,
                    boxShadow: `0 0 20px ${accentColor}`,
                    transform: `scale(${dotScale})`,
                    flexShrink: 0,
                    zIndex: 2,
                  }} />
                  <ItemContent item={item} yearSize={yearSize} titSize={titSize} descSize={descSize} accentColor={accentColor} align="left" i={i} total={visible.length} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// 공통 콘텐츠 블록
function ItemContent({ item, yearSize, titSize, descSize, accentColor, align, i, total }: {
  item: TimelineItem;
  yearSize: number; titSize: number; descSize: number;
  accentColor: string; align: 'center' | 'left';
  i: number; total: number;
}) {
  // 색상 그라데이션: 첫 → 마지막 점점 밝아짐
  const t = total > 1 ? i / (total - 1) : 0;
  const alpha = Math.round((0.55 + t * 0.45) * 255).toString(16).padStart(2, '0');

  return (
    <div style={{ textAlign: align, minWidth: 0 }}>
      <div style={{
        fontSize: yearSize,
        fontWeight: 900,
        color: `${accentColor}${alpha}`,
        letterSpacing: 1,
        marginBottom: 4,
        textShadow: `0 0 16px ${accentColor}66`,
      }}>
        {item.year}
      </div>
      <div style={{
        fontSize: titSize,
        fontWeight: 850,
        color: 'rgba(255,255,255,0.92)',
        lineHeight: 1.3,
        wordBreak: 'keep-all',
        marginBottom: item.desc ? 4 : 0,
      }}>
        {item.title}
      </div>
      {item.desc && (
        <div style={{
          fontSize: descSize,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.4,
          wordBreak: 'keep-all',
        }}>
          {item.desc}
        </div>
      )}
    </div>
  );
}
