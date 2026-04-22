"use client";

// ============================================================
// (partner) 라우트 그룹 레이아웃 — 파트너 수당 대시보드
// 사이드바: 수당 현황 / 파트너 네트워크
// ============================================================

import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  { label: "수당 현황", href: "/partner/earnings", icon: "💰" },
  { label: "파트너 네트워크", href: "/partner/network", icon: "🌐" },
];

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      {/* 상단 헤더 */}
      <header
        style={{
          height: 60,
          backgroundColor: "var(--bg-surface)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <a href="/" style={{ fontFamily: '"Montserrat", "Pretendard Variable", "Pretendard", sans-serif', fontWeight: 700, fontSize: 20, color: "var(--accent-neon)", textDecoration: "none", letterSpacing: "0.05em" }}>
          LINKDROP
        </a>
        <span style={{ fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif", fontSize: 14, color: "#FF8800", fontWeight: 600 }}>
          파트너 센터
        </span>
      </header>

      <div style={{ display: "flex", flex: 1 }}>
        {/* 사이드바 */}
        <aside className="partner-sidebar" style={{ width: 240, backgroundColor: "var(--bg-surface)", borderRight: "1px solid rgba(255,255,255,0.08)", padding: "24px 0", flexShrink: 0 }}>
          <nav>
            {MENU_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 24px",
                    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                    fontSize: 16,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#FF8800" : "var(--text-secondary)",
                    textDecoration: "none",
                    backgroundColor: isActive ? "rgba(255,136,0,0.08)" : "transparent",
                    borderLeft: isActive ? "3px solid #FF8800" : "3px solid transparent",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <main style={{ flex: 1, padding: "32px 24px", paddingBottom: 80, overflowX: "hidden" }}>
          {children}
        </main>
      </div>

      {/* 모바일 탭바 */}
      <nav className="partner-tabbar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, backgroundColor: "var(--bg-surface)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", zIndex: 40 }}>
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a key={item.href} href={item.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, textDecoration: "none", color: isActive ? "#FF8800" : "var(--text-secondary)" }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif", fontSize: 11, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
            </a>
          );
        })}
      </nav>

    </div>
  );
}
