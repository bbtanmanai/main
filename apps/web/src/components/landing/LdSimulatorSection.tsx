"use client";

// ============================================================
// LdSimulatorSection — 랜딩 섹션 5: 수익 시뮬레이터
// simulator.json 기반 슬라이더 2개
// 콘텐츠 수 / 판매 가격 조절 → 예상 수익 실시간 카운트업 800ms
// ============================================================

import { useEffect, useRef, useState } from "react";
import simData from "@/data/simulator.json";

// 숫자를 한국어 금액 형식으로 포맷 (예: 63,360원)
function formatKRW(amount: number): string {
  return Math.round(amount).toLocaleString("ko-KR") + "원";
}

// 카운트업 훅 — 목표값까지 800ms 동안 증가
function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(target);
  const prevTarget = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevTarget.current;
    const diff = target - start;
    const startTime = performance.now();

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out 커브
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        prevTarget.current = target;
      }
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return display;
}

export default function LdSimulatorSection() {
  // 슬라이더 상태값
  const [contentPerMonth, setContentPerMonth] = useState(
    simData.defaults.contentPerMonth
  );
  const [pricePerContent, setPricePerContent] = useState(
    simData.defaults.pricePerContent
  );

  // 예상 월 수익 계산: 콘텐츠 수 × 가격 × (1 - 플랫폼 수수료)
  const monthlyRevenue =
    contentPerMonth * pricePerContent * (1 - simData.platformFeeRate);

  // 카운트업 애니메이션 적용
  const displayRevenue = useCountUp(monthlyRevenue);

  return (
    <section
      style={{
        padding: "80px 24px",
        background: "rgba(10,21,64,0.3)",
        fontFamily: "Pretendard Variable, Pretendard, sans-serif",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
          내 수익을 직접 계산해보세요
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "17px",
            marginBottom: "48px",
          }}
        >
          슬라이더를 움직여 예상 수익을 확인하세요
        </p>

        {/* 시뮬레이터 카드 */}
        <div
          className="ld-glass"
          style={{
            borderRadius: "24px",
            padding: "40px 36px",
          }}
        >
          {/* 슬라이더 1: 월 콘텐츠 수 */}
          <SliderRow
            label="월 콘텐츠 수"
            value={contentPerMonth}
            min={simData.min.contentPerMonth}
            max={simData.max.contentPerMonth}
            displayValue={`${contentPerMonth}개`}
            onChange={setContentPerMonth}
          />

          {/* 슬라이더 2: 콘텐츠당 가격 */}
          <SliderRow
            label="콘텐츠 판매 가격"
            value={pricePerContent}
            min={simData.min.pricePerContent}
            max={simData.max.pricePerContent}
            step={100}
            displayValue={`${pricePerContent.toLocaleString("ko-KR")}원`}
            onChange={setPricePerContent}
          />

          {/* 구분선 */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              margin: "32px 0",
            }}
          />

          {/* 예상 수익 출력 */}
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              예상 월 수익 (플랫폼 수수료 {simData.platformFeeRate * 100}% 제외)
            </p>
            {/* 카운트업 숫자 — 핵심 강조 */}
            <div
              style={{
                fontFamily: "Pretendard Variable, Pretendard, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(40px, 8vw, 64px)",
                color: "var(--accent-neon)",
                lineHeight: 1,
              }}
            >
              {formatKRW(displayRevenue)}
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginTop: "8px",
              }}
            >
              * 실제 수익은 플랫폼·콘텐츠 종류에 따라 달라질 수 있습니다
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 슬라이더 행 서브컴포넌트 ────────────────────────────
interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue: string;
  onChange: (v: number) => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  displayValue,
  onChange,
}: SliderRowProps) {
  return (
    <div style={{ marginBottom: "28px" }}>
      {/* 라벨 + 현재값 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <label
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontSize: "18px",
            fontWeight: 800,
            color: "var(--accent-neon)",
          }}
        >
          {displayValue}
        </span>
      </div>

      {/* 슬라이더 — 시니어 터치 타깃 충분히 확보 */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          height: "8px",
          appearance: "none",
          background: `linear-gradient(to right, var(--accent-neon) 0%, var(--accent-neon) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)`,
          borderRadius: "4px",
          cursor: "pointer",
          outline: "none",
          border: "none",
        }}
      />

      {/* 최소/최대 레이블 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "6px",
        }}
      >
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {typeof min === "number" && min >= 1000
            ? `${min.toLocaleString()}원`
            : `${min}개`}
        </span>
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {typeof max === "number" && max >= 1000
            ? `${max.toLocaleString()}원`
            : `${max}개`}
        </span>
      </div>
    </div>
  );
}
