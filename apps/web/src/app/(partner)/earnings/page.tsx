"use client";

// ============================================================
// 파트너 수당 현황 페이지
// 3색 수익 카드 (LD-004 색상 체계)
// CSS 바 차트 (canvas/svg 없음) + 정산 상태 스테퍼
// ============================================================

import LdStatusStepper, { Step } from "@/components/ui/LdStatusStepper";

// mock 수익 데이터 — 실제 Supabase 연결 후 교체
const mockEarnings = {
  directSales: 118000,   // 직접 판매 수익 (파랑)
  partnerBonus: 45000,   // 파트너 후원 수당 (주황)
  lectureIncome: 28000,  // 강의 수입 (초록)
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

// 정산 진행 상태
const SETTLEMENT_STEPS: Step[] = [
  { label: "수당 확정", status: "success" },
  { label: "정산 신청", status: "success" },
  { label: "검토 중",   status: "active" },
  { label: "입금 완료", status: "pending" },
];

export default function EarningsPage() {
  // 차트 최대값 (CSS 퍼센트 계산용)
  const maxAmount = Math.max(...mockMonthlyData.map((d) => d.amount));

  return (
    <div style={{ maxWidth: 720 }}>
      <h1
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontWeight: 800,
          fontSize: 26,
          color: "var(--text-primary)",
          marginBottom: 8,
        }}
      >
        수당 현황
      </h1>
      <p
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 16,
          color: "var(--text-secondary)",
          marginBottom: 28,
        }}
      >
        2026년 4월 기준 누적 수익
      </p>

      {/* 3색 수익 카드 행 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* 직접 판매 수익 — 파랑 #0055FF */}
        <EarningCard
          label="직접 판매 수익"
          amount={mockEarnings.directSales}
          color="#0055FF"
          icon="🛒"
        />
        {/* 파트너 후원 수당 — 주황 #FF8800 */}
        <EarningCard
          label="파트너 후원 수당"
          amount={mockEarnings.partnerBonus}
          color="#FF8800"
          icon="🤝"
        />
        {/* 강의 수입 — 초록 #119944 */}
        <EarningCard
          label="강의 수입"
          amount={mockEarnings.lectureIncome}
          color="#119944"
          icon="🎓"
        />
      </div>

      {/* 총 수익 합계 */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: 14,
          padding: "16px 24px",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <span
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 600,
            fontSize: 18,
            color: "var(--text-secondary)",
          }}
        >
          이번 달 총 수익
        </span>
        <span
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: "var(--text-primary)",
          }}
        >
          {mockEarnings.total.toLocaleString()}원
        </span>
      </div>

      {/* 월별 수익 CSS 바 차트 */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: 16,
          padding: 24,
          border: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--text-primary)",
            marginBottom: 20,
          }}
        >
          월별 수익 추이
        </h2>

        {/* 바 차트 컨테이너 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 12,
            height: 160,
            padding: "0 4px",
          }}
        >
          {mockMonthlyData.map((d) => {
            // 막대 높이를 최대값 대비 퍼센트로 계산
            const heightPct = maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0;
            return (
              <div
                key={d.month}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                {/* 금액 레이블 (막대 위) */}
                {d.amount > 0 && (
                  <span
                    style={{
                      fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {(d.amount / 10000).toFixed(0)}만
                  </span>
                )}
                {/* 막대 */}
                <div
                  style={{
                    width: "100%",
                    height: `${heightPct}%`,
                    minHeight: d.amount > 0 ? 4 : 0,
                    borderRadius: "4px 4px 0 0",
                    background:
                      d.month === "4월"
                        ? "linear-gradient(180deg, #0055FF, #6366f1)" // 이번 달 강조
                        : "rgba(99,102,241,0.35)",
                    transition: "height 0.4s ease",
                  }}
                />
                {/* 월 레이블 */}
                <span
                  style={{
                    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                    fontSize: 12,
                    color: d.month === "4월" ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: d.month === "4월" ? 700 : 500,
                  }}
                >
                  {d.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 정산 진행 상태 */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: 16,
          padding: 24,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h2
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--text-primary)",
            marginBottom: 20,
          }}
        >
          이번 달 정산 상태
        </h2>
        <LdStatusStepper steps={SETTLEMENT_STEPS} />
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 14,
            color: "var(--text-secondary)",
            marginTop: 16,
            padding: "10px 14px",
            backgroundColor: "rgba(99,102,241,0.08)",
            borderRadius: 8,
          }}
        >
          정산은 매월 15일 신청 마감, 20일 입금됩니다
        </p>
      </div>
    </div>
  );
}

// 수익 카드 컴포넌트
function EarningCard({ label, amount, color, icon }: { label: string; amount: number; color: string; icon: string }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${color}33`, // 색상 투명도 20%
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <p
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color,
          margin: "0 0 6px",
        }}
      >
        {amount.toLocaleString()}원
      </p>
      <p
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 13,
          color: "var(--text-secondary)",
          margin: 0,
        }}
      >
        {label}
      </p>
    </div>
  );
}
