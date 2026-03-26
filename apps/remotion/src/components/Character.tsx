import React from "react";
import { Img, interpolate, useCurrentFrame, staticFile } from "remotion";

// ── 타입 ──────────────────────────────────────────────────────────────
interface PartLayout {
  left: number;   // px (ref_width=430 기준)
  top: number;    // px (ref_height=764 기준)
  width: number;  // px (ref_width=430 기준)
  pivot?: [number, number]; // 회전 중심 [x, y] 0-1
}

interface CharacterCalibration {
  ref_width: number;
  ref_height: number;
  useBodyImage?: boolean;
  fullImageLipSync?: boolean; // true = mouth 파일이 캐릭터 전체 이미지 (c13 방식)
  mouthPrefix?: string;       // mouth 파일명 앞에 붙는 접두사 (예: "c13_")
  parts: {
    head:      PartLayout & { pivot: [number, number] };
    eyes:      PartLayout;
    mouth:     PartLayout;
    arm_right: PartLayout & { pivot: [number, number] };
  };
}

interface LipSyncTiming {
  start: number; // 초
  end: number;   // 초
}

// ── 캐릭터별 calibration ───────────────────────────────────────────────
// 값은 calibration.json 기준 — 화면에서 맞지 않으면 숫자 조정
const CALIBRATIONS: Record<string, CharacterCalibration> = {
  c6: {
    ref_width: 430,
    ref_height: 764,
    useBodyImage: true,
    parts: {
      head:      { left: 158, top: 20,  width: 123, pivot: [0.5, 0.88] },
      eyes:      { left: 177, top: 68,  width: 87 },
      mouth:     { left: 189, top: 118, width: 65 },
      arm_right: { left: 227, top: 169, width: 78, pivot: [0.36, 0.15] },
    },
  },
  c13: {
    ref_width: 300,
    ref_height: 450,
    fullImageLipSync: true, // mouth 파일이 캐릭터 전체 이미지
    mouthPrefix: "c13_",    // c13_mouth_closed.png 등
    parts: {
      head:      { left: 0, top: 0, width: 300, pivot: [0.5, 0.5] },
      eyes:      { left: 0, top: 0, width: 300 },
      mouth:     { left: 0, top: 0, width: 300 },
      arm_right: { left: 0, top: 0, width: 300, pivot: [0.5, 0.5] },
    },
  },
};

const DEFAULT_CAL: CharacterCalibration = {
  ref_width: 430,
  ref_height: 764,
  parts: {
    head:      { left: 158, top: 20,  width: 123, pivot: [0.5, 0.88] },
    eyes:      { left: 177, top: 68,  width: 87 },
    mouth:     { left: 189, top: 118, width: 65 },
    arm_right: { left: 227, top: 169, width: 78, pivot: [0.36, 0.15] },
  },
};

// ── 헬퍼: calibration 픽셀 → CSS % ────────────────────────────────────
function pct(px: number, ref: number) {
  return `${(px / ref) * 100}%`;
}

// ── 컴포넌트 ───────────────────────────────────────────────────────────
export const Character: React.FC<{
  characterId: string;
  visualType?: string;
  sceneDuration: number;
  lipSync?: LipSyncTiming[];
  scale?: number;
  position?: "left" | "right" | "center";
}> = ({
  characterId,
  visualType = "key_point",
  sceneDuration,
  lipSync = [],
  scale = 1,
  position = "right",
}) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const sec = frame / fps;
  const charBase = `/img/content/character/${characterId}`;

  const cal = CALIBRATIONS[characterId] ?? DEFAULT_CAL;
  const { ref_width, ref_height, parts, useBodyImage = true, fullImageLipSync = false, mouthPrefix = "" } = cal;

  // ── 등장 / 퇴장 ────────────────────────────────────────────────────
  const enterY = interpolate(frame, [0, 15, 22, 28], [80, -6, 3, 0], { extrapolateRight: "clamp" });
  const enterOp = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const exitOp  = interpolate(frame, [sceneDuration - 10, sceneDuration], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const opacity = Math.min(enterOp, exitOp);

  // ── body 호흡 ──────────────────────────────────────────────────────
  const breathe = 1 + Math.sin((sec * Math.PI * 2) / 3) * 0.006;

  // ── head 흔들림 ────────────────────────────────────────────────────
  const headSway = Math.sin((sec * Math.PI * 2) / 2.5) * 0.6;
  const headNod  = visualType === "quote_hero"
    ? Math.sin((sec * Math.PI * 2) / 1.5) * 2 : 0;
  const headRot  = headSway + headNod;

  // 포즈 전환 (3초마다)
  const headPoses = ["head_front", "head_front", "head_tilt_left", "head_front", "head_tilt_right"];
  const headFile  = `${charBase}/${headPoses[Math.floor(sec / 3) % 5]}.png`;

  // ── eyes 깜빡임 ────────────────────────────────────────────────────
  const blinkCycle = sec % 5;
  let eyeFile = "eyes_open";
  if      (blinkCycle > 4.70 && blinkCycle < 4.85) eyeFile = "eyes_half";
  else if (blinkCycle > 4.85 && blinkCycle < 4.95) eyeFile = "eyes_closed";
  else if (blinkCycle > 4.95)                       eyeFile = "eyes_half";

  // ── mouth 립싱크 ───────────────────────────────────────────────────
  let mouthFile = "mouth_closed";
  const isSpeak = lipSync.some(t => sec >= t.start && sec <= t.end);
  if (isSpeak) {
    const mouthMap = ["mouth_closed", "mouth_half", "mouth_open", "mouth_half"];
    mouthFile = mouthMap[Math.floor(sec / 0.15) % 4];
  }

  // ── arm 포즈 ───────────────────────────────────────────────────────
  let armFile = "arm_down";
  const armSway = Math.sin((sec * Math.PI * 2) / 3) * 0.8;
  if ((visualType === "stat_card" || visualType === "key_point") && frame > 45) {
    armFile = "arm_point";
  } else if (visualType === "full_visual" && frame > 30 && frame < 60) {
    armFile = "arm_wave";
  }

  // ── 컨테이너 크기 + 위치 ──────────────────────────────────────────
  let sizeScale = scale;
  let displayMode: "fullbody" | "upperbody" = "fullbody";

  if (fullImageLipSync) {
    // c13 방식: 항상 fullbody, 1.3배 크기, 하단 밀착
    sizeScale *= 1.3;
  } else {
    switch (visualType) {
      case "comparison_table": case "split_screen": case "ranking_list":
        sizeScale *= 0.85; displayMode = "upperbody"; break;
      case "icon_grid": case "flowchart":
        sizeScale *= 0.80; displayMode = "upperbody"; break;
      case "stat_card": case "timeline":
        sizeScale *= 0.90; break;
    }
  }

  const containerWidth = ref_width * sizeScale;
  const bottomOffset   = fullImageLipSync ? -15 : (displayMode === "fullbody" ? 10 : -260 * sizeScale);

  let posStyle: React.CSSProperties = {};
  if      (position === "right")  posStyle = { right: 30 };
  else if (position === "left")   posStyle = { left: 30 };
  else                            posStyle = { left: "50%", marginLeft: -containerWidth / 2 };

  // ── 오버레이 스타일 헬퍼 ──────────────────────────────────────────
  const overlay = (
    part: PartLayout,
    extra?: React.CSSProperties
  ): React.CSSProperties => ({
    position: "absolute",
    left:  pct(part.left,  ref_width),
    top:   pct(part.top,   ref_height),
    width: pct(part.width, ref_width),
    ...extra,
  });

  // ── 렌더 ──────────────────────────────────────────────────────────

  // c13 방식: mouth 파일이 전체 캐릭터 이미지 → 단순 이미지 교체
  if (fullImageLipSync) {
    return (
      <div style={{
        position: "absolute",
        bottom: bottomOffset,
        ...posStyle,
        width: containerWidth,
        opacity,
        transform: `translateY(${enterY}px) scaleY(${breathe})`,
        transformOrigin: "bottom center",
        zIndex: 5,
      }}>
        <Img
          src={staticFile(`${charBase}/${mouthPrefix}${mouthFile}.png`)}
          style={{ width: "100%", display: "block" }}
        />
      </div>
    );
  }

  return (
    <div style={{
      position: "absolute",
      bottom: bottomOffset,
      ...posStyle,
      width: containerWidth,
      opacity,
      transform: `translateY(${enterY}px)`,
      zIndex: 5,
    }}>
      {/* 레이어 1: body (호흡 애니메이션) — useBodyImage=false 시 투명 공간만 확보 */}
      <div style={{
        position: "relative",
        transform: `scaleY(${breathe})`,
        transformOrigin: "bottom center",
      }}>
        {useBodyImage ? (
          <Img
            src={staticFile(`${charBase}/${characterId}.png`)}
            style={{ width: "100%", display: "block" }}
          />
        ) : (
          /* 파트 파일만 사용 — 컨테이너 높이 확보용 투명 div */
          <div style={{ width: "100%", paddingBottom: `${(ref_height / ref_width) * 100}%` }} />
        )}

        {/* 레이어 2: arm_right (팔 — body 위) */}
        <Img
          src={staticFile(`${charBase}/${armFile}.png`)}
          style={overlay(parts.arm_right, {
            transformOrigin: parts.arm_right.pivot
              ? `${parts.arm_right.pivot[0] * 100}% ${parts.arm_right.pivot[1] * 100}%`
              : "50% 10%",
            transform: `rotate(${armSway}deg)`,
          })}
        />

        {/* 레이어 3: head (머리 — 흔들림) */}
        <div style={overlay(parts.head, {
          transformOrigin: `${parts.head.pivot[0] * 100}% ${parts.head.pivot[1] * 100}%`,
          transform: `rotate(${headRot}deg)`,
        })}>
          <Img src={staticFile(headFile)} style={{ width: "100%" }} />
        </div>

        {/* 레이어 4: eyes (눈 — head와 동일 pivot으로 연동) */}
        <div style={overlay(parts.eyes, {
          transformOrigin: `${parts.head.pivot[0] * 100}% ${
            ((parts.head.top + parts.head.width * 0.88 - parts.eyes.top) / parts.head.width) * 100
          }%`,
          transform: `rotate(${headRot}deg)`,
        })}>
          <Img src={staticFile(`${charBase}/${eyeFile}.png`)} style={{ width: "100%" }} />
        </div>

        {/* 레이어 5: mouth (입 — head와 동일 pivot으로 연동 + 립싱크) */}
        <div style={overlay(parts.mouth, {
          transformOrigin: `${parts.head.pivot[0] * 100}% ${
            ((parts.head.top + parts.head.width * 0.88 - parts.mouth.top) / parts.head.width) * 100
          }%`,
          transform: `rotate(${headRot}deg)`,
        })}>
          <Img src={staticFile(`${charBase}/${mouthFile}.png`)} style={{ width: "100%" }} />
        </div>
      </div>
    </div>
  );
};
