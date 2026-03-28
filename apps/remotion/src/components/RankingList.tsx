import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";
import { VisualBackdrop } from "./VisualBackdrop";

interface RankingData {
  title?: string;
  items: Array<{ rank: number; text: string; sub?: string }>;
}

export const RankingList: React.FC<{ data: RankingData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const float = Math.sin((frame / 30) * Math.PI * 2) * 6;

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <VisualBackdrop theme={theme} />
      <div style={{ opacity, width: "82%", maxWidth: 920, transform: `translateY(${float}px)` }}>
        {data.title && (
          <div style={{ fontSize: 38, fontWeight: 950, color: theme.textPrimary, textAlign: "center", marginBottom: 26, letterSpacing: -0.6, textShadow: "0 10px 40px rgba(0,0,0,0.45)" }}>
            {data.title}
          </div>
        )}
        {data.items.map((item, i) => {
          const itemOp = interpolate(frame, [10 + i * 6, 22 + i * 6], [0, 1], { extrapolateRight: "clamp" });
          const slideX = interpolate(frame, [10 + i * 6, 22 + i * 6], [30, 0], { extrapolateRight: "clamp" });
          const isFirst = item.rank === 1;
          const isTop3 = item.rank <= 3;
          const medal = item.rank === 1 ? "🏆" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : "";
          return (
            <div key={i} style={{ opacity: itemOp, transform: `translateX(${slideX}px)`, display: "flex", alignItems: "center", gap: 18, marginBottom: 14, padding: "18px 22px", background: theme.cardBg, borderRadius: theme.borderRadius + 10, boxShadow: isTop3 ? theme.shadowStrong : theme.shadow, border: `1px solid ${isTop3 ? theme.accentDark : theme.cardBorder}`, overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: isTop3 ? `linear-gradient(135deg, ${theme.accent}22 0%, transparent 55%)` : "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 55%)", opacity: 0.9, mixBlendMode: "overlay" }} />
              <div style={{ position: "relative", width: 56, height: 56, borderRadius: 999, background: isTop3 ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentDark} 100%)` : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isTop3 ? `0 0 22px ${theme.accent}60` : theme.shadow }}>
                <div style={{ fontSize: 22, fontWeight: 950, color: "#fff" }}>{item.rank}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ position: "relative", fontSize: 26, fontWeight: 950, color: theme.textPrimary, letterSpacing: -0.4, lineHeight: 1.32, wordBreak: "keep-all", display: "flex", alignItems: "center", gap: 10 }}>
                  {medal && <span style={{ fontSize: 22, filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.35))" }}>{medal}</span>}
                  <span>{item.text}</span>
                </div>
                {item.sub && (
                  <div style={{ position: "relative", fontSize: 18, color: theme.textSecondary, marginTop: 8, fontWeight: 650, letterSpacing: -0.1, wordBreak: "keep-all" }}>
                    {item.sub}
                  </div>
                )}
              </div>
              {isTop3 && (
                <div style={{ position: "relative", width: 10, height: 52, borderRadius: 999, background: `linear-gradient(180deg, ${theme.accent} 0%, ${theme.accentDark} 100%)`, boxShadow: `0 0 18px ${theme.accent}70` }} />
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
