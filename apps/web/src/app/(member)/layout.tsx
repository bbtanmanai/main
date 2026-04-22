"use client";

// ============================================================
// (member) 라우트 그룹 레이아웃 — 구매자 마이페이지 공통
// 데스크톱: 240px 사이드바 + 콘텐츠 영역
// 모바일: 하단 탭바 + 콘텐츠 영역
// 다크/라이트 테마 CSS 변수 사용
// 미로그인 시 /login redirect (실제 Supabase 연결 후 활성화)
// ============================================================

import { usePathname } from "next/navigation";

// 사이드바 메뉴 항목 정의
const MENU_ITEMS = [
  { label: "대시보드", href: "/member/dashboard", icon: "🏠" },
  { label: "구매 콘텐츠", href: "/member/content", icon: "📦" },
  { label: "파트너 초대", href: "/member/referral", icon: "🤝" },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 상단 헤더 (로고 + 사용자 정보) */}
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
        <a
          href="/"
          style={{
            fontFamily: '"Montserrat", "Pretendard Variable", "Pretendard", sans-serif',
            fontWeight: 700,
            fontSize: 20,
            color: "var(--accent-neon)",
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}
        >
          LINKDROP
        </a>
        <span
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 14,
            color: "var(--text-secondary)",
          }}
        >
          마이페이지
        </span>
      </header>

      <div style={{ display: "flex", flex: 1 }}>
        {/* 사이드바 — 데스크톱만 표시 (CSS 미디어 쿼리) */}
        <aside
          className="member-sidebar"
          style={{
            width: 240,
            backgroundColor: "var(--bg-surface)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
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
                    color: isActive ? "var(--accent-neon)" : "var(--text-secondary)",
                    textDecoration: "none",
                    backgroundColor: isActive ? "rgba(111,255,0,0.08)" : "transparent",
                    borderLeft: isActive ? "3px solid var(--accent-neon)" : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* 메인 콘텐츠 영역 */}
        <main
          style={{
            flex: 1,
            padding: "32px 24px",
            // 모바일에서 하단 탭바 공간 확보
            paddingBottom: 80,
            overflowX: "hidden",
          }}
        >
          {children}
        </main>
      </div>

      {/* 모바일 하단 탭바 */}
      <nav
        className="member-tabbar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: "var(--bg-surface)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          zIndex: 40,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {MENU_ITEMS.map((item) => {
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
                gap: 3,
                textDecoration: "none",
                color: isActive ? "var(--accent-neon)" : "var(--text-secondary)",
              }}
            >
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span
                style={{
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
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
