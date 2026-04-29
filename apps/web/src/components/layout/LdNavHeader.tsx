"use client";

// ============================================================
// LdNavHeader — 랜딩 페이지 공통 헤더
// sticky top-0, 스크롤 시 .ld-glass 배경 강화
// 네비게이션: .glass.glass-nav 필 + .glass-nav__item (링크드랍 디자인 시스템)
// 다크테마 고정 — 테마 토글 없음
// ============================================================

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import navData from "@/data/nav.json";
import externalLinks from "@/data/external-links.json";
import LdMobileNav from "./LdMobileNav";

export default function LdNavHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pathname = usePathname();
  const isDarkHero = pathname === "/landing/landing1";
  const heroNav = isDarkHero && !scrolled;

  useEffect(() => {
    function handleScroll() { setScrolled(window.scrollY > 20); }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function isActive(href: string) {
    if (href.startsWith("#")) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      <header
        className={scrolled ? "ld-glass" : ""}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 80,
          height: "64px",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          background: scrolled ? undefined : "transparent",
          transition: "background 300ms ease",
          fontFamily: "Pretendard Variable, Pretendard, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          {/* 로고 */}
          <a
            href="/"
            style={{
              fontFamily: '"Montserrat", "Pretendard Variable", "Pretendard", sans-serif',
              fontWeight: 700,
              fontSize: "20px",
              color: "#6fff00",
              textDecoration: "none",
              letterSpacing: "-0.01em",
              flexShrink: 0,
            }}
          >
            {navData.logo}
          </a>

          {/* 데스크톱 nav pill — md 이상에서 표시 */}
          <nav
            className={heroNav ? "hidden md:flex" : "glass glass-nav hidden md:flex"}
            aria-label="메인 내비게이션"
            style={heroNav ? {
              flex: 1,
              justifyContent: "center",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.20)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderRadius: "9999px",
              padding: "4px",
            } : { flex: 1, justifyContent: "center" }}
          >
            {navData.items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={heroNav ? "" : `glass-nav__item${isActive(item.href) ? " glass-nav__item--active" : ""}`}
                style={heroNav ? {
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "9px 22px",
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                  fontWeight: isActive(item.href) ? 700 : 400,
                  textDecoration: "none",
                  color: isActive(item.href) ? "#fff" : "rgba(255,255,255,0.75)",
                  background: isActive(item.href) ? "rgba(255,255,255,0.20)" : "transparent",
                  border: isActive(item.href) ? "1px solid rgba(255,255,255,0.28)" : "1px solid transparent",
                  transition: "all 180ms ease",
                } : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* 우측 액션 영역 */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {/* CTA 버튼 — 데스크톱에서만 표시 */}
            <a
              href={externalLinks.kakao}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex"
              style={{
                background: "#6fff00",
                color: "#010828",
                padding: "10px 18px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "14px",
                alignItems: "center",
                transition: "opacity 200ms ease",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.85")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")
              }
            >
              {navData.cta.label}
            </a>

            {/* 모바일 햄버거 버튼 */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="메뉴 열기"
              className="flex md:hidden"
              style={{
                background: "transparent",
                border: heroNav ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px",
                padding: "8px",
                cursor: "pointer",
                color: heroNav ? "#fff" : "var(--text-primary)",
                minWidth: "40px",
                minHeight: "40px",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <LdMobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
