"use client";

import { useEffect } from "react";

// 특정 페이지에서만 라이트 테마를 강제 적용하고
// 페이지 이탈(언마운트) 시 이전 테마로 자동 복원한다.
export default function ForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute("data-theme") ?? "dark";
    root.setAttribute("data-theme", "light");
    return () => root.setAttribute("data-theme", prev);
  }, []);

  return null;
}
