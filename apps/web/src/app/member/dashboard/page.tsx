"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "@/hooks/useSession";
import { createClient } from "@/lib/supabase";
import LdStatusStepper, { Step } from "@/components/ui/LdStatusStepper";

interface Profile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  provider: string | null;
  first_purchase_at: string | null;
  created_at: string | null;
}

interface Sale {
  id: string;
  product_price: number;
  status: string;
  payment_method: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const { user, role, loading } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/?auth=1"); return; }

    const supabase = createClient();

    async function loadData() {
      try {
        const profileRes = await supabase
          .from("profiles")
          .select("full_name, email, avatar_url, role, provider, first_purchase_at, created_at")
          .eq("id", user!.id)
          .single();

        if (profileRes.data) setProfile(profileRes.data);
      } finally {
        setDataLoading(false);
      }
    }

    loadData();
  }, [user, loading, router]);

  if (loading || dataLoading) return <DashboardSkeleton />;

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "회원";

  const avatarUrl =
    profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  const isBuyer = role === "partner" || role === "gold_partner" || role === "instructor" || role === "admin";

  const roleLabel =
    role === "gold_partner" ? "골드파트너회원" :
    role === "partner"      ? "파트너회원" :
    role === "instructor"   ? "강사회원" :
    role === "admin"        ? "관리자" : "일반회원";

  const daysSince = profile?.first_purchase_at
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(profile.first_purchase_at).getTime()) /
            86400000
        )
      )
    : null;

  const contentSteps: Step[] = isBuyer
    ? [
        { label: "결제 확인", status: "success" },
        { label: "계정 생성", status: "success" },
        { label: "콘텐츠 발급", status: "success" },
        { label: "이용 시작", status: "success" },
      ]
    : [
        { label: "결제 확인", status: "pending" },
        { label: "계정 생성", status: "success" },
        { label: "콘텐츠 발급", status: "pending" },
        { label: "이용 시작", status: "pending" },
      ];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* 환영 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="프로필"
            width={56}
            height={56}
            style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--accent-neon)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
              color: "#010828",
              flexShrink: 0,
            }}
          >
            {displayName[0].toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontWeight: 800,
              fontSize: 26,
              color: "var(--text-primary)",
              margin: "0 0 4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            안녕하세요, {displayName}님
          </h1>
          <p
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontSize: 15,
              color: "var(--text-secondary)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {profile?.email || user?.email}
          </p>
        </div>
        <span
          style={{
            flexShrink: 0,
            whiteSpace: "nowrap",
            padding: "4px 12px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            background: isBuyer
              ? "rgba(111,255,0,0.12)"
              : "rgba(255,255,255,0.07)",
            color: isBuyer ? "var(--accent-neon)" : "var(--text-secondary)",
            border: isBuyer
              ? "1px solid rgba(111,255,0,0.3)"
              : "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {roleLabel}
        </span>
      </div>

      {/* 통계 카드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="구매 상품"
          value={isBuyer ? "링크드롭" : "—"}
          sub={isBuyer ? "이용권" : "미구매"}
          color={isBuyer ? "var(--accent-neon)" : "var(--text-secondary)"}
        />
        <StatCard
          label="이용"
          value={daysSince ? `${daysSince}일째` : "—"}
          sub={daysSince ? "함께하고 있어요" : "구매 전"}
          color="#6366f1"
        />
      </div>

      {/* 콘텐츠 이용 상태 */}
      <SectionCard title="콘텐츠 이용 상태">
        <LdStatusStepper steps={contentSteps} />
        {!isBuyer && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <p
              style={{
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                fontSize: 14,
                color: "var(--text-secondary)",
                margin: "0 0 10px",
              }}
            >
              아직 이용권을 구매하지 않으셨습니다.
            </p>
            <button
              onClick={() => router.push("/landing/senior-online-business")}
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                background: "var(--accent-neon)",
                color: "#010828",
                border: "none",
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              이용권 구매하기
            </button>
          </div>
        )}
        {isBuyer && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(111,255,0,0.06)",
              border: "1px solid rgba(111,255,0,0.15)",
            }}
          >
            <p
              style={{
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                fontSize: 14,
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              콘텐츠 이용 중입니다.{" "}
              <a
                href="/member/content"
                style={{ color: "var(--accent-neon)", fontWeight: 600 }}
              >
                콘텐츠 보기 →
              </a>
            </p>
          </div>
        )}
      </SectionCard>

      {/* 계정 정보 */}
      <SectionCard title="계정 정보">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <InfoRow label="이메일" value={profile?.email || user?.email || "—"} />
          <InfoRow
            label="로그인 방식"
            value={
              profile?.provider === "google"
                ? "Google"
                : profile?.provider === "kakao"
                ? "카카오"
                : user?.app_metadata?.provider === "google"
                ? "Google"
                : user?.app_metadata?.provider === "kakao"
                ? "카카오"
                : "소셜 로그인"
            }
          />
          <InfoRow
            label="가입일"
            value={
              profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("ko-KR")
                : "—"
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div
      className="ld-surface-card"
      style={{ borderRadius: 14, padding: "18px 16px", textAlign: "center" }}
    >
      <div className="glass-content">
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 800,
            fontSize: 24,
            color,
            margin: "0 0 2px",
          }}
        >
          {value}
        </p>
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 12,
            color: "var(--text-secondary)",
            margin: "0 0 6px",
          }}
        >
          {sub}
        </p>
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="ld-surface-card"
      style={{ borderRadius: 16, padding: "22px 20px", marginBottom: 18 }}
    >
      <div className="glass-content">
        <h2
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 700,
            fontSize: 17,
            color: "var(--text-primary)",
            marginBottom: 18,
          }}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 14,
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: 16,
            height: i === 1 ? 80 : 160,
            marginBottom: 18,
            opacity: 0.4,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}
