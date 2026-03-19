import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";

interface StatCardData {
  value: string;
  label: string;
  sub?: string;
  icon?: string;
  trend?: "up" | "down" | "neutral";
}

export const StatCard: React.FC<{ data: StatCardData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const valueScale = interpolate(frame, [5, 25], [0.5, 1], { extrapolateRight: "clamp" });
  const slideUp = interpolate(frame, [0, 20], [40, 0], { extrapolateRight: "clamp" });

  const trendIcon = data.trend === "up" ? "↑" : data.trend === "down" ? "↓" : "";
  const trendColor = data.trend === "up" ? "#22c55e" : data.trend === "down" ? "#ef4444" : theme.textSecondary;

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <div style={{ opacity, transform: `translateY(${slideUp}px)`, textAlign: "center" }}>
        <div style={{ fontSize: 28, color: theme.textSecondary, marginBottom: 20, fontWeight: 500 }}>
          {data.label}
        </div>
        <div style={{ transform: `scale(${valueScale})`, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 12 }}>
          <span style={{ fontSize: 140, fontWeight: 900, color: theme.accent, lineHeight: 1 }}>
            {data.value}
          </span>
          {trendIcon && (
            <span style={{ fontSize: 60, color: trendColor, fontWeight: 700 }}>{trendIcon}</span>
          )}
        </div>
        {data.sub && (
          <div style={{ fontSize: 24, color: theme.textSecondary, marginTop: 24, fontWeight: 400 }}>
            {data.sub}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
