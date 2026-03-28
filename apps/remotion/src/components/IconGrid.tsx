import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";
import { VisualBackdrop } from "./VisualBackdrop";

interface IconGridData {
  title?: string;
  items: Array<{ icon: string; label: string }>;
}

const ICON_MAP: Record<string, string> = {
  vitamin_d: "☀️", calcium: "🦴", iron: "🔴", omega3: "🐟", zinc: "⚡",
  protein: "💪", fiber: "🌿", probiotics: "🦠", magnesium: "✨", b12: "🧬",
  muscle: "💪", heart: "❤️", brain: "🧠", eye: "👁️", bone: "🦴",
  immune: "🛡️", energy: "⚡", sleep: "😴", stress: "🧘", skin: "✨",
  chart: "📊", check: "✅", star: "⭐", warning: "⚠️", info: "ℹ️",
};

export const IconGrid: React.FC<{ data: IconGridData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const cols = data.items.length <= 4 ? 2 : 3;
  const float = Math.sin((frame / 30) * Math.PI * 2) * 6;

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <VisualBackdrop theme={theme} />
      <div style={{ opacity, textAlign: "center", width: "84%", maxWidth: 980, transform: `translateY(${float}px)` }}>
        {data.title && (
          <div style={{ fontSize: 38, fontWeight: 950, color: theme.textPrimary, marginBottom: 30, letterSpacing: -0.6, textShadow: "0 10px 40px rgba(0,0,0,0.45)" }}>
            {data.title}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18 }}>
          {data.items.map((item, i) => {
            const itemScale = interpolate(frame, [10 + i * 4, 20 + i * 4], [0.7, 1], { extrapolateRight: "clamp" });
            const itemOp = interpolate(frame, [10 + i * 4, 20 + i * 4], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ opacity: itemOp, transform: `scale(${itemScale})`, background: theme.cardBg, borderRadius: theme.borderRadius + 10, padding: "26px 18px", boxShadow: theme.shadowStrong, border: `1px solid ${theme.cardBorder}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 55%)", opacity: 0.9, mixBlendMode: "overlay" }} />
                <div style={{ position: "relative", width: 70, height: 70, borderRadius: 999, background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.20) 0%, transparent 55%),linear-gradient(135deg, ${theme.accent}66 0%, ${theme.accentDark}66 100%)`, boxShadow: `0 0 22px ${theme.accent}55, 0 18px 50px rgba(0,0,0,0.35)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 34, filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.35))" }}>
                    {ICON_MAP[item.icon] || "📌"}
                  </div>
                </div>
                <div style={{ position: "relative", fontSize: 22, fontWeight: 850, color: theme.textPrimary, letterSpacing: -0.3, wordBreak: "keep-all", lineHeight: 1.35 }}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
