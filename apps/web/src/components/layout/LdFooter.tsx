"use client";

// ============================================================
// LdFooter — 푸터 컴포넌트
// footer.json: 회사 정보 / external-links.json: 연락처 링크
// 3컬럼 (좌: 로고+회사정보 / 중: 링크 / 우: 연락처)
// 모바일: 세로 스택 레이아웃
// ============================================================

import footerData from "@/data/footer.json";
import externalLinks from "@/data/external-links.json";

export default function LdFooter() {
  return (
    <footer
      style={{
        background: "#1e1e1e",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "48px 24px 32px",
        fontFamily: "Pretendard Variable, Pretendard, sans-serif",
      }}
    >
      {/* 최대 너비 컨테이너 */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* 3컬럼 그리드 — 모바일은 1컬럼 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "40px",
            marginBottom: "40px",
          }}
        >
          {/* 좌: 로고 + 회사 정보 */}
          <div>
            {/* 로고 — Montserrat Bold 영문 전용 */}
            <div
              style={{
                fontFamily: '"Montserrat", "Pretendard Variable", "Pretendard", sans-serif',
                fontWeight: 700,
                fontSize: "22px",
                color: "#6fff00", // neon green 브랜드 컬러
                marginBottom: "16px",
                letterSpacing: "-0.01em",
              }}
            >
              LINKDROP
            </div>

            {/* 회사 법적 정보 — 소형 텍스트 */}
            <div
              style={{
                color: "rgba(136,153,204,0.8)",
                fontSize: "13px",
                lineHeight: 1.9,
              }}
            >
              <p style={{ margin: 0 }}>{footerData.company.name}</p>
              <p style={{ margin: 0 }}>{footerData.company.ceo}</p>
              <p style={{ margin: 0 }}>
                사업자등록번호: {footerData.company.bizNumber}
              </p>
              <p style={{ margin: "8px 0 0" }}>{footerData.company.address}</p>
            </div>
          </div>

          {/* 중: 법적 링크 목록 */}
          <div>
            <p
              style={{
                color: "#8899cc",
                fontSize: "13px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "16px",
              }}
            >
              정책
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {footerData.links.map((link) => (
                <li key={link.href} style={{ marginBottom: "10px" }}>
                  <a
                    href={link.href}
                    style={{
                      color: "rgba(239,244,255,0.7)",
                      fontSize: "15px",
                      textDecoration: "none",
                      // 호버 효과는 인라인으로 처리 불가 → underline 기본 제거
                    }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLAnchorElement).style.color = "#eff4ff")
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLAnchorElement).style.color =
                        "rgba(239,244,255,0.7)")
                    }
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* DEV ONLY: Skills 가이드 버튼 — 환불정책 바로 아래 */}
            {process.env.NODE_ENV !== "production" && (
              <a
                href="/dev/skills"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  marginTop: "16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0a0a0f",
                  backgroundColor: "#6fff00",
                  borderRadius: "8px",
                  padding: "9px 16px",
                  textDecoration: "none",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                Claude Skills 가이드
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "rgba(0,0,0,0.4)",
                    background: "rgba(0,0,0,0.1)",
                    borderRadius: "3px",
                    padding: "1px 5px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  DEV
                </span>
              </a>
            )}
          </div>

          {/* 우: 연락처 정보 */}
          <div>
            <p
              style={{
                color: "#8899cc",
                fontSize: "13px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "16px",
              }}
            >
              연락처
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {/* 전화번호 */}
              <a
                href={externalLinks.phone}
                style={{
                  color: "rgba(239,244,255,0.8)",
                  fontSize: "15px",
                  textDecoration: "none",
                }}
              >
                Tel: {footerData.company.phone}
              </a>

              {/* 이메일 */}
              <a
                href={externalLinks.email}
                style={{
                  color: "rgba(239,244,255,0.8)",
                  fontSize: "15px",
                  textDecoration: "none",
                }}
              >
                {footerData.company.email}
              </a>

              {/* 카카오채널 */}
              <a
                href={externalLinks.kakao}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#6fff00",
                  fontSize: "15px",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                카카오 채널 문의
              </a>
            </div>
          </div>
        </div>

        {/* 하단 구분선 + 저작권 */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "24px",
            color: "rgba(136,153,204,0.5)",
            fontSize: "12px",
            textAlign: "center",
          }}
        >
          {footerData.copyright}
        </div>


      </div>
    </footer>
  );
}
