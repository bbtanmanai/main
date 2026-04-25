"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/contexts/ThemeContext";

const isDarkOnly = (pathname: string) =>
  pathname === "/" || pathname.startsWith("/landing/");

export default function LdThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ThemeProvider forcedTheme={isDarkOnly(pathname) ? "dark" : undefined}>
      {children}
    </ThemeProvider>
  );
}
