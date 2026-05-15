"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { LayoutDashboard, Package, Rocket, Wallet, Users } from "lucide-react";
import LgShell, { type MenuItem } from "@/components/lg/LgShell";

const MENU_ITEMS: MenuItem[] = [
  { label: "대시보드",    href: "/member/dashboard",  icon: LayoutDashboard },
  { label: "구매 콘텐츠", href: "/member/content",    icon: Package },
  { label: "랜딩페이지",  href: "/partner/mylanding", icon: Rocket,  divider: true },
  { label: "수당 현황",   href: "/partner/earnings",  icon: Wallet },
  { label: "파트너 목록", href: "/partner/network",   icon: Users },
];

const ALLOWED = ["partner", "gold_partner", "instructor", "admin"];

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/?auth=1"); return; }
    if (!ALLOWED.includes(role ?? "")) { router.replace("/member/dashboard"); }
  }, [user, role, loading, router]);

  if (loading || !user || !ALLOWED.includes(role ?? "")) return null;

  return (
    <LgShell
      title="파트너 센터"
      accentColor="var(--partner-accent)"
      accentBgActive="var(--partner-accent-bg)"
      sidebarCls="partner-sidebar"
      tabbarCls="partner-tabbar"
      menuItems={MENU_ITEMS}
      noHeader
      a4Main
    >
      {children}
    </LgShell>
  );
}
