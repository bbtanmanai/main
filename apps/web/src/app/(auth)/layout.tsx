// ============================================================
// (auth) 라우트 그룹 레이아웃 — 로그인/회원가입 공통 레이아웃
// ThemeProvider는 root layout에서 이미 적용됨 — 상속됨
// 카드를 화면 중앙에 배치하는 컨테이너 역할
// ============================================================

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 전체 화면 높이, 배경색 CSS 변수 사용 (다크/라이트 모두 대응)
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      {/* 상단 로고 고정 영역 */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <a
          href="/"
          style={{
            fontFamily: '"Montserrat", "Pretendard Variable", "Pretendard", sans-serif',
            fontWeight: 700,
            fontSize: 28,
            color: "var(--accent-neon)",
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}
          aria-label="LinkDrop 홈으로"
        >
          LINKDROP
        </a>
      </div>

      {/* 인증 폼 카드 영역 */}
      {children}
    </div>
  );
}
