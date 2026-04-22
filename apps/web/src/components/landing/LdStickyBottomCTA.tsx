"use client";

// ============================================================
// LdStickyBottomCTA — 모바일 랜딩 하단 고정 바
// 스크롤이 300px 이상 내려갔을 때만 나타남
// 좌: 카카오 상담 링크 / 우: 전화번호 직접 연결
// ============================================================

import { useEffect, useState } from "react";
import externalLinks from "@/data/external-links.json";

export default function LdStickyBottomCTA() {
  // 고정 바 표시 여부 상태 (300px 이상 스크롤 시 true)
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 스크롤 위치 감지 — 300px 초과 시 노출
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // 컴포넌트 언마운트 시 이벤트 리스너 정리
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 카카오 링크 클릭 처리
  // 실패(카카오 앱 미설치 등) 시 전화번호로 폴백
  const handleKakaoClick = () => {
    try {
      window.open(externalLinks.kakao, "_blank");
    } catch {
      // 팝업 차단 등 실패 시 전화 연결로 전환
      window.location.href = externalLinks.phone;
    }
  };

  // 스크롤 300px 미만이면 렌더링 자체를 하지 않음
  if (!visible) return null;

  return (
    // 하단 고정 바 — z-50으로 다른 요소 위에 표시
    // safe-area-inset-bottom: 아이폰 홈 바 영역 침범 방지
    <div
      className="ld-glass"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 64,
        // 아이폰 노치/홈 바 대응 패딩
        paddingBottom: "env(safe-area-inset-bottom)",
        // 모바일에서만 표시 (md 이상 화면에서는 숨김)
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        gap: 12,
        backgroundColor: "rgba(1, 8, 40, 0.85)",
        borderTop: "1px solid rgba(111,255,0,0.2)",
      }}
      // md 이상 화면 숨김은 Tailwind md:hidden 대신 inline style로 처리
      // (서버 컴포넌트 아님 — CSR이므로 직접 window 접근 가능)
    >
      {/* 카카오 상담 시작 버튼 */}
      <button
        onClick={handleKakaoClick}
        style={{
          flex: 1,
          height: 48, // 터치 타깃 최소 48px 준수
          backgroundColor: "#FEE500", // 카카오 공식 노란색
          color: "#191919",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
        aria-label="카카오 상담 시작하기"
      >
        {/* 카카오 말풍선 아이콘 (SVG 인라인) */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919">
          <path d="M12 3C6.477 3 2 6.477 2 11c0 2.88 1.57 5.43 4 7.07L5 22l4.17-2.77C10.07 19.4 11.02 19.5 12 19.5c5.523 0 10-3.477 10-7.75S17.523 3 12 3z" />
        </svg>
        지금 시작하기
      </button>

      {/* 전화 연결 버튼 */}
      <a
        href={externalLinks.phone}
        style={{
          flex: 1,
          height: 48,
          backgroundColor: "rgba(111,255,0,0.15)",
          color: "#6fff00",
          borderRadius: 10,
          border: "1px solid rgba(111,255,0,0.4)",
          cursor: "pointer",
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          textDecoration: "none",
        }}
        aria-label={`전화 상담 ${externalLinks.fallbackPhone}`}
      >
        {/* 전화 아이콘 */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
        {externalLinks.fallbackPhone}
      </a>
    </div>
  );
}
