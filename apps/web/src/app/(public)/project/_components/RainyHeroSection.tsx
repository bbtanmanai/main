"use client";

import { useEffect } from "react";
import Script from "next/script";
import externalLinks from "@/data/external-links.json";

export default function RainyHeroSection() {
  useEffect(() => {
    return () => {
      // Script는 페이지 생명주기 동안 유지 — cleanup 불필요
    };
  }, []);

  return (
    <section className="aprj-rain-hero">
      {/* 배경 이미지 — CSS 블러 처리용 */}
      <img
        src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80"
        alt=""
        aria-hidden="true"
        className="aprj-rain-bg"
        crossOrigin="anonymous"
      />

      {/* 빗방울 캔버스 — raindrops.js가 id="bg-canvas"로 찾음 */}
      <canvas
        id="bg-canvas"
        className="aprj-rain-canvas"
        aria-hidden="true"
      />

      <div className="aprj-rain-overlay" aria-hidden="true" />

      <div className="aprj-rain-content">
        <div className="aprj-badge ld-glass">
          <span className="aprj-badge-dot" />
          원데이 ON/OFF 클래스
        </div>

        <h1 className="aprj-hero-title">
          구매자들과 함께
          <br />
          <span className="aprj-hero-title-accent">만들어보는</span> 프로젝트
        </h1>

        <p className="aprj-hero-desc">
          링크드랍 구매자들이 모여 하루 안에 실제로 완성하는 소규모 클래스입니다.
          <br />
          온라인·오프라인 모두 진행되며, 혼자가 아닌 다 같이 만들어갑니다.
        </p>

        <div className="aprj-rain-cta-row">
          <a
            href={externalLinks.kakao}
            target="_blank"
            rel="noopener noreferrer"
            className="aprj-cta-btn"
          >
            클래스 참여 신청
          </a>
          <a href="#all-projects" className="aprj-rain-scroll ld-glass">
            클래스 보기 ↓
          </a>
        </div>
      </div>

      {/* raindrops.js — id="bg-canvas" 캔버스를 자동으로 찾아 비 효과 시작 */}
      <Script
        src="/js/raindrops.js"
        strategy="afterInteractive"
      />
    </section>
  );
}
