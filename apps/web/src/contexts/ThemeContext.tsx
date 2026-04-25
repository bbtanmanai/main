"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

// localStorage에서 테마를 읽어 data-theme 를 즉시 설정 — React 하이드레이션 전 FOUC 방지
// "use client" 모듈은 서버에서도 실행되므로 typeof window 가드 필수
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem("ld-theme");
    if (stored) document.documentElement.setAttribute("data-theme", stored);
  } catch {}
}

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: "dark", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  children,
  forcedTheme,
}: {
  children: React.ReactNode;
  forcedTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    if (forcedTheme) {
      setThemeState(forcedTheme);
      document.documentElement.setAttribute("data-theme", forcedTheme);
      return;
    }
    const stored = localStorage.getItem("ld-theme") as Theme | null;
    const initial = stored || "dark";
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, [forcedTheme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("ld-theme", t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
