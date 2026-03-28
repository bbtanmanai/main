import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";
import { VisualBackdrop } from "./VisualBackdrop";

interface KeyPointData {
  text: string;
  sub?: string;
}

export const KeyPoint: React.FC<{ data: KeyPointData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const slideUp = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [5, 20], [0, 60], { extrapolateRight: "clamp" });
  const glow = 0.65 + Math.sin((frame / 30) * Math.PI * 2) * 0.12;

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <VisualBackdrop theme={theme} />
      <div
        style={{
          opacity,
          transform: `translateY(${slideUp}px)`,
          textAlign: "center",
          maxWidth: "78%",
          padding: 0,
          borderRadius: theme.borderRadius + 12,
          overflow: "hidden",
          boxShadow: theme.shadowStrong,
          border: `1px solid ${theme.cardBorder}`,
          background: theme.cardBg,
        }}
      >
        <div
          style={{
            position: "relative",
            padding: "54px 62px 50px",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 12,
              background: `linear-gradient(180deg, ${theme.accent} 0%, ${theme.accentDark} 100%)`,
              boxShadow: `0 0 26px ${theme.accent}90`,
              opacity: glow,
            }}
          />

          <div
            style={{
              width: lineWidth,
              height: 5,
              background: theme.accent,
              margin: "0 auto 28px",
              borderRadius: 999,
              boxShadow: `0 0 18px ${theme.accent}80`,
            }}
          />

          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: theme.textPrimary,
              lineHeight: 1.5,
              letterSpacing: -0.6,
              wordBreak: "keep-all",
              textShadow: "0 10px 40px rgba(0,0,0,0.45)",
            }}
          >
            {data.text}
          </div>
          {data.sub && (
            <div
              style={{
                fontSize: 26,
                color: theme.textSecondary,
                marginTop: 20,
                fontWeight: 600,
                lineHeight: 1.55,
                wordBreak: "keep-all",
              }}
            >
              {data.sub}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
