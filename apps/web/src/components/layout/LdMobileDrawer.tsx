"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import LgThemeToggle from "@/components/lg/LgThemeToggle";
import { useSession } from "@/hooks/useSession";

const MARKETING_NAV = [
  { label: "서비스소개", href: "/about" },
  { label: "온라인부업", href: "/landing/senior-online-business" },
  { label: "웹소설", href: "/landing/webnovel-writer" },
  { label: "영상자동화", href: "/landing/expert-video" },
];

const MEMBER_GUEST = [
  { label: "대시보드",    href: "/member/dashboard", icon: "🏠" },
  { label: "구매 콘텐츠", href: "/member/content",   icon: "📦" },
];

const MEMBER_PARTNER_EXTRA = [
  { label: "랜딩페이지",  href: "/partner/mylanding", icon: "🚀" },
  { label: "수당 현황",   href: "/partner/earnings",  icon: "💰" },
  { label: "파트너 목록", href: "/partner/network",   icon: "🌐" },
];

const PARTNER_MENU = [
  { label: "대시보드",    href: "/member/dashboard",  icon: "🏠" },
  { label: "구매 콘텐츠", href: "/member/content",    icon: "📦" },
  { label: "랜딩페이지",  href: "/partner/mylanding", icon: "🚀" },
  { label: "수당 현황",   href: "/partner/earnings",  icon: "💰" },
  { label: "파트너 목록", href: "/partner/network",   icon: "🌐" },
];

const INSTRUCTOR_MENU = [
  { label: "강의 관리", href: "/instructor/courses",  icon: "📖" },
  { label: "수강생",   href: "/instructor/students", icon: "👥" },
];

interface LdMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  variant: "marketing" | "user";
  showToggle?: boolean;
}

export default function LdMobileDrawer({
  isOpen,
  onClose,
  variant,
  showToggle = false,
}: LdMobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const { role } = useSession();

  const isBuyer = role === "partner" || role === "gold_partner" || role === "instructor" || role === "admin";

  // 라우트 이동 시 자동 닫힘
  useEffect(() => {
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Escape 키 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`ld-drawer-overlay${isOpen ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 드로어 패널 */}
      <nav
        id="ld-mobile-drawer"
        className={`ld-drawer-panel${isOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="모바일 메뉴"
      >
        {/* 헤더 */}
        <div className="ld-drawer-head">
          <a href="/" onClick={() => onClose()} style={{ display: "flex" }}>
            <Image
              src="/img/logo.png"
              alt="LinkDrop"
              width={120}
              height={33}
              style={{ objectFit: "contain" }}
              priority
            />
          </a>
          <button
            ref={firstFocusRef}
            className="ld-hamburger-btn"
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            <span className="ld-ham-icon" aria-hidden="true">
              <span className="ld-ham-bar" style={{ transform: "translateY(7px) rotate(45deg)" }} />
              <span className="ld-ham-bar" style={{ opacity: 0 }} />
              <span className="ld-ham-bar" style={{ transform: "translateY(-7px) rotate(-45deg)" }} />
            </span>
          </button>
        </div>

        {/* 메뉴 본문 */}
        {variant === "marketing" && (
          <>
            {MARKETING_NAV.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <button
                  key={item.href}
                  className={`ld-drawer-item${isActive ? " active" : ""}`}
                  onClick={() => navigate(item.href)}
                >
                  {item.label}
                </button>
              );
            })}
            <div className="ld-drawer-divider" />
          </>
        )}

        {variant === "user" && (
          <>
            {(() => {
              const menu = pathname.startsWith("/member")
                ? (isBuyer ? [...MEMBER_GUEST, ...MEMBER_PARTNER_EXTRA] : MEMBER_GUEST)
                : pathname.startsWith("/partner")
                ? PARTNER_MENU
                : pathname.startsWith("/instructor")
                ? INSTRUCTOR_MENU
                : [{ label: "마이페이지", href: "/member/dashboard", icon: "🏠" }];

              return menu.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    className={`ld-drawer-item${isActive ? " active" : ""}`}
                    onClick={() => navigate(item.href)}
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              });
            })()}
            <div className="ld-drawer-divider" />
          </>
        )}

        {/* 푸터 */}
        <div className="ld-drawer-footer">
          {variant === "marketing" && (
            <>
              <button
                className="ld-drawer-item ld-cta-target"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 999,
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.7)",
                  padding: "0 20px",
                  width: "100%",
                }}
                onClick={() => navigate("/login")}
              >
                로그인
              </button>
              <button
                className="ld-cta-target"
                style={{
                  borderRadius: 999,
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  background: "var(--accent-neon)",
                  color: "#010828",
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => navigate("/signup")}
              >
                시작하기
              </button>
            </>
          )}

          {variant === "user" && (
            <form action="/auth/logout" method="POST" style={{ width: "100%" }}>
              <button
                type="submit"
                className="ld-drawer-item ld-cta-target"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 999,
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.7)",
                  padding: "0 20px",
                  width: "100%",
                }}
              >
                로그아웃
              </button>
            </form>
          )}

          {showToggle && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif", fontSize: 16, color: "var(--text-secondary)" }}>
                테마
              </span>
              <LgThemeToggle />
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
