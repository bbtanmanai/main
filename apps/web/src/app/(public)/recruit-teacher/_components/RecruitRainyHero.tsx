"use client";

import { useEffect } from "react";

export default function RecruitRainyHero() {
  useEffect(() => {
    const prev = document.getElementById("raindrops-script");
    if (prev) prev.remove();

    const script = document.createElement("script");
    script.id = "raindrops-script";
    script.src = "/js/raindrops.js";
    document.body.appendChild(script);

    return () => {
      const s = document.getElementById("raindrops-script");
      if (s) s.remove();
    };
  }, []);

  return (
    <section className="aprj-rain-hero">
      <img
        src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80"
        alt=""
        aria-hidden="true"
        className="aprj-rain-bg"
        crossOrigin="anonymous"
      />

      <canvas id="bg-canvas" className="aprj-rain-canvas" aria-hidden="true" />

      <div className="aprj-rain-overlay" aria-hidden="true" />

      <div className="aprj-rain-content">
        <div className="aprj-badge ld-glass">
          <span className="aprj-badge-dot" />
          강사 성장 프로그램
        </div>

        <h1 className="aprj-hero-title">
          오늘의 수강생이
          <br />
          <span className="aprj-hero-title-accent">내일의 강사</span>가 됩니다
        </h1>

        <p className="aprj-hero-desc">
          처음부터 잘할 필요 없습니다.
          <br />
          LinkDrop과 함께 성장하고, 자연스럽게 강사로 전환됩니다.
        </p>

        <div className="aprj-rain-cta-row">
          <a
            href="mailto:hello@linkdrop.kr"
            className="aprj-cta-btn"
          >
            강사 성장 프로그램 신청하기
          </a>
          <a href="#what" className="aprj-rain-scroll ld-glass">
            강사 혜택 보기 ↓
          </a>
        </div>
      </div>
    </section>
  );
}
