"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const CENTER_MENU = [
  { label: "서비스소개", href: "/about" },
  { label: "온라인부업", href: "/landing/senior-online-business" },
  { label: "웹소설", href: "/landing/webnovel-writer" },
  { label: "영상자동화 과정", href: "/landing/expert-video" },
];

export default function LdGnb() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Supabase auth 상태 구독
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 스크롤 감지 → glass 효과 on/off
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 모바일 메뉴 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfileOpen(false);
    window.location.href = "/";
  }

  const userRole = user?.user_metadata?.role as string | undefined;
  const userName = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? "";
  const userInitial = userName.charAt(0).toUpperCase() || "U";

  return (
    <>
      <header
        className={scrolled ? "lg-header" : ""}
        style={{
          height: 60,
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          backgroundColor: scrolled ? undefined : "transparent",
          transition: "background 280ms ease, border-color 280ms ease",
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          {/* 로고 */}
          <a
            href="/"
            style={{
              fontFamily: '"Montserrat", "Pretendard Variable", "Pretendard", sans-serif',
              fontWeight: 700,
              fontSize: 20,
              color: "var(--accent-neon)",
              textDecoration: "none",
              letterSpacing: "0.05em",
              flexShrink: 0,
            }}
          >
            LINKDROP
          </a>

          {/* 센터 메뉴 — 데스크톱 (768px+) glass-nav 필 */}
          <nav
            className="glass glass-nav hidden md:flex"
            aria-label="메인 내비게이션"
            style={{ flex: 1, justifyContent: "center" }}
          >
            {CENTER_MENU.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`glass-nav__item${isActive ? " glass-nav__item--active" : ""}`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* 우측 영역 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {user ? (
              /* 로그인 상태 — 프로필 드롭다운 */
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px 6px 6px",
                    borderRadius: 999,
                    border: "1px solid var(--glass-border)",
                    background: "var(--glass-white)",
                    cursor: "pointer",
                    color: "var(--color-text)",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                    transition: "background 180ms ease",
                  }}
                  aria-label="프로필 메뉴"
                  aria-expanded={profileOpen}
                >
                  {/* 아바타 */}
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--accent-neon)",
                      color: "#010828",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {userInitial}
                  </span>
                  <span className="hidden md:block">{userName.split("@")[0]}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                    style={{
                      transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 200ms ease",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    <path d="M6 8L1 3h10L6 8z" />
                  </svg>
                </button>

                {/* 드롭다운 메뉴 */}
                {profileOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      minWidth: 160,
                      borderRadius: 12,
                      border: "1px solid var(--glass-border)",
                      background: "var(--glass-white-md)",
                      backdropFilter: "var(--blur-md)",
                      WebkitBackdropFilter: "var(--blur-md)",
                      boxShadow: "var(--shadow-float)",
                      overflow: "hidden",
                      zIndex: 100,
                    }}
                  >
                    <a href="/member/dashboard" style={dropdownItemStyle} onClick={() => setProfileOpen(false)}>
                      🏠 마이페이지
                    </a>
                    {(userRole === "partner" || userRole === "gold_partner" || userRole === "both") && (
                      <a href="/partner/earnings" style={dropdownItemStyle} onClick={() => setProfileOpen(false)}>
                        💰 파트너센터
                      </a>
                    )}
                    {(userRole === "instructor" || userRole === "both") && (
                      <a href="/instructor/courses" style={dropdownItemStyle} onClick={() => setProfileOpen(false)}>
                        📖 강사센터
                      </a>
                    )}
                    <div style={{ height: 1, background: "var(--glass-border-subtle)", margin: "4px 0" }} />
                    <button
                      onClick={handleSignOut}
                      style={{ ...dropdownItemStyle, width: "100%", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", color: "#ef4444" }}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* 비로그인 상태 */
              <>
                <a
                  href="/login"
                  className="hidden md:flex"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid var(--glass-border)",
                    background: "transparent",
                    color: "var(--color-text-muted)",
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                    alignItems: "center",
                    transition: "color 180ms ease, border-color 180ms ease",
                  }}
                >
                  로그인
                </a>
                <a
                  href="/signup"
                  className="hidden md:flex"
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    background: "var(--accent-neon)",
                    color: "#010828",
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "none",
                    alignItems: "center",
                    transition: "opacity 180ms ease",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.85")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}
                >
                  무료시작
                </a>
              </>
            )}

            {/* 모바일 햄버거 */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="메뉴 열기"
              className="flex md:hidden"
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                border: "1px solid var(--glass-border)",
                background: "var(--glass-white)",
                cursor: "pointer",
                color: "var(--color-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="2" y1="4.5" x2="16" y2="4.5" />
                <line x1="2" y1="9" x2="16" y2="9" />
                <line x1="2" y1="13.5" x2="16" y2="13.5" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 풀스크린 오버레이 */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "var(--bg-base)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* 오버레이 헤더 */}
          <div
            style={{
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              borderBottom: "1px solid var(--glass-border-subtle)",
            }}
          >
            <a
              href="/"
              onClick={() => setMobileOpen(false)}
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
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="메뉴 닫기"
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                border: "1px solid var(--glass-border)",
                background: "var(--glass-white)",
                cursor: "pointer",
                color: "var(--color-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="3" y1="3" x2="15" y2="15" />
                <line x1="15" y1="3" x2="3" y2="15" />
              </svg>
            </button>
          </div>

          {/* 메뉴 아이템 */}
          <nav style={{ flex: 1, padding: "24px 24px 0", display: "flex", flexDirection: "column", gap: 4 }}>
            {CENTER_MENU.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  borderRadius: 12,
                  color: pathname === item.href ? "var(--color-text)" : "var(--color-text-muted)",
                  fontWeight: pathname === item.href ? 700 : 500,
                  fontSize: 18,
                  textDecoration: "none",
                  background: pathname === item.href ? "var(--glass-white)" : "transparent",
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* 하단 액션 버튼 */}
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 12 }}>
            {user ? (
              <>
                <a href="/member/dashboard" onClick={() => setMobileOpen(false)} style={mobileActionStyle("outline")}>
                  마이페이지
                </a>
                <button onClick={handleSignOut} style={{ ...mobileActionStyle("outline"), background: "transparent", border: "1px solid #ef4444", color: "#ef4444", cursor: "pointer", width: "100%", fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif" }}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <a href="/login" onClick={() => setMobileOpen(false)} style={mobileActionStyle("outline")}>
                  로그인
                </a>
                <a href="/signup" onClick={() => setMobileOpen(false)} style={mobileActionStyle("primary")}>
                  무료시작
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const dropdownItemStyle: React.CSSProperties = {
  display: "block",
  padding: "10px 16px",
  color: "var(--color-text)",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 500,
  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
  transition: "background 150ms ease",
  whiteSpace: "nowrap",
};

function mobileActionStyle(variant: "primary" | "outline"): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "block",
    textAlign: "center",
    padding: "16px",
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 700,
    textDecoration: "none",
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
  };
  if (variant === "primary") {
    return { ...base, background: "var(--accent-neon)", color: "#010828", border: "none" };
  }
  return { ...base, background: "var(--glass-white)", border: "1px solid var(--glass-border)", color: "var(--color-text)" };
}
