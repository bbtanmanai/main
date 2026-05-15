"use client";

import { useState } from "react";
import Link from "next/link";

const initialPartners = [
  { id: "par-001", name: "박지영",  networkSize: 3, totalReward: 22500, settlementStatus: "pending",  bankAccount: "국민 123-456" },
  { id: "par-002", name: "이철수",  networkSize: 1, totalReward: 7500,  settlementStatus: "pending",  bankAccount: "신한 789-012" },
  { id: "par-003", name: "최강의",  networkSize: 8, totalReward: 60000, settlementStatus: "settled",  bankAccount: "하나 345-678" },
  { id: "par-004", name: "김영수",  networkSize: 2, totalReward: 15000, settlementStatus: "pending",  bankAccount: "우리 901-234" },
];

const SETTLEMENT_LABELS: Record<string, string> = { pending: "정산 대기", settled: "정산 완료" };

export default function PartnersPage() {
  const [partners, setPartners] = useState(initialPartners);

  const handleSettle = (id: string, name: string) => {
    if (!confirm(`${name} 파트너의 정산을 처리하시겠습니까?`)) return;
    setPartners((prev) => prev.map((p) => p.id === id ? { ...p, settlementStatus: "settled" } : p));
  };

  const pendingCount  = partners.filter((p) => p.settlementStatus === "pending").length;
  const totalPending  = partners.filter((p) => p.settlementStatus === "pending").reduce((s, p) => s + p.totalReward, 0);

  return (
    <div>
      <div className="adm-page-header">
        <h4 className="adm-page-title--lg">파트너 관리</h4>
        <ol className="adm-breadcrumb">
          <li><Link href="/admin/dashboard">Admin</Link></li>
          <li>›</li>
          <li>파트너 관리</li>
        </ol>
      </div>

      {pendingCount > 0 && (
        <div className="adm-alert-warning">
          <span style={{ fontSize: 18 }}>⚠️</span>
          정산 대기 {pendingCount}건 · 총 {totalPending.toLocaleString()}원
        </div>
      )}

      <div className="adm-card">
        <div className="adm-card-header">
          <h5 className="adm-card-title">파트너 목록</h5>
          <span className="adm-text-muted" style={{ fontSize: 12 }}>총 {partners.length}명</span>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>이름</th>
                <th className="adm-text-center">네트워크 규모</th>
                <th>누적 수당</th>
                <th>계좌</th>
                <th>정산 상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className="adm-text-center">
                    <span className="adm-text-partner">{p.networkSize}</span>명
                  </td>
                  <td className="adm-text-partner">{p.totalReward.toLocaleString()}원</td>
                  <td className="adm-text-muted">{p.bankAccount}</td>
                  <td>
                    <span className={`adm-badge adm-badge--${p.settlementStatus}`}>
                      {SETTLEMENT_LABELS[p.settlementStatus] ?? p.settlementStatus}
                    </span>
                  </td>
                  <td className="adm-text-right">
                    {p.settlementStatus === "pending" ? (
                      <button
                        onClick={() => handleSettle(p.id, p.name)}
                        className="adm-btn-settle"
                      >
                        정산 처리
                      </button>
                    ) : (
                      <span className="adm-text-muted">완료</span>
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
