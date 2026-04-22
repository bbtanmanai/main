"use client";

// ============================================================
// LdPricingSection — 랜딩 섹션 7: 가격 정보
// pricing.json 기반
// 정가(취소선) → 런칭 특가 카운트업 800ms 진입 시 표시
// 혜택 목록 + 보장 문구 + CTA 버튼
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Check, Shield } from "lucide-react";
import pricingData from "@/data/pricing.json";
import externalLinks from "@/data/external-links.json";

// 숫자 카운트업 훅 — 진입 시 0 → 목표값까지 800ms
function useCountUp(target: number, triggered: boolean, duration = 800) {
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!triggered || startedRef.current) return;
    startedRef.current = true;

    const startTime = performance.now();
    let frameId: number;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out 커브
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    }

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [triggered, target, duration]);

  return display;
}

export default function LdPricingSection() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // 런칭가 카운트업
  const displayPrice = useCountUp(pricingData.launchPrice, visible);

  return (
    <section
      ref={sectionRef}
      style={{
        padding: "80px 24px",
        background: "rgba(10,21,64,0.3)",
        fontFamily: "Pretendard Variable, Pretendard, sans-serif",
      }}
    >
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        {/* 섹션 제목 */}
        <h2
          style={{
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 40px)",
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: "48px",
          }}
        >
          지금 시작하세요
        </h2>

        {/* 가격 카드 */}
        <div
          className="ld-glass"
          style={{
            borderRadius: "24px",
            padding: "40px 36px",
            border: "1px solid rgba(111,255,0,0.2)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 600ms ease, transform 600ms ease",
          }}
        >
          {/* 런칭 특가 배지 */}
          <div
            style={{
              display: "inline-block",
              background: "var(--accent-neon)",
              color: "#010828",
              fontSize: "13px",
              fontWeight: 800,
              padding: "5px 12px",
              borderRadius: "100px",
              marginBottom: "20px",
              letterSpacing: "0.05em",
            }}
          >
            {pricingData.launchLabel}
          </div>

          {/* 가격 표시 영역 */}
          <div style={{ marginBottom: "8px" }}>
            {/* 정가 — 취소선 */}
            <span
              style={{
                fontSize: "20px",
                color: "var(--text-secondary)",
                textDecoration: "line-through",
                marginRight: "12px",
              }}
            >
              {pricingData.regularPrice.toLocaleString("ko-KR")}원
            </span>
            <span
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              {pricingData.savings.toLocaleString("ko-KR")}원 절약
            </span>
          </div>

          {/* 런칭가 — 카운트업 */}
          <div
            style={{
              fontWeight: 800,
              fontSize: "clamp(48px, 8vw, 64px)",
              color: "var(--accent-neon)",
              lineHeight: 1,
              marginBottom: "8px",
            }}
          >
            {displayPrice.toLocaleString("ko-KR")}
            <span style={{ fontSize: "24px", marginLeft: "4px" }}>원</span>
          </div>

          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              marginBottom: "32px",
            }}
          >
            {pricingData.validUntil.split("-")[0]}년 {pricingData.validUntil.split("-")[1]}월까지 한정 가격
          </p>

          {/* 혜택 목록 */}
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px" }}>
            {pricingData.benefits.map((benefit, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "14px",
                  fontSize: "16px",
                  color: "var(--text-primary)",
                  lineHeight: 1.5,
                }}
              >
                <Check
                  size={18}
                  style={{
                    color: "var(--accent-neon)",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                />
                {benefit}
              </li>
            ))}
          </ul>

          {/* 환불 보장 문구 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 16px",
              borderRadius: "10px",
              background: "rgba(111,255,0,0.05)",
              border: "1px solid rgba(111,255,0,0.15)",
              marginBottom: "28px",
            }}
          >
            <Shield size={18} style={{ color: "var(--accent-neon)", flexShrink: 0 }} />
            <span
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              {pricingData.guarantee}
            </span>
          </div>

          {/* CTA 버튼 */}
          <a
            href={externalLinks.kakao}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#6fff00",
              color: "#010828",
              borderRadius: "14px",
              padding: "20px 32px",
              fontWeight: 800,
              fontSize: "18px",
              textDecoration: "none",
              minHeight: "60px",
              transition: "opacity 200ms ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")
            }
          >
            카카오채널에서 상담 시작
          </a>
        </div>
      </div>
    </section>
  );
}
