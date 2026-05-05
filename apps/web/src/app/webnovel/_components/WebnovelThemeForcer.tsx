"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function WebnovelThemeForcer() {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme("light");
    return () => { setTheme("dark"); };
  }, [setTheme]);
  return null;
}
