"use client";

// ============================================================
// 관리자 파트너 관리 페이지
// 파트너 테이블 + 정산 처리 버튼
// ============================================================

import { useState } from "react";

// mock 파트너 데이터
const initialPartners = [
  { id: "par-001", name: "박지영",  networkSize: 3, totalReward: 22500, settlementStatus: "pending",  bankAccount: "국민 123-456" },
  { id: "par-002", name: "이철수",  networkSize: 1, totalReward: 7500,  settlementStatus: "pending",  bankAccount: "신한 789-012" },
  { id: "par-003", name: "최강의",  networkSize: 8, totalReward: 60000, settlementStatus: "settled",  bankAccount: "하나 345-678" },
  { id: "par-004", name: "김영수",  networkSize: 2, totalReward: 15000, settlementStatus: "pending",  bankAccount: "우리 901-234" },
];

const SETTLEMENT_LABELS: Record<string, string> = { pending: "정산 대기", settled: "정산 완료" };
const SETTLEMENT_COLORS: Record<string, string> = { pending: "#eab308", settled: "#10b981" };
const SETTLEMENT_BG: Record<string, string> = { pending: "rgba(234,179,8,0.12)", settled: "rgba(16,185,129,0.12)" };

export default function PartnersPage() {
  const [partners, setPartners] = useState(initialPartners);

  // 정산 처리 핸들러 — 상태를 pending → settled로 변경
  const handleSettle = (id: string, name: string) => {
    if (!confirm(`${name} 파트너의 정산을 처리하시겠습니까?`)) return;
    setPartners((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, settlementStatus: "settled" } : p
      )
    );
  };

  const pendingCount = partners.filter((p) => p.settlementStatus === "pending").length;
  const totalPending = partners
    .filter((p) => p.settlementStatus === "pending")
    .reduce((s, p) => s + p.totalReward, 0);

  return (
    <div style={{ maxWidth: 900 }}>
      {/* 페이지 제목 */}
      <h1
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontWeight: 800,
          fontSize: 26,
          color: "var(--text-primary)",
          marginBottom: 8,
        }}
      >
        파트너 관리
      </h1>

      {/* 정산 대기 요약 */}
      {pendingCount > 0 && (
        <div
          style={{
            backgroundColor: "rgba(234,179,8,0.08)",
            border: "1px solid rgba(234,179,8,0.25)",
            borderRadius: 12,
            padding: "14px 20px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 22 }}>⚠️</span>
          <span
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: "#eab308",
            }}
          >
            정산 대기 {pendingCount}건 · 총 {totalPending.toLocaleString()}원
          </span>
        </div>
      )}

      {/* 파트너 테이블 */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["이름", "네트워크 규모", "누적 수당", "계좌", "정산 상태", ""].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {/* 이름 */}
                  <td style={tdStyle}>{p.name}</td>

                  {/* 네트워크 규모 */}
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <span style={{ fontWeight: 700, color: "#FF8800" }}>{p.networkSize}</span>명
                  </td>

                  {/* 누적 수당 */}
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#FF8800" }}>
                    {p.totalReward.toLocaleString()}원
                  </td>

                  {/* 계좌 */}
                  <td style={{ ...tdStyle, fontSize: 14, color: "var(--text-secondary)" }}>
                    {p.bankAccount}
                  </td>

                  {/* 정산 상태 뱃지 */}
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                        backgroundColor: SETTLEMENT_BG[p.settlementStatus] ?? "rgba(255,255,255,0.06)",
                        color: SETTLEMENT_COLORS[p.settlementStatus] ?? "var(--text-secondary)",
                      }}
                    >
                      {SETTLEMENT_LABELS[p.settlementStatus] ?? p.settlementStatus}
                    </span>
                  </td>

                  {/* 정산 처리 버튼 */}
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    {p.settlementStatus === "pending" ? (
                      <button
                        onClick={() => handleSettle(p.id, p.name)}
                        style={{
                          height: 36,
                          padding: "0 14px",
                          borderRadius: 8,
                          backgroundColor: "rgba(234,179,8,0.15)",
                          border: "1px solid rgba(234,179,8,0.4)",
                          color: "#eab308",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        정산 처리
                      </button>
                    ) : (
                      <span style={{ fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>
                        완료
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "14px 20px",
  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
  fontSize: 15,
  color: "var(--text-primary)",
};
