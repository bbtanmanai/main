// ============================================================
// LdSocialButtonGoogle — Google OAuth 소셜 로그인 버튼
// Supabase signInWithOAuth + /auth/callback Route Handler 연동
// ============================================================

"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LdSocialButtonGoogle({
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
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    // signInWithOAuth는 페이지를 redirect하므로 setLoading(false) 불필요
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="ld-social-btn ld-social-btn--google"
      aria-label="Google로 계속하기"
    >
      {!loading && (
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"
          />
          <path
            fill="#FBBC05"
            d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.5-9.9l-7.8 6C6.6 42.6 14.6 48 24 48z"
          />
        </svg>
      )}
      {loading ? "연결 중..." : "Google로 계속하기"}
    </button>
  );
}
