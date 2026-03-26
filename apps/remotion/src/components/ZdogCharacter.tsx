import React, { useRef, useEffect } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
// @ts-ignore
import Zdog from "zdog";

const TAU = Math.PI * 2;

// 주제별 상의 색상
const TOPIC_CLOTH_COLOR: Record<string, string> = {
  "health-senior":   "#16a34a",
  "stock-news":      "#b45309",
  "tech-trend":      "#4f46e5",
  "wisdom-quotes":   "#c2410c",
  "lifestyle":       "#0d9488",
  "shorts-viral":    "#be185d",
  "insta-marketing": "#be123c",
  "blog-seo":        "#b45309",
  "ai-video-ads":    "#6d28d9",
  "ai-business":     "#0369a1",
  "digital-product": "#0e7490",
  "workflow":        "#334155",
};
const DEFAULT_CLOTH = "#3730a3";

export const ZdogCharacter: React.FC<{
  topicId?: string;
  lipSync?: { start: number; end: number }[];
  size?: number;   // canvas 짧은 변 기준 (기본 380)
}> = ({ topicId = "", lipSync = [], size = 380 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentSec = frame / fps;
  const isSpeaking = lipSync.some(s => currentSec >= s.start && currentSec <= s.end);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── 미세 움직임 오실레이터 ─────────────────────────────────────────────
    const breath   = Math.sin(frame * 0.04)           * 0.5;   // 호흡 (5s)
    const headBob  = Math.sin(frame * 0.05  + 0.6)   * 0.8;   // 머리 위아래 (4s)
    const armSwing = Math.sin(frame * 0.038)          * 0.06;  // 팔 흔들림 (5s)
    const rock     = Math.sin(frame * 0.027)          * 0.012; // 몸 미세 기울기 (8s)

    // ── 색상 ──────────────────────────────────────────────────────────────
    const skin  = "#f5c5a3";
    const hair  = "#1e1b4b";
    const cloth = TOPIC_CLOTH_COLOR[topicId] ?? DEFAULT_CLOTH;
    const pant  = "#1e293b";
    const shoe  = "#0f172a";

    const illo = new Zdog.Illustration({
      element: canvas,
      zoom: 6,
    });

    // ── Hips (회전 중심) ───────────────────────────────────────────────────
    // 허리 (캔버스 하단에서 잘림 → 상반신 버스트 형태)
    const hips = new Zdog.Shape({
      addTo: illo,
      path: [{ x: -4 }, { x: 4 }],
      translate: { y: 26 },
      rotate: { z: rock },
      color: pant,
      stroke: 5.5,
    });

    // ── Spine anchor (호흡으로 상체 살짝 움직임) ────────────────────────────
    const spine = new Zdog.Anchor({
      addTo: hips,
      translate: { y: breath },
    });

    // ── 상체 (Chest) ───────────────────────────────────────────────────────
    const chest = new Zdog.Shape({
      addTo: spine,
      path: [{ x: -2.5 }, { x: 2.5 }],
      translate: { y: -8 },
      color: cloth,
      stroke: 11,
    });

    // 어깨 라인
    new Zdog.Shape({
      addTo: chest,
      path: [{ x: -6 }, { x: 6 }],
      translate: { y: -4 },
      color: cloth,
      stroke: 7,
    });

    // 목
    new Zdog.Shape({
      addTo: chest,
      path: [{ y: 0 }, { y: -3.5 }],
      translate: { y: -7.5 },
      color: skin,
      stroke: 3.5,
    });

    // ── 팔 왼쪽 ────────────────────────────────────────────────────────────
    const uArmL = new Zdog.Shape({
      addTo: chest,
      path: [{ y: 0 }, { y: 7 }],
      translate: { x: -7, y: -4 },
      rotate: { z: armSwing - 0.08 },
      color: cloth,
      stroke: 3.8,
    });
    const fArmL = new Zdog.Shape({
      addTo: uArmL,
      path: [{ y: 0 }, { y: 7 }],
      translate: { y: 7 },
      rotate: { z: 0.12 },
      color: skin,
      stroke: 3.2,
    });
    // 왼손
    new Zdog.Shape({
      addTo: fArmL,
      path: [{ x: -1.5 }, { x: 1.5 }],
      translate: { y: 7.5 },
      color: skin, stroke: 2.8,
    });

    // ── 팔 오른쪽 ──────────────────────────────────────────────────────────
    const uArmR = new Zdog.Shape({
      addTo: chest,
      path: [{ y: 0 }, { y: 7 }],
      translate: { x: 7, y: -4 },
      rotate: { z: -armSwing + 0.08 },
      color: cloth,
      stroke: 3.8,
    });
    const fArmR = new Zdog.Shape({
      addTo: uArmR,
      path: [{ y: 0 }, { y: 7 }],
      translate: { y: 7 },
      rotate: { z: -0.12 },
      color: skin,
      stroke: 3.2,
    });
    // 오른손
    new Zdog.Shape({
      addTo: fArmR,
      path: [{ x: -1.5 }, { x: 1.5 }],
      translate: { y: 7.5 },
      color: skin, stroke: 2.8,
    });

    // ── 머리 ───────────────────────────────────────────────────────────────
    const head = new Zdog.Shape({
      addTo: chest,
      stroke: 13,
      translate: { y: -13 + headBob },
      color: skin,
    });

    // 눈썹 왼쪽
    new Zdog.Shape({
      addTo: head,
      path: [{ x: -3.8 }, { x: -1.5 }],
      translate: { y: -2, z: 6.2 },
      color: hair, stroke: 1,
    });
    // 눈썹 오른쪽
    new Zdog.Shape({
      addTo: head,
      path: [{ x: 1.5 }, { x: 3.8 }],
      translate: { y: -2, z: 6.2 },
      color: hair, stroke: 1,
    });

    // 눈 왼쪽 — 원형 점
    new Zdog.Shape({
      addTo: head,
      stroke: 3.2,
      translate: { x: -3, y: 0.2, z: 6.5 },
      color: "#1e293b",
    });
    // 눈 하이라이트 왼쪽
    new Zdog.Shape({
      addTo: head,
      stroke: 1,
      translate: { x: -2.2, y: -0.6, z: 6.8 },
      color: "#ffffff",
    });
    // 눈 오른쪽
    new Zdog.Shape({
      addTo: head,
      stroke: 3.2,
      translate: { x: 3, y: 0.2, z: 6.5 },
      color: "#1e293b",
    });
    // 눈 하이라이트 오른쪽
    new Zdog.Shape({
      addTo: head,
      stroke: 1,
      translate: { x: 3.8, y: -0.6, z: 6.8 },
      color: "#ffffff",
    });

    // 볼 (분홍)
    new Zdog.Shape({
      addTo: head,
      stroke: 4.5,
      translate: { x: -4.5, y: 2, z: 5.2 },
      color: "rgba(255,150,150,0.35)",
    });
    new Zdog.Shape({
      addTo: head,
      stroke: 4.5,
      translate: { x: 4.5, y: 2, z: 5.2 },
      color: "rgba(255,150,150,0.35)",
    });

    // 입 (립싱크)
    if (isSpeaking) {
      new Zdog.Ellipse({
        addTo: head,
        width: 4.5, height: 2.8,
        translate: { y: 3.8, z: 6.5 },
        color: "#7f1d1d",
        fill: true, stroke: 0.8,
      });
    } else {
      // 미소 곡선
      new Zdog.Shape({
        addTo: head,
        path: [
          { x: -2.5 },
          { arc: [{ x: -2.5, y: 1.5 }, { x: 0, y: 2 }] },
          { arc: [{ x:  2.5, y: 1.5 }, { x: 2.5, y: 0 }] },
        ],
        translate: { y: 3, z: 6.5 },
        closed: false,
        color: "#c27b84", stroke: 1,
      });
    }

    illo.updateRenderGraph();
  }, [frame, isSpeaking, topicId]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={Math.round(size * 1.1)}
      style={{ display: "block" }}
    />
  );
};
