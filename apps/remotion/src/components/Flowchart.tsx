import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";

interface FlowchartData {
  title?: string;
  nodes: Array<{ step: number; text: string }>;
}

export const Flowchart: React.FC<{ data: FlowchartData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <div style={{ opacity, textAlign: "center", width: "85%", maxWidth: 900 }}>
        {data.title && (
          <div style={{ fontSize: 34, fontWeight: 800, color: theme.textPrimary, marginBottom: 40 }}>
            {data.title}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
          {data.nodes.map((node, i) => {
            const nodeOp = interpolate(frame, [8 + i * 8, 20 + i * 8], [0, 1], { extrapolateRight: "clamp" });
            const nodeScale = interpolate(frame, [8 + i * 8, 20 + i * 8], [0.8, 1], { extrapolateRight: "clamp" });
            return (
              <React.Fragment key={i}>
                <div style={{ opacity: nodeOp, transform: `scale(${nodeScale})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, minWidth: 140 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#fff", boxShadow: theme.shadow }}>
                    {node.step}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: theme.textPrimary, maxWidth: 140, lineHeight: 1.4 }}>
                    {node.text}
                  </div>
                </div>
                {i < data.nodes.length - 1 && (
                  <div style={{ opacity: nodeOp, fontSize: 28, color: theme.accent, margin: "0 8px", marginTop: -20 }}>
                    →
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
