import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";

interface TimelineData {
  title?: string;
  events: Array<{ time: string; text: string }>;
}

export const Timeline: React.FC<{ data: TimelineData; theme: Theme }> = ({ data, theme }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <div style={{ opacity, width: "80%", maxWidth: 800 }}>
        {data.title && (
          <div style={{ fontSize: 32, fontWeight: 800, color: theme.textPrimary, textAlign: "center", marginBottom: 40 }}>
            {data.title}
          </div>
        )}

        <div style={{ position: "relative", paddingLeft: 60 }}>
          {/* 세로 라인 */}
          <div style={{ position: "absolute", left: 20, top: 0, bottom: 0, width: 3, background: theme.accent, borderRadius: 2 }} />

          {data.events.map((ev, i) => {
            const itemOpacity = interpolate(frame, [10 + i * 8, 22 + i * 8], [0, 1], { extrapolateRight: "clamp" });
            const itemSlide = interpolate(frame, [10 + i * 8, 22 + i * 8], [20, 0], { extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ opacity: itemOpacity, transform: `translateX(${itemSlide}px)`, display: "flex", alignItems: "flex-start", marginBottom: 32, position: "relative" }}>
                {/* 도트 */}
                <div style={{ position: "absolute", left: -48, top: 8, width: 16, height: 16, borderRadius: "50%", background: theme.accent, border: `3px solid ${theme.bgPrimary}` }} />
                {/* 내용 */}
                <div style={{ background: theme.cardBg, borderRadius: theme.borderRadius, padding: "16px 24px", boxShadow: theme.shadow, border: `1px solid ${theme.cardBorder}`, flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: theme.accent, marginBottom: 6 }}>
                    {ev.time}
                  </div>
                  <div style={{ fontSize: 22, color: theme.textPrimary, fontWeight: 500, lineHeight: 1.4 }}>
                    {ev.text}
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
