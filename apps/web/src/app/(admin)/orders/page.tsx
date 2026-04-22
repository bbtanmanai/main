"use client";

// ============================================================
// 관리자 주문 목록 페이지
// 주문 테이블 + 상태별 LdStatusStepper + 필터
// ============================================================

import { useState } from "react";
import LdStatusStepper, { Step } from "@/components/ui/LdStatusStepper";

type OrderStatus = "all" | "pending" | "complete" | "refunded";

// mock 주문 데이터
const mockOrders = [
  { id: "ORD-001", name: "김미숙",  product: "링크드롭 이용권", amount: 59000, date: "2026-04-22", status: "complete" },
  { id: "ORD-002", name: "한소희",  product: "링크드롭 이용권", amount: 59000, date: "2026-04-21", status: "complete" },
  { id: "ORD-003", name: "윤성진",  product: "링크드롭 이용권", amount: 59000, date: "2026-04-20", status: "pending" },
  { id: "ORD-004", name: "장민서",  product: "링크드롭 이용권", amount: 59000, date: "2026-04-18", status: "refunded" },
  { id: "ORD-005", name: "정예진",  product: "링크드롭 이용권", amount: 59000, date: "2026-04-17", status: "complete" },
];

// 주문 상태에 따른 스테퍼 단계 생성
function getSteps(status: string): Step[] {
  const done: Step["status"] = "success";
  const active: Step["status"] = "active";
  const wait: Step["status"] = "pending";
  const err: Step["status"] = "error";

  if (status === "complete") {
    return [{ label: "결제", status: done }, { label: "확인", status: done }, { label: "발급", status: done }];
  } else if (status === "pending") {
    return [{ label: "결제", status: done }, { label: "확인", status: active }, { label: "발급", status: wait }];
  } else if (status === "refunded") {
    return [{ label: "결제", status: done }, { label: "확인", status: done }, { label: "환불", status: err }];
  }
  return [{ label: "결제", status: wait }, { label: "확인", status: wait }, { label: "발급", status: wait }];
}

const STATUS_LABELS: Record<string, string> = {
  complete: "완료",
  pending: "처리 중",
  refunded: "환불",
};
const STATUS_COLORS: Record<string, string> = {
  complete: "#10b981",
  pending: "#eab308",
  refunded: "#ef4444",
};
const STATUS_BG: Record<string, string> = {
  complete: "rgba(16,185,129,0.12)",
  pending: "rgba(234,179,8,0.12)",
  refunded: "rgba(239,68,68,0.12)",
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  // 상세 스테퍼 열려 있는 주문 ID
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = mockOrders.filter((o) =>
    statusFilter === "all" ? true : o.status === statusFilter
  );

  const totalAmount = mockOrders
    .filter((o) => o.status === "complete")
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <div style={{ maxWidth: 900 }}>
      {/* 페이지 제목 + 매출 합계 */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 800,
            fontSize: 26,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          주문 목록
        </h1>
        <p style={{ fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif", fontSize: 15, color: "#10b981", fontWeight: 700 }}>
          결제 완료 매출: {totalAmount.toLocaleString()}원
        </p>
      </div>

      {/* 상태 필터 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {(["all", "complete", "pending", "refunded"] as OrderStatus[]).map((s) => {
          const labels: Record<OrderStatus, string> = { all: "전체", complete: "완료", pending: "처리 중", refunded: "환불" };
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                height: 38,
                padding: "0 14px",
                borderRadius: 8,
                backgroundColor: statusFilter === s ? "#ef4444" : "var(--bg-surface)",
                color: statusFilter === s ? "#ffffff" : "var(--text-secondary)",
                border: statusFilter === s ? "none" : "1px solid rgba(255,255,255,0.08)",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                cursor: "pointer",
              }}
            >
              {labels[s]}
            </button>
          );
        })}
      </div>

      {/* 주문 테이블 */}
      <div style={{ backgroundColor: "var(--bg-surface)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["주문번호", "이름", "상품", "금액", "상태", ""].map((h, i) => (
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
              {filtered.map((order) => (
                <>
                  <tr key={order.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ ...tdStyle, fontSize: 13, fontFamily: "monospace", color: "var(--text-secondary)" }}>{order.id}</td>
                    <td style={tdStyle}>{order.name}</td>
                    <td style={{ ...tdStyle, fontSize: 14 }}>{order.product}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#10b981" }}>{order.amount.toLocaleString()}원</td>
                    <td style={tdStyle}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 600, fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif", backgroundColor: STATUS_BG[order.status] ?? "rgba(255,255,255,0.06)", color: STATUS_COLORS[order.status] ?? "var(--text-secondary)" }}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    {/* 스테퍼 토글 버튼 */}
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <button
                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          backgroundColor: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "var(--text-secondary)",
                          fontSize: 13,
                          cursor: "pointer",
                          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                        }}
                      >
                        {expandedId === order.id ? "닫기" : "단계"}
                      </button>
                    </td>
                  </tr>
                  {/* 확장된 스테퍼 행 */}
                  {expandedId === order.id && (
                    <tr key={`${order.id}-stepper`} style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                      <td colSpan={6} style={{ padding: "16px 24px" }}>
                        <LdStatusStepper steps={getSteps(order.status)} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 20px", textAlign: "center", fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif", fontSize: 15, color: "var(--text-secondary)" }}>
                    해당 주문이 없습니다
                  </td>
                </tr>
              )}
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
