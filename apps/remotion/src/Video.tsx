import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneRenderer, SceneData } from "./components/SceneRenderer";
import { Character } from "./components/Character";
import animData from "./data/object_animations.json";

// ── sky: 상단 군집 기준점 (같은 종류 여러 개 → 여기 주변으로 모임) ─────────────
const SKY_CLUSTER_BASES = [
  { x: 280,  y: 120 },
  { x: 960,  y: 100 },
  { x: 1640, y: 120 },
];

// ── ground: 카드 하단 군집 기준점 ────────────────────────────────────────────
// 카드 하단 ≈ y720, 오브젝트 중심 y=700 → 상단 절반이 카드에 살짝 걸침
const GROUND_CLUSTER_BASES = [
  { x: 340,  y: 700 },
  { x: 820,  y: 695 },
  { x: 1300, y: 700 },
  { x: 1620, y: 695 },
];

// ── 군집 내 슬롯 오프셋: 같은 종류가 여러 개일 때 미세 좌표 분산 ──────────────
const CLUSTER_OFFSETS = [
  { dx:   0, dy:   0 },   // 기준 (첫 번째)
  { dx:  34, dy:  16 },   // 오른쪽 살짝 아래
  { dx: -28, dy:  22 },   // 왼쪽 살짝 아래
  { dx:  18, dy: -14 },   // 오른쪽 살짝 위
];

interface AnimConfig { type: string; speed: number; amplitude: number; phase: number; }
interface ObjectDef  { label: string; category: string; size: string; canOverlap: boolean; animation: AnimConfig; }
const SIZE_PX: Record<string, number> = { sm: 100, md: 130, lg: 160, xl: 190 };

function getObjTransform(anim: AnimConfig, frame: number, slotPhase = 0): string {
  const t = frame * anim.speed + anim.phase + slotPhase;
  switch (anim.type) {
    case "float":   return `translateY(${Math.sin(t) * anim.amplitude * 0.6}px)`;
    case "bounce":  return `translateY(${-Math.abs(Math.sin(t)) * anim.amplitude * 0.6}px)`;
    case "sway":    return `rotate(${Math.sin(t) * anim.amplitude}deg)`;
    case "spin":    return `rotate(${(frame * anim.speed * 360) % 360}deg)`;
    case "pulse":   return `scale(${1 + Math.sin(t) * anim.amplitude})`;
    case "drift":   return `translate(${Math.sin(t) * anim.amplitude * 0.5}px, ${Math.sin(t * 0.6) * anim.amplitude * 0.3}px)`;
    default: return "";
  }
}

// ── 오브젝트 레이어 ───────────────────────────────────────────────────────────
const ObjectLayer: React.FC<{ sceneObjects: string[] }> = ({ sceneObjects }) => {
  const frame = useCurrentFrame();

  // sky / ground 분리 — sky는 같은 ID 중복 제거 (해·달·구름 1개씩만)
  const skyObjs    = Array.from(new Set(
    sceneObjects.filter(id => (animData as Record<string, ObjectDef>)[id]?.category === "sky")
  ));
  const groundObjs = sceneObjects.filter(id => (animData as Record<string, ObjectDef>)[id]?.category !== "sky");

  // 군집 좌표 계산: 같은 종류 → 같은 base + CLUSTER_OFFSETS
  function buildItems(
    objs: string[],
    bases: { x: number; y: number }[],
    startIdx: number,
  ): { objId: string; pos: { x: number; y: number }; idx: number }[] {
    const typeBaseIdx: Record<string, number> = {};  // objId → bases 인덱스
    const typeCount:   Record<string, number> = {};  // objId → 등장 횟수
    let nextBase = 0;

    return objs.map((id, i) => {
      if (typeBaseIdx[id] === undefined) {
        typeBaseIdx[id] = nextBase % bases.length;
        nextBase++;
      }
      const count = typeCount[id] ?? 0;
      typeCount[id] = count + 1;

      const base   = bases[typeBaseIdx[id]];
      const offset = CLUSTER_OFFSETS[count % CLUSTER_OFFSETS.length];
      return {
        objId: id,
        pos:   { x: base.x + offset.dx, y: base.y + offset.dy },
        idx:   startIdx + i,
      };
    });
  }

  const items = [
    ...buildItems(skyObjs,    SKY_CLUSTER_BASES,    0),
    ...buildItems(groundObjs, GROUND_CLUSTER_BASES, skyObjs.length),
  ];

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {items.map(({ objId, pos, idx }) => {
        const def = (animData as Record<string, ObjectDef>)[objId];
        if (!def) return null;
        const px = SIZE_PX[def.size] ?? 140;
        const origin = def.animation.type === "sway" ? "bottom center" : "center";
        // 등장 stagger: 첫 씬에서만 한 번 fade-in
        const enterOpacity = interpolate(frame, [idx * 4, idx * 4 + 16], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        return (
          <div key={idx} style={{
            position: "absolute",
            left: pos.x - px / 2,
            top:  pos.y - px / 2,
            width: px, height: px,
            opacity: enterOpacity,
            zIndex: def.canOverlap ? 2 : 1,
          }}>
            <div style={{
              transform: getObjTransform(def.animation, frame, idx * 0.9),
              transformOrigin: origin,
              width: "100%", height: "100%",
            }}>
              <Img
                src={staticFile(`img/content/character/object/${objId}.png`)}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * 캐릭터 오버레이 (body 포즈 전환 + 호흡 + 등장/퇴장)
 */
const CharacterOverlay: React.FC<{
  characterId: string;
  visualType?: string;
  sceneDuration: number;
}> = ({ characterId, visualType = "key_point", sceneDuration }) => {
  const frame = useCurrentFrame();
  const charBase = `/img/content/character/${characterId}`;

  // ── body 포즈 전환 (0.8초 주기) ──────────────────────────
  const poseFrame = Math.floor(frame / 24) % 6;
  const poseMap = [
    "body_front", "body_front",
    "body_tilt_left", "body_front",
    "body_tilt_right", "body_front",
  ];
  const bodyFile = `${charBase}/${poseMap[poseFrame]}.png`;

  // ── 호흡 효과 (미세 스케일) ─────────────────────────────
  const breathe = 1 + Math.sin(frame / 30 * Math.PI * 2 / 3) * 0.008; // ±0.8%, 3초 주기

  // ── 미세 흔들림 ─────────────────────────────────────────
  const sway = Math.sin(frame / 30 * Math.PI * 2 / 2.5) * 0.8; // ±0.8도, 2.5초 주기

  // ── 등장 애니메이션 (아래에서 바운스) ───────────────────
  const enterY = interpolate(frame, [0, 15, 22, 28], [120, -10, 5, 0], { extrapolateRight: "clamp" });
  const enterOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  // ── 퇴장 애니메이션 (마지막 10프레임) ──────────────────
  const exitStart = sceneDuration - 10;
  const exitOpacity = interpolate(frame, [exitStart, sceneDuration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const opacity = Math.min(enterOpacity, exitOpacity);

  // ── 비주얼타입별 위치 ──────────────────────────────────
  let position: { right?: number; left?: number; bottom: number; width: number } = {
    right: 30, bottom: -20, width: 300,
  };

  switch (visualType) {
    case "comparison_table":
    case "split_screen":
    case "ranking_list":
      // 넓은 컨텐츠 → 캐릭터 우측 작게
      position = { right: 10, bottom: -20, width: 220 };
      break;
    case "quote_hero":
    case "key_point":
      // 텍스트 중심 → 캐릭터 우측 크게
      position = { right: 40, bottom: -10, width: 340 };
      break;
    case "stat_card":
      // 수치 강조 → 캐릭터 좌측
      position = { left: 40, bottom: -10, width: 300 };
      break;
    case "icon_grid":
    case "flowchart":
      // 그리드/차트 → 캐릭터 우측 작게
      position = { right: 20, bottom: -20, width: 240 };
      break;
    case "timeline":
      // 타임라인 → 캐릭터 좌측
      position = { left: 30, bottom: -10, width: 260 };
      break;
    case "full_visual":
      // 풀 비주얼 → 캐릭터 중앙 우측 크게
      position = { right: 60, bottom: 0, width: 360 };
      break;
  }

  return (
    <div style={{
      position: "absolute",
      ...(position.right !== undefined ? { right: position.right } : {}),
      ...(position.left !== undefined ? { left: position.left } : {}),
      bottom: position.bottom,
      width: position.width,
      opacity,
      transform: `translateY(${enterY}px) rotate(${sway}deg) scale(${breathe})`,
      transformOrigin: "bottom center",
      zIndex: 5,
    }}>
      <Img
        src={staticFile(bodyFile)}
        style={{ width: "100%", objectFit: "contain" }}
      />
    </div>
  );
};

/**
 * 배경 이미지 레이어 (Ken Burns 줌 효과)
 */
const BackgroundLayer: React.FC<{
  bgImage?: string;
}> = ({ bgImage }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 300], [1, 1.08], { extrapolateRight: "clamp" });

  if (bgImage) {
    return (
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img src={staticFile(bgImage)} style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom})`,
        }} />
      </AbsoluteFill>
    );
  }

  // 배경 이미지 없으면 체커보드 (투명 표시) + 안내 텍스트
  return (
    <AbsoluteFill>
      <div style={{
        width: "100%",
        height: "100%",
        backgroundImage: `
          linear-gradient(45deg, #2a2a2a 25%, transparent 25%),
          linear-gradient(-45deg, #2a2a2a 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #2a2a2a 75%),
          linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)
        `,
        backgroundSize: "40px 40px",
        backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0",
        backgroundColor: "#222222",
      }} />
      {/* 1차 영상: 텍스트/자막 없음 — 체커보드만 표시 */}
    </AbsoluteFill>
  );
};

/**
 * 씬 전환 효과 (fade in/out)
 */
const SceneTransition: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  fadeFrames?: number;
}> = ({ children, durationInFrames, fadeFrames = 8 }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, fadeFrames], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - fadeFrames, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {children}
    </AbsoluteFill>
  );
};

/**
 * 자막 오버레이 (하단 중앙, spring 등장)
 */
const SubtitleOverlay: React.FC<{
  text: string;
  durationInFrames: number;
}> = ({ text, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!text) return null;

  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const exitStart = durationInFrames - 10;
  const exit = interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{
      position: "absolute",
      bottom: 60,
      left: "50%",
      transform: `translateX(-50%) translateY(${(1 - enter) * 30}px)`,
      opacity: Math.min(enter, exit),
      zIndex: 10,
    }}>
      <div style={{
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        padding: "12px 28px",
        borderRadius: 12,
        maxWidth: 800,
        textAlign: "center",
      }}>
        <p style={{
          color: "#fff",
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1.5,
          margin: 0,
          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}>{text}</p>
      </div>
    </div>
  );
};

/**
 * 메인 비디오 컴포지션
 *
 * Props:
 *   scenes: SceneData[]         — 비주얼타입 JSON (투명 배경)
 *   styleId: string             — 화풍 ID (테마 색상용)
 *   audioFiles: string[]        — 씬별 MP3 파일 경로
 *   durations: number[]         — 씬별 프레임 수
 *   subtitles: string[]         — 씬별 자막 텍스트 (1차 영상에서는 미사용)
 *   bgImages: string[]          — 씬별 배경 이미지 경로 (없으면 테마 색상)
 *   characterId: string         — 캐릭터 ID (예: "c3", 없으면 캐릭터 없음)
 */
export const LinkDropVideo: React.FC<{
  scenes: SceneData[];
  styleId: string;
  audioFiles: string[];
  durations: number[];
  subtitles: string[];
  bgImages?: string[];
  characterId?: string;
  lipSync?: { start: number; end: number }[];
  sceneObjects?: string[];  // 씬에 배치할 오브젝트 ID 목록
}> = ({ scenes, styleId, audioFiles, durations, subtitles, bgImages = [], characterId, lipSync = [], sceneObjects = [] }) => {

  // bgImages[0] 경로에서 topicId 추출 ("tech-trend1.png" → "tech-trend")
  const topicId = bgImages[0]?.match(/video_svg_bg\/([a-z-]+?)\d*\.png/)?.[1] ?? styleId ?? "";

  let totalFrames = 0;
  const sequences = scenes.map((scene, i) => {
    const dur = durations[i] || 150;
    const from = totalFrames;
    totalFrames += dur;
    return {
      scene, from, dur,
      audioFile: audioFiles[i] || "",
      bgImage: bgImages[i] || "",
    };
  });

  return (
    <AbsoluteFill>
      {sequences.map((seq, i) => (
        <Sequence key={i} from={seq.from} durationInFrames={seq.dur}>
          <SceneTransition durationInFrames={seq.dur}>

            {/* Layer 4: 배경 이미지 */}
            <BackgroundLayer bgImage={seq.bgImage} />

            {/* Layer 2: 캐릭터 — 우측 하단 고정 */}
            {characterId && (
              <Character
                characterId={characterId}
                visualType={seq.scene.visual_type}
                sceneDuration={seq.dur}
                lipSync={lipSync}
                position="right"
              />
            )}

            {/* Layer 1: 비주얼 오버레이 (텍스트 카드) */}
            <SceneRenderer scene={seq.scene} topicId={topicId} />

            {/* Layer 5: 자막 */}
            <SubtitleOverlay text={subtitles[i] || ""} durationInFrames={seq.dur} />

            {/* 오디오 */}
            {seq.audioFile && <Audio src={staticFile(seq.audioFile)} />}

          </SceneTransition>
        </Sequence>
      ))}

      {/* Layer 3: 오브젝트 — 영상 전체 persistent (씬 변경 무관) */}
      {sceneObjects.length > 0 && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <ObjectLayer sceneObjects={sceneObjects} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
