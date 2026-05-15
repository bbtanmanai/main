"use client";

import { useSession } from "@/hooks/useSession";
import { LayoutDashboard, Package, Rocket, Wallet, Users } from "lucide-react";
import LgShell, { type MenuItem } from "@/components/lg/LgShell";

const GUEST_ITEMS: MenuItem[] = [
  { label: "대시보드",    href: "/member/dashboard", icon: LayoutDashboard },
  { label: "구매 콘텐츠", href: "/member/content",   icon: Package },
];

const PARTNER_ITEMS: MenuItem[] = [
  { label: "랜딩페이지",  href: "/partner/mylanding", icon: Rocket,  divider: true },
  { label: "수당 현황",   href: "/partner/earnings",  icon: Wallet },
  { label: "파트너 목록", href: "/partner/network",   icon: Users },
];

const isBuyer = (role: string | null) =>
  role === "partner" || role === "gold_partner" || role === "instructor" || role === "admin";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { role } = useSession();

  const menuItems = isBuyer(role) ? [...GUEST_ITEMS, ...PARTNER_ITEMS] : GUEST_ITEMS;

  return (
    <LgShell
      title="마이페이지"
      accentColor="var(--member-accent)"
      accentBgActive="var(--member-accent-bg)"
      sidebarCls="member-sidebar"
      tabbarCls="member-tabbar"
      menuItems={menuItems}
      noHeader
      a4Main
    >
      {children}
    </LgShell>
  );
}
