import React from "react";
import { AbsoluteFill } from "remotion";
import { TextCard, extractCardText, TOPIC_COLORS, DEFAULT_TOPIC_COLOR } from "./TextCard";

export interface SceneData {
  index: number;
  visual_type: string;
  data: any;
}

export const SceneRenderer: React.FC<{
  scene: SceneData;
  topicId: string;
}> = ({ scene, topicId }) => {
  const color = TOPIC_COLORS[topicId] ?? DEFAULT_TOPIC_COLOR;
  const { main, sub } = extractCardText(scene.visual_type, scene.data);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <TextCard main={main} sub={sub} color={color} topicId={topicId} />
    </AbsoluteFill>
  );
};
