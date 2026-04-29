"use client";

// ============================================================
// 결제 페이지 — 결제 플로우 2단계
// 테마 상속 (LD-008: checkout은 전역 테마 그대로 상속)
// 토스페이먼츠 위젯 영역 (placeholder — 실제 SDK 키 필요)
// ============================================================

import { useRouter } from "next/navigation";
import LdStatusStepper, { Step } from "@/components/ui/LdStatusStepper";
import pricingData from "@/data/pricing.json";

const STEPS: Step[] = [
  { label: "주문 확인", status: "success" }, // 이전 단계 완료
  { label: "결제",     status: "active" },   // 현재 단계
  { label: "완료",     status: "pending" },
];

export default function PaymentPage() {
  const router = useRouter();

  const handlePaymentComplete = () => {
    // 실제 구현 시: 토스페이먼츠 SDK 결제 완료 콜백에서 호출
    router.push("/checkout/complete");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "var(--text-primary)",
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

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* 결제 금액 표시 */}
        <div
          style={{
            backgroundColor: "#f0f4ff",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 20,
            border: "1px solid #c7d2fe",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontWeight: 600,
              fontSize: 18,
              color: "#374151",
            }}
          >
            최종 결제 금액
          </span>
          <span
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontWeight: 800,
              fontSize: 26,
              color: "#0055FF",
            }}
          >
            {pricingData.launchPrice.toLocaleString()}원
          </span>
        </div>

        {/* 토스페이먼츠 위젯 영역 (placeholder) */}
        <div
          style={{
            backgroundColor: "#f8faff",
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            border: "2px dashed #c7d2fe",
            minHeight: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {/* 토스페이먼츠 로고 플레이스홀더 */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "#0064FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
            </svg>
          </div>
          <p
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontSize: 16,
              color: "#6b7280",
              textAlign: "center",
              margin: 0,
            }}
          >
            토스페이먼츠 결제 위젯
            <br />
            <span style={{ fontSize: 13, color: "#9ca3af" }}>
              (실제 SDK 키 연동 후 활성화)
            </span>
          </p>

          {/* 지원 결제 수단 뱃지 */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {["카드결제", "계좌이체", "카카오페이", "네이버페이"].map((method) => (
              <span
                key={method}
                style={{
                  padding: "4px 10px",
                  backgroundColor: "#e0e7ff",
                  borderRadius: 20,
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontSize: 13,
                  color: "#4338ca",
                  fontWeight: 600,
                }}
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        {/* 보안 안내 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 16px",
            backgroundColor: "#f0fdf4",
            borderRadius: 10,
            border: "1px solid #bbf7d0",
            marginBottom: 20,
          }}
        >
          {/* 자물쇠 아이콘 */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="#16a34a"
            style={{ flexShrink: 0, marginTop: 1 }}
          >
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
          </svg>
          <p
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontSize: 14,
              color: "#15803d",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            SSL 암호화로 결제 정보가 안전하게 보호됩니다.
            개인정보는 결제 처리 목적으로만 사용됩니다.
          </p>
        </div>

        {/* 결제 완료 버튼 (테스트용 — 실제는 SDK 콜백으로 처리) */}
        <button
          onClick={handlePaymentComplete}
          style={{
            width: "100%",
            height: 56,
            borderRadius: 12,
            backgroundColor: "#0055FF",
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            border: "none",
            cursor: "pointer",
          }}
        >
          결제 완료 — {pricingData.launchPrice.toLocaleString()}원
        </button>

        <p
          style={{
            textAlign: "center",
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 13,
            color: "#9ca3af",
            marginTop: 12,
          }}
        >
          결제 완료 후 즉시 이용 가능합니다
        </p>
      </div>
    </div>
  );
}
