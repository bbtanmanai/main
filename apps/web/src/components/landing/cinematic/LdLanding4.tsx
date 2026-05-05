"use client";

import "@/styles/cinematic.css";
import { useLenisScroll } from "@/hooks/useLenisScroll";
import type { VideoSection } from "@/types/landing";
import LdCinematicSection from "./LdCinematicSection";

interface Props {
  sections: VideoSection[];
}

// LdLanding4 — landing4 전용 (구 LdCinematicLanding)
// 시네마틱 풀스크린 영상 랜딩 레이아웃
export default function LdLanding4({ sections }: Props) {
  useLenisScroll();

  return (
    <main>
      {sections.map((section, i) => (
        <LdCinematicSection
          key={section.id}
          section={section}
          index={i}
          isHero={i === 0}
          isFinal={i === sections.length - 1}
        />
      ))}
    </main>
  );
}
