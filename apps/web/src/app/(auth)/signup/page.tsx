"use client";

// ============================================================
// 회원가입 페이지 — 이름 + 이메일 + 비밀번호 + 약관 동의
// Supabase auth.signUp 사용
// 성공 시 이메일 확인 안내 메시지 표시
// ============================================================

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  // 이용약관 동의 체크박스 상태
  const [agreed, setAgreed] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // 가입 성공 후 이메일 안내 메시지 표시용
  const [success, setSuccess] = useState(false);

  // 회원가입 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 비밀번호 길이 검증 (8자 이상)
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다");
      return;
    }

    // 비밀번호 일치 검증
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    // 약관 동의 여부 확인
    if (!agreed) {
      setError("이용약관에 동의해 주세요");
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 사용자 이름을 메타데이터로 저장 (프로필 페이지에서 사용)
        data: { name },
      },
    });

    setIsLoading(false);

    if (authError) {
      // 이미 가입된 이메일 등 에러 처리
      if (authError.message.includes("already registered")) {
        setError("이미 가입된 이메일 주소입니다");
      } else {
        setError("회원가입 중 오류가 발생했습니다. 다시 시도해 주세요");
      }
      return;
    }

    // 가입 성공 — 이메일 확인 안내
    setSuccess(true);
  };

  // 가입 성공 후 이메일 확인 안내 화면
  if (success) {
    return (
      <div
        className="ld-glass"
        style={{
          width: "100%",
          maxWidth: 384,
          borderRadius: 20,
          padding: "40px 32px",
          textAlign: "center",
          backgroundColor: "rgba(255,255,255,0.03)",
        }}
      >
        {/* 성공 체크 아이콘 */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "rgba(16,185,129,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#10b981">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
        <h2
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: "var(--text-primary)",
            marginBottom: 12,
          }}
        >
          이메일을 확인해 주세요
        </h2>
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 16,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          {email}로 이메일 확인 링크를 보내드렸습니다.
          <br />
          링크를 클릭하면 가입이 완료됩니다.
        </p>
        <a
          href="/login"
          style={{
            display: "block",
            height: 48,
            lineHeight: "48px",
            borderRadius: 10,
            backgroundColor: "#0055FF",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            textDecoration: "none",
            textAlign: "center",
          }}
        >
          로그인으로 이동
        </a>
      </div>
    );
  }

  return (
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
        회원가입
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 이름 입력 */}
        <div>
          <label
            htmlFor="name"
            style={{
              display: "block",
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            이름
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="홍길동"
            style={inputStyle}
          />
        </div>

        {/* 이메일 입력 */}
        <div>
          <label htmlFor="email" style={labelStyle}>이메일</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@email.com"
            style={inputStyle}
          />
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <label htmlFor="password" style={labelStyle}>비밀번호 (8자 이상)</label>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="8자 이상 입력"
              style={{ ...inputStyle, paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={pwToggleStyle}
              aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* 비밀번호 확인 입력 */}
        <div>
          <label htmlFor="passwordConfirm" style={labelStyle}>비밀번호 확인</label>
          <div style={{ position: "relative" }}>
            <input
              id="passwordConfirm"
              type={showPwConfirm ? "text" : "password"}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              placeholder="비밀번호 재입력"
              style={{ ...inputStyle, paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPwConfirm(!showPwConfirm)}
              style={pwToggleStyle}
              aria-label={showPwConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPwConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* 이용약관 동의 체크박스 */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{
              width: 20,
              height: 20,
              marginTop: 2,
              accentColor: "#0055FF",
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontSize: 18, // 시니어 가독성
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            링크드롭{" "}
            <a
              href="/terms"
              target="_blank"
              style={{ color: "var(--accent-neon)", textDecoration: "underline" }}
            >
              이용약관
            </a>
            {" "}및{" "}
            <a
              href="/privacy"
              target="_blank"
              style={{ color: "var(--accent-neon)", textDecoration: "underline" }}
            >
              개인정보처리방침
            </a>
            에 동의합니다
          </span>
        </label>

        {/* 에러 메시지 */}
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

        {/* 회원가입 버튼 */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            height: 56,
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
          }}
        >
          {isLoading ? (
            <>
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
              가입 중...
            </>
          ) : (
            "회원가입"
          )}
        </button>
      </form>

      {/* 로그인 링크 */}
      <p
        style={{
          marginTop: 24,
          textAlign: "center",
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 14,
          color: "var(--text-secondary)",
        }}
      >
        이미 계정이 있으신가요?{" "}
        <a
          href="/login"
          style={{ color: "var(--accent-neon)", textDecoration: "none" }}
        >
          로그인
        </a>
      </p>

    </div>
  );
}

// ── 공통 인라인 스타일 상수 ────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.15)",
  backgroundColor: "rgba(255,255,255,0.05)",
  color: "var(--text-primary)",
  fontSize: 18,
  padding: "0 14px",
  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

const pwToggleStyle: React.CSSProperties = {
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
};
