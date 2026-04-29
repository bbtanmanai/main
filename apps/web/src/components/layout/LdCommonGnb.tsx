"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import LgThemeToggle from "@/components/lg/LgThemeToggle";
import LdMobileDrawer from "./LdMobileDrawer";
import { useSession } from "@/hooks/useSession";
import { NAV_ITEMS, findActiveNavIdx } from "./navItems";

export default function LdCommonGnb({
  showToggle = false,
  drawerVariant = "marketing",
  forceDarkGnb = false,
}: {
  showToggle?: boolean;
  drawerVariant?: "marketing" | "user";
  forceDarkGnb?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, loading } = useSession();

  const activeNavIdx = findActiveNavIdx(NAV_ITEMS, pathname);

  return (
    <header className={`gnb-bar${forceDarkGnb ? " gnb-force-dark" : ""}`}>
      <div className="gnb-inner">
        {/* 좌측 로고 */}
        <a href="/" className="gnb-logo">
          <Image
            src="/img/logo.png"
            alt="LinkDrop"
            width={256}
            height={70}
            sizes="140px"
            style={{
              objectFit: "contain",
              width: "140px",
              height: "auto",
              filter:
                "drop-shadow(0 0 6px rgba(255,255,255,1)) " +
                "drop-shadow(0 0 14px rgba(255,255,255,0.95)) " +
                "drop-shadow(0 0 28px rgba(255,255,255,0.8)) " +
                "drop-shadow(0 0 50px rgba(255,255,255,0.55))",
            }}
            priority
            unoptimized
          />
        </a>

        {/* 중앙 nav — 데스크톱(md+)에서만 표시 */}
        <nav className="gnb-swiss-nav hidden md:flex" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item, i) => {
            const isActive = activeNavIdx === i;
            if (item.children) {
              return (
                <div key={item.href} className="gnb-drop-wrap">
                  <button
                    onClick={() => router.push(item.href)}
                    className={`gnb-btn${isActive ? " active" : ""}`}
                    aria-haspopup="menu"
                  >
                    {item.label}
                    <span className="gnb-drop-chevron" aria-hidden="true" />
                  </button>
                  <div className="gnb-drop-panel" role="menu">
                    {item.children.map((sub) => {
                      const isSubActive =
                        pathname === sub.href ||
                        pathname.startsWith(sub.href + "/");
                      return (
                        <button
                          key={sub.href}
                          role="menuitem"
                          className={`gnb-drop-link${isSubActive ? " active" : ""}`}
                          onClick={() => router.push(sub.href)}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`gnb-btn${isActive ? " active" : ""}`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* 우측 버튼 영역 */}
        <div className="gnb-right">
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 8 }}>
            {!loading && (
              user ? (
                <>
                  <button
                    onClick={() => router.push("/member/dashboard")}
                    className="gnb-mypage-btn"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt="프로필"
                        width={24}
                        height={24}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "#6fff00",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#010828",
                        }}
                      >
                        {(
                          user.user_metadata?.full_name ||
                          user.email ||
                          "U"
                        )[0].toUpperCase()}
                      </div>
                    )}
                    마이페이지
                  </button>
                  <form action="/auth/logout" method="POST">
                    <button type="submit" className="gnb-login-btn">
                      로그아웃
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <button
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("ld-auth-open"))
                    }
                    className="gnb-login-btn"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("ld-auth-open"))
                    }
                    className="gnb-cta-primary"
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
