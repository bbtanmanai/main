"use client";

import { usePathname } from "next/navigation";
import LgBackground from "./LgBackground";
import LgThemeToggle from "./LgThemeToggle";

interface MenuItem {
  label: string;
  href: string;
  icon: string;
  divider?: boolean; // true: 이 항목 위에 구분선 렌더
}

interface LgShellProps {
  children: React.ReactNode;
  title: string;
  accentColor: string;
  accentBgActive: string;
  sidebarCls: string;
  tabbarCls: string;
  menuItems: MenuItem[];
  noHeader?: boolean; // true: GNB가 상단을 대체 — 내부 헤더 숨김 (member/partner/instructor 전용)
}

export default function LgShell({
  children,
  title,
  accentColor,
  accentBgActive,
  sidebarCls,
  tabbarCls,
  menuItems,
  noHeader = false,
}: LgShellProps) {
  const pathname = usePathname();

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <LgBackground />

      {/* 상단 헤더 — noHeader=true 시 GNB가 대체하므로 숨김 */}
      {!noHeader && (
        <header
          className="lg-header"
          style={{
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          <a
            href="/"
            style={{
              fontFamily: '"Montserrat", "Pretendard Variable", "Pretendard", sans-serif',
              fontWeight: 700,
              fontSize: 20,
              color: accentColor,
              textDecoration: "none",
              letterSpacing: "0.05em",
            }}
          >
            LINKDROP
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                fontSize: 14,
                color: accentColor,
                fontWeight: 600,
              }}
            >
              {title}
            </span>
            <LgThemeToggle />
          </div>
        </header>
      )}

      <div style={{ display: "flex", flex: 1, position: "relative", zIndex: 1, paddingTop: noHeader ? 64 : 0 }}>
        <div className="lg-shell-inner" style={{ maxWidth: 1000, margin: "0 auto", width: "100%", display: "flex", flex: 1, paddingTop: 50 }}>
        {/* 사이드바 — 데스크톱: 좌측 패널 / 모바일: 가로 스크롤 스트립 */}
        <aside
          className={`${sidebarCls} lg-sidebar-glass`}
          style={{ width: 240, padding: "24px 0", flexShrink: 0, borderRadius: "16px 16px 0 0" }}
        >
          <nav style={{ display: "contents" }}>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <div key={item.href} style={{ display: "contents" }}>
                  {item.divider && (
                    <div className="lg-sidebar-divider" style={{
                      margin: "8px 24px",
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                    }} />
                  )}
                  <a
                    href={item.href}
                    className={`lg-sidebar-item${isActive ? " active" : ""}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 24px",
                      fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                      fontSize: 16,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? accentColor : "var(--text-secondary)",
                      textDecoration: "none",
                      backgroundColor: isActive ? accentBgActive : "transparent",
                      borderLeft: isActive
                        ? `3px solid ${accentColor}`
                        : "3px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    {item.label}
                  </a>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* 메인 콘텐츠 */}
        <main style={{ flex: 1, padding: "32px 24px", paddingBottom: 80, overflowX: "hidden" }}>
          {children}
        </main>
        </div>
      </div>

      {/* 모바일 탭바 */}
      <nav
        className={`${tabbarCls} lg-tabbar-glass`}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          display: "flex",
          zIndex: 40,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                padding: "0 2px",
                textDecoration: "none",
                color: isActive ? accentColor : "var(--text-secondary)",
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span
                style={{
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  lineHeight: 1.2,
                  textAlign: "center",
                }}
              >
                {item.label}
              </span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
