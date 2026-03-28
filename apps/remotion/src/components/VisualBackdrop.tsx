import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";

export const VisualBackdrop: React.FC<{ theme: Theme; intensity?: number }> = ({ theme, intensity = 1 }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 240], [0, 1], { extrapolateRight: "extend" });
  const sheenX = Math.sin(drift * Math.PI * 2) * 40;
  const sheenY = Math.cos(drift * Math.PI * 2) * 24;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          opacity: 0.85 * intensity,
          transform: `translate(${sheenX}px, ${sheenY}px)`,
          backgroundImage: theme.overlay,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.9 * intensity,
          backgroundImage: theme.vignette,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.18 * intensity,
          backgroundImage:
            "repeating-linear-gradient(120deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 28px)",
          mixBlendMode: "overlay",
          transform: `translate(${sheenX * 0.4}px, ${sheenY * 0.4}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

