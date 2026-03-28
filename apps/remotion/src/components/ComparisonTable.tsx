import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";
import { VisualBackdrop } from "./VisualBackdrop";

interface ComparisonData {
  title?: string;
  col_a: string;
  col_b: string;
  rows: Array<{ label: string; a: string; b: string }>;
}

export const ComparisonTable: React.FC<{ data: ComparisonData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const sheen = interpolate(frame, [0, 90], [-220, 220], { extrapolateRight: "extend" });

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <VisualBackdrop theme={theme} />
      <div style={{ opacity, width: "86%", maxWidth: 1040 }}>
        {data.title && (
          <div style={{ fontSize: 38, fontWeight: 950, color: theme.textPrimary, textAlign: "center", marginBottom: 30, letterSpacing: -0.6, textShadow: "0 10px 40px rgba(0,0,0,0.45)" }}>
            {data.title}
          </div>
        )}

        <div style={{ position: "relative", borderRadius: theme.borderRadius + 10, overflow: "hidden", border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadowStrong }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, ${theme.cardBg} 0%, rgba(255,255,255,0.03) 60%, ${theme.cardBg} 100%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${sheen}px`,
              width: 200,
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 50%, transparent 100%)",
              transform: "skewX(-18deg)",
              opacity: 0.7,
              mixBlendMode: "overlay",
            }}
          />

          <div style={{ position: "relative", padding: 18 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1.2, padding: "18px 18px", background: "transparent" }} />
              <div style={{ flex: 1, padding: "18px 18px", background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentDark} 100%)`, borderRadius: `${theme.borderRadius}px ${theme.borderRadius}px 10px 10px`, textAlign: "center", fontSize: 22, fontWeight: 950, color: "#fff", boxShadow: `0 0 18px ${theme.accent}55` }}>
                {data.col_a}
              </div>
              <div style={{ flex: 1, padding: "18px 18px", background: `linear-gradient(135deg, ${theme.accentDark} 0%, ${theme.accent} 100%)`, borderRadius: `${theme.borderRadius}px ${theme.borderRadius}px 10px 10px`, textAlign: "center", fontSize: 22, fontWeight: 950, color: "#fff", boxShadow: `0 0 18px ${theme.accent}45` }}>
                {data.col_b}
              </div>
            </div>

            {data.rows.map((row, i) => {
              const rowOpacity = interpolate(frame, [12 + i * 5, 24 + i * 5], [0, 1], { extrapolateRight: "clamp" });
              const rowSlide = interpolate(frame, [12 + i * 5, 24 + i * 5], [24, 0], { extrapolateRight: "clamp" });
              const isLast = i === data.rows.length - 1;
              const zebra = i % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.00)";
              return (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: isLast ? 0 : 8, opacity: rowOpacity, transform: `translateY(${rowSlide}px)` }}>
                  <div style={{ flex: 1.2, padding: "16px 18px", background: zebra, borderRadius: isLast ? `0 0 0 ${theme.borderRadius}px` : 12, fontSize: 20, fontWeight: 800, color: theme.textPrimary, display: "flex", alignItems: "center", border: `1px solid ${theme.cardBorder}` }}>
                    {row.label}
                  </div>
                  <div style={{ flex: 1, padding: "16px 18px", background: zebra, textAlign: "center", fontSize: 20, color: theme.textPrimary, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${theme.cardBorder}`, borderRadius: 12 }}>
                    {row.a}
                  </div>
                  <div style={{ flex: 1, padding: "16px 18px", background: `linear-gradient(135deg, ${zebra} 0%, rgba(255,255,255,0.03) 100%)`, borderRadius: isLast ? `0 0 ${theme.borderRadius}px 0` : 12, textAlign: "center", fontSize: 20, fontWeight: 950, color: theme.textAccent, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${theme.accentDark}`, boxShadow: `0 0 14px ${theme.accent}25` }}>
                    {row.b}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
