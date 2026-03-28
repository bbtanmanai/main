import React from "react";
import { AbsoluteFill } from "remotion";
import { TextCard, extractCardText, TOPIC_COLORS, DEFAULT_TOPIC_COLOR } from "./TextCard";
import { getTheme } from "../themes";
import { StatCard } from "./StatCard";
import { ComparisonTable } from "./ComparisonTable";
import { Timeline } from "./Timeline";
import { IconGrid } from "./IconGrid";
import { RankingList } from "./RankingList";
import { QuoteHero } from "./QuoteHero";
import { SplitScreen } from "./SplitScreen";
import { Flowchart } from "./Flowchart";
import { KeyPoint } from "./KeyPoint";
import { FullVisual } from "./FullVisual";

export interface SceneData {
  index: number;
  visual_type: string;
  data: any;
}

export const SceneRenderer: React.FC<{
  scene: SceneData;
  topicId: string;
  styleId: string;
}> = ({ scene, topicId, styleId }) => {
  const color = TOPIC_COLORS[topicId] ?? DEFAULT_TOPIC_COLOR;
  const theme = getTheme(styleId, { accent: color.accent, textAccent: "#ffffff" });

  const fallback = () => {
    const { main, sub } = extractCardText(scene.visual_type, scene.data);
    return <TextCard main={main} sub={sub} color={color} topicId={topicId} />;
  };

  const vt = (scene.visual_type || "").toLowerCase();
  const d = scene.data ?? {};

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {vt === "stat_card" ? (
        <StatCard
          theme={theme}
          data={{
            value: String(d.value ?? ""),
            label: String(d.label ?? d.title ?? ""),
            sub: d.sub ? String(d.sub) : undefined,
            icon: d.icon ? String(d.icon) : undefined,
            trend: d.trend === "up" || d.trend === "down" || d.trend === "neutral" ? d.trend : undefined,
          }}
        />
      ) : vt === "comparison_table" ? (
        <ComparisonTable
          theme={theme}
          data={{
            title: d.title ? String(d.title) : undefined,
            col_a: String(d.col_a ?? d.left_label ?? "A"),
            col_b: String(d.col_b ?? d.right_label ?? "B"),
            rows: Array.isArray(d.rows)
              ? d.rows.map((r: any) => ({
                  label: String(r.label ?? ""),
                  a: String(r.a ?? ""),
                  b: String(r.b ?? ""),
                }))
              : [],
          }}
        />
      ) : vt === "timeline" ? (
        <Timeline
          theme={theme}
          data={{
            title: d.title ? String(d.title) : undefined,
            events: Array.isArray(d.events)
              ? d.events.map((e: any) => ({
                  time: String(e.time ?? ""),
                  text: String(e.text ?? ""),
                }))
              : [],
          }}
        />
      ) : vt === "icon_grid" ? (
        <IconGrid
          theme={theme}
          data={{
            title: d.title ? String(d.title) : undefined,
            items: Array.isArray(d.items)
              ? d.items.map((i: any) => ({
                  icon: String(i.icon ?? "info"),
                  label: String(i.label ?? i.text ?? ""),
                }))
              : [],
          }}
        />
      ) : vt === "ranking_list" ? (
        <RankingList
          theme={theme}
          data={{
            title: d.title ? String(d.title) : undefined,
            items: Array.isArray(d.items)
              ? d.items.map((i: any, idx: number) => ({
                  rank: Number(i.rank ?? idx + 1),
                  text: String(i.text ?? i.label ?? ""),
                  sub: i.sub ? String(i.sub) : undefined,
                }))
              : [],
          }}
        />
      ) : vt === "quote_hero" ? (
        <QuoteHero
          theme={theme}
          data={{
            quote: String(d.quote ?? d.text ?? ""),
            speaker: d.speaker ? String(d.speaker) : undefined,
            emotion: d.emotion ? String(d.emotion) : undefined,
          }}
        />
      ) : vt === "split_screen" ? (
        <SplitScreen
          theme={theme}
          data={{
            left_label: String(d.left_label ?? d.left?.label ?? "A"),
            right_label: String(d.right_label ?? d.right?.label ?? "B"),
            left_items: Array.isArray(d.left_items)
              ? d.left_items.map((x: any) => String(x))
              : Array.isArray(d.left?.items)
                ? d.left.items.map((x: any) => String(x))
                : [],
            right_items: Array.isArray(d.right_items)
              ? d.right_items.map((x: any) => String(x))
              : Array.isArray(d.right?.items)
                ? d.right.items.map((x: any) => String(x))
                : [],
          }}
        />
      ) : vt === "flowchart" ? (
        <Flowchart
          theme={theme}
          data={{
            title: d.title ? String(d.title) : undefined,
            nodes: Array.isArray(d.nodes)
              ? d.nodes.map((n: any, idx: number) => ({
                  step: Number(n.step ?? idx + 1),
                  text: String(n.text ?? n.label ?? ""),
                }))
              : [],
          }}
        />
      ) : vt === "key_point" ? (
        <KeyPoint
          theme={theme}
          data={{
            text: String(d.text ?? d.title ?? ""),
            sub: d.sub ? String(d.sub) : undefined,
          }}
        />
      ) : vt === "full_visual" ? (
        <FullVisual
          theme={theme}
          data={{
            mood: d.mood ? String(d.mood) : undefined,
            scene_desc: d.scene_desc ? String(d.scene_desc) : undefined,
            overlay_text: d.overlay_text ? String(d.overlay_text) : undefined,
          }}
        />
      ) : (
        fallback()
      )}
    </AbsoluteFill>
  );
};
