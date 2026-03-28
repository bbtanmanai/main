import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";
import { VisualBackdrop } from "./VisualBackdrop";

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
  const drift = interpolate(frame, [0, 240], [0, 1], { extrapolateRight: "extend" });
  const leakX = Math.sin(drift * Math.PI * 2) * 120;
  const leakY = Math.cos(drift * Math.PI * 2) * 70;

  const moodOverlay = MOOD_OVERLAYS[data.mood || "warm"] || MOOD_OVERLAYS.warm;

  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }} />
      <VisualBackdrop theme={theme} intensity={0.9} />
      <AbsoluteFill style={{ background: moodOverlay, opacity: 0.95 }} />
      <AbsoluteFill
        style={{
          opacity,
          transform: `translate(${leakX}px, ${leakY}px)`,
          backgroundImage:
            "radial-gradient(circle at 30% 35%, rgba(255,255,255,0.10) 0%, transparent 55%),radial-gradient(circle at 75% 60%, rgba(255,255,255,0.06) 0%, transparent 58%)",
          mixBlendMode: "overlay",
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.16 * opacity,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 5px)",
          mixBlendMode: "soft-light",
        }}
      />
    </AbsoluteFill>
  );
};
