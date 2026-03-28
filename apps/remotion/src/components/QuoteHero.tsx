import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";
import { VisualBackdrop } from "./VisualBackdrop";

interface QuoteHeroData {
  quote: string;
  speaker?: string;
  emotion?: string;
}

export const QuoteHero: React.FC<{ data: QuoteHeroData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const quoteScale = interpolate(frame, [5, 30], [0.9, 1], { extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [0, 25], [0, 120], { extrapolateRight: "clamp" });
  const floatY = Math.sin((frame / 30) * Math.PI * 2) * 6;

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <VisualBackdrop theme={theme} />
      <div
        style={{
          opacity,
          maxWidth: "82%",
          textAlign: "center",
          transform: `translateY(${floatY}px)`,
        }}
      >
        <div
          style={{
            position: "relative",
            margin: "0 auto",
            padding: "62px 66px 56px",
            borderRadius: theme.borderRadius + 14,
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.shadowStrong,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -140,
              backgroundImage: `radial-gradient(circle at 30% 30%, ${theme.accent}22 0%, transparent 55%),radial-gradient(circle at 70% 70%, ${theme.accent}18 0%, transparent 55%)`,
              filter: "blur(12px)",
              opacity: 0.95,
              mixBlendMode: "screen",
            }}
          />

          <div style={{ position: "relative" }}>
            <div
              style={{
                fontSize: 94,
                color: theme.accent,
                opacity: 0.25,
                lineHeight: 0.7,
                marginBottom: -18,
                fontWeight: 900,
                textShadow: `0 0 26px ${theme.accent}70`,
              }}
            >
              “
            </div>

            <div
              style={{
                transform: `scale(${quoteScale})`,
                fontSize: 56,
                fontWeight: 900,
                color: theme.textPrimary,
                lineHeight: 1.52,
                letterSpacing: -1,
                wordBreak: "keep-all",
                textShadow: "0 10px 42px rgba(0,0,0,0.50)",
              }}
            >
              {data.quote}
            </div>

            <div
              style={{
                width: lineWidth,
                height: 4,
                background: `linear-gradient(90deg, ${theme.accent}00 0%, ${theme.accent} 35%, ${theme.accent} 65%, ${theme.accent}00 100%)`,
                margin: "34px auto 26px",
                borderRadius: 999,
                boxShadow: `0 0 18px ${theme.accent}70`,
              }}
            />

            {data.speaker && (
              <div style={{ fontSize: 26, color: theme.textSecondary, fontWeight: 700, letterSpacing: -0.2 }}>
                — {data.speaker}
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
