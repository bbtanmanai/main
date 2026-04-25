"use client";

// ============================================================
// 수강생 관리 페이지 — 테이블 + 필터 (수료/미수료)
// mock 데이터, 실제 Supabase 연결 후 교체
// ============================================================

import { useState } from "react";

// mock 수강생 데이터
const mockStudents = [
  { id: 1, name: "김지수", course: "AI로 웹소설 쓰는 법", enrollDate: "2026-04-01", progress: 100, completed: true },
  { id: 2, name: "이민준", course: "AI로 웹소설 쓰는 법", enrollDate: "2026-04-05", progress: 68,  completed: false },
  { id: 3, name: "박서연", course: "유튜브 쇼츠 수익화",  enrollDate: "2026-04-08", progress: 100, completed: true },
  { id: 4, name: "최유진", course: "AI로 웹소설 쓰는 법", enrollDate: "2026-04-10", progress: 34,  completed: false },
  { id: 5, name: "장민서", course: "유튜브 쇼츠 수익화",  enrollDate: "2026-04-15", progress: 12,  completed: false },
  { id: 6, name: "한소희", course: "AI로 웹소설 쓰는 법", enrollDate: "2026-04-18", progress: 100, completed: true },
];

type Filter = "all" | "completed" | "ongoing";

export default function StudentsPage() {
  // 필터 상태: 전체 / 수료 / 미수료
  const [filter, setFilter] = useState<Filter>("all");

  // 필터에 따른 수강생 목록 필터링
  const filtered = mockStudents.filter((s) => {
    if (filter === "completed") return s.completed;
    if (filter === "ongoing")   return !s.completed;
    return true;
  });

  return (
    <div style={{ maxWidth: 800 }}>
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
        수강생 관리
      </h1>
      <p
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 16,
          color: "var(--text-secondary)",
          marginBottom: 20,
        }}
      >
        전체 {mockStudents.length}명 · 수료 {mockStudents.filter((s) => s.completed).length}명 · 진행 중 {mockStudents.filter((s) => !s.completed).length}명
      </p>

      {/* 필터 탭 버튼 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["all", "completed", "ongoing"] as Filter[]).map((f) => {
          const labels: Record<Filter, string> = { all: "전체", completed: "수료", ongoing: "미수료" };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                height: 38,
                padding: "0 16px",
                borderRadius: 8,
                backgroundColor: filter === f ? "#6366f1" : "var(--bg-surface)",
                color: filter === f ? "#ffffff" : "var(--text-secondary)",
                border: filter === f ? "none" : "1px solid rgba(255,255,255,0.08)",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* 수강생 테이블 */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["이름", "수강 강의", "수강일", "진도율", "수료"].map((h) => (
                  <th
                    key={h}
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
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  {/* 이름 */}
                  <td style={tdStyle}>{s.name}</td>

                  {/* 수강 강의 */}
                  <td
                    style={{
                      ...tdStyle,
                      fontSize: 14,
                      color: "var(--text-secondary)",
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.course}
                  </td>

                  {/* 수강일 */}
                  <td style={{ ...tdStyle, fontSize: 14 }}>{s.enrollDate}</td>

                  {/* 진도율 — CSS 바 형태 */}
                  <td style={{ ...tdStyle, minWidth: 120 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* 진도 바 */}
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "rgba(255,255,255,0.08)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${s.progress}%`,
                            height: "100%",
                            borderRadius: 3,
                            backgroundColor: s.completed ? "#10b981" : "#6366f1",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                          color: s.completed ? "#10b981" : "var(--text-primary)",
                          minWidth: 36,
                          textAlign: "right",
                        }}
                      >
                        {s.progress}%
                      </span>
                    </div>
                  </td>

                  {/* 수료 여부 */}
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        backgroundColor: s.completed ? "rgba(16,185,129,0.12)" : "rgba(234,179,8,0.12)",
                        color: s.completed ? "#10b981" : "#eab308",
                      }}
                    >
                      {s.completed ? "수료" : "진행 중"}
                    </span>
                  </td>
                </tr>
              ))}

              {/* 빈 상태 */}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                      fontSize: 15,
                      color: "var(--text-secondary)",
                    }}
                  >
                    해당 조건의 수강생이 없습니다
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
