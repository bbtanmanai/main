import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ZdogShape } from "./ZdogShape";

// ── 주제별 카드 색상 팔레트 ─────────────────────────────────────────────────
export interface TopicColor {
  cardBg: string;       // 카드 배경 (rgba)
  cardBorder: string;   // 카드 테두리 (rgba)
  accent: string;       // 강조선 / 서브텍스트 색
  subText: string;      // 서브 텍스트 색
}

export const TOPIC_COLORS: Record<string, TopicColor> = {
  "health-senior":   { cardBg: "rgba(20,120,60,0.52)",    cardBorder: "rgba(74,222,128,0.55)",  accent: "#4ade80", subText: "#86efac" },
  "stock-news":      { cardBg: "rgba(120,80,0,0.52)",     cardBorder: "rgba(251,191,36,0.55)",  accent: "#fbbf24", subText: "#fde68a" },
  "tech-trend":      { cardBg: "rgba(30,27,120,0.52)",    cardBorder: "rgba(129,140,248,0.55)", accent: "#818cf8", subText: "#c7d2fe" },
  "wisdom-quotes":   { cardBg: "rgba(90,40,10,0.52)",     cardBorder: "rgba(251,146,60,0.55)",  accent: "#fb923c", subText: "#fed7aa" },
  "lifestyle":       { cardBg: "rgba(0,80,80,0.52)",      cardBorder: "rgba(45,212,191,0.55)",  accent: "#2dd4bf", subText: "#99f6e4" },
  "shorts-viral":    { cardBg: "rgba(120,10,70,0.52)",    cardBorder: "rgba(244,114,182,0.55)", accent: "#f472b6", subText: "#fbcfe8" },
  "insta-marketing": { cardBg: "rgba(130,30,60,0.52)",    cardBorder: "rgba(251,113,133,0.55)", accent: "#fb7185", subText: "#fecdd3" },
  "blog-seo":        { cardBg: "rgba(110,40,0,0.52)",     cardBorder: "rgba(251,146,60,0.55)",  accent: "#fb923c", subText: "#fed7aa" },
  "ai-video-ads":    { cardBg: "rgba(60,10,130,0.52)",    cardBorder: "rgba(167,139,250,0.55)", accent: "#a78bfa", subText: "#ddd6fe" },
  "ai-business":     { cardBg: "rgba(0,50,100,0.52)",     cardBorder: "rgba(56,189,248,0.55)",  accent: "#38bdf8", subText: "#bae6fd" },
  "digital-product": { cardBg: "rgba(0,70,90,0.52)",      cardBorder: "rgba(34,211,238,0.55)",  accent: "#22d3ee", subText: "#a5f3fc" },
  "workflow":        { cardBg: "rgba(30,40,60,0.52)",     cardBorder: "rgba(148,163,184,0.55)", accent: "#94a3b8", subText: "#cbd5e1" },
};

export const DEFAULT_TOPIC_COLOR: TopicColor = {
  cardBg: "rgba(10,10,30,0.52)",
  cardBorder: "rgba(255,255,255,0.3)",
  accent: "#ffffff",
  subText: "rgba(255,255,255,0.7)",
};

// ── 텍스트 추출: visual_type별 data → {main, sub} ──────────────────────────
export function extractCardText(visual_type: string, data: any): { main: string; sub?: string } {
  if (!data) return { main: "" };
  switch (visual_type) {
    case "key_point":
      return { main: data.text || "", sub: data.sub };
    case "quote_hero":
      return { main: data.quote || "", sub: data.speaker ? `— ${data.speaker}` : undefined };
    case "stat_card":
      return {
        main: data.value || "",
        sub: [data.label, data.sub].filter(Boolean).join("  ·  "),
      };
    case "comparison_table":
      return { main: data.title || "" };
    case "timeline":
      return {
        main: data.title || "",
        sub: data.events?.map((e: any) => e.text).join("  →  "),
      };
    case "icon_grid":
      return {
        main: data.title || "",
        sub: data.items?.map((i: any) => i.label).join("  ·  "),
      };
    case "ranking_list":
      return {
        main: data.title || "",
        sub: data.items?.slice(0, 3).map((i: any, idx: number) =>
          `${idx + 1}. ${i.label || i.text || ""}`
        ).join("  "),
      };
    case "flowchart":
      return {
        main: data.title || "",
        sub: data.nodes?.map((n: any) => n.text).join("  →  "),
      };
    case "full_visual":
      return { main: data.overlay_text || data.scene_desc || "" };
    case "split_screen":
      return { main: data.title || data.topic || "", sub: data.left?.label };
    default:
      return { main: data.text || data.title || data.quote || "" };
  }
}

// ── 카드 컴포넌트 ───────────────────────────────────────────────────────────
export const TextCard: React.FC<{
  main: string;
  sub?: string;
  color: TopicColor;
  topicId?: string;
}> = ({ main, sub, color, topicId = "" }) => {
  const frame = useCurrentFrame();
  const opacity  = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const slideUp  = interpolate(frame, [0, 22], [50, 0], { extrapolateRight: "clamp" });
  const lineW    = interpolate(frame, [6, 28], [0, 72], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>

      {/* Zdog 데코 — 우측 하단 */}
      {topicId && (
        <div style={{
          position: "absolute",
          bottom: 60, right: 80,
          pointerEvents: "none",
        }}>
          <ZdogShape topicId={topicId} size={280} opacity={0.18} />
        </div>
      )}

      <div style={{
        opacity,
        transform: `translateY(${slideUp}px)`,
        textAlign: "center",
        maxWidth: "76%",
        padding: "52px 60px",
        background: color.cardBg,
        borderRadius: 28,
        border: `2px solid ${color.cardBorder}`,
        boxShadow: `0 12px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}>

        {/* 상단 액센트 라인 */}
        <div style={{
          width: lineW,
          height: 5,
          background: color.accent,
          margin: "0 auto 32px",
          borderRadius: 3,
          boxShadow: `0 0 16px ${color.accent}80`,
        }} />

        {/* 메인 텍스트 */}
        <div style={{
          fontSize: 46,
          fontWeight: 800,
          color: "#ffffff",
          lineHeight: 1.6,
          letterSpacing: -0.5,
          textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          fontFamily: "'Noto Sans KR', 'Malgun Gothic', sans-serif",
          wordBreak: "keep-all",
        }}>
          {main}
        </div>

        {/* 서브 텍스트 */}
        {sub && (
          <div style={{
            fontSize: 26,
            color: color.subText,
            marginTop: 22,
            fontWeight: 500,
            fontFamily: "'Noto Sans KR', 'Malgun Gothic', sans-serif",
            lineHeight: 1.5,
            wordBreak: "keep-all",
          }}>
            {sub}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
