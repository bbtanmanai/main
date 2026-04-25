// ============================================================
// LdSocialButtonKakao — 카카오 OAuth 소셜 로그인 버튼
// Supabase signInWithOAuth + /auth/callback Route Handler 연동
// ============================================================

"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LdSocialButtonKakao({
  redirectTo,
}: {
  redirectTo?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const callbackUrl = `${origin}/auth/callback${
      redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""
    }`;
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: callbackUrl },
    });
    // signInWithOAuth는 페이지를 redirect하므로 setLoading(false) 불필요
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="ld-social-btn ld-social-btn--kakao"
      aria-label="카카오로 계속하기"
    >
      {!loading && (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#3C1E1E"
            d="M12 3C6.48 3 2 6.69 2 11.25c0 2.91 1.87 5.47 4.69 6.98l-.97 3.6c-.08.3.26.54.52.37L10.8 19.7A11.7 11.7 0 0 0 12 19.5c5.52 0 10-3.69 10-8.25S17.52 3 12 3z"
          />
        </svg>
      )}
      {loading ? "연결 중..." : "카카오로 계속하기"}
    </button>
  );
}
