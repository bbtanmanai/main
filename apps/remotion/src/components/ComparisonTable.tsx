import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";

interface ComparisonData {
  title?: string;
  col_a: string;
  col_b: string;
  rows: Array<{ label: string; a: string; b: string }>;
}

export const ComparisonTable: React.FC<{ data: ComparisonData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <div style={{ opacity, width: "80%", maxWidth: 900 }}>
        {data.title && (
          <div style={{ fontSize: 36, fontWeight: 800, color: theme.textPrimary, textAlign: "center", marginBottom: 40 }}>
            {data.title}
          </div>
        )}

        {/* 헤더 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <div style={{ flex: 1.2, padding: "16px 20px", background: "transparent" }} />
          <div style={{ flex: 1, padding: "16px 20px", background: theme.accent, borderRadius: `${theme.borderRadius}px ${theme.borderRadius}px 0 0`, textAlign: "center", fontSize: 22, fontWeight: 800, color: "#fff" }}>
            {data.col_a}
          </div>
          <div style={{ flex: 1, padding: "16px 20px", background: theme.accentDark, borderRadius: `${theme.borderRadius}px ${theme.borderRadius}px 0 0`, textAlign: "center", fontSize: 22, fontWeight: 800, color: "#fff" }}>
            {data.col_b}
          </div>
        </div>

        {/* 행 */}
        {data.rows.map((row, i) => {
          const rowOpacity = interpolate(frame, [10 + i * 5, 20 + i * 5], [0, 1], { extrapolateRight: "clamp" });
          const isLast = i === data.rows.length - 1;
          return (
            <div key={i} style={{ display: "flex", gap: 4, marginBottom: isLast ? 0 : 4, opacity: rowOpacity }}>
              <div style={{ flex: 1.2, padding: "14px 20px", background: theme.cardBg, borderRadius: isLast ? `0 0 0 ${theme.borderRadius}px` : 0, fontSize: 20, fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center" }}>
                {row.label}
              </div>
              <div style={{ flex: 1, padding: "14px 20px", background: theme.cardBg, textAlign: "center", fontSize: 20, color: theme.textPrimary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {row.a}
              </div>
              <div style={{ flex: 1, padding: "14px 20px", background: theme.cardBg, borderRadius: isLast ? `0 0 ${theme.borderRadius}px 0` : 0, textAlign: "center", fontSize: 20, fontWeight: 700, color: theme.textAccent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {row.b}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
