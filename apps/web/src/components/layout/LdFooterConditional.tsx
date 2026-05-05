"use client";

import { usePathname } from "next/navigation";
import LdFooter from "./LdFooter";

export default function LdFooterConditional() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <LdFooter />;
}
