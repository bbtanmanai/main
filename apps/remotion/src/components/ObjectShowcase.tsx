import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import animData from "../data/object_animations.json";

// ── 타입 ──────────────────────────────────────────────────────────────────────
interface AnimConfig {
  type: "float" | "bounce" | "sway" | "spin" | "pulse" | "drift";
  speed: number;
  amplitude: number;
  phase: number;
}
interface ObjectDef {
  label: string;
  category: string;
  size: "sm" | "md" | "lg" | "xl";
  canOverlap: boolean;
  animation: AnimConfig;
}

// ── 크기 매핑 ─────────────────────────────────────────────────────────────────
const SIZE_PX: Record<string, number> = { sm: 140, md: 190, lg: 240, xl: 290 };

// ── 애니메이션 transform 계산 ─────────────────────────────────────────────────
function getAnimTransform(anim: AnimConfig, frame: number): string {
  const t = frame * anim.speed + anim.phase;
  switch (anim.type) {
    case "float":
      return `translateY(${Math.sin(t) * anim.amplitude}px)`;
    case "bounce":
      return `translateY(${-Math.abs(Math.sin(t)) * anim.amplitude}px)`;
    case "sway":
      return `rotate(${Math.sin(t) * anim.amplitude}deg)`;
    case "spin":
      return `rotate(${(frame * anim.speed * 360) % 360}deg)`;
    case "pulse":
      return `scale(${1 + Math.sin(t) * anim.amplitude})`;
    case "drift":
      return `translate(${Math.sin(t) * anim.amplitude}px, ${Math.sin(t * 0.6) * anim.amplitude * 0.4}px)`;
    default:
      return "";
  }
}

// ── 단일 오브젝트 셀 ──────────────────────────────────────────────────────────
const ObjectCell: React.FC<{
  objId: string;
  def: ObjectDef;
  cellW: number;
  cellH: number;
  enterDelay: number;  // 등장 지연 프레임
}> = ({ objId, def, cellW, cellH, enterDelay }) => {
  const frame = useCurrentFrame();
  const px = SIZE_PX[def.size] ?? 200;

  // 등장 애니메이션
  const enterProgress = interpolate(frame, [enterDelay, enterDelay + 18], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const enterScale = interpolate(enterProgress, [0, 0.7, 1], [0.4, 1.08, 1]);
  const enterOpacity = interpolate(enterProgress, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });

  // 루프 움직임
  const loopTransform = getAnimTransform(def.animation, frame);

  // sway는 transformOrigin을 하단 중앙으로
  const origin = def.animation.type === "sway" ? "bottom center" : "center";

  // canOverlap이면 z-index 높게, overflow visible
  const overlapStyle: React.CSSProperties = def.canOverlap
    ? { overflow: "visible", zIndex: 2 }
    : { overflow: "hidden", zIndex: 1 };

  const imgPath = staticFile(`img/content/character/object/${objId}.png`);

  return (
    <div style={{
      width: cellW,
      height: cellH,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      ...overlapStyle,
    }}>
      <div style={{
        opacity: enterOpacity,
        transform: `scale(${enterScale})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}>
        {/* 오브젝트 이미지 */}
        <div style={{
          transform: loopTransform,
          transformOrigin: origin,
          width: px,
          height: px,
          // canOverlap이면 약간 튀어나오게
          ...(def.canOverlap ? { marginLeft: -px * 0.08, marginRight: -px * 0.08 } : {}),
        }}>
          <Img
            src={imgPath}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        {/* 라벨 */}
        <div style={{
          fontSize: 22,
          fontWeight: 700,
          color: "rgba(255,255,255,0.85)",
          fontFamily: "'Noto Sans KR', sans-serif",
          textShadow: "0 1px 6px rgba(0,0,0,0.6)",
          whiteSpace: "nowrap",
        }}>
          {def.label}
        </div>
      </div>
    </div>
  );
};

// ── 씬 (12개 그리드) ─────────────────────────────────────────────────────────
const ObjectScene: React.FC<{
  objects: string[];  // 최대 12개
  sceneIndex: number;
}> = ({ objects, sceneIndex }) => {
  const COLS = 4;
  const ROWS = 3;
  const CELL_W = 1920 / COLS;   // 480
  const CELL_H = 1080 / ROWS;   // 360

  // 12개 슬롯 (부족하면 null 패딩)
  const slots = Array.from({ length: COLS * ROWS }, (_, i) => objects[i] ?? null);

  return (
    <AbsoluteFill>
      {/* 배경 */}
      <AbsoluteFill style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2027 100%)",
      }} />

      {/* 씬 번호 */}
      <div style={{
        position: "absolute", top: 18, right: 32,
        fontSize: 20, color: "rgba(255,255,255,0.3)",
        fontFamily: "monospace", fontWeight: 700,
      }}>
        {sceneIndex + 1} / {Math.ceil((Object.keys(animData).length) / 12)}
      </div>

      {/* 그리드 */}
      <div style={{
        position: "absolute", inset: 0,
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }}>
        {slots.map((objId, i) => {
          if (!objId) return <div key={i} />;
          const def = (animData as Record<string, ObjectDef>)[objId];
          if (!def) return <div key={i} />;
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const enterDelay = (row * COLS + col) * 4; // 열×행 순서로 등장
          return (
            <ObjectCell
              key={objId}
              objId={objId}
              def={def}
              cellW={CELL_W}
              cellH={CELL_H}
              enterDelay={enterDelay}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 메인 컴포지션 ─────────────────────────────────────────────────────────────
export interface ObjectShowcaseProps {
  objects?: string[];            // 커스텀 오브젝트 목록 (기본: 전체)
  sceneDurationFrames?: number;  // 씬당 프레임 수 (기본: 150 = 5초)
}

export const ObjectShowcase: React.FC<ObjectShowcaseProps> = ({
  objects,
  sceneDurationFrames = 150,
}) => {
  const allObjects = objects ?? Object.keys(animData);
  const CHUNK = 12;

  // 12개씩 청크
  const scenes: string[][] = [];
  for (let i = 0; i < allObjects.length; i += CHUNK) {
    scenes.push(allObjects.slice(i, i + CHUNK));
  }

  return (
    <AbsoluteFill>
      {scenes.map((sceneObjs, i) => (
        <Sequence
          key={i}
          from={i * sceneDurationFrames}
          durationInFrames={sceneDurationFrames}
        >
          <ObjectScene objects={sceneObjs} sceneIndex={i} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
