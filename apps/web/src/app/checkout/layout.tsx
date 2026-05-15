import LgBackground from "@/components/lg/LgBackground";

// 🔒 LD-012: checkout = 라이트 테마 강제 (가독성·결제 신뢰성 목적, LD-008 번복 — 2026-05-08)
// GNB(LdGnb)가 루트 layout에서 sticky로 렌더되므로 기존 인라인 헤더 제거
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="light"
      style={{
        minHeight: "100dvh",
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
