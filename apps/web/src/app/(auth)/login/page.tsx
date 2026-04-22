"use client";

// ============================================================
// 로그인 페이지 — 이메일 + 비밀번호 인증
// Supabase auth.signInWithPassword 사용
// 성공 시 /member/dashboard 이동
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // 비밀번호 보기/숨기기 토글 상태
  const [showPw, setShowPw] = useState(false);
  // 로딩 중 상태 — 버튼 스피너 표시용
  const [isLoading, setIsLoading] = useState(false);
  // 에러 메시지 상태
  const [error, setError] = useState("");

  // 로그인 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (authError) {
      // 에러 코드에 상관없이 한국어 메시지로 통일 (보안상 상세 이유 노출 금지)
      setError("이메일 또는 비밀번호가 올바르지 않습니다");
      return;
    }

    // 로그인 성공 — 구매자 대시보드로 이동
    router.push("/member/dashboard");
  };

  return (
    // ld-glass 카드 컨테이너 — 최대 너비 384px (sm)
    <div
      className="ld-glass"
      style={{
        width: "100%",
        maxWidth: 384,
        borderRadius: 20,
        padding: "40px 32px",
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      {/* 페이지 제목 */}
      <h1
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontWeight: 700,
          fontSize: 24,
          color: "var(--text-primary)",
          marginBottom: 32,
          textAlign: "center",
        }}
      >
        로그인
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 이메일 입력 */}
        <div>
          <label
            htmlFor="email"
            style={{
              display: "block",
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@email.com"
            style={{
              width: "100%",
              height: 48, // 터치 타깃 최소 48px 준수
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "var(--text-primary)",
              fontSize: 18, // 시니어 가독성 최소 18px
              padding: "0 14px",
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* 비밀번호 입력 + 보기/숨기기 토글 */}
        <div>
          <label
            htmlFor="password"
            style={{
              display: "block",
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            비밀번호
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="비밀번호 입력"
              style={{
                width: "100%",
                height: 48,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "var(--text-primary)",
                fontSize: 18,
                padding: "0 48px 0 14px", // 우측 버튼 공간 확보
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {/* 비밀번호 보기/숨기기 토글 버튼 */}
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                padding: 4,
              }}
              aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* 에러 메시지 표시 영역 */}
        {error && (
          <p
            style={{
              color: "#ef4444",
              fontSize: 14,
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              margin: 0,
              padding: "8px 12px",
              backgroundColor: "rgba(239,68,68,0.1)",
              borderRadius: 8,
            }}
            role="alert"
          >
            {error}
          </p>
        )}

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            height: 56, // 터치 타깃 56px — 주요 CTA 버튼은 더 크게
            borderRadius: 12,
            backgroundColor: isLoading ? "rgba(0,85,255,0.5)" : "#0055FF",
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 8,
            transition: "background-color 0.2s",
          }}
        >
          {isLoading ? (
            <>
              {/* 로딩 스피너 (CSS 애니메이션) */}
              <span
                style={{
                  width: 20,
                  height: 20,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#ffffff",
                  borderRadius: "50%",
                  animation: "ld-spin 0.8s linear infinite",
                  display: "inline-block",
                }}
              />
              로그인 중...
            </>
          ) : (
            "로그인"
          )}
        </button>
      </form>

      {/* 하단 링크 — 회원가입 / 비밀번호 찾기 */}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <a
          href="/signup"
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 14,
            color: "var(--accent-neon)",
            textDecoration: "none",
          }}
        >
          회원가입
        </a>
        <a
          href="/forgot-password"
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 14,
            color: "var(--text-secondary)",
            textDecoration: "none",
          }}
        >
          비밀번호 찾기
        </a>
      </div>

    </div>
  );
}
