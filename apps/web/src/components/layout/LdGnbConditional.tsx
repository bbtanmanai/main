"use client";

import { usePathname } from "next/navigation";
import LdCommonGnb from "./LdCommonGnb";

// index(/) 만 토글 없음 — /landing/* 포함 나머지 전체 라우터는 토글 있음
// member/partner/instructor/admin은 유저 드로어(탭바와 역할 분리)
export default function LdGnbConditional() {
  const pathname = usePathname();
  const noToggle = pathname === "/";
  const isUserRoute =
    pathname.startsWith("/member") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/instructor") ||
    pathname.startsWith("/admin");

  const forceDarkGnb = pathname === "/landing/landing1";

  return (
    <LdCommonGnb
      showToggle={!noToggle}
      drawerVariant={isUserRoute ? "user" : "marketing"}
      forceDarkGnb={forceDarkGnb}
    />
  );
}
