import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface AccentNumProps {
  value?: string;
  label?: string;
  startSec?: number;
  endSec?: number;
  accentColor?: string;
}
const FONT = "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif";
const DEFAULT_ACCENT = '#6366f1';

/** 텍스트 길이 기반 폰트 자동 스케일 — 카드가 maxW를 넘지 않도록 */
function autoFontSize(text: string, maxContentW: number, baseSize: number, charW = 0.70, minSize = 24): number {
  const len = text.replace(/\s/g, '').length || 1;
  const fit = Math.floor(maxContentW / (len * charW));
  return Math.max(Math.min(baseSize, fit), minSize);
}

/** "49만개" → { num:49, unit:"만", suffix:"개" } 파싱.
 *  범위/복합 표현(에서, ~, 이상, 이하 등)은 num=0 반환 → 롤링 스킵 */
function parseKoreanValue(raw: string): { num: number; unit: string; suffix: string; hasDecimal: boolean } {
  // 범위·복합 표현 감지 → 롤링 불가
  if (/에서|~|부터|사이|이상|이하/.test(raw)) return { num: 0, unit: '', suffix: raw, hasDecimal: false };
  // 숫자 + 단위(천만/천억/만/억/조/천/백 순서 중요) + 접미사
  const m = raw.trim().match(/^([\d,]+(?:\.\d+)?)\s*(천만|천억|만|억|조|천|백)?\s*(.*)$/);
  if (!m) return { num: 0, unit: '', suffix: raw, hasDecimal: false };
  const num = parseFloat(m[1].replace(/,/g, ''));
  if (isNaN(num)) return { num: 0, unit: '', suffix: raw, hasDecimal: false };
  return { num, unit: m[2] ?? '', suffix: (m[3] ?? '').trim(), hasDecimal: m[1].includes('.') };
}

/** 롤링 중 표시할 포맷 문자열 */
function formatRolling(current: number, unit: string, suffix: string, hasDecimal: boolean): string {
  const str = hasDecimal ? current.toFixed(1) : Math.round(current).toLocaleString('ko-KR');
  return `${str}${unit}${suffix}`;
}

export function AccentNum({ value = '73%', label = '스마트폰 사용자 비율', startSec = 0, endSec, accentColor = DEFAULT_ACCENT }: AccentNumProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  // accent 등장 시점 기준 로컬 프레임 — spring/enter/exit 모두 여기 기준
  const startFrame = Math.round(startSec * fps);
  const localFrame = frame - startFrame;
  const accentDur  = endSec != null ? Math.round((endSec - startSec) * fps) : 360;

  // BASE: 16:9(1080) / 9:16(1080) 동일 기준
  const BASE = Math.min(width, height);

  // 카드 최대 너비: 화면의 85% 초과 금지
  const maxCardW   = Math.round(width * 0.85);
  const cardPadH   = Math.round(BASE * 0.067);
  const pillPadV   = Math.round(BASE * 0.013);
  const pillPadH   = Math.round(BASE * 0.030);
  const pillMb     = Math.round(BASE * 0.015);
  const ringInset  = -Math.round(BASE * 0.074);

  const maxContentW = maxCardW - cardPadH * 2;

  // 값/라벨 폰트 — 텍스트 길이에 맞게 자동 축소
  const valueFontSize = autoFontSize(value,  maxContentW, Math.round(BASE * 0.123), 0.70, Math.round(BASE * 0.050));
  const labelFontSize = autoFontSize(label,  maxContentW, Math.round(BASE * 0.068), 0.90, Math.round(BASE * 0.027));

  // 숫자 롤링 파싱
  const parsed = parseKoreanValue(value);
  const canRoll = parsed.num > 0;

  // 롤링 spring — localFrame 기준 (accent 등장 순간부터 0→target)
  const rollSpring = spring({
    frame: Math.max(0, localFrame - 8),
    fps,
    config: { damping: 16, stiffness: 100, mass: 0.8 },
  });
  const rollingNum = Math.max(0, Math.min(rollSpring, 1)) * parsed.num;
  const displayValue = canRoll
    ? formatRolling(rollingNum, parsed.unit, parsed.suffix, parsed.hasDecimal)
    : value;

  // Enter — localFrame 기준
  const enterOp    = interpolate(localFrame, [0, 18], [0, 1],   { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const slideUp    = interpolate(localFrame, [0, 22], [60, 0],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const valueScale = interpolate(localFrame, [6, 28], [0.4, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Exit — accent 종료 기준
  const exitStart = accentDur - 14;
  const exitOp    = interpolate(localFrame, [exitStart, accentDur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const opacity = Math.min(enterOp, exitOp);

  // Ring spin / Pulse / Float
  const ringRot = interpolate(localFrame, [0, 200], [0, 360], { extrapolateRight: 'extend' });
  const pulse   = 1 + Math.sin((localFrame / 30) * Math.PI * 2) * 0.018;
  const float   = Math.sin((localFrame / 45) * Math.PI * 2) * 8;

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{
        opacity,
        transform: `translateY(${slideUp + float}px)`,
        textAlign: 'center',
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        maxWidth: maxCardW,
      }}>

        {/* Rotating ambient ring */}
        <div style={{
          position: 'absolute',
          inset: ringInset,
          borderRadius: '50%',
          transform: `rotate(${ringRot}deg)`,
          backgroundImage: `conic-gradient(from 0deg, ${accentColor}00 0deg, ${accentColor}66 60deg, ${accentColor}00 140deg, ${accentColor}44 220deg, ${accentColor}00 360deg)`,
          filter: 'blur(28px)',
          opacity: 0.7,
          pointerEvents: 'none',
        }} />

        {/* Value — 카드 없음, 스티커 아웃라인 (검정 stroke층 + 흰 fill층) */}
        <div style={{
          transform: `scale(${valueScale}) scale(${pulse})`,
          fontSize: valueFontSize,
          fontWeight: 950,
          lineHeight: 1.1,
          letterSpacing: -2,
          whiteSpace: 'nowrap',
          position: 'relative',
          display: 'inline-block',
          marginBottom: pillMb,
        }}>
          {/* 너비 고정 ghost */}
          <span style={{ visibility: 'hidden' }}>{value}</span>
          {/* 검정 stroke 층 — 바깥으로 번진 아웃라인 */}
          <span style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            WebkitTextStroke: `${Math.round(BASE * 0.022)}px #000`,
            WebkitTextFillColor: '#000',
          }}>{displayValue}</span>
          {/* 흰 fill 층 — stroke 내부를 덮어 스티커 외곽선만 남김 */}
          <span style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            WebkitTextFillColor: '#fff',
            textShadow: `0 4px 20px rgba(0,0,0,0.5)`,
          }}>{displayValue}</span>
        </div>

        {/* Label pill — 텍스트 빨간색 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxSizing: 'border-box',
          padding: `${pillPadV}px ${pillPadH}px`,
          borderRadius: 999,
          background: 'rgba(10,10,24,0.72)',
          border: `1px solid ${accentColor}59`,
          boxShadow: `0 8px 40px rgba(0,0,0,0.45)`,
          color: '#f43f5e',
          fontWeight: 800, fontSize: labelFontSize, letterSpacing: -0.5,
          backdropFilter: 'blur(12px)',
        }}>
          <span style={{ wordBreak: 'keep-all', textAlign: 'center', width: '100%' }}>{label}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
