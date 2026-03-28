import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "../themes";
import { VisualBackdrop } from "./VisualBackdrop";

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
  const ringRot = interpolate(frame, [0, 180], [0, 180], { extrapolateRight: "extend" });
  const pulse = 1 + Math.sin((frame / 30) * Math.PI * 2) * 0.02;

  const trendIcon = data.trend === "up" ? "↑" : data.trend === "down" ? "↓" : "";
  const trendColor = data.trend === "up" ? "#22c55e" : data.trend === "down" ? "#ef4444" : theme.textSecondary;

  return (
    <AbsoluteFill style={{ background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fontFamily }}>
      <VisualBackdrop theme={theme} />
      <div
        style={{
          opacity,
          transform: `translateY(${slideUp}px)`,
          textAlign: "center",
          width: "78%",
          maxWidth: 980,
        }}
      >
        <div
          style={{
            margin: "0 auto 18px",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            borderRadius: 999,
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.shadow,
            color: theme.textSecondary,
            fontWeight: 800,
            letterSpacing: 0.4,
            fontSize: 20,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: theme.accent,
              boxShadow: `0 0 18px ${theme.accent}90`,
            }}
          />
          <span style={{ wordBreak: "keep-all" }}>{data.label}</span>
        </div>

        <div
          style={{
            position: "relative",
            margin: "0 auto",
            padding: "44px 44px 40px",
            borderRadius: theme.borderRadius + 10,
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.shadowStrong,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -140,
              transform: `rotate(${ringRot}deg) scale(${pulse})`,
              backgroundImage: `conic-gradient(from 180deg, ${theme.accent}00 0deg, ${theme.accent}55 70deg, ${theme.accent}00 160deg, ${theme.accent}33 240deg, ${theme.accent}00 360deg)`,
              opacity: 0.55,
              filter: "blur(18px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.10) 0%, transparent 55%),radial-gradient(ellipse at 20% 70%, rgba(255,255,255,0.06) 0%, transparent 60%)",
              opacity: 0.8,
              mixBlendMode: "overlay",
            }}
          />

          <div style={{ position: "relative" }}>
            <div
              style={{
                transform: `scale(${valueScale})`,
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                gap: 14,
              }}
            >
              <span
                style={{
                  fontSize: 150,
                  fontWeight: 950,
                  color: "#fff",
                  lineHeight: 1,
                  letterSpacing: -2,
                  textShadow: `0 6px 30px ${theme.accent}40, 0 10px 40px rgba(0,0,0,0.45)`,
                }}
              >
                {data.value}
              </span>
              {trendIcon && (
                <span style={{ fontSize: 64, color: trendColor, fontWeight: 900, textShadow: "0 6px 22px rgba(0,0,0,0.45)" }}>
                  {trendIcon}
                </span>
              )}
            </div>

            {data.sub && (
              <div
                style={{
                  marginTop: 22,
                  fontSize: 24,
                  color: theme.textSecondary,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  wordBreak: "keep-all",
                }}
              >
                {data.sub}
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
