// ============================================================
// useAuthModal — 전역 인증 모달 open/close 상태 관리
// CustomEvent "ld-auth-open" 기반으로 어디서든 모달 오픈 가능
// React Context 없이 window 이벤트 버스 사용 — SSR safe
// ============================================================

"use client";
import { useState, useEffect } from "react";

export function useAuthModal() {
  const [isOpen, setIsOpen] = useState(false);

  // 전역에서 모달을 여는 함수 — GNB 버튼, 랜딩 CTA 등에서 호출
  const open = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ld-auth-open"));
    }
  };

  const close = () => setIsOpen(false);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("ld-auth-open", handler);
    return () => window.removeEventListener("ld-auth-open", handler);
  }, []);

  return { isOpen, open, close };
}
