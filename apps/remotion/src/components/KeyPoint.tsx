import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";

interface KeyPointData {
  text: string;
  sub?: string;
}

export const KeyPoint: React.FC<{ data: KeyPointData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const slideUp = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [5, 20], [0, 60], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <div style={{ opacity, transform: `translateY(${slideUp}px)`, textAlign: "center", maxWidth: "75%", padding: 40, background: theme.cardBg, borderRadius: theme.borderRadius, boxShadow: theme.shadow, border: `1px solid ${theme.cardBorder}` }}>
        <div style={{ width: lineWidth, height: 4, background: theme.accent, margin: "0 auto 24px", borderRadius: 2 }} />
        <div style={{ fontSize: 42, fontWeight: 700, color: theme.textPrimary, lineHeight: 1.5 }}>
          {data.text}
        </div>
        {data.sub && (
          <div style={{ fontSize: 24, color: theme.textSecondary, marginTop: 16, fontWeight: 400 }}>
            {data.sub}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
