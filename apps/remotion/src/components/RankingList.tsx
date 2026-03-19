import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";

interface RankingData {
  title?: string;
  items: Array<{ rank: number; text: string; sub?: string }>;
}

export const RankingList: React.FC<{ data: RankingData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <div style={{ opacity, width: "70%", maxWidth: 700 }}>
        {data.title && (
          <div style={{ fontSize: 36, fontWeight: 800, color: theme.textPrimary, textAlign: "center", marginBottom: 36 }}>
            {data.title}
          </div>
        )}
        {data.items.map((item, i) => {
          const itemOp = interpolate(frame, [10 + i * 6, 22 + i * 6], [0, 1], { extrapolateRight: "clamp" });
          const slideX = interpolate(frame, [10 + i * 6, 22 + i * 6], [30, 0], { extrapolateRight: "clamp" });
          const isFirst = item.rank === 1;
          return (
            <div key={i} style={{ opacity: itemOp, transform: `translateX(${slideX}px)`, display: "flex", alignItems: "center", gap: 20, marginBottom: 16, padding: "16px 24px", background: isFirst ? theme.accent : theme.cardBg, borderRadius: theme.borderRadius, boxShadow: theme.shadow, border: `1px solid ${theme.cardBorder}` }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: isFirst ? "#fff" : theme.accent, minWidth: 50, textAlign: "center" }}>
                {item.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: isFirst ? "#fff" : theme.textPrimary }}>
                  {item.text}
                </div>
                {item.sub && (
                  <div style={{ fontSize: 16, color: isFirst ? "rgba(255,255,255,0.7)" : theme.textSecondary, marginTop: 4 }}>
                    {item.sub}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
