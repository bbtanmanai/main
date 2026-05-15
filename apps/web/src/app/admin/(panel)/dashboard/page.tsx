import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  pending:   "검토대기",
  reviewing: "검토중",
  approved:  "승인",
  rejected:  "보류",
};

/* 목업 — 주간 신청 추이 */
const WEEKLY = [
  { day: "월", h: 38 }, { day: "화", h: 62 }, { day: "수", h: 50 },
  { day: "목", h: 84 }, { day: "금", h: 46 }, { day: "토", h: 28 }, { day: "일", h: 18 },
];

/* 목업 — 회원 역할 구성 */
const ROLES = [
  { label: "일반회원",  pct: 62, color: "#0f9cf3" },
  { label: "파트너",    pct: 22, color: "#6fd088" },
  { label: "골드파트너", pct: 10, color: "#ffbb44" },
  { label: "강사",      pct:  6, color: "#0097a7" },
];

async function getStats() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { count: totalUsers },
    { count: partnerUsers },
    { count: instructorUsers },
    { count: pendingApps },
    { data: recentApps },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .in("role", ["partner", "gold_partner", "instructor"]),
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .eq("role", "instructor"),
    supabase.from("v2_instructor_applications").select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("v2_instructor_applications")
      .select("title, author_name, contact, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    totalUsers:      totalUsers      ?? 0,
    partnerUsers:    partnerUsers    ?? 0,
    instructorUsers: instructorUsers ?? 0,
    pendingApps:     pendingApps     ?? 0,
    recentApps:      recentApps      ?? [],
  };
}

export default async function DashboardPage() {
  const { totalUsers, partnerUsers, instructorUsers, pendingApps, recentApps } = await getStats();

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="adm-page-header">
        <h4 className="adm-page-title">대시보드</h4>
        <ol className="adm-breadcrumb">
          <li><Link href="/admin/dashboard">Admin</Link></li>
          <li>›</li>
          <li>대시보드</li>
        </ol>
      </div>

      {/* ── 스탯 카드 4종 ── */}
      <div className="adm-stat-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-body">
            <p className="adm-stat-label">총 회원</p>
            <h4 className="adm-stat-value">{totalUsers.toLocaleString()}</h4>
            <p className="adm-stat-trend adm-stat-trend--up">
              <strong>↑ 12.5%</strong>전월 대비
            </p>
          </div>
          <div className="adm-stat-icon adm-stat-icon--primary">👤</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-body">
            <p className="adm-stat-label">파트너 이상</p>
            <h4 className="adm-stat-value">{partnerUsers.toLocaleString()}</h4>
            <p className="adm-stat-trend adm-stat-trend--up">
              <strong>↑ 8.3%</strong>전월 대비
            </p>
          </div>
          <div className="adm-stat-icon adm-stat-icon--success">🤝</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-body">
            <p className="adm-stat-label">강사 신청 대기</p>
            <h4 className="adm-stat-value">{pendingApps.toLocaleString()}</h4>
            <p className="adm-stat-trend adm-stat-trend--neutral">
              <strong>● {pendingApps}건</strong>검토 대기 중
            </p>
          </div>
          <div className="adm-stat-icon adm-stat-icon--warning">📋</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-body">
            <p className="adm-stat-label">강사 회원</p>
            <h4 className="adm-stat-value">{instructorUsers.toLocaleString()}</h4>
            <p className="adm-stat-trend adm-stat-trend--up">
              <strong>↑ 4.1%</strong>전월 대비
            </p>
          </div>
          <div className="adm-stat-icon adm-stat-icon--info">🎓</div>
        </div>
      </div>

      {/* ── 차트 2종 (목업) ── */}
      <div className="adm-chart-grid">
        {/* 주간 신청 추이 바 차트 */}
        <div className="adm-card">
          <div className="adm-card-header">
            <h5 className="adm-card-title">주간 강사 신청 추이</h5>
            <span className="adm-text-muted" style={{ fontSize: 11 }}>최근 7일 (목업)</span>
          </div>
          <div className="adm-card-body">
            <div className="adm-chart-stat-row">
              <div className="adm-chart-stat">
                <span className="adm-chart-stat-val">23</span>
                <span className="adm-chart-stat-label">이번 주</span>
              </div>
              <div className="adm-chart-stat">
                <span className="adm-chart-stat-val">18</span>
                <span className="adm-chart-stat-label">지난 주</span>
              </div>
              <div className="adm-chart-stat">
                <span className="adm-chart-stat-val" style={{ color: "#6fd088" }}>↑ 27.7%</span>
                <span className="adm-chart-stat-label">증가율</span>
              </div>
            </div>
            <div className="adm-chart-bars">
              {WEEKLY.map((b, i) => (
                <div key={b.day} className="adm-chart-bar-col">
                  <div
                    className={`adm-chart-bar${i === 3 ? " adm-chart-bar--hi" : ""}`}
                    style={{ height: `${b.h}%` }}
                  />
                  <span className="adm-chart-bar-lbl">{b.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 회원 역할 구성 프로그레스 바 */}
        <div className="adm-card">
          <div className="adm-card-header">
            <h5 className="adm-card-title">회원 역할 구성</h5>
            <span className="adm-text-muted" style={{ fontSize: 11 }}>전체 기준 (목업)</span>
          </div>
          <div className="adm-card-body">
            <div className="adm-chart-stat-row">
              <div className="adm-chart-stat">
                <span className="adm-chart-stat-val">{totalUsers}</span>
                <span className="adm-chart-stat-label">총 회원</span>
              </div>
              <div className="adm-chart-stat">
                <span className="adm-chart-stat-val">{partnerUsers}</span>
                <span className="adm-chart-stat-label">파트너 이상</span>
              </div>
            </div>
            <div className="adm-role-rows">
              {ROLES.map((r) => (
                <div key={r.label}>
                  <div className="adm-role-row-head">
                    <span className="adm-role-row-label">{r.label}</span>
                    <span className="adm-role-row-val">{r.pct}%</span>
                  </div>
                  <div className="adm-progress">
                    <div
                      className="adm-progress-bar"
                      style={{ width: `${r.pct}%`, background: r.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 최근 강사 신청 테이블 ── */}
      <div className="adm-card">
        <div className="adm-card-header">
          <h5 className="adm-card-title">최근 강사 신청</h5>
          <Link href="/certificate-teacher" className="adm-card-link">전체 보기 →</Link>
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
              </tr>
            </thead>
            <tbody>
              {recentApps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="adm-table-empty">신청 내역이 없습니다</td>
                </tr>
              ) : recentApps.map((app, i) => (
                <tr key={i}>
                  <td className="adm-text-truncate">{app.title}</td>
                  <td>{app.author_name}</td>
                  <td className="adm-text-muted">{app.contact}</td>
                  <td className="adm-text-muted">{(app.created_at as string).slice(0, 10)}</td>
                  <td>
                    <span className={`adm-badge adm-badge--${app.status}`}>
                      {STATUS_LABEL[app.status] ?? app.status}
                    </span>
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
