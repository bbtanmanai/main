"use client";

// ============================================================
// LdProofSection — 랜딩 섹션 6: 사용자 후기
// testimonials.json에서 slug 매칭 후기 우선 표시
// 없으면 다른 후기로 채워 카드 3개 표시
// scroll reveal (Intersection Observer)
// ============================================================

import { useEffect, useRef, useState } from "react";
import allTestimonials from "@/data/testimonials.json";

interface LdProofSectionProps {
  slug: string; // 현재 랜딩 페이지 슬러그 (topic 매칭용)
}

export default function LdProofSection({ slug }: LdProofSectionProps) {
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
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // slug와 매칭되는 후기를 먼저, 나머지는 다른 것으로 채워 최대 3개
  const matched = allTestimonials.filter((t) => t.topic === slug);
  const others = allTestimonials.filter((t) => t.topic !== slug);
  const displayCards = [...matched, ...others].slice(0, 3);

  return (
    <section
      ref={sectionRef}
      style={{
        padding: "80px 24px",
        fontFamily: "Pretendard Variable, Pretendard, sans-serif",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        {/* 섹션 제목 */}
        <h2
          style={{
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 40px)",
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          실제 파트너 후기
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "17px",
            marginBottom: "48px",
          }}
        >
          비슷한 고민을 가졌던 분들의 실제 이야기입니다
        </p>

        {/* 후기 카드 그리드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {displayCards.map((t, idx) => (
            <div
              key={`${t.name}-${idx}`}
              className="ld-glass card-hover"
              style={{
                borderRadius: "20px",
                padding: "28px 24px",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                // stagger 100ms
                transition: `opacity 500ms ease ${idx * 100}ms, transform 500ms ease ${idx * 100}ms`,
              }}
            >
              {/* 수익 하이라이트 배지 */}
              <div
                style={{
                  display: "inline-block",
                  background: "var(--accent-neon-dim)",
                  color: "var(--accent-neon)",
                  fontSize: "13px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "100px",
                  marginBottom: "16px",
                }}
              >
                {t.income}
              </div>

              {/* 후기 본문 — 최소 17px 가독성 */}
              <p
                style={{
                  fontSize: "17px",
                  lineHeight: 1.7,
                  color: "var(--text-primary)",
                  margin: "0 0 20px",
                  fontStyle: "italic",
                }}
              >
                &ldquo;{t.content}&rdquo;
              </p>

              {/* 작성자 정보 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {/* 아바타 — 이니셜 */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(111,255,0,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "var(--accent-neon)",
                    flexShrink: 0,
                  }}
                >
                  {t.name[0]}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {t.name} ({t.age}세)
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {t.region} · {t.months}개월만에 수익 달성
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
