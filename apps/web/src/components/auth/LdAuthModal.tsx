// ============================================================
// LdAuthModal — 데스크톱 인증 모달 (768px 이상)
// useAuthModal hook 구독 → isOpen 감지
// 외부 클릭(overlay) 또는 X 버튼으로 닫기
// LD-006: glass 효과는 .ld-glass CSS 클래스 사용 (JS 분기 금지)
// ============================================================

"use client";
import { useEffect, useRef } from "react";
import { useAuthModal } from "@/hooks/useAuthModal";
import LdAuthPanel from "./LdAuthPanel";

export default function LdAuthModal() {
  const { isOpen, close } = useAuthModal();
  const overlayRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, close]);

  // 모달 오픈 시 body 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // 오버레이 — 데스크톱(md+)에서만 표시. 모바일은 LdAuthBottomSheet가 담당
    <div
      ref={overlayRef}
      className="ld-auth-overlay ld-auth-modal-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="로그인"
    >
      <div className="ld-glass ld-auth-modal-card">
        <LdAuthPanel onClose={close} />
      </div>
    </div>
  );
}
