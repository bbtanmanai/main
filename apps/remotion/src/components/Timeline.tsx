import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";
import { VisualBackdrop } from "./VisualBackdrop";

interface TimelineData {
  title?: string;
  events: Array<{ time: string; text: string }>;
}

export const Timeline: React.FC<{ data: TimelineData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const drift = Math.sin((frame / 30) * Math.PI * 2) * 8;

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <VisualBackdrop theme={theme} />
      <div style={{ opacity, width: "86%", maxWidth: 980, transform: `translateY(${drift}px)` }}>
        {data.title && (
          <div style={{ fontSize: 38, fontWeight: 950, color: theme.textPrimary, textAlign: "center", marginBottom: 28, letterSpacing: -0.6, textShadow: "0 10px 40px rgba(0,0,0,0.45)" }}>
            {data.title}
          </div>
        )}

        <div style={{ position: "relative", paddingLeft: 72, paddingRight: 12 }}>
          <div style={{ position: "absolute", left: 28, top: 6, bottom: 6, width: 6, background: `linear-gradient(180deg, ${theme.accent} 0%, ${theme.accentDark} 100%)`, borderRadius: 999, boxShadow: `0 0 22px ${theme.accent}70` }} />

          {data.events.map((ev, i) => {
            const itemOpacity = interpolate(frame, [10 + i * 8, 22 + i * 8], [0, 1], { extrapolateRight: "clamp" });
            const itemSlide = interpolate(frame, [10 + i * 8, 22 + i * 8], [20, 0], { extrapolateRight: "clamp" });
            const dotPulse = 1 + Math.sin((frame / 30) * Math.PI * 2 + i) * 0.08;
            return (
              <div key={i} style={{ opacity: itemOpacity, transform: `translateX(${itemSlide}px)`, display: "flex", alignItems: "flex-start", marginBottom: 32, position: "relative" }}>
                <div style={{ position: "absolute", left: -58, top: 10, width: 22, height: 22, borderRadius: 999, background: theme.accent, transform: `scale(${dotPulse})`, boxShadow: `0 0 20px ${theme.accent}90`, border: `4px solid ${theme.bgPrimary}` }} />
                <div style={{ background: theme.cardBg, borderRadius: theme.borderRadius + 10, padding: "20px 26px", boxShadow: theme.shadowStrong, border: `1px solid ${theme.cardBorder}`, flex: 1, overflow: "hidden", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 55%)", opacity: 0.8, mixBlendMode: "overlay" }} />
                  <div style={{ position: "relative" }}>
                    <div style={{ fontSize: 18, fontWeight: 950, color: theme.accent, marginBottom: 8, letterSpacing: 1.2, textTransform: "uppercase" }}>
                    {ev.time}
                    </div>
                    <div style={{ fontSize: 24, color: theme.textPrimary, fontWeight: 750, lineHeight: 1.45, letterSpacing: -0.2, wordBreak: "keep-all" }}>
                    {ev.text}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
