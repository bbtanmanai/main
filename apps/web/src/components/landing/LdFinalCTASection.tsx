"use client";

// ============================================================
// LdFinalCTASection — 랜딩 마지막 섹션: 최종 CTA
// 풀블리드 deep navy (#010828) 배경
// 대형 헤딩 + 카카오채널 CTA 버튼 (primary blue)
// 실패 시 fallback: 전화번호 텍스트 링크
// ============================================================

import externalLinks from "@/data/external-links.json";

export default function LdFinalCTASection() {
  return (
    <section
      style={{
        // 풀블리드 deep navy 배경
        background: "#010828",
        padding: "100px 24px",
        textAlign: "center",
        fontFamily: "Pretendard Variable, Pretendard, sans-serif",
        // 상단 구분 효과
        borderTop: "1px solid rgba(111,255,0,0.1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 배경 글로우 효과 */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(111,255,0,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* 서브 레이블 */}
        <div
          style={{
            display: "inline-block",
            color: "var(--accent-neon)",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "24px",
          }}
        >
          지금 시작하세요
        </div>

        {/* 대형 헤딩 — Pretendard 800 (한글이므로 Anton 금지) */}
        <h2
          style={{
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(36px, 6vw, 60px)",
            color: "#eff4ff",
            lineHeight: 1.2,
            marginBottom: "24px",
            letterSpacing: "-0.02em",
          }}
        >
          오늘이 가장 좋은
          <br />
          시작 날짜입니다
        </h2>

        {/* 부제목 */}
        <p
          style={{
            fontSize: "20px",
            lineHeight: 1.7,
            color: "rgba(239,244,255,0.7)",
            marginBottom: "48px",
          }}
        >
          카카오채널에서 무료 상담을 받고
          <br />
          나에게 맞는 방법을 찾아드립니다.
        </p>

        {/* 주요 CTA 버튼 — 카카오채널 */}
        <a
          href={externalLinks.kakao}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            // primary blue (카카오 계열 강조)
            background: "#3B82F6",
            color: "#ffffff",
            borderRadius: "16px",
            padding: "22px 48px",
            fontWeight: 800,
            fontSize: "20px",
            textDecoration: "none",
            minHeight: "64px",
            boxShadow: "0 0 48px rgba(59,130,246,0.3)",
            transition: "opacity 200ms ease, transform 200ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9";
            (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
            (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
          }}
        >
          카카오채널에서 무료 상담받기
        </a>

        {/* 폴백: 전화번호 텍스트 링크 */}
        <p style={{ marginTop: "20px" }}>
          <span
            style={{
              fontSize: "15px",
              color: "rgba(239,244,255,0.4)",
              marginRight: "8px",
            }}
          >
            카카오가 불편하시면
          </span>
          <a
            href={externalLinks.phone}
            style={{
              fontSize: "15px",
              color: "rgba(239,244,255,0.7)",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            {externalLinks.fallbackPhone}
          </a>
          <span
            style={{
              fontSize: "15px",
              color: "rgba(239,244,255,0.4)",
              marginLeft: "4px",
            }}
          >
            으로 전화하세요
          </span>
        </p>
      </div>
    </section>
  );
}
