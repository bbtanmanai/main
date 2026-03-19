import React from "react";
import { Theme } from "../themes";
import { StatCard } from "./StatCard";
import { QuoteHero } from "./QuoteHero";
import { ComparisonTable } from "./ComparisonTable";
import { KeyPoint } from "./KeyPoint";
import { Timeline } from "./Timeline";
import { SplitScreen } from "./SplitScreen";
import { IconGrid } from "./IconGrid";
import { RankingList } from "./RankingList";
import { Flowchart } from "./Flowchart";
import { FullVisual } from "./FullVisual";

export interface SceneData {
  index: number;
  visual_type: string;
  data: any;
}

export const SceneRenderer: React.FC<{ scene: SceneData; theme: Theme }> = ({ scene, theme }) => {
  switch (scene.visual_type) {
    case "stat_card":
      return <StatCard data={scene.data} theme={theme} />;
    case "quote_hero":
      return <QuoteHero data={scene.data} theme={theme} />;
    case "comparison_table":
      return <ComparisonTable data={scene.data} theme={theme} />;
    case "key_point":
      return <KeyPoint data={scene.data} theme={theme} />;
    case "timeline":
      return <Timeline data={scene.data} theme={theme} />;
    case "split_screen":
      return <SplitScreen data={scene.data} theme={theme} />;
    case "icon_grid":
      return <IconGrid data={scene.data} theme={theme} />;
    case "ranking_list":
      return <RankingList data={scene.data} theme={theme} />;
    case "flowchart":
      return <Flowchart data={scene.data} theme={theme} />;
    case "full_visual":
      return <FullVisual data={scene.data} theme={theme} />;
    default:
      return <KeyPoint data={{ text: scene.data?.text || "씬", sub: "" }} theme={theme} />;
  }
};
