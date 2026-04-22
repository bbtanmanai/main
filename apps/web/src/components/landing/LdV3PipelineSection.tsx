"use client";

// ============================================================
// LdV3PipelineSection — 랜딩 섹션 3: 3단계 파이프라인
// pipeline-steps.json의 3단계를 순차 fade-in
// 화살표는 SVG draw 1.2s 애니메이션
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Sparkles, PenTool, Rocket } from "lucide-react";
import stepsData from "@/data/pipeline-steps.json";

// icon 문자열을 실제 컴포넌트로 변환하는 맵
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Sparkles,
  PenTool,
  Rocket,
};

export default function LdV3PipelineSection() {
  // 각 스텝의 표시 여부 — 순차적으로 true로 바뀜
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>(
    new Array(stepsData.length).fill(false)
  );
  const [arrowVisible, setArrowVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // 각 스텝 순차 표시 (200ms 간격)
          stepsData.forEach((_, i) => {
            setTimeout(() => {
              setVisibleSteps((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, i * 250);
          });
          // 마지막 스텝 후 화살표 표시
          setTimeout(() => setArrowVisible(true), stepsData.length * 250);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        padding: "80px 24px",
        background: "rgba(10,21,64,0.3)", // 약한 표면색으로 구분
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
          3단계로 바로 시작합니다
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "17px",
            marginBottom: "56px",
          }}
        >
          복잡한 과정 없이 오늘 바로 시작할 수 있습니다
        </p>

        {/* 파이프라인 스텝 그리드 — 데스크톱: 3컬럼 / 모바일: 1컬럼 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0",
            alignItems: "start",
          }}
        >
          {stepsData.map((step, idx) => {
            const IconComponent = ICON_MAP[step.icon] || Sparkles;
            const isLast = idx === stepsData.length - 1;

            return (
              <div
                key={step.step}
                style={{
                  display: "flex",
                  alignItems: "start",
                }}
              >
                {/* 스텝 카드 */}
                <div
                  className="ld-glass"
                  style={{
                    flex: 1,
                    borderRadius: "20px",
                    padding: "32px 24px",
                    textAlign: "center",
                    opacity: visibleSteps[idx] ? 1 : 0,
                    transform: visibleSteps[idx]
                      ? "translateY(0)"
                      : "translateY(24px)",
                    transition: "opacity 500ms ease, transform 500ms ease",
                  }}
                >
                  {/* 스텝 번호 배지 */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "var(--accent-neon)",
                      color: "#010828",
                      fontWeight: 800,
                      fontSize: "14px",
                      marginBottom: "16px",
                    }}
                  >
                    {step.step}
                  </div>

                  {/* 아이콘 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <IconComponent
                      size={32}
                      style={{ color: "var(--accent-neon)" }}
                    />
                  </div>

                  {/* 제목 */}
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "19px",
                      color: "var(--text-primary)",
                      marginBottom: "10px",
                    }}
                  >
                    {step.title}
                  </h3>

                  {/* 설명 */}
                  <p
                    style={{
                      fontSize: "15px",
                      lineHeight: 1.6,
                      color: "var(--text-secondary)",
                      margin: 0,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>

                {/* 스텝 사이 화살표 — 마지막 스텝 제외 */}
                {!isLast && (
                  <div
                    style={{
                      // 모바일에서는 숨김 (좁으면 그리드가 1컬럼이 됨)
                      display: "flex",
                      alignItems: "center",
                      padding: "0 8px",
                      paddingTop: "60px",
                      opacity: arrowVisible ? 1 : 0,
                      transition: "opacity 600ms ease",
                    }}
                  >
                    {/* SVG 화살표 */}
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke="var(--accent-neon)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          strokeDasharray: "40",
                          strokeDashoffset: arrowVisible ? "0" : "40",
                          transition: "stroke-dashoffset 1.2s ease",
                        }}
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
