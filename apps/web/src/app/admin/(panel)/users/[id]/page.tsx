import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  guest:        "일반회원",
  partner:      "파트너",
  gold_partner: "골드파트너",
  instructor:   "강사",
  admin:        "관리자",
};

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  kakao:  "Kakao",
};

const ACTION_META: Record<string, { label: string; color: string }> = {
  signup:         { label: "가입",     color: "#16a34a" },
  placement:      { label: "배치",     color: "#0f9cf3" },
  role_change:    { label: "역할변경", color: "#d97706" },
  note:           { label: "메모",     color: "#6b7280" },
  application:    { label: "신청",     color: "#7c3aed" },
  order:          { label: "주문",     color: "#0891b2" },
  profile_update: { label: "정보수정", color: "#db2777" },
  manual_place:   { label: "수동배치", color: "#dc2626" },
};

interface HistoryRow {
  id: string;
  action_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  performed_by: string | null;
  created_at: string;
  performer: { full_name: string | null; email: string | null } | null;
}

async function getUserDetail(id: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { data: profile },
    { data: referral },
    { data: downlines },
    { data: historyRaw },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, provider, created_at, avatar_url")
      .eq("id", id)
      .single(),
    supabase
      .from("referrals")
      .select("depth, position, referrer_id")
      .eq("user_id", id)
      .single(),
    supabase
      .from("referrals")
      .select("user_id, position, depth, profiles(full_name, email, role)")
      .eq("referrer_id", id)
      .order("position"),
    supabase
      .from("user_history")
      .select("id, action_type, description, old_value, new_value, performed_by, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) return null;

  let referrerProfile = null;
  if (referral?.referrer_id) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", referral.referrer_id)
      .single();
    referrerProfile = data;
  }

  // performed_by 이름 조회
  const performerIds = [...new Set(
    (historyRaw ?? []).map((h) => h.performed_by).filter(Boolean) as string[]
  )];
  let performerMap = new Map<string, { full_name: string | null; email: string | null }>();
  if (performerIds.length > 0) {
    const { data: performers } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", performerIds);
    (performers ?? []).forEach((p) => performerMap.set(p.id, p));
  }

  const history: HistoryRow[] = (historyRaw ?? []).map((h) => ({
    ...h,
    performer: h.performed_by ? (performerMap.get(h.performed_by) ?? null) : null,
  }));

  return { profile, referral, downlines: downlines ?? [], referrerProfile, history };
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getUserDetail(id);
  if (!result) notFound();

  const { profile, referral, downlines, referrerProfile, history } = result;
  const role = profile.role ?? "guest";

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h4 className="adm-page-title--lg">회원 상세</h4>
        </div>
        <ol className="adm-breadcrumb">
          <li><Link href="/admin/dashboard">Admin</Link></li>
          <li>›</li>
          <li><Link href="/admin/users">회원 목록</Link></li>
          <li>›</li>
          <li>{profile.full_name ?? profile.email}</li>
        </ol>
      </div>

      {/* 기본 정보 + 후원 구조 */}
      <div className="adm-chart-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* 기본 정보 */}
        <div className="adm-card">
          <div className="adm-card-header">
            <h5 className="adm-card-title">기본 정보</h5>
          </div>
          <div className="adm-card-body">
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "var(--adm-primary)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 700,
                }}>
                  {(profile.full_name ?? profile.email ?? "?")[0].toUpperCase()}
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--adm-text-dark)" }}>
                  {profile.full_name ?? "—"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--adm-text-muted)" }}>
                  {profile.email}
                </p>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  { label: "역할",     value: <span className={`adm-badge adm-badge--${role.replace(/_/g, "-")}`}>{ROLE_LABELS[role] ?? role}</span> },
                  { label: "연락처",   value: profile.phone ?? "—" },
                  { label: "가입경로", value: PROVIDER_LABELS[profile.provider ?? ""] ?? profile.provider ?? "—" },
                  { label: "가입일",   value: profile.created_at ? profile.created_at.slice(0, 10) : "—" },
                  { label: "회원 ID",  value: <span style={{ fontFamily: "monospace", fontSize: 12 }}>{profile.id}</span> },
                ].map(({ label, value }) => (
                  <tr key={label} style={{ borderBottom: "1px solid var(--adm-border)" }}>
                    <td style={{ padding: "10px 0", fontSize: 13, color: "var(--adm-text-muted)", width: 80 }}>{label}</td>
                    <td style={{ padding: "10px 0", fontSize: 13, color: "var(--adm-text-dark)" }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 후원 구조 */}
        <div className="adm-card">
          <div className="adm-card-header">
            <h5 className="adm-card-title">후원 구조</h5>
            {referral && (
              <span className="adm-text-muted" style={{ fontSize: 12 }}>
                {referral.depth}단계 · position {referral.position}
              </span>
            )}
          </div>
          <div className="adm-card-body">
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--adm-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              나를 후원한 회원
            </p>
            {referrerProfile ? (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f8fafc", border: "1px solid var(--adm-border)", marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--adm-text-dark)" }}>{referrerProfile.full_name ?? "—"}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--adm-text-muted)" }}>{referrerProfile.email}</p>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "var(--adm-text-muted)", marginBottom: 20 }}>없음 (최상위 또는 고아 회원)</p>
            )}

            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--adm-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              직접 후원 현황 ({downlines.length}/3)
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[1, 2, 3].map((pos) => {
                const member = downlines.find((d) => d.position === pos);
                const p = (member?.profiles as unknown) as { full_name: string | null; email: string | null; role: string | null } | null;
                return (
                  <div
                    key={pos}
                    style={{
                      padding: "10px 12px", borderRadius: 8, textAlign: "center",
                      border: `1px solid ${member ? "var(--adm-primary)" : "var(--adm-border)"}`,
                      background: member ? "rgba(15,156,243,0.05)" : "#f8fafc",
                    }}
                  >
                    <p style={{ margin: "0 0 2px", fontSize: 11, color: "var(--adm-text-muted)" }}>Position {pos}</p>
                    {member && p ? (
                      <>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--adm-text-dark)" }}>{p.full_name ?? "—"}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--adm-text-muted)" }}>{p.email}</p>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: "#cbd5e1" }}>빈 자리</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 히스토리 타임라인 */}
      <div className="adm-card" style={{ marginTop: 20 }}>
        <div className="adm-card-header">
          <h5 className="adm-card-title">활동 히스토리</h5>
          <span className="adm-text-muted" style={{ fontSize: 12 }}>
            총 {history.length}건
          </span>
        </div>
        <div className="adm-card-body" style={{ padding: 0 }}>
          {history.length === 0 ? (
            <p style={{ padding: "24px", textAlign: "center", color: "var(--adm-text-muted)", fontSize: 13 }}>
              이력이 없습니다
            </p>
          ) : (
            <div className="adm-history-list">
              {history.map((h, i) => {
                const meta = ACTION_META[h.action_type] ?? { label: h.action_type, color: "#6b7280" };
                const date = h.created_at.slice(0, 10);
                const time = h.created_at.slice(11, 16);
                return (
                  <div key={h.id} className={`adm-history-item${i < history.length - 1 ? " adm-history-item--divider" : ""}`}>
                    <div className="adm-history-dot" style={{ background: meta.color }} />
                    <div className="adm-history-body">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span
                          className="adm-history-badge"
                          style={{ background: meta.color + "1a", color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        <span style={{ fontSize: 13, color: "var(--adm-text-dark)" }}>
                          {h.description}
                        </span>
                      </div>
                      {(h.old_value || h.new_value) && (
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--adm-text-muted)" }}>
                          {h.old_value && <><s style={{ opacity: 0.6 }}>{h.old_value}</s> → </>}
                          {h.new_value && <strong>{h.new_value}</strong>}
                        </p>
                      )}
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>
                        {date} {time}
                        {h.performer && (
                          <> · <span style={{ color: "var(--adm-text-muted)" }}>
                            {h.performer.full_name ?? h.performer.email}
                          </span></>
                        )}
                        {!h.performer && !h.performed_by && (
                          <> · <span>시스템</span></>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
