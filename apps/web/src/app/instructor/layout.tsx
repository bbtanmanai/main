"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import LgShell from "@/components/lg/LgShell";

const MENU_ITEMS = [
  { label: "강의 관리", href: "/instructor/courses",  icon: "📖" },
  { label: "수강생",   href: "/instructor/students", icon: "👥" },
];

const ALLOWED = ["instructor", "admin"];

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
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
      title="강사 센터"
      accentColor="#6366f1"
      accentBgActive="rgba(99,102,241,0.1)"
      sidebarCls="instructor-sidebar"
      tabbarCls="instructor-tabbar"
      menuItems={MENU_ITEMS}
      noHeader
    >
      {children}
    </LgShell>
  );
}
