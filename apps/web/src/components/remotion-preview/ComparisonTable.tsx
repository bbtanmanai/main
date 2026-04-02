import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface ComparisonRow {
  label: string;
  left: string;
  right: string;
  winner?: 'left' | 'right' | 'tie';
}

export interface ComparisonTableProps {
  leftLabel?: string;
  rightLabel?: string;
  rows: ComparisonRow[];
  accentColor?: string;
}

const DEFAULT_ACCENT = '#6366f1';
const RIGHT_COLOR    = '#10b981';
const TIE_COLOR      = '#f59e0b';
const FONT           = "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif";

const WINNER_ICON: Record<string, string> = {
  left:  '◀',
  right: '▶',
  tie:   '=',
};

export function ComparisonTable({
  leftLabel  = 'A안',
  rightLabel = 'B안',
  rows = [
    { label: '가격',    left: '월 9,900원',  right: '월 14,900원', winner: 'left'  },
    { label: '속도',    left: '보통',         right: '빠름',         winner: 'right' },
    { label: '저장공간', left: '50GB',        right: '200GB',        winner: 'right' },
    { label: '지원',    left: '이메일',       right: '24시간 채팅',  winner: 'right' },
  ],
  accentColor = DEFAULT_ACCENT,
}: ComparisonTableProps) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const BASE   = Math.min(width, height);
  const isWide = width > height;

  // 진입 / 퇴장
  const enterOp = interpolate(frame, [0, 18], [0, 1],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, 22], [50, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitOp  = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(enterOp, exitOp);
  const float   = Math.sin((frame / 55) * Math.PI * 2) * 5;

  const ROW_DELAY = 7;
  const visible   = rows.slice(0, 6);

  // 크기
  const cardW    = Math.round(width  * (isWide ? 0.84 : 0.90));
  const padX     = Math.round(BASE   * 0.040);
  const padY     = Math.round(BASE   * 0.035);
  const headSize = Math.round(BASE   * 0.026);
  const cellSize = Math.round(BASE   * 0.022);
  const labSize  = Math.round(BASE   * 0.019);
  const rowH     = Math.round(BASE   * (isWide ? 0.062 : 0.052));

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ opacity, transform: `translateY(${slideUp + float}px)`, width: cardW }}>

        {/* 카드 */}
        <div style={{
          position: 'relative',
          borderRadius: 28,
          background: 'rgba(6,6,18,0.84)',
          border: '1.5px solid rgba(255,255,255,0.10)',
          boxShadow: `0 28px 90px rgba(0,0,0,0.65), 0 0 0 1px ${accentColor}1a`,
          backdropFilter: 'blur(18px)',
          overflow: 'hidden',
        }}>

          {/* 상단 색 구분 라인 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, ${accentColor}, ${RIGHT_COLOR})`,
            boxShadow: `0 0 20px ${accentColor}66`,
          }} />

          {/* 배경 shimmer */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `radial-gradient(ellipse at 20% 30%, ${accentColor}10 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, ${RIGHT_COLOR}0c 0%, transparent 50%)`,
          }} />

          {/* 헤더 행 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2.5fr 1fr 2.5fr',
            padding: `${padY}px ${padX}px`,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.30)',
          }}>
            <div style={{ fontSize: headSize, fontWeight: 700, color: 'rgba(255,255,255,0.40)', letterSpacing: 1 }}>항목</div>
            <div style={{ fontSize: headSize, fontWeight: 900, color: accentColor, textAlign: 'center', textShadow: `0 0 20px ${accentColor}88` }}>
              {leftLabel}
            </div>
            <div style={{ fontSize: headSize * 0.7, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>vs</div>
            <div style={{ fontSize: headSize, fontWeight: 900, color: RIGHT_COLOR, textAlign: 'center', textShadow: `0 0 20px ${RIGHT_COLOR}88` }}>
              {rightLabel}
            </div>
          </div>

          {/* 데이터 행 */}
          <div style={{ padding: `${Math.round(padY * 0.5)}px 0` }}>
            {visible.map((row, i) => {
              const delay   = i * ROW_DELAY + 8;
              const rowOp   = interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const rowX    = interpolate(frame, [delay, delay + 16], [-20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

              const isEven  = i % 2 === 0;
              const winLeft  = row.winner === 'left';
              const winRight = row.winner === 'right';
              const isTie    = row.winner === 'tie';

              return (
                <div
                  key={i}
                  style={{
                    opacity: rowOp,
                    transform: `translateX(${rowX}px)`,
                    display: 'grid',
                    gridTemplateColumns: '2fr 2.5fr 1fr 2.5fr',
                    alignItems: 'center',
                    minHeight: rowH,
                    padding: `0 ${padX}px`,
                    background: isEven ? 'rgba(255,255,255,0.025)' : 'transparent',
                    borderBottom: i < visible.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  {/* 항목명 */}
                  <div style={{
                    fontSize: labSize,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.55)',
                    wordBreak: 'keep-all',
                  }}>
                    {row.label}
                  </div>

                  {/* 왼쪽 값 */}
                  <div style={{
                    fontSize: cellSize,
                    fontWeight: winLeft ? 900 : 700,
                    color: winLeft ? accentColor : 'rgba(255,255,255,0.65)',
                    textAlign: 'center',
                    textShadow: winLeft ? `0 0 18px ${accentColor}88` : 'none',
                    background: winLeft ? `${accentColor}14` : 'transparent',
                    borderRadius: 10,
                    padding: `${Math.round(BASE * 0.008)}px ${Math.round(BASE * 0.012)}px`,
                    wordBreak: 'keep-all',
                  }}>
                    {row.left}
                  </div>

                  {/* 승자 아이콘 */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: Math.round(BASE * 0.018),
                    fontWeight: 900,
                    color: isTie ? TIE_COLOR : (winLeft ? accentColor : RIGHT_COLOR),
                    textShadow: `0 0 12px currentColor`,
                  }}>
                    {row.winner ? WINNER_ICON[row.winner] : ''}
                  </div>

                  {/* 오른쪽 값 */}
                  <div style={{
                    fontSize: cellSize,
                    fontWeight: winRight ? 900 : 700,
                    color: winRight ? RIGHT_COLOR : 'rgba(255,255,255,0.65)',
                    textAlign: 'center',
                    textShadow: winRight ? `0 0 18px ${RIGHT_COLOR}88` : 'none',
                    background: winRight ? `${RIGHT_COLOR}14` : 'transparent',
                    borderRadius: 10,
                    padding: `${Math.round(BASE * 0.008)}px ${Math.round(BASE * 0.012)}px`,
                    wordBreak: 'keep-all',
                  }}>
                    {row.right}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 집계 푸터 */}
          {(() => {
            const leftWins  = visible.filter(r => r.winner === 'left').length;
            const rightWins = visible.filter(r => r.winner === 'right').length;
            const footerOp  = interpolate(frame, [visible.length * ROW_DELAY + 16, visible.length * ROW_DELAY + 32], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div style={{
                opacity: footerOp,
                display: 'grid',
                gridTemplateColumns: '2fr 2.5fr 1fr 2.5fr',
                padding: `${Math.round(padY * 0.7)}px ${padX}px`,
                borderTop: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(0,0,0,0.28)',
              }}>
                <div style={{ fontSize: labSize, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>승리</div>
                <div style={{
                  textAlign: 'center',
                  fontSize: Math.round(BASE * 0.030),
                  fontWeight: 950,
                  color: leftWins >= rightWins ? accentColor : 'rgba(255,255,255,0.30)',
                  textShadow: leftWins >= rightWins ? `0 0 24px ${accentColor}` : 'none',
                }}>
                  {leftWins}승
                </div>
                <div />
                <div style={{
                  textAlign: 'center',
                  fontSize: Math.round(BASE * 0.030),
                  fontWeight: 950,
                  color: rightWins >= leftWins ? RIGHT_COLOR : 'rgba(255,255,255,0.30)',
                  textShadow: rightWins >= leftWins ? `0 0 24px ${RIGHT_COLOR}` : 'none',
                }}>
                  {rightWins}승
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </AbsoluteFill>
  );
}
