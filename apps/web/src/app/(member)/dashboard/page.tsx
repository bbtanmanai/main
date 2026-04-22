"use client";

// ============================================================
// 구매자 대시보드 — 환영 메시지 + 구매 내역 + 콘텐츠 발급 상태
// 실제 Supabase 연결 전 mock 데이터로 UI 완성
// ============================================================

import LdStatusStepper, { Step } from "@/components/ui/LdStatusStepper";

// mock 데이터 — 실제 Supabase 연결 후 API 호출로 교체
const mockUser = { name: "김미숙", email: "user@example.com" };
const mockOrder = {
  id: "ORD-001",
  product: "링크드롭 이용권",
  amount: 59000,
  date: "2026-04-22",
  status: "complete",
};
const mockReferralCount = 3; // 초대한 파트너 수

// 콘텐츠 발급 진행 4단계
const CONTENT_STEPS: Step[] = [
  { label: "결제 확인", status: "success" },
  { label: "계정 생성", status: "success" },
  { label: "콘텐츠 발급", status: "active" },  // 현재 진행 중
  { label: "이용 시작", status: "pending" },
];

export default function DashboardPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      {/* 환영 메시지 */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          안녕하세요, {mockUser.name}님
        </h1>
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 16,
            color: "var(--text-secondary)",
          }}
        >
          링크드롭 마이페이지에 오신 것을 환영합니다
        </p>
      </div>

      {/* 통계 카드 행 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* 구매 상품 수 */}
        <StatCard label="구매 상품" value="1개" color="#0055FF" />
        {/* 파트너 초대 수 */}
        <StatCard label="파트너 초대" value={`${mockReferralCount}명`} color="#FF8800" />
        {/* 이용 일수 */}
        <StatCard label="이용 중" value="1일째" color="#10b981" />
      </div>

      {/* 구매 내역 카드 */}
      <SectionCard title="최근 구매 내역">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: "var(--text-primary)",
                margin: "0 0 4px",
              }}
            >
              {mockOrder.product}
            </p>
            <p
              style={{
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                fontSize: 14,
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {mockOrder.id} · {mockOrder.date}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                fontWeight: 800,
                fontSize: 20,
                color: "var(--text-primary)",
                margin: "0 0 4px",
              }}
            >
              {mockOrder.amount.toLocaleString()}원
            </p>
            <span
              style={{
                padding: "3px 10px",
                backgroundColor: "rgba(16,185,129,0.15)",
                color: "#10b981",
                borderRadius: 20,
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              결제 완료
            </span>
          </div>
        </div>
      </SectionCard>

      {/* 콘텐츠 발급 진행 상태 */}
      <SectionCard title="콘텐츠 발급 진행 상태">
        <LdStatusStepper steps={CONTENT_STEPS} />
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 14,
            color: "var(--text-secondary)",
            marginTop: 16,
            padding: "10px 14px",
            backgroundColor: "rgba(99,102,241,0.08)",
            borderRadius: 8,
          }}
        >
          콘텐츠 발급은 영업일 기준 1~2일 이내 완료됩니다.
          완료 시 이메일로 안내드립니다.
        </p>
      </SectionCard>

      {/* 파트너 초대 현황 */}
      <SectionCard title="파트너 초대 현황">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              backgroundColor: "rgba(255,136,0,0.12)",
              border: "2px solid rgba(255,136,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                fontWeight: 800,
                fontSize: 28,
                color: "#FF8800",
              }}
            >
              {mockReferralCount}
            </span>
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: "var(--text-primary)",
                margin: "0 0 4px",
              }}
            >
              {mockReferralCount}명 초대 완료
            </p>
            <a
              href="/member/referral"
              style={{
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                fontSize: 14,
                color: "var(--accent-neon)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              초대 링크 보기 →
            </a>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ── 재사용 가능한 서브 컴포넌트 ────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: 14,
        padding: "20px 16px",
        border: "1px solid rgba(255,255,255,0.06)",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontWeight: 800,
          fontSize: 26,
          color,
          margin: "0 0 6px",
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 14,
          color: "var(--text-secondary)",
          margin: 0,
        }}
      >
        {label}
      </p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: 16,
        padding: 24,
        border: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 20,
      }}
    >
      <h2
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: "var(--text-primary)",
          marginBottom: 20,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
