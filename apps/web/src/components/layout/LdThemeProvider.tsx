"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/contexts/ThemeContext";

const getForcedTheme = (pathname: string): "dark" | "light" | undefined => {
  if (pathname === "/") return "dark";
  if (pathname === "/landing/landing1") return "light";
  return undefined;
};

export default function LdThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ThemeProvider forcedTheme={getForcedTheme(pathname)}>
      {children}
    </ThemeProvider>
  );
}
