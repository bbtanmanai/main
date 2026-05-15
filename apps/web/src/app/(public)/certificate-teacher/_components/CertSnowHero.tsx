"use client";

import { useEffect } from "react";

export default function CertSnowHero() {
  useEffect(() => {
    /* 눈 결정체 스크립트 */
    const prevSnow = document.getElementById("snowflakes-script");
    if (prevSnow) prevSnow.remove();
    const snow = document.createElement("script");
    snow.id = "snowflakes-script";
    snow.src = "/js/snowflakes.js";
    document.body.appendChild(snow);

    /* 성에 유리창 스크립트 */
    const prevFrost = document.getElementById("frostglass-script");
    if (prevFrost) prevFrost.remove();
    const frost = document.createElement("script");
    frost.id = "frostglass-script";
    frost.src = "/js/frostglass.js";
    document.body.appendChild(frost);

    return () => {
      document.getElementById("snowflakes-script")?.remove();
      document.getElementById("frostglass-script")?.remove();
    };
  }, []);

  return (
    <section className="ct-snow-hero">
      <img
        src="https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/teacher/cover02.jpeg"
        alt=""
        aria-hidden="true"
        className="ct-snow-bg"
      />

      {/* 어두운 오버레이 */}
      <div className="ct-snow-overlay" aria-hidden="true" />

      {/* 창 바깥 — 눈 내리는 캔버스 */}
      <canvas id="bg-canvas" className="ct-snow-canvas" aria-hidden="true" />

      {/* 유리면 — 성에 결정 캔버스 */}
      <canvas id="frost-canvas" className="ct-frost-canvas" aria-hidden="true" />

      {/* 하단 서리 그라디언트 */}
      <div className="ct-snow-frost" aria-hidden="true" />

      <div className="ct-snow-content">
        <div className="ct-badge ld-glass">
          <span className="ct-badge-dot" />
          강사 신청 프로그램
        </div>

        <h1 className="ct-hero-title">
          성장의 기록이
          <br />
          <span className="ct-hero-title-accent">강사 신청</span>으로 시작됩니다
        </h1>

        <p className="ct-hero-desc">
          LinkDrop에서 쌓은 경험과 결과물로<br />
          공식 파트너 강사 자격을 취득하세요.
        </p>

        <div className="ct-cta-row">
          <a href="mailto:hello@linkdrop.kr" className="ct-cta-btn">
            강사 신청 문의하기
          </a>
          <a href="#process" className="ct-scroll-btn ld-glass">
            신청 요건 보기 ↓
          </a>
        </div>
      </div>
    </section>
  );
}
