"use client";

import "@/styles/cinematic.css";
import { useLenisScroll } from "@/hooks/useLenisScroll";
import type { VideoSection } from "@/types/landing";
import LdCinematicSection from "./LdCinematicSection";

interface Props {
  sections: VideoSection[];
}

export default function LdCinematicLanding({ sections }: Props) {
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
