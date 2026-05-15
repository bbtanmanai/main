"use client";

// ============================================================
// 파트너 수당 현황 페이지
// Architectural Precision 디자인 시스템
// 3색 수익 카드 (LD-004 색상 체계)
// CSS 바 차트 (canvas/svg 없음) + 정산 상태 스테퍼
// ============================================================

import LdStatusStepper, { Step } from "@/components/ui/LdStatusStepper";
import { ShoppingCart, Handshake, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "@/styles/pages/partner.css";

// mock 수익 데이터 — 실제 Supabase 연결 후 교체
const mockEarnings = {
  directSales: 118000,
  partnerBonus: 45000,
  lectureIncome: 28000,
  total: 191000,
};

// 월별 수익 차트 데이터 (최근 6개월)
const mockMonthlyData = [
  { month: "11월", amount: 0 },
  { month: "12월", amount: 59000 },
  { month: "1월",  amount: 88000 },
  { month: "2월",  amount: 103000 },
  { month: "3월",  amount: 147000 },
  { month: "4월",  amount: 191000 },
];

const SETTLEMENT_STEPS: Step[] = [
  { label: "수당 확정", status: "success" },
  { label: "정산 신청", status: "success" },
  { label: "검토 중",   status: "active" },
  { label: "입금 완료", status: "pending" },
];

export default function EarningsPage() {
  const maxAmount = Math.max(...mockMonthlyData.map((d) => d.amount));

  return (
    <div className="pt-container">

      {/* ── 헤더 ── */}
      <div style={{ marginBottom: 20, position: "relative", zIndex: 1 }}>
        <p className="pt-eyebrow">파트너 대시보드</p>
        <h1 className="pt-page-title">수당 현황</h1>
        <p className="pt-page-desc">2026년 4월 기준 누적 수익</p>
      </div>

      {/* ── 총 수익 카드 ── */}
      <div className="pt-total-card" style={{ position: "relative", zIndex: 1 }}>
        <div>
          <p className="pt-total-label">이번 달 총 수익</p>
          <p className="pt-total-amount">
            ₩{mockEarnings.total.toLocaleString()}
          </p>
        </div>
        <p className="pt-total-period">2026년 4월</p>
      </div>

      {/* ── 3색 수익 카드 ── */}
      <div className="pt-earnings-cards">
        {/* 직접 판매 수익 — 파랑 #0055FF (동적 color → inline style 허용) */}
        <EarningCard
          label="직접 판매"
          amount={mockEarnings.directSales}
          color="#0055FF"
          icon={ShoppingCart}
        />
        {/* 파트너 후원 수당 — 에메랄드 #059669 */}
        <EarningCard
          label="파트너 수당"
          amount={mockEarnings.partnerBonus}
          color="#059669"
          icon={Handshake}
        />
        {/* 강의 수입 — 초록 #119944 */}
        <EarningCard
          label="강의 수입"
          amount={mockEarnings.lectureIncome}
          color="#119944"
          icon={GraduationCap}
        />
      </div>

      {/* ── 월별 수익 추이 차트 ── */}
      <div className="pt-chart" style={{ position: "relative", zIndex: 1 }}>
        <div className="pt-section-header"><h2>월별 수익 추이</h2></div>
        <div className="pt-chart-bars">
          {mockMonthlyData.map((d) => {
            // 막대 높이를 최대값 대비 퍼센트로 계산 — 런타임 계산값
            const heightPct = maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0;
            const isCurrent = d.month === "4월";
            return (
              <div key={d.month} className="pt-bar-col">
                {d.amount > 0 && (
                  <span className="pt-bar-amount-label">
                    {(d.amount / 10000).toFixed(0)}만
                  </span>
                )}
                {/* 막대 높이·배경색 — 런타임 계산값 → inline style 허용 */}
                <div
                  className="pt-bar"
                  style={{
                    height: `${heightPct}%`,
                    minHeight: d.amount > 0 ? 3 : 0,
                    background: isCurrent
                      ? "linear-gradient(180deg, #0055FF, #6366f1)"
                      : "rgba(99,102,241,0.28)",
                  }}
                />
                {/* 월 레이블 — 색상·굵기 런타임 → inline style 허용 */}
                <span
                  className="pt-bar-month-label"
                  style={{
                    color: isCurrent ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                >
                  {d.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 정산 진행 상태 ── */}
      <div className="pt-card" style={{ position: "relative", zIndex: 1 }}>
        <div className="pt-section-header"><h2>이번 달 정산 상태</h2></div>
        <LdStatusStepper steps={SETTLEMENT_STEPS} />
        <p className="pt-settlement-notice">
          정산은 매월 15일 신청 마감, 20일 입금됩니다
        </p>
      </div>

    </div>
  );
}

// ── 수익 카드 컴포넌트
// color prop이 동적 런타임 값이므로 inline style 허용
function EarningCard({
  label,
  amount,
  color,
  icon: Icon,
}: {
  label: string;
  amount: number;
  color: string;
  icon: LucideIcon;
}) {
  return (
    <div
      className="pt-earning-card"
      style={{ border: `1px solid ${color}22` }}
    >
      <div className="pt-earning-card-icon" style={{ color }}>
        <Icon size={22} strokeWidth={1.8} />
      </div>
      <p className="pt-earning-card-amount" style={{ color }}>
        ₩{amount.toLocaleString()}
      </p>
      <p className="pt-earning-card-label">{label}</p>
    </div>
  );
}
