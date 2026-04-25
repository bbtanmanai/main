import LgBackground from "@/components/lg/LgBackground";

// LD-008: (checkout)은 사용자 선택 테마 그대로 상속 (LD-002 번복 — 2026-04-24)
// GNB(LdGnb)가 루트 layout에서 sticky로 렌더되므로 기존 인라인 헤더 제거
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--bg-base)",
        position: "relative",
      }}
    >
      <LgBackground />

      <div style={{ position: "relative", zIndex: 1, paddingTop: 64 }}>
        {children}
      </div>
    </div>
  );
}
