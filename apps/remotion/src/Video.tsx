import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate } from "remotion";
import { SceneRenderer, SceneData } from "./components/SceneRenderer";
import { Character } from "./components/Character";
import { getTheme } from "./themes";

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
  bgColor?: string;
}> = ({ bgImage, bgColor }) => {
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
}> = ({ scenes, styleId, audioFiles, durations, subtitles, bgImages = [], characterId }) => {
  const theme = getTheme(styleId);

  let startFrame = 0;
  const sequences = scenes.map((scene, i) => {
    const dur = durations[i] || 150;
    const from = startFrame;
    startFrame += dur;
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

          {/* Layer 1: 배경 이미지 (또는 테마 그라데이션) */}
          <BackgroundLayer bgImage={seq.bgImage} bgColor={theme.bgGradient} />

          {/* Layer 2: 비주얼타입 오버레이 (투명 배경) */}
          <SceneRenderer scene={seq.scene} theme={theme} />

          {/* Layer 3: 캐릭터 (선택적) */}
          {characterId && (
            <Character
              characterId={characterId}
              visualType={seq.scene.visual_type}
              sceneDuration={seq.dur}
              position={
                seq.scene.visual_type === "stat_card" || seq.scene.visual_type === "timeline"
                  ? "left" : "right"
              }
            />
          )}

          {/* 오디오 */}
          {seq.audioFile && <Audio src={staticFile(seq.audioFile)} />}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
