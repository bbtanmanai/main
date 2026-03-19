import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";

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

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <div style={{ opacity, maxWidth: "80%", textAlign: "center" }}>
        {/* 장식 따옴표 */}
        <div style={{ fontSize: 80, color: theme.accent, opacity: 0.3, lineHeight: 0.8, marginBottom: -10 }}>
          "
        </div>

        {/* 인용문 */}
        <div style={{ transform: `scale(${quoteScale})`, fontSize: 52, fontWeight: 700, color: theme.textPrimary, lineHeight: 1.5, letterSpacing: -1 }}>
          {data.quote}
        </div>

        {/* 구분선 */}
        <div style={{ width: lineWidth, height: 3, background: theme.accent, margin: "30px auto", borderRadius: 2 }} />

        {/* 화자 */}
        {data.speaker && (
          <div style={{ fontSize: 26, color: theme.textSecondary, fontWeight: 500 }}>
            — {data.speaker}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
