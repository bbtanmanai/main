"use client";

import { useSession } from "@/hooks/useSession";
import LgShell from "@/components/lg/LgShell";

const GUEST_ITEMS = [
  { label: "대시보드",    href: "/member/dashboard", icon: "🏠" },
  { label: "구매 콘텐츠", href: "/member/content",   icon: "📦" },
];

const PARTNER_ITEMS = [
  { label: "랜딩페이지",  href: "/partner/mylanding", icon: "🚀", divider: true },
  { label: "수당 현황",   href: "/partner/earnings",  icon: "💰" },
  { label: "파트너 목록", href: "/partner/network",   icon: "🌐" },
];

const isBuyer = (role: string | null) =>
  role === "partner" || role === "gold_partner" || role === "instructor" || role === "admin";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { role } = useSession();

  const menuItems = isBuyer(role) ? [...GUEST_ITEMS, ...PARTNER_ITEMS] : GUEST_ITEMS;

  return (
    <LgShell
      title="마이페이지"
      accentColor="var(--accent-neon)"
      accentBgActive="rgba(111,255,0,0.1)"
      sidebarCls="member-sidebar"
      tabbarCls="member-tabbar"
      menuItems={menuItems}
      noHeader
    >
      {children}
    </LgShell>
  );
}
