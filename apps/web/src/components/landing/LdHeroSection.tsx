"use client";

// ============================================================
// LdHeroSection — 랜딩 페이지 섹션 1: 히어로
// eyebrow (neon green) / heading (Pretendard 800) / subheading / CTA
// fade-up 600ms 진입 애니메이션
// 한글에 Anton 절대 사용 금지 — Pretendard 800 사용
// ============================================================

import { useEffect, useState } from "react";
import externalLinks from "@/data/external-links.json";

// 랜딩 데이터의 hero 필드 형태
interface HeroData {
  eyebrow: string;     // 상단 소형 레이블 (예: "웹소설 수익화")
  heading: string;     // 메인 헤딩 (\n 포함 줄바꿈)
  subheading: string;  // 부제목
  cta: string;         // 버튼 텍스트
}

interface LdHeroSectionProps {
  data: HeroData;
}

export default function LdHeroSection({ data }: LdHeroSectionProps) {
  // 마운트 후 fade-up 트리거
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 브라우저 렌더 후 50ms 딜레이로 애니메이션 시작
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // \n 문자를 <br>로 변환하는 헬퍼
  function formatHeading(text: string) {
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));
  }

  return (
    <section
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px 60px",
        fontFamily: "Pretendard Variable, Pretendard, sans-serif",
        // prefers-reduced-motion: CSS 미디어쿼리로 처리 (globals.css)
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          textAlign: "center",
          // fade-up 애니메이션
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(32px)",
          transition: "opacity 600ms ease, transform 600ms ease",
        }}
      >
        {/* eyebrow — neon green 소형 레이블 */}
        <div
          style={{
            display: "inline-block",
            color: "var(--accent-neon)",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "20px",
            padding: "6px 14px",
            border: "1px solid var(--accent-neon)",
            borderRadius: "100px",
          }}
        >
          {data.eyebrow}
        </div>

        {/* 메인 헤딩 — Pretendard 800, 한글이므로 Anton 금지 */}
        <h1
          style={{
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
            fontWeight: 800,
            // 데스크톱 56px / 모바일는 CSS 미디어쿼리로 조정
            fontSize: "clamp(36px, 6vw, 60px)",
            lineHeight: 1.2,
            color: "var(--text-primary)",
            margin: "0 0 24px",
            letterSpacing: "-0.02em",
          }}
        >
          {formatHeading(data.heading)}
        </h1>

        {/* 부제목 — 최소 18px 시니어 가독성 */}
        <p
          style={{
            fontSize: "20px",
            lineHeight: 1.7,
            color: "var(--text-secondary)",
            margin: "0 0 40px",
            fontWeight: 400,
          }}
        >
          {data.subheading}
        </p>

        {/* CTA 버튼 — 카카오채널 링크 */}
        <a
          href={externalLinks.kakao}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#6fff00",
            color: "#010828",
            borderRadius: "14px",
            padding: "20px 40px",
            fontWeight: 800,
            fontSize: "18px",
            textDecoration: "none",
            // 시니어 터치 타깃 최소 48px
            minHeight: "60px",
            transition: "opacity 200ms ease, transform 200ms ease",
            boxShadow: "0 0 32px rgba(111,255,0,0.25)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85";
            (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
            (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
          }}
        >
          {data.cta}
        </a>

        {/* 보조 안내 — 카카오톡 이름 명시 */}
        <p
          style={{
            marginTop: "16px",
            fontSize: "14px",
            color: "var(--text-secondary)",
          }}
        >
          카카오채널에서 무료 상담을 시작하세요
        </p>
      </div>
    </section>
  );
}
