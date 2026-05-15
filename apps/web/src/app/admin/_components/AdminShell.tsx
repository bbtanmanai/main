"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Handshake,
  Bell,
  Menu,
  Search,
  ChevronDown,
  GraduationCap,
} from "lucide-react";

type NavChild = { label: string; href: string };
type NavItem = { label: string; href: string; icon: React.ElementType; children?: NavChild[] };

const NAV: NavItem[] = [
  { label: "대시보드",    href: "/admin/dashboard",    icon: LayoutDashboard },
  {
    label: "회원 목록",   href: "/admin/users",         icon: Users,
    children: [
      { label: "회원 상세", href: "/admin/users" },
    ],
  },
  { label: "주문 목록",   href: "/admin/orders",        icon: ShoppingCart },
  { label: "파트너 관리", href: "/admin/partners",      icon: Handshake },
  { label: "강사 신청",   href: "/admin/applications",  icon: GraduationCap },
];

function isGroupActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  return !!item.children?.some(
    (c) => pathname === c.href || pathname.startsWith(item.href + "/")
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      NAV.filter((i) => i.children).map((i) => [i.href, isGroupActive(i, pathname)])
    )
  );

  const initial = (user?.email?.[0] ?? "A").toUpperCase();

  const toggleGroup = (href: string) =>
    setOpenGroups((prev) => ({ ...prev, [href]: !prev[href] }));

  return (
    <div className="adm-shell">
      {/* ── 탑바 ── */}
      <header className="adm-topbar">
        <div className="adm-topbar-brand">
          <Link href="/admin/dashboard" className="adm-logo">
            <span className="adm-logo-text">LINKDROP</span>
            <span className="adm-logo-badge">ADMIN</span>
          </Link>
        </div>

        <div className="adm-topbar-left">
          <button
            className="adm-topbar-btn"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="메뉴 열기"
          >
            <Menu size={22} />
          </button>
          <div className="adm-search">
            <Search size={15} className="adm-search-icon" />
            <input type="text" placeholder="검색..." className="adm-search-input" />
          </div>
        </div>

        <div className="adm-topbar-right">
          <button className="adm-topbar-btn adm-topbar-notif" aria-label="알림">
            <Bell size={20} />
            <span className="adm-notif-dot" />
          </button>
          <div className="adm-topbar-user">
            <div className="adm-user-avatar">{initial}</div>
            <span className="adm-user-name">Admin</span>
            <ChevronDown size={14} />
          </div>
        </div>
      </header>

      {/* ── 사이드바 ── */}
      <aside className={`adm-sidebar${mobileOpen ? " adm-sidebar--open" : ""}`}>
        <div className="adm-sidebar-user">
          <div className="adm-sidebar-avatar">{initial}</div>
          <p className="adm-sidebar-username">관리자</p>
          <p className="adm-sidebar-status">온라인</p>
        </div>

        <nav className="adm-nav">
          <p className="adm-nav-label">MENU</p>

          {NAV.map((item) => {
            const Icon = item.icon;

            /* 서브메뉴 없는 항목 */
            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`adm-nav-item${pathname === item.href ? " active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={17} className="adm-nav-icon" />
                  <span>{item.label}</span>
                </Link>
              );
            }

            /* 서브메뉴 있는 항목 */
            const groupActive = isGroupActive(item, pathname);
            const groupOpen   = !!openGroups[item.href];

            return (
              <div key={item.href}>
                {/* 부모 행: 왼쪽 클릭 → 페이지 이동, 우측 chevron → 서브 토글 */}
                <div className={`adm-nav-group-btn${groupActive ? " active" : ""}`}>
                  <Link
                    href={item.href}
                    style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, textDecoration: "none", color: "inherit" }}
                    onClick={() => {
                      setMobileOpen(false);
                      setOpenGroups((prev) => ({ ...prev, [item.href]: true }));
                    }}
                  >
                    <Icon size={17} className="adm-nav-icon" />
                    <span>{item.label}</span>
                  </Link>
                  <button
                    aria-label="서브메뉴 토글"
                    onClick={() => toggleGroup(item.href)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", display: "flex", alignItems: "center" }}
                  >
                    <ChevronDown
                      size={13}
                      className={`adm-nav-group-chevron${groupOpen ? " open" : ""}`}
                    />
                  </button>
                </div>

                {/* 서브 항목 */}
                <div className={`adm-nav-sub${groupOpen ? " open" : ""}`}>
                  {item.children.map((child) => {
                    const childActive =
                      pathname.startsWith("/admin/users/") &&
                      child.href === "/admin/users";
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`adm-nav-sub-item${childActive ? " active" : ""}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* 모바일 오버레이 */}
      {mobileOpen && (
        <div className="adm-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── 메인 콘텐츠 ── */}
      <main className="adm-main">
        <div className="adm-page-content">{children}</div>
        <footer className="adm-footer">© 2026 LinkDrop. All rights reserved.</footer>
      </main>
    </div>
  );
}
