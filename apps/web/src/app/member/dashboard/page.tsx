"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "@/hooks/useSession";
import { createClient } from "@/lib/supabase";
import LdStatusStepper, { Step } from "@/components/ui/LdStatusStepper";
import "@/styles/pages/member.css";

interface Profile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  provider: string | null;
  first_purchase_at: string | null;
  created_at: string | null;
}

export default function DashboardPage() {
  const { user, role, loading } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
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

  const isBuyer =
    role === "partner" ||
    role === "gold_partner" ||
    role === "instructor" ||
    role === "admin";

  const roleLabel =
    role === "gold_partner" ? "GOLD PARTNER" :
    role === "partner"      ? "PARTNER" :
    role === "instructor"   ? "INSTRUCTOR" :
    role === "admin"        ? "ADMIN" : "GUEST";

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

  // 동적 accentColor — isBuyer 여부에 따라 런타임 결정
  const accentColor: string = isBuyer ? "#0d9488" : "var(--text-secondary)";
  const accentBg: string = isBuyer
    ? "rgba(13,148,136,0.08)"
    : "rgba(15,23,42,0.04)";
  const accentBorder: string = isBuyer
    ? "1px solid rgba(13,148,136,0.25)"
    : "1px solid rgba(15,23,42,0.10)";

  return (
    <div className="md-container">
      <div className="md-bento">

        {/* ── 프로필 카드 (full width) ── */}
        <div className="md-card md-bento-wide md-profile-card">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="프로필"
              width={52}
              height={52}
              className="md-avatar-img"
            />
          ) : (
            <div className="md-avatar-fallback">
              {displayName[0].toUpperCase()}
            </div>
          )}
          <div className="md-welcome-text">
            <h1 className="md-welcome-name">안녕하세요, {displayName}님</h1>
            <p className="md-welcome-email">
              {profile?.email || user?.email}
            </p>
          </div>
          {/* 역할 배지 — 동적 색상값이므로 inline style 허용 */}
          <span
            className="md-role-badge"
            style={{
              background: accentBg,
              color: accentColor,
              border: accentBorder,
            }}
          >
            {roleLabel}
          </span>
        </div>

        {/* ── 구매 상품 stat ── */}
        <div className="md-card">
          <p className="md-eyebrow">구매 상품</p>
          {/* 동적 accentColor → inline style 허용 */}
          <p className="md-stat-value" style={{ color: accentColor }}>
            {isBuyer ? "링크드롭" : "—"}
          </p>
          <p className="md-stat-sub">{isBuyer ? "이용권" : "미구매"}</p>
        </div>

        {/* ── 이용 일수 stat ── */}
        <div className="md-card">
          <p className="md-eyebrow">이용</p>
          {/* 고정 indigo 계열 — 동적 런타임 값 */}
          <p className="md-stat-value" style={{ color: "#6366f1" }}>
            {daysSince ? `${daysSince}일` : "—"}
          </p>
          <p className="md-stat-sub">
            {daysSince ? "함께하고 있어요" : "구매 전"}
          </p>
        </div>

        {/* ── 콘텐츠 이용 상태 (full width) ── */}
        <div className="md-card md-bento-wide">
          <div className="md-section-header"><h2>콘텐츠 이용 상태</h2></div>
          <LdStatusStepper steps={contentSteps} />
          {!isBuyer && (
            <div className="md-upsell-box">
              <p className="md-upsell-text">
                아직 이용권을 구매하지 않으셨습니다.
              </p>
              <button
                onClick={() => router.push("/landing/senior-online-business")}
                className="md-upsell-btn"
              >
                이용권 구매하기
              </button>
            </div>
          )}
          {isBuyer && (
            <div className="md-active-box">
              <p className="md-active-text">
                콘텐츠 이용 중입니다.{" "}
                <a href="/member/content" className="md-active-link">
                  콘텐츠 보기 →
                </a>
              </p>
            </div>
          )}
        </div>

        {/* ── 계정 정보 (full width) ── */}
        <div className="md-card md-bento-wide">
          <div className="md-section-header"><h2>계정 정보</h2></div>
          <div className="md-info-list">
            <div className="md-info-row">
              <span className="md-info-label">이메일</span>
              <span className="md-info-value">
                {profile?.email || user?.email || "—"}
              </span>
            </div>
            <div className="md-info-row">
              <span className="md-info-label">로그인 방식</span>
              <span className="md-info-value">
                {profile?.provider === "google" ||
                user?.app_metadata?.provider === "google"
                  ? "Google"
                  : profile?.provider === "kakao" ||
                    user?.app_metadata?.provider === "kakao"
                  ? "카카오"
                  : "소셜 로그인"}
              </span>
            </div>
            <div className="md-info-row">
              <span className="md-info-label">가입일</span>
              <span className="md-info-value">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("ko-KR")
                  : "—"}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="md-skeleton-container">
      <div className="md-bento">
        <div
          className="md-skeleton-block md-bento-wide"
          style={{ height: 88 }}
        />
        <div className="md-skeleton-block" style={{ height: 110 }} />
        <div className="md-skeleton-block" style={{ height: 110 }} />
        <div
          className="md-skeleton-block md-bento-wide"
          style={{ height: 140 }}
        />
        <div
          className="md-skeleton-block md-bento-wide"
          style={{ height: 120 }}
        />
      </div>
    </div>
  );
}
