export interface NavSubItem {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavSubItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "서비스소개", href: "/about" },
  { label: "웹소설",     href: "/landing/landing1" },
  { label: "영상자동화", href: "/landing/landing4" },
  {
    label: "강사모집",
    href: "/recruit-teacher",
    children: [
      { label: "강사자격", href: "/certificate-teacher" },
      { label: "강사혜택", href: "/recruit-teacher" },
    ],
  },
  {
    label: "유틸리티",
    href: "/ai-prompt",
    children: [
      { label: "프롬프트",     href: "/ai-prompt" },
      { label: "홈페이지소스", href: "/homepage" },
    ],
  },
];

export function findActiveNavIdx(items: NavItem[], pathname: string): number {
  return items.findIndex((item) => {
    if (pathname === item.href || pathname.startsWith(item.href + "/")) return true;
    return item.children?.some(
      (c) => pathname === c.href || pathname.startsWith(c.href + "/")
    );
  });
}
