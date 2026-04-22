"use client";

// ============================================================
// LdNavHeader — 랜딩 페이지 공통 헤더
// sticky top-0, 스크롤 시 .ld-glass 배경 강화
// 테마 토글 (Sun/Moon), 모바일 햄버거 메뉴
// height: 64px, 한글 메뉴는 Pretendard
// ============================================================

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu } from "lucide-react";
import navData from "@/data/nav.json";
import externalLinks from "@/data/external-links.json";
import LdMobileNav from "./LdMobileNav";

export default function LdNavHeader() {
  // 스크롤 여부 감지 — true면 배경 강화
  const [scrolled, setScrolled] = useState(false);
  // 모바일 메뉴 열림 상태
  const [mobileOpen, setMobileOpen] = useState(false);
  // 클라이언트 마운트 확인 (next-themes hydration 방지)
  const [mounted, setMounted] = useState(false);

  const { theme, setTheme } = useTheme();

  // 마운트 후에만 테마 관련 UI 렌더 (서버-클라이언트 불일치 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 스크롤 감지 — 20px 이상 내려가면 배경 강화
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 다크/라이트 토글
  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
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
          // 스크롤 전: 투명 / 스크롤 후: ld-glass 클래스로 처리
          background: scrolled ? undefined : "transparent",
          transition: "background 300ms ease",
          fontFamily: "Pretendard Variable, Pretendard, sans-serif",
        }}
      >
        {/* 내부 최대 너비 컨테이너 */}
        <div
          style={{
            width: "100%",
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          {/* 로고 — Montserrat Bold 영문 전용 */}
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

          {/* 데스크톱 메뉴 — 768px 이상에서 표시 */}
          <nav
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
            className="hidden md:flex"
          >
            {navData.items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  fontSize: "15px",
                  fontWeight: 500,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  transition: "color 200ms ease",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLAnchorElement).style.color =
                    "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLAnchorElement).style.color =
                    "var(--text-secondary)")
                }
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* 우측 액션 영역 */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {/* 테마 토글 버튼 — 마운트 후에만 렌더 */}
            {mounted && (
              <button
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  padding: "8px",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  // 터치 타깃 최소 44px
                  minWidth: "40px",
                  minHeight: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "border-color 200ms ease, color 200ms ease",
                }}
              >
                {/* 다크 모드: Sun 아이콘 / 라이트 모드: Moon 아이콘 */}
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}

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
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px",
                padding: "8px",
                cursor: "pointer",
                color: "var(--text-primary)",
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

      {/* 모바일 풀스크린 메뉴 오버레이 */}
      <LdMobileNav
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
    </>
  );
}
