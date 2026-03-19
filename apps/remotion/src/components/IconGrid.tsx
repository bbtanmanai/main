import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";

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

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <div style={{ opacity, textAlign: "center", width: "75%", maxWidth: 800 }}>
        {data.title && (
          <div style={{ fontSize: 34, fontWeight: 800, color: theme.textPrimary, marginBottom: 40 }}>
            {data.title}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 20 }}>
          {data.items.map((item, i) => {
            const itemScale = interpolate(frame, [10 + i * 4, 20 + i * 4], [0.7, 1], { extrapolateRight: "clamp" });
            const itemOp = interpolate(frame, [10 + i * 4, 20 + i * 4], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ opacity: itemOp, transform: `scale(${itemScale})`, background: theme.cardBg, borderRadius: theme.borderRadius, padding: "28px 20px", boxShadow: theme.shadow, border: `1px solid ${theme.cardBorder}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 48 }}>
                  {ICON_MAP[item.icon] || "📌"}
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, color: theme.textPrimary }}>
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
