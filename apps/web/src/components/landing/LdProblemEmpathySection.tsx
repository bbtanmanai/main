"use client";

// ============================================================
// LdProblemEmpathySection — 랜딩 섹션 2: 공감 포인트
// 제목: "이런 고민, 해보신 적 있으신가요?"
// pain 배열 3개를 카드로 표시 (체크 아이콘 + 텍스트)
// Intersection Observer로 스크롤 진입 시 stagger 80ms 애니메이션
// ============================================================

import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";

interface LdProblemEmpathySectionProps {
  pains: string[]; // 고민 텍스트 배열 (최대 3개)
}

export default function LdProblemEmpathySection({ pains }: LdProblemEmpathySectionProps) {
  // 각 카드의 표시 여부 — 순차적으로 true로 바뀜
  const [visibleCards, setVisibleCards] = useState<boolean[]>(
    new Array(pains.length).fill(false)
  );
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // 각 카드를 80ms 간격으로 순차 표시 (stagger)
          pains.forEach((_, i) => {
            setTimeout(() => {
              setVisibleCards((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, i * 80);
          });
          observer.disconnect(); // 한 번만 실행
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [pains]);

  return (
    <section
      ref={sectionRef}
      style={{
        padding: "80px 24px",
        fontFamily: "Pretendard Variable, Pretendard, sans-serif",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* 섹션 제목 */}
        <h2
          style={{
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 40px)",
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: "48px",
            lineHeight: 1.3,
          }}
        >
          이런 고민, 해보신 적 있으신가요?
        </h2>

        {/* 고민 카드 그리드 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {pains.map((pain, idx) => (
            <div
              key={idx}
              className="ld-glass"
              style={{
                borderRadius: "16px",
                padding: "24px 28px",
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                // stagger fade-up 애니메이션
                opacity: visibleCards[idx] ? 1 : 0,
                transform: visibleCards[idx]
                  ? "translateY(0)"
                  : "translateY(20px)",
                transition: "opacity 500ms ease, transform 500ms ease",
              }}
            >
              {/* 말풍선 아이콘 */}
              <div
                style={{
                  flexShrink: 0,
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "var(--accent-neon-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircle
                  size={22}
                  style={{ color: "var(--accent-neon)" }}
                />
              </div>

              {/* 고민 텍스트 — 최소 18px 시니어 가독성 */}
              <p
                style={{
                  margin: 0,
                  fontSize: "18px",
                  lineHeight: 1.6,
                  color: "var(--text-primary)",
                  fontWeight: 500,
                }}
              >
                &ldquo;{pain}&rdquo;
              </p>
            </div>
          ))}
        </div>

        {/* 공감 후 전환 메시지 */}
        <p
          style={{
            textAlign: "center",
            marginTop: "40px",
            fontSize: "18px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          링크드롭은 그 고민을 함께 해결합니다.
        </p>
      </div>
    </section>
  );
}
