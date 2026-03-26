import React, { useRef, useEffect } from "react";
import { useCurrentFrame } from "remotion";
// @ts-ignore
import Zdog from "zdog";

// ── 주제별 도형 빌더 ──────────────────────────────────────────────────────────
type ShapeBuilder = (illo: any, color: string) => void;

const buildHeart: ShapeBuilder = (illo, color) => {
  // 두 원 + 하단 꼭짓점으로 하트 근사
  new Zdog.Ellipse({ addTo: illo, diameter: 70, translate: { x: -24, y: -20 }, color, fill: true, stroke: 6 });
  new Zdog.Ellipse({ addTo: illo, diameter: 70, translate: { x:  24, y: -20 }, color, fill: true, stroke: 6 });
  new Zdog.Shape({
    addTo: illo,
    path: [{ x: -58, y:  0 }, { x: 0, y: 58 }, { x: 58, y: 0 }],
    color, fill: true, stroke: 14,
  });
};

const buildBars: ShapeBuilder = (illo, color) => {
  const heights = [55, 90, 70];
  const xs = [-52, 0, 52];
  heights.forEach((h, i) => {
    new Zdog.Rect({
      addTo: illo,
      width: 28,
      height: h,
      translate: { x: xs[i], y: (90 - h) / 2 },
      color, fill: true, stroke: 4,
    });
  });
};

const buildHexagon: ShapeBuilder = (illo, color) => {
  new Zdog.Polygon({
    addTo: illo,
    radius: 70,
    sides: 6,
    color, fill: false, stroke: 12,
  });
  new Zdog.Polygon({
    addTo: illo,
    radius: 44,
    sides: 6,
    color, fill: false, stroke: 6,
  });
};

const buildStar: ShapeBuilder = (illo, color) => {
  // 별 = 5각형 두 개 (크기 다르게 겹침)
  new Zdog.Polygon({
    addTo: illo,
    radius: 72,
    sides: 5,
    color, fill: false, stroke: 10,
  });
  new Zdog.Polygon({
    addTo: illo,
    radius: 40,
    sides: 5,
    color, fill: true, stroke: 6,
    rotate: { z: Math.PI / 5 },
  });
};

const buildRing: ShapeBuilder = (illo, color) => {
  new Zdog.Ellipse({ addTo: illo, diameter: 130, color, fill: false, stroke: 18 });
  new Zdog.Ellipse({ addTo: illo, diameter:  80, color, fill: false, stroke: 10 });
  new Zdog.Ellipse({ addTo: illo, diameter:  34, color, fill: true,  stroke: 6 });
};

const buildDiamond: ShapeBuilder = (illo, color) => {
  new Zdog.Shape({
    addTo: illo,
    path: [{ x: 0, y: -80 }, { x: 55, y: 0 }, { x: 0, y: 70 }, { x: -55, y: 0 }],
    color, fill: true, stroke: 8,
  });
};

const buildCircle: ShapeBuilder = (illo, color) => {
  new Zdog.Ellipse({ addTo: illo, diameter: 120, color, fill: false, stroke: 14 });
  new Zdog.Ellipse({ addTo: illo, diameter:  60, color, fill: true,  stroke: 6 });
};

// ── 주제별 매핑 ────────────────────────────────────────────────────────────────
const SHAPE_MAP: Record<string, { build: ShapeBuilder; color: string }> = {
  "health-senior":   { build: buildHeart,   color: "#4ade80" },
  "stock-news":      { build: buildBars,    color: "#fbbf24" },
  "tech-trend":      { build: buildHexagon, color: "#818cf8" },
  "wisdom-quotes":   { build: buildStar,    color: "#fb923c" },
  "lifestyle":       { build: buildRing,    color: "#2dd4bf" },
  "shorts-viral":    { build: buildDiamond, color: "#f472b6" },
  "insta-marketing": { build: buildDiamond, color: "#fb7185" },
  "blog-seo":        { build: buildStar,    color: "#fb923c" },
  "ai-video-ads":    { build: buildHexagon, color: "#a78bfa" },
  "ai-business":     { build: buildRing,    color: "#38bdf8" },
  "digital-product": { build: buildCircle,  color: "#22d3ee" },
  "workflow":        { build: buildHexagon, color: "#94a3b8" },
};

const DEFAULT_SHAPE = { build: buildCircle, color: "#ffffff" };

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
export const ZdogShape: React.FC<{
  topicId: string;
  size?: number;
  opacity?: number;
}> = ({ topicId, size = 280, opacity = 0.18 }) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { build, color } = SHAPE_MAP[topicId] ?? DEFAULT_SHAPE;

    const illo = new Zdog.Illustration({
      element: canvas,
      zoom: 1.4,
    });

    build(illo, color);

    // 미세한 부유 움직임 (위아래 float + 살짝 rotate)
    illo.translate.y = Math.sin(frame * 0.045) * 9;
    illo.translate.x = Math.sin(frame * 0.028) * 5;
    illo.rotate.z    = Math.sin(frame * 0.022) * 0.06;

    illo.updateRenderGraph();
  }, [frame, topicId]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: "block", opacity }}
    />
  );
};
