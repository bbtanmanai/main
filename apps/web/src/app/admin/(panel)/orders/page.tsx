"use client";

import React, { useState } from "react";
import Link from "next/link";
import LdStatusStepper, { Step } from "@/components/ui/LdStatusStepper";

type OrderStatus = "all" | "pending" | "complete" | "refunded";

const mockOrders = [
  { id: "ORD-001", name: "김미숙",  product: "링크드롭 이용권", amount: 59000, date: "2026-04-22", status: "complete" },
  { id: "ORD-002", name: "한소희",  product: "링크드롭 이용권", amount: 59000, date: "2026-04-21", status: "complete" },
  { id: "ORD-003", name: "윤성진",  product: "링크드롭 이용권", amount: 59000, date: "2026-04-20", status: "pending" },
  { id: "ORD-004", name: "장민서",  product: "링크드롭 이용권", amount: 59000, date: "2026-04-18", status: "refunded" },
  { id: "ORD-005", name: "정예진",  product: "링크드롭 이용권", amount: 59000, date: "2026-04-17", status: "complete" },
];

function getSteps(status: string): Step[] {
  const done: Step["status"] = "success";
  const active: Step["status"] = "active";
  const wait: Step["status"] = "pending";
  const err: Step["status"] = "error";

  if (status === "complete") return [{ label: "결제", status: done }, { label: "확인", status: done }, { label: "발급", status: done }];
  if (status === "pending")  return [{ label: "결제", status: done }, { label: "확인", status: active }, { label: "발급", status: wait }];
  if (status === "refunded") return [{ label: "결제", status: done }, { label: "확인", status: done }, { label: "환불", status: err }];
  return [{ label: "결제", status: wait }, { label: "확인", status: wait }, { label: "발급", status: wait }];
}

const STATUS_LABELS: Record<string, string> = { complete: "완료", pending: "처리 중", refunded: "환불" };
const FILTER_LABELS: Record<OrderStatus, string> = { all: "전체", complete: "완료", pending: "처리 중", refunded: "환불" };

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = mockOrders.filter((o) => statusFilter === "all" || o.status === statusFilter);
  const totalAmount = mockOrders.filter((o) => o.status === "complete").reduce((sum, o) => sum + o.amount, 0);

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h4 className="adm-page-title--lg">주문 목록</h4>
          <p className="adm-page-subtitle">결제 완료 매출: {totalAmount.toLocaleString()}원</p>
        </div>
        <ol className="adm-breadcrumb">
          <li><Link href="/admin/dashboard">Admin</Link></li>
          <li>›</li>
          <li>주문 목록</li>
        </ol>
      </div>

      <div className="adm-card">
        <div className="adm-card-header">
          <h5 className="adm-card-title">주문 내역</h5>
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "complete", "pending", "refunded"] as OrderStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`adm-filter-btn${statusFilter === s ? " adm-filter-btn--active" : ""}`}
              >
                {FILTER_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>이름</th>
                <th>상품</th>
                <th>금액</th>
                <th>날짜</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <React.Fragment key={order.id}>
                  <tr>
                    <td className="adm-text-mono">{order.id}</td>
                    <td>{order.name}</td>
                    <td>{order.product}</td>
                    <td className="adm-text-success">{order.amount.toLocaleString()}원</td>
                    <td className="adm-text-muted">{order.date}</td>
                    <td>
                      <span className={`adm-badge adm-badge--${order.status}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="adm-text-right">
                      <button
                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                        className="adm-btn-expand"
                      >
                        {expandedId === order.id ? "닫기" : "단계"}
                      </button>
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr className="adm-stepper-row">
                      <td colSpan={7} className="adm-stepper-cell">
                        <LdStatusStepper steps={getSteps(order.status)} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="adm-table-empty">해당 주문이 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
