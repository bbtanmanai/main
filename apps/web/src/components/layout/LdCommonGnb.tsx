"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import LgThemeToggle from "@/components/lg/LgThemeToggle";
import LdMobileDrawer from "./LdMobileDrawer";
import { useEffect, useRef, useCallback } from "react";
import { useSession } from "@/hooks/useSession";

// 🔒 LD-006: liquid-glass는 단일 CSS 클래스, JS 분기 금지
// 중앙 내비게이션 메뉴 항목
const NAV_ITEMS = [
  { label: "서비스소개", href: "/about" },
  { label: "웹소설",     href: "/landing/landing1" },
  { label: "AI클래스",   href: "/landing/landing4" },
  { label: "영상제작",   href: "/landing/landing5" },
];

export default function LdCommonGnb({
  showToggle = false,
  drawerVariant = "marketing",
}: {
  showToggle?: boolean;
  drawerVariant?: "marketing" | "user";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, loading } = useSession();

  const glareRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const navBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isFirstRender = useRef(true);

  // pathname 기반 active 인덱스
  const activeNavIdx = NAV_ITEMS.findIndex(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  // pill 위치 업데이트 — 버튼 기준 절대 좌표 계산 (데스크톱에서만)
  const updatePill = useCallback((idx: number) => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    const btn = navBtnRefs.current[idx];
    const pill = pillRef.current;
    if (!btn || !pill) return;
    const btnRect = btn.getBoundingClientRect();
    const parentRect = btn.parentElement!.getBoundingClientRect();
    pill.style.left = `${btnRect.left - parentRect.left}px`;
    pill.style.width = `${btnRect.width}px`;
    pill.style.opacity = "1";
  }, []);

  // pathname 변경 시 pill 위치 갱신 (60ms 지연 — 레이아웃 완료 후 계산)
  useEffect(() => {
    const idx = activeNavIdx;
    if (idx < 0) {
      if (pillRef.current) pillRef.current.style.opacity = "0";
      return;
    }
    const timer = setTimeout(() => {
      if (isFirstRender.current) {
        const pill = pillRef.current;
        if (pill) pill.style.transition = "none";
        updatePill(idx);
        requestAnimationFrame(() => {
          if (pillRef.current) {
            pillRef.current.style.transition = "";
          }
        });
        isFirstRender.current = false;
      } else {
        updatePill(idx);
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [activeNavIdx, updatePill, pathname]);

  // 브라우저 리사이즈 시 pill 재계산 (768px 이상일 때만)
  useEffect(() => {
    const onResize = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 768 && activeNavIdx >= 0) {
        updatePill(activeNavIdx);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeNavIdx, updatePill]);

  // 마우스 위치 기반 glare 광원 효과
  const handleNavMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const glare = glareRef.current;
    if (!glare) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    glare.style.left = `${x}%`;
    glare.style.top = `${y}%`;
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        zIndex: 80,
        width: "100%",
        display: "flex",
        alignItems: "center",
        padding: "10px 24px",
        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* 좌측 로고 */}
        <a href="/" style={{ flexShrink: 0 }}>
          <Image
            src="/img/logo.png"
            alt="LinkDrop"
            width={256}
            height={70}
            sizes="160px"
            style={{ objectFit: "contain", width: "160px", height: "44px" }}
            priority
          />
        </a>

        {/* 중앙 liquid-nav — 데스크톱(md+)에서만 표시 */}
        <nav
          className="hidden md:flex liquid-nav"
          onMouseMove={handleNavMouseMove}
          style={{ flex: "0 1 50%", margin: "0 24px" }}
        >
          {/* glare 광원 컨테이너 */}
          <div className="liquid-glare-container">
            <div ref={glareRef} className="liquid-glare" />
          </div>
          <div
            className="liquid-nav-items"
            style={{ justifyContent: "center", flex: 1 }}
          >
            {/* 슬라이딩 pill 배경 */}
            <div ref={pillRef} className="liquid-active-pill" />
            {NAV_ITEMS.map((item, i) => (
              <button
                key={item.href}
                ref={(el) => {
                  navBtnRefs.current[i] = el;
                }}
                onClick={() => router.push(item.href)}
                className={`liquid-nav-btn${activeNavIdx === i ? " active" : ""}`}
                style={{
                  fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
                  fontSize: "15px",
                  color: "var(--lnav-icon-color)",
                }}
              >
                <div className="liquid-btn-content">{item.label}</div>
              </button>
            ))}
          </div>
        </nav>

        {/* 우측 버튼 영역 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {/* 데스크톱 전용 버튼들 */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 8 }}>
            {!loading && (
              user ? (
                /* ── 로그인 상태 ── */
                <>
                  {/* 아바타 + 마이페이지 */}
                  <button
                    onClick={() => router.push("/member/dashboard")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 14px 6px 6px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.08)",
                      border: "1.5px solid rgba(255,255,255,0.15)",
                      cursor: "pointer",
                      fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--lnav-icon-color)",
                    }}
                  >
                    {user.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt="프로필"
                        width={26}
                        height={26}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: "var(--accent-neon)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 800, color: "#010828",
                      }}>
                        {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
                      </div>
                    )}
                    마이페이지
                  </button>
                  {/* 로그아웃 */}
                  <form action="/auth/logout" method="POST">
                    <button type="submit" className="ld-login-btn">
                      로그아웃
                    </button>
                  </form>
                </>
              ) : (
                /* ── 비로그인 상태 ── */
                <>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("ld-auth-open"))}
                    className="ld-login-btn"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("ld-auth-open"))}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 700,
                      background: "var(--accent-neon)",
                      color: "#010828",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                      transition: "opacity 180ms ease",
                    }}
                  >
                    시작하기
                  </button>
                </>
              )
            )}
            {showToggle && <LgThemeToggle />}
          </div>

          {/* 모바일 햄버거 버튼 */}
          <button
            className="ld-hamburger-btn md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-controls="ld-mobile-drawer"
            aria-label="메뉴 열기"
          >
            <span className="ld-ham-icon" aria-hidden="true">
              <span className="ld-ham-bar" />
              <span className="ld-ham-bar" />
              <span className="ld-ham-bar" />
            </span>
          </button>
        </div>
      </div>

      {/* 모바일 드로어 */}
      <LdMobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant={drawerVariant}
        showToggle={showToggle}
      />
    </header>
  );
}
