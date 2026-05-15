import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import UsersClient from "./_client";

export const dynamic = "force-dynamic";

async function getUsers() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: profiles }, { data: referrals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, provider, created_at, phone")
      .order("created_at", { ascending: false }),
    supabase
      .from("referrals")
      .select("user_id, depth, referrer_id"),
  ]);

  const refMap = new Map((referrals ?? []).map((r) => [r.user_id, r]));

  return (profiles ?? []).map((p) => ({
    ...p,
    referral: refMap.get(p.id) ?? null,
  }));
}

export default async function UsersPage() {
  const users = await getUsers();

  const counts = {
    all:          users.length,
    guest:        users.filter((u) => u.role === "guest").length,
    partner:      users.filter((u) => u.role === "partner").length,
    gold_partner: users.filter((u) => u.role === "gold_partner").length,
    instructor:   users.filter((u) => u.role === "instructor").length,
  };

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h4 className="adm-page-title--lg">
            회원 목록
            <span style={{ fontSize: 14, fontWeight: 500, color: "#6c757d", marginLeft: 10 }}>
              총 {counts.all}명
            </span>
          </h4>
        </div>
        <ol className="adm-breadcrumb">
          <li><Link href="/admin/dashboard">Admin</Link></li>
          <li>›</li>
          <li>회원 목록</li>
        </ol>
      </div>

      <div className="adm-stat-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {[
          { label: "전체",       count: counts.all,          color: "#0f9cf3" },
          { label: "일반회원",   count: counts.guest,        color: "#6c757d" },
          { label: "파트너",     count: counts.partner,      color: "#c2410c" },
          { label: "골드파트너", count: counts.gold_partner, color: "#b45309" },
          { label: "강사",       count: counts.instructor,   color: "#4f46e5" },
        ].map((s) => (
          <div key={s.label} className="adm-stat-card" style={{ padding: "14px 18px" }}>
            <p className="adm-stat-label">{s.label}</p>
            <h4 className="adm-stat-value" style={{ color: s.color, fontSize: 26 }}>{s.count}</h4>
          </div>
        ))}
      </div>

      <div className="adm-card">
        <UsersClient users={users} />
      </div>
    </div>
  );
}
