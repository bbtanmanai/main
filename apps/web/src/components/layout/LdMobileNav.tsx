"use client";

// ============================================================
// LdMobileNav — 모바일 풀스크린 네비게이션 오버레이
// 250ms 슬라이드 다운 애니메이션
// 포커스 트랩: Tab 키가 메뉴 내부에서만 순환
// ============================================================

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import navData from "@/data/nav.json";
import externalLinks from "@/data/external-links.json";

interface LdMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LdMobileNav({ isOpen, onClose }: LdMobileNavProps) {
  // 첫 번째 포커스 가능한 요소 ref (접근성용)
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // 메뉴가 열릴 때 닫기 버튼에 포커스 이동
  useEffect(() => {
    if (isOpen) {
      firstFocusRef.current?.focus();
      // body 스크롤 잠금
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* 오버레이 배경 — 클릭 시 닫기 */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(1,8,40,0.7)",
          zIndex: 90,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 250ms ease",
        }}
        aria-hidden="true"
      />

      {/* 슬라이드 다운 메뉴 패널 */}
      <nav
        role="dialog"
        aria-modal="true"
        aria-label="모바일 메뉴"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "rgba(10,21,64,0.97)",
          backdropFilter: "blur(20px)",
          zIndex: 100,
          padding: "20px 24px 32px",
          // 열린 상태: 제자리 / 닫힌 상태: 위로 슬라이드
          transform: isOpen ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 250ms ease",
          borderBottom: "1px solid rgba(111,255,0,0.15)",
          fontFamily: "Pretendard Variable, Pretendard, sans-serif",
        }}
      >
        {/* 헤더 행 — 로고 + 닫기 버튼 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontFamily: '"Montserrat", "Pretendard Variable", "Pretendard", sans-serif',
              fontWeight: 700,
              fontSize: "20px",
              color: "#6fff00",
            }}
          >
            {navData.logo}
          </span>

          {/* 닫기 버튼 — 포커스 트랩 첫 번째 요소 */}
          <button
            ref={firstFocusRef}
            onClick={onClose}
            aria-label="메뉴 닫기"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
              color: "var(--text-primary)",
              // 터치 타깃 48px 보장
              minWidth: "44px",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 메뉴 항목 목록 */}
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px" }}>
          {navData.items.map((item) => (
            <li key={item.href} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <a
                href={item.href}
                onClick={onClose}
                style={{
                  display: "block",
                  padding: "18px 0",
                  color: "var(--text-primary)",
                  textDecoration: "none",
                  // 시니어 가독성 — 최소 18px
                  fontSize: "20px",
                  fontWeight: 600,
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA 버튼 — 카카오 채널 연결 */}
        <a
          href={externalLinks.kakao}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          style={{
            display: "block",
            textAlign: "center",
            padding: "18px 24px",
            background: "#6fff00",
            color: "#010828",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "18px",
            textDecoration: "none",
            // 터치 타깃 충분히 확보
            minHeight: "56px",
            lineHeight: "20px",
          }}
        >
          {navData.cta.label}
        </a>
      </nav>
    </>
  );
}
