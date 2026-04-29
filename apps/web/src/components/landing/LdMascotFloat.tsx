"use client";

// ============================================================
// LdMascotFloat — 랜딩페이지 마스코트 (우주인 캐릭터)
// 섹션 경계에 배치: 높이 0 divider + absolute 포지셔닝
// 배치 A: ProblemEmpathy → V3Pipeline (side="right")
// 배치 B: Pricing → FAQ (side="left")
// prefers-reduced-motion 감지 시 float 애니메이션 즉시 정지
// ============================================================

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface LdMascotFloatProps {
  side: "left" | "right";
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: 72,
  md: 120,
  lg: 160,
} as const;

export default function LdMascotFloat({ side, size = "md" }: LdMascotFloatProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // h-0 래퍼는 면적이 없어 threshold > 0 이면 절대 트리거 안 됨.
    // threshold: 0 + rootMargin으로 경계선 진입 즉시 감지.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const px = SIZE_MAP[size];

  const positionClass =
    side === "right"
      ? "right-4 md:right-8 lg:right-16"
      : "left-4 md:left-8 lg:left-16";

  // side 클래스는 CSS 선택자에서 방향 감지용으로 사용
  const sideClass = side === "right" ? "ld-mascot-side-right" : "ld-mascot-side-left";
  const stateClass = visible ? "ld-mascot-visible" : "";

  return (
    <div ref={ref} className="relative h-0 w-full" aria-hidden="true">
      <div
        className={`ld-mascot-wrap absolute z-10 ${positionClass} ${sideClass} ${stateClass}`}
        style={{ top: -px * 0.55, width: px, height: px }}
      >
        <Image
          src="/img/mascot-astronaut.png"
          alt=""
          width={px}
          height={px}
          className="ld-mascot-img select-none pointer-events-none"
          loading="lazy"
          draggable={false}
        />
      </div>
    </div>
  );
}
