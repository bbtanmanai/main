import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import ApplicationsClient from "./_client";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending:   "검토대기",
  reviewing: "검토중",
  approved:  "승인",
  rejected:  "보류",
};

async function getApplications() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("v2_instructor_applications")
    .select("id, title, author_name, contact, status, created_at, attachment_url")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export default async function ApplicationsPage() {
  const applications = await getApplications();

  const counts = {
    all:       applications.length,
    pending:   applications.filter((a) => a.status === "pending").length,
    reviewing: applications.filter((a) => a.status === "reviewing").length,
    approved:  applications.filter((a) => a.status === "approved").length,
    rejected:  applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div>
      <div className="adm-page-header">
        <h4 className="adm-page-title">강사 신청 관리</h4>
        <ol className="adm-breadcrumb">
          <li><Link href="/admin/dashboard">Admin</Link></li>
          <li>›</li>
          <li>강사 신청</li>
        </ol>
      </div>

      <div className="adm-stat-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {[
          { label: "전체",     count: counts.all,       color: "#0f9cf3" },
          { label: "검토대기", count: counts.pending,   color: "#eab308" },
          { label: "검토중",   count: counts.reviewing, color: "#6366f1" },
          { label: "승인",     count: counts.approved,  color: "#10b981" },
          { label: "보류",     count: counts.rejected,  color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="adm-stat-card" style={{ padding: "16px 20px" }}>
            <p className="adm-stat-label">{s.label}</p>
            <h4 className="adm-stat-value" style={{ color: s.color, fontSize: 28 }}>{s.count}</h4>
          </div>
        ))}
      </div>

      <div className="adm-card">
        <div className="adm-card-header">
          <h5 className="adm-card-title">신청 목록</h5>
          <span className="adm-text-muted" style={{ fontSize: 12 }}>총 {counts.all}건</span>
        </div>
        <ApplicationsClient applications={applications} statusLabel={STATUS_LABEL} />
      </div>
    </div>
  );
}
