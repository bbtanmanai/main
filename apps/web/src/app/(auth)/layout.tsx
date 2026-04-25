import LgBackground from "@/components/lg/LgBackground";

// GNB(LdGnb)가 루트 layout에서 sticky로 렌더되므로
// 기존 고정 로고 + LgThemeToggle 제거 — 중복 방지
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        position: "relative",
      }}
    >
      <LgBackground />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
