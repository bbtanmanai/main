"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import LgThemeToggle from "@/components/lg/LgThemeToggle";
import { useSession } from "@/hooks/useSession";
import { NAV_ITEMS, findActiveNavIdx } from "./navItems";

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

  // accordion 열린 인덱스 관리 — 현재 pathname이 children에 있는 항목 초기 자동 펼침
  const [openAccordion, setOpenAccordion] = useState<Set<number>>(() => {
    const initialOpen = new Set<number>();
    NAV_ITEMS.forEach((item, i) => {
      if (item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))) {
        initialOpen.add(i);
      }
    });
    return initialOpen;
  });

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
              style={{ objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(255,255,255,0.95)) drop-shadow(0 0 16px rgba(255,255,255,0.6))" }}
              priority
              unoptimized
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

        {/* 메뉴 본문 — 마케팅 모드: accordion */}
        {variant === "marketing" && (
          <>
            {NAV_ITEMS.map((item, i) => {
              const isParentActive = findActiveNavIdx(NAV_ITEMS, pathname) === i;
              if (item.children) {
                const isOpen = openAccordion.has(i);
                return (
                  <div key={item.href}>
                    <button
                      className={`ld-drawer-accordion-toggle${isParentActive ? " active" : ""}${isOpen ? " open" : ""}`}
                      onClick={() => {
                        setOpenAccordion((prev) => {
                          const next = new Set(prev);
                          next.has(i) ? next.delete(i) : next.add(i);
                          return next;
                        });
                      }}
                    >
                      {item.label}
                      <svg
                        className="ld-drawer-chevron"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <div className={`ld-drawer-sub-list${isOpen ? " open" : ""}`}>
                      {item.children.map((sub) => {
                        const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + "/");
                        return (
                          <button
                            key={sub.href}
                            className={`ld-drawer-sub-item${isSubActive ? " active" : ""}`}
                            onClick={() => navigate(sub.href)}
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              // 서브 없는 항목
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
                className="ld-cta-target"
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 2,
                  justifyContent: "center",
                  display: "flex",
                  alignItems: "center",
                  color: "rgba(255,255,255,0.55)",
                  padding: "0 20px",
                  height: 52,
                  width: "100%",
                  background: "transparent",
                  fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                  fontSize: 16,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  transition: "color 0.18s ease, border-color 0.18s ease",
                }}
                onClick={() => window.dispatchEvent(new CustomEvent("ld-auth-open"))}
              >
                로그인
              </button>
              <button
                className="ld-cta-target"
                style={{
                  borderRadius: 2,
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  background: "#6fff00",
                  color: "#010828",
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                  height: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.18s ease",
                }}
                onClick={() => window.dispatchEvent(new CustomEvent("ld-auth-open"))}
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
