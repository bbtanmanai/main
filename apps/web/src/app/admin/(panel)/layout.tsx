import LgShell from "@/components/lg/LgShell";

const MENU_ITEMS = [
  { label: "회원 목록",   href: "/admin/users",    icon: "👤" },
  { label: "주문 목록",   href: "/admin/orders",   icon: "🛒" },
  { label: "파트너 관리", href: "/admin/partners", icon: "🤝" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <LgShell
      title="ADMIN"
      accentColor="#ef4444"
      accentBgActive="rgba(239,68,68,0.1)"
      sidebarCls="admin-sidebar"
      tabbarCls="admin-tabbar"
      menuItems={MENU_ITEMS}
      noHeader
    >
      {children}
    </LgShell>
  );
}
