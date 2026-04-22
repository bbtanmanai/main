"use client";

// ============================================================
// (admin) 라우트 그룹 레이아웃 — CRM 관리자 패널
// role=admin 체크 (실제 Supabase 연결 후 redirect 활성화)
// 사이드바: 회원 목록 / 주문 목록 / 파트너 관리
// ============================================================

import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  { label: "회원 목록",   href: "/admin/users",    icon: "👤" },
  { label: "주문 목록",   href: "/admin/orders",   icon: "🛒" },
  { label: "파트너 관리", href: "/admin/partners", icon: "🤝" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      {/* 상단 헤더 */}
      <header
        style={{
          height: 60,
          backgroundColor: "#0f172a", // 관리자 전용 진한 네이비
          borderBottom: "1px solid rgba(239,68,68,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <a href="/" style={{ fontFamily: '"Montserrat", "Pretendard Variable", "Pretendard", sans-serif', fontWeight: 700, fontSize: 20, color: "#ef4444", textDecoration: "none", letterSpacing: "0.05em" }}>
          LINKDROP
        </a>
        <span
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 13,
            color: "#ef4444",
            fontWeight: 700,
            padding: "4px 10px",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: 6,
            letterSpacing: "0.05em",
          }}
        >
          ADMIN
        </span>
      </header>

      <div style={{ display: "flex", flex: 1 }}>
        {/* 사이드바 */}
        <aside
          className="admin-sidebar"
          style={{
            width: 240,
            backgroundColor: "#0f172a",
            borderRight: "1px solid rgba(239,68,68,0.1)",
            padding: "24px 0",
            flexShrink: 0,
          }}
        >
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
                    color: isActive ? "#ef4444" : "rgba(255,255,255,0.5)",
                    textDecoration: "none",
                    backgroundColor: isActive ? "rgba(239,68,68,0.08)" : "transparent",
                    borderLeft: isActive ? "3px solid #ef4444" : "3px solid transparent",
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
      <nav
        className="admin-tabbar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: "#0f172a",
          borderTop: "1px solid rgba(239,68,68,0.2)",
          display: "flex",
          zIndex: 40,
        }}
      >
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a key={item.href} href={item.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, textDecoration: "none", color: isActive ? "#ef4444" : "rgba(255,255,255,0.4)" }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif", fontSize: 11, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
            </a>
          );
        })}
      </nav>

    </div>
  );
}
