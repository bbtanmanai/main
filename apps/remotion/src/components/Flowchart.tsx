import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";
import { VisualBackdrop } from "./VisualBackdrop";

interface FlowchartData {
  title?: string;
  nodes: Array<{ step: number; text: string }>;
}

export const Flowchart: React.FC<{ data: FlowchartData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const drift = Math.sin((frame / 30) * Math.PI * 2) * 6;

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <VisualBackdrop theme={theme} />
      <div style={{ opacity, textAlign: "center", width: "90%", maxWidth: 1120, transform: `translateY(${drift}px)` }}>
        {data.title && (
          <div style={{ fontSize: 38, fontWeight: 950, color: theme.textPrimary, marginBottom: 26, letterSpacing: -0.6, textShadow: "0 10px 40px rgba(0,0,0,0.45)" }}>
            {data.title}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap" }}>
          {data.nodes.map((node, i) => {
            const nodeOp = interpolate(frame, [8 + i * 8, 20 + i * 8], [0, 1], { extrapolateRight: "clamp" });
            const nodeScale = interpolate(frame, [8 + i * 8, 20 + i * 8], [0.8, 1], { extrapolateRight: "clamp" });
            return (
              <React.Fragment key={i}>
                <div style={{ opacity: nodeOp, transform: `scale(${nodeScale})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, minWidth: 210, margin: "10px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 999, background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentDark} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 950, color: "#fff", boxShadow: `0 0 26px ${theme.accent}65, 0 18px 60px rgba(0,0,0,0.35)` }}>
                    {node.step}
                  </div>
                  <div style={{ background: theme.cardBg, borderRadius: theme.borderRadius + 10, padding: "16px 18px", border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadow, maxWidth: 220 }}>
                    <div style={{ fontSize: 22, fontWeight: 850, color: theme.textPrimary, lineHeight: 1.35, wordBreak: "keep-all" }}>
                      {node.text}
                    </div>
                  </div>
                </div>
                {i < data.nodes.length - 1 && (
                  <div style={{ opacity: nodeOp, width: 70, height: 6, margin: "0 10px", borderRadius: 999, background: `linear-gradient(90deg, ${theme.accent}00 0%, ${theme.accent} 35%, ${theme.accent} 65%, ${theme.accent}00 100%)`, boxShadow: `0 0 18px ${theme.accent}60` }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
