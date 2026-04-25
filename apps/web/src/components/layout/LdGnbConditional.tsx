"use client";

import { usePathname } from "next/navigation";
import LdCommonGnb from "./LdCommonGnb";

// index(/) 와 /landing/* 는 토글 없음 — 나머지 전체 라우터는 토글 있음
// member/partner/instructor/admin은 유저 드로어(탭바와 역할 분리)
export default function LdGnbConditional() {
  const pathname = usePathname();
  const noToggle = pathname === "/" || pathname.startsWith("/landing/");
  const isUserRoute =
    pathname.startsWith("/member") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/instructor") ||
    pathname.startsWith("/admin");

  return (
    <LdCommonGnb
      showToggle={!noToggle}
      drawerVariant={isUserRoute ? "user" : "marketing"}
    />
  );
}
