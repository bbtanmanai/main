"use client";

// ============================================================
// 파트너 초대 페이지 — 내 초대 링크 + 초대 현황 + 이력 테이블
// 복사 버튼 클릭 시 클립보드에 링크 복사
// ============================================================

import { useState } from "react";

// mock 데이터 — 실제 Supabase 연결 후 교체
const mockReferralCode = "MISOUK2026";
const mockStats = {
  totalInvited: 3,   // 총 초대 수
  joined: 2,         // 실제 가입한 수
  reward: 15000,     // 발생한 수당 (원)
};
const mockHistory = [
  { id: 1, name: "박지영", joinDate: "2026-04-18", status: "active", reward: 7500 },
  { id: 2, name: "이철수", joinDate: "2026-04-20", status: "active", reward: 7500 },
  { id: 3, name: "최은지", joinDate: null,         status: "pending", reward: 0 },
];

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);

  // 초대 링크 전체 URL
  const referralUrl = `https://linkdrop.kr?ref=${mockReferralCode}`;

  // 클립보드 복사 핸들러
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      // 2초 후 복사 완료 메시지 초기화
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 미지원 환경 — 수동 선택 안내
      alert("링크를 수동으로 복사해 주세요:\n" + referralUrl);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
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
        파트너 초대
      </h1>
      <p
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 16,
          color: "var(--text-secondary)",
          marginBottom: 28,
        }}
      >
        지인을 초대하면 수당이 발생합니다
      </p>

      {/* 내 초대 링크 카드 */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: 16,
          padding: 24,
          border: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--text-primary)",
            marginBottom: 16,
          }}
        >
          내 초대 링크
        </h2>

        {/* 링크 표시 + 복사 버튼 */}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "stretch",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 200,
              height: 48,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.04)",
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontSize: 14,
              color: "var(--text-secondary)",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {referralUrl}
          </div>
          <button
            onClick={handleCopy}
            style={{
              height: 48,
              padding: "0 20px",
              borderRadius: 10,
              backgroundColor: copied ? "rgba(16,185,129,0.15)" : "rgba(111,255,0,0.12)",
              border: `1px solid ${copied ? "#10b981" : "rgba(111,255,0,0.3)"}`,
              color: copied ? "#10b981" : "var(--accent-neon)",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            {copied ? "복사됨 ✓" : "링크 복사"}
          </button>
        </div>

        {/* 초대 코드 표시 */}
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 14,
            color: "var(--text-secondary)",
            marginTop: 12,
            marginBottom: 0,
          }}
        >
          내 초대 코드:{" "}
          <strong style={{ color: "var(--accent-neon)", letterSpacing: "0.1em" }}>
            {mockReferralCode}
          </strong>
        </p>
      </div>

      {/* 초대 현황 통계 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatBox label="총 초대" value={`${mockStats.totalInvited}명`} color="#6366f1" />
        <StatBox label="가입 완료" value={`${mockStats.joined}명`} color="#10b981" />
        <StatBox label="누적 수당" value={`${mockStats.reward.toLocaleString()}원`} color="#FF8800" />
      </div>

      {/* 초대 이력 테이블 */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px 24px 16px" }}>
          <h2
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            초대 이력
          </h2>
        </div>

        {/* 테이블 스크롤 래퍼 */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["이름", "가입일", "상태", "수당"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 24px",
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
              {mockHistory.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <td style={tdStyle}>{row.name}</td>
                  <td style={tdStyle}>{row.joinDate ?? "미가입"}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                        backgroundColor:
                          row.status === "active"
                            ? "rgba(16,185,129,0.12)"
                            : "rgba(234,179,8,0.12)",
                        color: row.status === "active" ? "#10b981" : "#eab308",
                      }}
                    >
                      {row.status === "active" ? "가입 완료" : "대기 중"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: row.reward > 0 ? "#FF8800" : "var(--text-secondary)" }}>
                    {row.reward > 0 ? `${row.reward.toLocaleString()}원` : "-"}
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

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: 14,
        padding: "18px 12px",
        border: "1px solid rgba(255,255,255,0.06)",
        textAlign: "center",
      }}
    >
      <p style={{ fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif", fontWeight: 800, fontSize: 22, color, margin: "0 0 4px" }}>
        {value}
      </p>
      <p style={{ fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif", fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
        {label}
      </p>
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "14px 24px",
  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
  fontSize: 15,
  color: "var(--text-primary)",
};
