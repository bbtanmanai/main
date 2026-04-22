"use client";

// ============================================================
// 주문 확인 페이지 — 결제 플로우 1단계
// 라이트 테마 강제 (checkout layout에서 적용됨)
// 상품 정보 + 구매자 정보 입력 후 결제 페이지로 이동
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import LdStatusStepper, { Step } from "@/components/ui/LdStatusStepper";
import pricingData from "@/data/pricing.json";

// 결제 플로우 3단계 정의
const STEPS: Step[] = [
  { label: "주문 확인", status: "active" },   // 현재 단계
  { label: "결제",     status: "pending" },
  { label: "완료",     status: "pending" },
];

export default function OrderPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 전화번호 자동 하이픈 포맷팅
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, ""); // 숫자만 남기기
    let formatted = raw;
    if (raw.length >= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    } else if (raw.length >= 4) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    }
    setPhone(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // 구매자 정보를 sessionStorage에 임시 저장 후 결제 페이지로 이동
    sessionStorage.setItem("orderInfo", JSON.stringify({ name, email, phone }));
    router.push("/payment");
  };

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
      <header
        style={{
          textAlign: "center",
          marginBottom: 32,
          paddingTop: 8,
        }}
      >
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
        {/* 상품 정보 카드 */}
        <div
          style={{
            backgroundColor: "#f8faff",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "#111827",
              marginBottom: 16,
            }}
          >
            주문 상품
          </h2>

          {/* 상품명 + 가격 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
              gap: 12,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#111827",
                  margin: "0 0 4px",
                }}
              >
                링크드롭 이용권
              </p>
              <p
                style={{
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontSize: 14,
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                {pricingData.launchLabel} — {pricingData.validUntil}까지
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {/* 정가 (취소선) */}
              <p
                style={{
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontSize: 14,
                  color: "#9ca3af",
                  textDecoration: "line-through",
                  margin: "0 0 2px",
                }}
              >
                {pricingData.regularPrice.toLocaleString()}원
              </p>
              {/* 할인가 */}
              <p
                style={{
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  color: "#0055FF",
                  margin: 0,
                }}
              >
                {pricingData.launchPrice.toLocaleString()}원
              </p>
            </div>
          </div>

          {/* 혜택 목록 */}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {pricingData.benefits.map((benefit, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontSize: 15,
                  color: "#374151",
                  padding: "4px 0",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#10b981">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>

          {/* 환불 보장 안내 */}
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              backgroundColor: "#ecfdf5",
              borderRadius: 8,
              border: "1px solid #6ee7b7",
            }}
          >
            <p
              style={{
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                fontSize: 14,
                color: "#059669",
                margin: 0,
                fontWeight: 600,
              }}
            >
              {pricingData.guarantee}
            </p>
          </div>
        </div>

        {/* 구매자 정보 입력 폼 */}
        <div
          style={{
            backgroundColor: "#f8faff",
            borderRadius: 16,
            padding: 24,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "#111827",
              marginBottom: 20,
            }}
          >
            구매자 정보
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 이름 */}
            <div>
              <label
                htmlFor="name"
                style={{
                  display: "block",
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                이름 <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="홍길동"
                style={checkoutInputStyle}
              />
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" style={checkoutLabelStyle}>
                이메일 <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                style={checkoutInputStyle}
              />
            </div>

            {/* 전화번호 */}
            <div>
              <label htmlFor="phone" style={checkoutLabelStyle}>
                전화번호 <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                required
                placeholder="010-0000-0000"
                maxLength={13}
                style={checkoutInputStyle}
              />
            </div>

            {/* 결제하기 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                height: 56,
                borderRadius: 12,
                backgroundColor: isLoading ? "rgba(0,85,255,0.5)" : "#0055FF",
                color: "#ffffff",
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                marginTop: 8,
              }}
            >
              {isLoading ? "처리 중..." : `결제하기 — ${pricingData.launchPrice.toLocaleString()}원`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const checkoutLabelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

const checkoutInputStyle: React.CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  backgroundColor: "#ffffff",
  color: "#111827",
  fontSize: 18,
  padding: "0 14px",
  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
  outline: "none",
  boxSizing: "border-box",
};
