"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

const NAV_ITEMS = [
  { label: "강의 주제", href: "#pain-topic" },
  { label: "제작 과정", href: "#pain-production" },
  { label: "성공 후기", href: "#proof" },
] as const;

function BookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

const NAV_ICONS = [BookIcon, FilmIcon, StarIcon];

export default function LdCinematicHeader() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const navElRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const updatePill = useCallback((idx: number, animate = true) => {
    const btn = btnRefs.current[idx];
    const pill = pillRef.current;
    if (!btn || !pill) return;
    pill.style.transition = animate
      ? "transform 0.5s cubic-bezier(0.34,1.2,0.64,1), width 0.5s cubic-bezier(0.34,1.2,0.64,1)"
      : "none";
    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.transform = `translateX(${btn.offsetLeft}px)`;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      updatePill(activeIdx, false);
      void pillRef.current?.offsetWidth;
    }, 60);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onResize = () => updatePill(activeIdx, false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIdx, updatePill]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = NAV_ITEMS.findIndex((item) => item.href === `#${entry.target.id}`);
          if (idx >= 0) {
            setActiveIdx(idx);
            updatePill(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    NAV_ITEMS.forEach((item) => {
      const el = document.querySelector(item.href);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [updatePill]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!navElRef.current || !glareRef.current) return;
    const rect = navElRef.current.getBoundingClientRect();
    glareRef.current.style.setProperty("--x", `${e.clientX - rect.left}px`);
    glareRef.current.style.setProperty("--y", `${e.clientY - rect.top}px`);
  }, []);

  const handleNavClick = (idx: number, href: string) => {
    setActiveIdx(idx);
    updatePill(idx);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className={`ld-cine-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="ld-cine-header-inner">

        <a href="/" aria-label="LinkDrop 홈으로" className="ld-cine-logo-link">
          <Image
            src="/img/logo.png"
            alt="LinkDrop"
            width={128}
            height={40}
            style={{ objectFit: "contain", objectPosition: "left center" }}
            priority
          />
        </a>

        <nav
          ref={navElRef}
          className="ld-gnav"
          onMouseMove={onMouseMove}
          aria-label="페이지 내비게이션"
        >
          <div className="ld-gnav-glare-wrap" aria-hidden="true">
            <div className="ld-gnav-glare" ref={glareRef} />
          </div>
          <div className="ld-gnav-reflection" aria-hidden="true" />

          <div className="ld-gnav-items">
            <div className="ld-gnav-pill" ref={pillRef} aria-hidden="true" />
            {NAV_ITEMS.map((item, idx) => {
              const Icon = NAV_ICONS[idx];
              return (
                <button
                  key={item.href}
                  ref={(el) => { btnRefs.current[idx] = el; }}
                  className={`ld-gnav-btn${activeIdx === idx ? " is-active" : ""}`}
                  onClick={() => handleNavClick(idx, item.href)}
                >
                  <span className="ld-gnav-btn-inner">
                    <Icon />
                    <span className="ld-gnav-btn-label">{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <a href="#final" className="ld-cine-btn ld-cine-btn--header-cta">
          <span>무료 상담</span>
        </a>

      </div>
    </header>
  );
}
