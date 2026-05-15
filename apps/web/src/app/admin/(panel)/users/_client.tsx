"use client";

import { useState } from "react";
import Link from "next/link";

type Role = "all" | "guest" | "partner" | "gold_partner" | "instructor";

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  provider: string | null;
  created_at: string | null;
  referral: { depth: number; referrer_id: string | null } | null;
}

const ROLE_LABELS: Record<string, string> = {
  guest:        "일반회원",
  partner:      "파트너",
  gold_partner: "골드파트너",
  instructor:   "강사",
  admin:        "관리자",
};

const ROLE_FILTER_LABELS: Record<Role, string> = {
  all: "전체", guest: "일반", partner: "파트너", gold_partner: "골드파트너", instructor: "강사",
};

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  kakao:  "Kakao",
};

export default function UsersClient({ users }: { users: User[] }) {
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState<Role>("all");

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.phone ?? "").includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <>
      <div className="adm-filter-bar">
        <input
          type="text"
          placeholder="이름·이메일·연락처 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="adm-content-search"
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["all", "guest", "partner", "gold_partner", "instructor"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`adm-filter-btn${roleFilter === r ? " adm-filter-btn--active" : ""}`}
            >
              {ROLE_FILTER_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 44 }}>NO</th>
              <th>이름</th>
              <th>연락처</th>
              <th>이메일</th>
              <th>가입일</th>
              <th>가입경로</th>
              <th>역할</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, idx) => {
              const role = user.role ?? "guest";
              return (
                <tr key={user.id}>
                  <td className="adm-text-muted" style={{ textAlign: "center", fontSize: 12 }}>
                    {idx + 1}
                  </td>
                  <td>
                    <Link
                      href={`/admin/users/${user.id}`}
                      style={{ color: "var(--adm-primary)", fontWeight: 600, textDecoration: "none" }}
                    >
                      {user.full_name || user.email || "—"}
                    </Link>
                  </td>
                  <td className="adm-text-muted">{user.phone ?? ""}</td>
                  <td className="adm-text-muted">{user.email ?? ""}</td>
                  <td className="adm-text-muted">
                    {user.created_at ? user.created_at.slice(0, 10) : ""}
                  </td>
                  <td className="adm-text-muted">
                    {PROVIDER_LABELS[user.provider ?? ""] ?? user.provider ?? ""}
                  </td>
                  <td>
                    <span className={`adm-badge adm-badge--${role.replace(/_/g, "-")}`}>
                      {ROLE_LABELS[role] ?? role}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="adm-table-empty">
                  {search || roleFilter !== "all" ? "검색 결과가 없습니다" : "회원이 없습니다"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
