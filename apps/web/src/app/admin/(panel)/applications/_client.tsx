"use client";

import { useState } from "react";

type AppStatus = "all" | "pending" | "reviewing" | "approved" | "rejected";

interface Application {
  id: string;
  title: string;
  author_name: string;
  contact: string;
  status: string;
  created_at: string;
  attachment_url: string | null;
}

interface Props {
  applications: Application[];
  statusLabel: Record<string, string>;
}

const FILTER_LABELS: Record<AppStatus, string> = {
  all: "전체", pending: "검토대기", reviewing: "검토중", approved: "승인", rejected: "보류",
};

export default function ApplicationsClient({ applications, statusLabel }: Props) {
  const [filter, setFilter] = useState<AppStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = applications.filter((a) => {
    const matchStatus = filter === "all" || a.status === filter;
    const matchSearch = a.title.includes(search) || a.author_name.includes(search) || a.contact.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className="adm-filter-bar">
        <input
          type="text"
          placeholder="이름·제목·연락처 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="adm-content-search"
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["all", "pending", "reviewing", "approved", "rejected"] as AppStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`adm-filter-btn${filter === s ? " adm-filter-btn--active" : ""}`}
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
              <th>제목</th>
              <th>신청자</th>
              <th>연락처</th>
              <th>신청일</th>
              <th>상태</th>
              <th>첨부</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="adm-table-empty">신청 내역이 없습니다</td>
              </tr>
            ) : filtered.map((app) => (
              <tr key={app.id}>
                <td className="adm-text-truncate" style={{ maxWidth: 260 }}>{app.title}</td>
                <td>{app.author_name}</td>
                <td className="adm-text-muted">{app.contact}</td>
                <td className="adm-text-muted">{app.created_at.slice(0, 10)}</td>
                <td>
                  <span className={`adm-badge adm-badge--${app.status}`}>
                    {statusLabel[app.status] ?? app.status}
                  </span>
                </td>
                <td>
                  {app.attachment_url ? (
                    <a
                      href={app.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0f9cf3", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                    >
                      보기
                    </a>
                  ) : (
                    <span className="adm-text-muted" style={{ fontSize: 13 }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
