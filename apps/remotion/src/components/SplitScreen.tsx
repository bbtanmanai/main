import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";
import { VisualBackdrop } from "./VisualBackdrop";

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
  const glow = 0.7 + Math.sin((frame / 30) * Math.PI * 2) * 0.12;

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <VisualBackdrop theme={theme} />
      <div style={{ opacity, display: "flex", width: "88%", maxWidth: 1100, gap: 0, boxShadow: theme.shadowStrong, borderRadius: theme.borderRadius + 10, overflow: "hidden", border: `1px solid ${theme.cardBorder}` }}>
        {/* 왼쪽 */}
        <div style={{ flex: 1, transform: `translateX(${leftSlide}px)`, padding: 46, background: `linear-gradient(135deg, ${theme.cardBg} 0%, rgba(255,255,255,0.03) 100%)` }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <div style={{ padding: "10px 16px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: `1px solid ${theme.cardBorder}`, color: theme.textSecondary, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", fontSize: 18 }}>
              {data.left_label}
            </div>
          </div>
          {data.left_items.map((item, i) => {
            const itemOp = interpolate(frame, [15 + i * 5, 25 + i * 5], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ opacity: itemOp, fontSize: 22, color: theme.textPrimary, padding: "14px 0", borderBottom: i < data.left_items.length - 1 ? `1px solid ${theme.cardBorder}` : "none", display: "flex", alignItems: "flex-start", gap: 12, lineHeight: 1.4 }}>
                <span style={{ color: theme.textSecondary, fontWeight: 900 }}>•</span>
                <span style={{ flex: 1, wordBreak: "keep-all" }}>{item}</span>
              </div>
            );
          })}
        </div>

        {/* 구분선 */}
        <div style={{ width: 6, background: `linear-gradient(180deg, ${theme.accent} 0%, ${theme.accentDark} 100%)`, alignSelf: "center", height: `${dividerHeight}%`, borderRadius: 999, boxShadow: `0 0 22px ${theme.accent}80`, opacity: glow }} />

        {/* 오른쪽 */}
        <div style={{ flex: 1, transform: `translateX(${rightSlide}px)`, padding: 46, background: `linear-gradient(45deg, ${theme.cardBg} 0%, rgba(255,255,255,0.03) 100%)` }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <div style={{ padding: "10px 16px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: `1px solid ${theme.accentDark}`, color: theme.textPrimary, fontWeight: 950, letterSpacing: 2, textTransform: "uppercase", fontSize: 18, boxShadow: `0 0 18px ${theme.accent}50` }}>
              {data.right_label}
            </div>
          </div>
          {data.right_items.map((item, i) => {
            const itemOp = interpolate(frame, [15 + i * 5, 25 + i * 5], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ opacity: itemOp, fontSize: 22, color: theme.textAccent, fontWeight: 750, padding: "14px 0", borderBottom: i < data.right_items.length - 1 ? `1px solid ${theme.cardBorder}` : "none", display: "flex", alignItems: "flex-start", gap: 12, lineHeight: 1.4 }}>
                <span style={{ color: theme.accent, fontWeight: 900 }}>✦</span>
                <span style={{ flex: 1, wordBreak: "keep-all" }}>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
