"use client";

import { useRef, useEffect } from "react";
import type { VideoSection } from "@/types/landing";
import LdCinematicVideoBg from "./LdCinematicVideoBg";
import LdCinematicGlassButton from "./LdCinematicGlassButton";

interface Props {
  section: VideoSection;
  index: number;
  isHero?: boolean;
  isFinal?: boolean;
}

export default function LdCinematicSection({ section, index, isHero, isFinal }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !contentRef.current || !sectionRef.current) return;

    let gsap: typeof import("gsap").gsap | null = null;

    const init = async () => {
      const mod = await import("gsap");
      gsap = mod.gsap;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const revealEls = contentRef.current?.querySelectorAll(".ld-cine-reveal");
      if (!revealEls?.length) return;

      gsap.fromTo(
        Array.from(revealEls),
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none none",
          },
        }
      );

      // 비디오 parallax
      const videoBg = sectionRef.current?.querySelector(".ld-cine-video-bg");
      if (videoBg) {
        gsap.fromTo(
          videoBg,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      }
    };

    init();
  }, []);

  const contentCls = [
    "ld-cine-content",
    isHero || isFinal ? "ld-cine-content--center" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      ref={sectionRef}
      id={section.id}
      className="ld-cine-section"
      aria-label={section.heading.replace(/\n/g, " ")}
    >
      <LdCinematicVideoBg playbackId={section.playbackId} />

      <div ref={contentRef} className={contentCls}>
        <div style={{ maxWidth: "860px" }}>
          {section.eyebrow && (
            <span className="ld-cine-eyebrow ld-cine-reveal">{section.eyebrow}</span>
          )}

          <h2 className="ld-cine-heading ld-cine-reveal" style={{ whiteSpace: "pre-line" }}>
            {section.heading}
          </h2>

          {section.subheading && (
            <p className="ld-cine-subheading ld-cine-reveal">{section.subheading}</p>
          )}

          <div className="ld-cine-btn-row ld-cine-reveal">
            <LdCinematicGlassButton
              label={section.primaryCta.label}
              href={section.primaryCta.href}
              kind={section.primaryCta.kind}
              size={isHero || isFinal ? "lg" : "md"}
            />
            {section.secondaryCta && (
              <LdCinematicGlassButton
                label={section.secondaryCta.label}
                href={section.secondaryCta.href}
                kind={section.secondaryCta.kind}
                variant="ghost"
                showIcon={false}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
