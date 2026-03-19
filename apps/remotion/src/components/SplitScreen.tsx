import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";

interface SplitScreenData {
  left_label: string;
  right_label: string;
  left_items: string[];
  right_items: string[];
}

export const SplitScreen: React.FC<{ data: SplitScreenData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const leftSlide = interpolate(frame, [0, 20], [-50, 0], { extrapolateRight: "clamp" });
  const rightSlide = interpolate(frame, [0, 20], [50, 0], { extrapolateRight: "clamp" });
  const dividerHeight = interpolate(frame, [10, 30], [0, 100], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <div style={{ opacity, display: "flex", width: "85%", maxWidth: 1000, gap: 0 }}>
        {/* 왼쪽 */}
        <div style={{ flex: 1, transform: `translateX(${leftSlide}px)`, padding: 40, background: theme.cardBg, borderRadius: `${theme.borderRadius}px 0 0 ${theme.borderRadius}px`, border: `1px solid ${theme.cardBorder}` }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: theme.textSecondary, marginBottom: 24, textAlign: "center", textTransform: "uppercase", letterSpacing: 2 }}>
            {data.left_label}
          </div>
          {data.left_items.map((item, i) => {
            const itemOp = interpolate(frame, [15 + i * 5, 25 + i * 5], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ opacity: itemOp, fontSize: 22, color: theme.textPrimary, padding: "10px 0", borderBottom: i < data.left_items.length - 1 ? `1px solid ${theme.cardBorder}` : "none", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: theme.textSecondary }}>•</span> {item}
              </div>
            );
          })}
        </div>

        {/* 구분선 */}
        <div style={{ width: 4, background: theme.accent, alignSelf: "center", height: `${dividerHeight}%`, borderRadius: 2 }} />

        {/* 오른쪽 */}
        <div style={{ flex: 1, transform: `translateX(${rightSlide}px)`, padding: 40, background: theme.cardBg, borderRadius: `0 ${theme.borderRadius}px ${theme.borderRadius}px 0`, border: `1px solid ${theme.cardBorder}` }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: theme.accent, marginBottom: 24, textAlign: "center", textTransform: "uppercase", letterSpacing: 2 }}>
            {data.right_label}
          </div>
          {data.right_items.map((item, i) => {
            const itemOp = interpolate(frame, [15 + i * 5, 25 + i * 5], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ opacity: itemOp, fontSize: 22, color: theme.textAccent, fontWeight: 600, padding: "10px 0", borderBottom: i < data.right_items.length - 1 ? `1px solid ${theme.cardBorder}` : "none", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: theme.accent }}>✦</span> {item}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
