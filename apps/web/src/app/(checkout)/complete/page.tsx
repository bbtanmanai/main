"use client";

// ============================================================
// 결제 완료 페이지 — 결제 플로우 3단계 (최종)
// 라이트 테마 강제 (checkout layout 적용)
// 성공 아이콘 + 이메일 발송 안내 + 이동 버튼
// ============================================================

import LdStatusStepper, { Step } from "@/components/ui/LdStatusStepper";

const STEPS: Step[] = [
  { label: "주문 확인", status: "success" },
  { label: "결제",     status: "success" },
  { label: "완료",     status: "active" }, // 현재 완료 단계 (active = 초록과 다름에 주의)
];

export default function CompletePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        color: "#111827",
        padding: "24px 16px 60px",
      }}
    >
      {/* 로고 헤더 */}
      <header style={{ textAlign: "center", marginBottom: 32, paddingTop: 8 }}>
        <a
          href="/"
          style={{
            fontFamily: '"Montserrat", "Pretendard Variable", "Pretendard", sans-serif',
            fontWeight: 700,
            fontSize: 24,
            color: "#0055FF",
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}
        >
          LINKDROP
        </a>
      </header>

      {/* 진행 단계 스테퍼 */}
      <div style={{ maxWidth: 480, margin: "0 auto 40px" }}>
        <LdStatusStepper steps={STEPS} />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        {/* 큰 체크 아이콘 */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            backgroundColor: "#dcfce7",
            border: "3px solid #10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
          }}
        >
          <svg width="52" height="52" viewBox="0 0 24 24" fill="#10b981">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>

        {/* 완료 제목 */}
        <h1
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: "#111827",
            marginBottom: 12,
          }}
        >
          결제가 완료되었습니다
        </h1>

        {/* 이메일 발송 안내 */}
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 18,
            color: "#6b7280",
            lineHeight: 1.7,
            marginBottom: 40,
          }}
        >
          가입하신 이메일로 이용 안내를 발송했습니다.
          <br />
          메일이 오지 않으면 스팸함을 확인해 주세요.
        </p>

        {/* 이동 버튼 그룹 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* 콘텐츠 보러가기 — 주요 CTA */}
          <a
            href="/member/content"
            style={{
              display: "block",
              height: 56,
              lineHeight: "56px",
              borderRadius: 12,
              backgroundColor: "#0055FF",
              color: "#ffffff",
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              textDecoration: "none",
            }}
          >
            콘텐츠 보러가기
          </a>

          {/* 홈으로 — 보조 버튼 */}
          <a
            href="/"
            style={{
              display: "block",
              height: 48,
              lineHeight: "48px",
              borderRadius: 10,
              backgroundColor: "transparent",
              color: "#6b7280",
              fontSize: 16,
              fontWeight: 600,
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              textDecoration: "none",
              border: "1px solid #e5e7eb",
            }}
          >
            홈으로
          </a>
        </div>

        {/* 고객센터 안내 */}
        <p
          style={{
            marginTop: 32,
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 14,
            color: "#9ca3af",
          }}
        >
          문의사항은{" "}
          <a href="mailto:hello@linkdrop.kr" style={{ color: "#0055FF" }}>
            hello@linkdrop.kr
          </a>
          로 연락해 주세요
        </p>
      </div>
    </div>
  );
}
