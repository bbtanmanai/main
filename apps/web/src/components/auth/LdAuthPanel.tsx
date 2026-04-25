// ============================================================
// LdAuthPanel — 인증 모달/바텀시트 공통 내부 컨텐츠
// 카카오(위) → 구글(아래) 순서
// 하단: 약관/개인정보 링크 + 서킷브레이커(전화번호)
// ============================================================

"use client";
import LdSocialButtonKakao from "./LdSocialButtonKakao";
import LdSocialButtonGoogle from "./LdSocialButtonGoogle";

interface LdAuthPanelProps {
  onClose: () => void;
  redirectTo?: string;
}

export default function LdAuthPanel({ onClose, redirectTo }: LdAuthPanelProps) {
  return (
    <div style={{ position: "relative" }}>
      {/* X 닫기 버튼 */}
      <button
        onClick={onClose}
        className="ld-auth-close-btn"
        aria-label="닫기"
      >
        ×
      </button>

      {/* 제목 */}
      <h2
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color: "var(--color-text)",
          marginBottom: 6,
          textAlign: "center",
        }}
      >
        시작하기
      </h2>
      <p
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 14,
          color: "var(--color-text-muted)",
          textAlign: "center",
          marginBottom: 28,
        }}
      >
        소셜 계정으로 간편하게 로그인하세요
      </p>

      {/* 소셜 버튼 영역 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* 카카오 먼저 (한국 사용자 최우선) */}
        <LdSocialButtonKakao redirectTo={redirectTo} />
        {/* 구글 */}
        <LdSocialButtonGoogle redirectTo={redirectTo} />
      </div>

      {/* 약관 안내 */}
      <p
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 12,
          color: "var(--color-text-subtle)",
          textAlign: "center",
          marginTop: 20,
          lineHeight: 1.6,
        }}
      >
        로그인 시{" "}
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent-aqua)", textDecoration: "underline" }}
        >
          이용약관
        </a>
        {" "}및{" "}
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent-aqua)", textDecoration: "underline" }}
        >
          개인정보처리방침
        </a>
        에 동의하는 것으로 간주합니다.
      </p>

      {/* 서킷브레이커: 로그인 실패 시 대체 연락처 */}
      <p
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 12,
          color: "var(--color-text-subtle)",
          textAlign: "center",
          marginTop: 10,
        }}
      >
        로그인 문제?{" "}
        <a
          href="tel:1588-0000"
          style={{ color: "var(--color-text-muted)", textDecoration: "none" }}
        >
          1588-0000
        </a>
        {" "}또는{" "}
        <a
          href="mailto:help@linkdrop.kr"
          style={{ color: "var(--color-text-muted)", textDecoration: "none" }}
        >
          help@linkdrop.kr
        </a>
      </p>
    </div>
  );
}
