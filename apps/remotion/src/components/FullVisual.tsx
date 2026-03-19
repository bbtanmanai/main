import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";

interface FullVisualData {
  mood?: string;
  scene_desc?: string;
  overlay_text?: string;
}

const MOOD_OVERLAYS: Record<string, string> = {
  warm: "radial-gradient(ellipse at 50% 50%, rgba(255,200,100,0.15) 0%, transparent 70%)",
  sad: "radial-gradient(ellipse at 50% 70%, rgba(100,120,200,0.15) 0%, transparent 70%)",
  somber: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)",
  hopeful: "radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.1) 0%, transparent 70%)",
  curious: "radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.1) 0%, transparent 60%)",
  informative: "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, transparent 50%)",
  product_focused: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 60%)",
};

export const FullVisual: React.FC<{ data: FullVisualData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const zoom = interpolate(frame, [0, 150], [1, 1.05], { extrapolateRight: "clamp" });

  const moodOverlay = MOOD_OVERLAYS[data.mood || "warm"] || MOOD_OVERLAYS.warm;

  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      {/* 줌 효과 배경 (투명) */}
      <AbsoluteFill style={{ transform: `scale(${zoom})` }} />
      {/* 무드 오버레이 */}
      <AbsoluteFill style={{ background: moodOverlay }} />
      {/* 1차 영상: 자막/텍스트 없음 (2차 9:16에서 자막 추가) */}
    </AbsoluteFill>
  );
};
