"use client";

import { useState } from "react";

type Role = "all" | "guest" | "partner" | "gold_partner" | "instructor";

const mockUsers = [
  { id: "u1", name: "김미숙",  email: "misouk@example.com",    joinDate: "2026-04-01", role: "guest",     status: "active" },
  { id: "u2", name: "박지영",  email: "jiyoung@example.com",   joinDate: "2026-04-05", role: "partner",    status: "active" },
  { id: "u3", name: "이철수",  email: "chulsu@example.com",    joinDate: "2026-04-08", role: "partner",    status: "active" },
  { id: "u4", name: "최강의",  email: "kangui@example.com",    joinDate: "2026-04-10", role: "instructor", status: "active" },
  { id: "u5", name: "장민서",  email: "minseo@example.com",    joinDate: "2026-04-15", role: "guest",     status: "inactive" },
  { id: "u6", name: "한소희",  email: "sohee@example.com",     joinDate: "2026-04-18", role: "guest",     status: "active" },
  { id: "u7", name: "윤성진",  email: "sungjin@example.com",   joinDate: "2026-04-20", role: "guest",     status: "active" },
];

const ROLE_LABELS: Record<string, string> = {
  guest:        "일반회원",
  partner:      "파트너회원",
  gold_partner: "골드파트너회원",
  instructor:   "강사회원",
  admin:        "관리자",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role>("all");

  const filtered = mockUsers.filter((u) => {
    const matchSearch = u.name.includes(search) || u.email.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div style={{ maxWidth: 1400 }}>
      <h1
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontWeight: 800,
          fontSize: 26,
          color: "var(--text-primary)",
          marginBottom: 20,
        }}
      >
        회원 목록
        <span style={{ fontSize: 16, fontWeight: 500, color: "var(--text-secondary)", marginLeft: 12 }}>
          {filtered.length}명
        </span>
      </h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="이름 또는 이메일 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            height: 44, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: "var(--bg-surface)", color: "var(--text-primary)",
            fontSize: 16, padding: "0 14px",
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            outline: "none", minWidth: 220, flex: 1, boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "guest", "partner", "gold_partner", "instructor"] as Role[]).map((r) => {
            const labels: Record<Role, string> = { all: "전체", guest: "일반회원", partner: "파트너회원", gold_partner: "골드파트너회원", instructor: "강사회원" };
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                style={{
                  height: 44, padding: "0 14px", borderRadius: 8,
                  backgroundColor: roleFilter === r ? "#ef4444" : "var(--bg-surface)",
                  color: roleFilter === r ? "#ffffff" : "var(--text-secondary)",
                  border: roleFilter === r ? "none" : "1px solid rgba(255,255,255,0.08)",
                  fontSize: 14, fontWeight: 600,
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ backgroundColor: "var(--bg-surface)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["이름", "이메일", "가입일", "역할", "상태"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={tdStyle}>{user.name}</td>
                  <td style={{ ...tdStyle, fontSize: 14, color: "var(--text-secondary)" }}>{user.email}</td>
                  <td style={{ ...tdStyle, fontSize: 14 }}>{user.joinDate}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                      fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                      backgroundColor: user.role === "instructor" ? "rgba(99,102,241,0.12)" : user.role === "gold_partner" ? "rgba(234,179,8,0.15)" : user.role === "partner" ? "rgba(255,136,0,0.12)" : "rgba(255,255,255,0.06)",
                      color: user.role === "instructor" ? "#6366f1" : user.role === "gold_partner" ? "#eab308" : user.role === "partner" ? "#FF8800" : "var(--text-secondary)",
                    }}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                      fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                      backgroundColor: user.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.06)",
                      color: user.status === "active" ? "#10b981" : "#6b7280",
                    }}>
                      {user.status === "active" ? "활성" : "비활성"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "40px 20px", textAlign: "center", fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif", fontSize: 15, color: "var(--text-secondary)" }}>
                    검색 결과가 없습니다
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
