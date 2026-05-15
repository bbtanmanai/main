"use client";

import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import LgBackground from "./LgBackground";
import LgThemeToggle from "./LgThemeToggle";

export interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  divider?: boolean;
}

interface LgShellProps {
  children: React.ReactNode;
  title: string;
  accentColor: string;
  accentBgActive: string;
  sidebarCls: string;
  tabbarCls: string;
  menuItems: MenuItem[];
  noHeader?: boolean;
  a4Main?: boolean;
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
  a4Main = false,
}: LgShellProps) {
  const pathname = usePathname();

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <LgBackground />

      {!noHeader && (
        <header
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

      <div
        style={{
          display: "flex",
          flex: 1,
          position: "relative",
          zIndex: 1,
          paddingTop: noHeader ? 64 : 0,
        }}
      >
        <div
          className="lg-shell-inner"
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            width: "100%",
            display: "flex",
            flex: 1,
            paddingTop: 50,
          }}
        >
          {/* 사이드바 */}
          <aside
            className={`${sidebarCls} lg-sidebar-glass`}
            style={{
              width: 240,
              padding: "16px 0",
              flexShrink: 0,
              borderRadius: "16px 16px 0 0",
            }}
          >
            <nav style={{ display: "contents" }}>
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <div key={item.href} style={{ display: "contents" }}>
                    {item.divider && (
                      <div
                        style={{
                          margin: "8px 20px",
                          borderTop: "1px solid var(--shell-divider)",
                        }}
                      />
                    )}
                    <a
                      href={item.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "11px 14px",
                        margin: "2px 12px",
                        borderRadius: 4,
                        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                        fontSize: 15,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? accentColor : "var(--text-secondary)",
                        textDecoration: "none",
                        backgroundColor: isActive ? accentBgActive : "transparent",
                        transition: "background-color 0.15s ease, color 0.15s ease",
                        cursor: "pointer",
                      }}
                    >
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                      {item.label}
                    </a>
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* 메인 콘텐츠 */}
          <main
            style={{
              flex: 1,
              padding: a4Main ? 0 : "32px 24px",
              paddingBottom: a4Main ? 0 : 80,
              overflowX: "hidden",
              display: a4Main ? "flex" : undefined,
              flexDirection: a4Main ? "column" : undefined,
            }}
          >
            {a4Main ? (
              <div className="lg-a4-main">{children}</div>
            ) : children}
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
          const Icon = item.icon;
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
                gap: 3,
                padding: "0 4px",
                textDecoration: "none",
                color: isActive ? accentColor : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
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
