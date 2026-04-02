import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Img } from 'remotion';

export interface FullImageProps {
  src?: string;
  caption?: string;
  accentColor?: string;
}

const DEFAULT_ACCENT = '#6366f1';
const FONT = "'Noto Sans KR','Malgun Gothic',system-ui,sans-serif";

export function FullImage({
  src,
  caption,
  accentColor = DEFAULT_ACCENT,
}: FullImageProps) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const BASE = Math.min(width, height);

  // 진입 / 퇴장
  const enterOp = interpolate(frame, [0, 20], [0, 1],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitOp  = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(enterOp, exitOp);

  // Ken Burns: 서서히 확대 1.0 → 1.06, 약간 패닝
  const kbScale = interpolate(frame, [0, durationInFrames], [1.0, 1.06], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const kbX     = interpolate(frame, [0, durationInFrames], [0, -12],    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const kbY     = interpolate(frame, [0, durationInFrames], [0, -6],     { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 캡션 슬라이드업
  const captionOp = interpolate(frame, [16, 32], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const captionY  = interpolate(frame, [16, 32], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const captionFontSize = Math.round(BASE * 0.030);
  const captionPadV     = Math.round(BASE * 0.016);
  const captionPadH     = Math.round(BASE * 0.036);
  const captionBarW     = Math.round(width * 0.90);
  const captionRadius   = Math.round(BASE * 0.012);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', opacity }}>

      {/* 이미지 or 플레이스홀더 */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${kbScale}) translate(${kbX}px, ${kbY}px)`,
        transformOrigin: 'center center',
      }}>
        {src ? (
          <Img
            src={src}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          /* 플레이스홀더 */
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, #08081a 0%, ${accentColor}22 40%, #0e0e22 70%, ${accentColor}11 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: Math.round(BASE * 0.016),
          }}>
            {/* 점 격자 */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `radial-gradient(${accentColor}22 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
            }} />
            <div style={{
              fontSize: Math.round(BASE * 0.060),
              lineHeight: 1,
              filter: `drop-shadow(0 0 24px ${accentColor}88)`,
            }}>
              🖼️
            </div>
            <div style={{
              fontFamily: FONT,
              fontSize: Math.round(BASE * 0.024),
              fontWeight: 700,
              color: 'rgba(255,255,255,0.30)',
              letterSpacing: -0.3,
            }}>
              이미지를 연결하세요
            </div>
          </div>
        )}
      </div>

      {/* 어두운 비네트 오버레이 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.60) 100%)',
        pointerEvents: 'none',
      }} />

      {/* 하단 그라데이션 (캡션 가독성) */}
      {caption && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: Math.round(height * 0.28),
          background: 'linear-gradient(0deg, rgba(0,0,0,0.80) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* 상단 액센트 라인 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        boxShadow: `0 0 20px ${accentColor}88`,
      }} />

      {/* 캡션 바 */}
      {caption && (
        <div style={{
          position: 'absolute', bottom: Math.round(height * 0.06), left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          opacity: captionOp,
          transform: `translateY(${captionY}px)`,
        }}>
          <div style={{
            width: captionBarW,
            background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${accentColor}33`,
            borderRadius: captionRadius,
            padding: `${captionPadV}px ${captionPadH}px`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 32px rgba(0,0,0,0.5), 0 0 0 1px ${accentColor}22`,
          }}>
            {/* 캡션 왼쪽 액센트 바 */}
            <div style={{
              width: 3, alignSelf: 'stretch', borderRadius: 999, flexShrink: 0,
              background: `linear-gradient(180deg, ${accentColor}, ${accentColor}55)`,
              marginRight: Math.round(BASE * 0.014),
              boxShadow: `0 0 10px ${accentColor}88`,
            }} />
            <p style={{
              margin: 0,
              fontFamily: FONT,
              fontSize: captionFontSize,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.92)',
              lineHeight: 1.55,
              textAlign: 'center',
              wordBreak: 'keep-all',
              letterSpacing: -0.3,
            }}>
              {caption}
            </p>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
