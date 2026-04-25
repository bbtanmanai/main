// ============================================================
// LdAuthBottomSheet — 모바일 바텀시트 (767px 이하)
// useAuthModal hook 구독 → isOpen 감지
// 상단 핸들 + 드래그 80px 이상 아래로 → 닫기
// LD-006: glass 효과는 .ld-glass CSS 클래스 사용 (JS 분기 금지)
// ============================================================

"use client";
import { useEffect, useRef } from "react";
import { useAuthModal } from "@/hooks/useAuthModal";
import LdAuthPanel from "./LdAuthPanel";

export default function LdAuthBottomSheet() {
  const { isOpen, close } = useAuthModal();
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

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

  // 터치 드래그 핸들러 — 80px 이상 아래로 스와이프 시 닫기
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 80) close();
  };

  // 768px 이상(데스크톱)에서는 렌더하지 않음 (LdAuthModal이 담당)
  if (!isOpen) return null;

  return (
    // 오버레이 — 외부 클릭으로 닫기
    <div
      ref={overlayRef}
      className="ld-auth-overlay ld-auth-bs-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="로그인"
    >
      {/* 바텀시트 래퍼 — 하단 고정 */}
      <div
        className="ld-auth-bs-wrap"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 카드 본체 */}
        <div className="ld-glass ld-auth-bs-card">
          {/* 드래그 핸들 */}
          <div className="ld-auth-bs-handle" aria-hidden="true" />
          <LdAuthPanel onClose={close} />
        </div>
      </div>
    </div>
  );
}
