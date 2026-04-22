"use client";

// ============================================================
// LdGrowthPathSection — 랜딩 섹션 4: 성장 경로 스테퍼
// growth-path.json 4단계
// 데스크톱: 수평 스테퍼 / 모바일: 수직 스테퍼
// ============================================================

import { useEffect, useRef, useState } from "react";
import growthData from "@/data/growth-path.json";

export default function LdGrowthPathSection() {
  // 스크롤 진입 여부
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
          파트너 성장 로드맵
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "17px",
            marginBottom: "56px",
          }}
        >
          단계별로 성장하며 수익도 함께 커집니다
        </p>

        {/* 스테퍼 컨테이너 — 데스크톱: 수평, 모바일: 수직 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
            position: "relative",
          }}
        >
          {growthData.map((item, idx) => (
            <div
              key={item.step}
              style={{
                // 순차 fade-up (각 150ms 딜레이)
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: `opacity 500ms ease ${idx * 150}ms, transform 500ms ease ${idx * 150}ms`,
              }}
            >
              {/* 스텝 카드 */}
              <div
                className="ld-glass card-hover"
                style={{
                  borderRadius: "20px",
                  padding: "28px 20px",
                  borderTop: `3px solid ${item.color}`,
                  height: "100%",
                }}
              >
                {/* 스텝 번호 + 색상 점 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: item.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "16px",
                    }}
                  >
                    {item.step}
                  </div>
                  {/* 기간 배지 */}
                  <span
                    style={{
                      fontSize: "12px",
                      color: item.color,
                      fontWeight: 600,
                      background: `${item.color}20`,
                      padding: "3px 8px",
                      borderRadius: "100px",
                    }}
                  >
                    {item.duration}
                  </span>
                </div>

                {/* 단계 라벨 */}
                <h3
                  style={{
                    fontWeight: 800,
                    fontSize: "22px",
                    color: "var(--text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  {item.label}
                </h3>

                {/* 단계 설명 */}
                <p
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.6,
                    color: "var(--text-secondary)",
                    margin: 0,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
