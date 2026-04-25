"use client";

// ============================================================
// 파트너 네트워크 페이지 — 내 파트너 트리 (1~2 depth)
// 파트너 카드 목록 + 신규 파트너 초대 섹션
// ============================================================

// mock 데이터 — 실제 Supabase 연결 후 교체
const mockPartners = [
  {
    id: "p1",
    name: "박지영",
    depth: 1, // 내가 직접 초대한 1단계 파트너
    joinDate: "2026-04-18",
    totalReward: 7500,
    subPartners: 1, // 이 파트너가 초대한 하위 파트너 수
  },
  {
    id: "p2",
    name: "이철수",
    depth: 1,
    joinDate: "2026-04-20",
    totalReward: 7500,
    subPartners: 0,
  },
  {
    id: "p3",
    name: "김영희",
    depth: 2, // 박지영이 초대한 2단계 파트너
    joinDate: "2026-04-21",
    totalReward: 2500,
    subPartners: 0,
    parentName: "박지영",
  },
];

export default function NetworkPage() {
  const depth1 = mockPartners.filter((p) => p.depth === 1);
  const depth2 = mockPartners.filter((p) => p.depth === 2);

  return (
    <div style={{ maxWidth: 720 }}>
      {/* 페이지 제목 */}
      <h1
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontWeight: 800,
          fontSize: 26,
          color: "var(--text-primary)",
          marginBottom: 8,
        }}
      >
        파트너 네트워크
      </h1>
      <p
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 16,
          color: "var(--text-secondary)",
          marginBottom: 28,
        }}
      >
        총 {mockPartners.length}명의 파트너 네트워크
      </p>

      {/* 1단계 직접 파트너 */}
      <SectionTitle>직접 초대 파트너 ({depth1.length}명)</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {depth1.map((p) => (
          <PartnerCard key={p.id} partner={p} />
        ))}
        {depth1.length === 0 && (
          <EmptyState message="아직 직접 초대한 파트너가 없습니다" />
        )}
      </div>

      {/* 2단계 하위 파트너 */}
      <SectionTitle>하위 파트너 ({depth2.length}명)</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {depth2.map((p) => (
          <PartnerCard key={p.id} partner={p} showParent />
        ))}
        {depth2.length === 0 && (
          <EmptyState message="하위 파트너가 아직 없습니다" />
        )}
      </div>

      {/* 신규 파트너 초대 섹션 */}
      <div
        style={{
          backgroundColor: "rgba(255,136,0,0.06)",
          borderRadius: 16,
          padding: 24,
          border: "1px solid rgba(255,136,0,0.2)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
        <h2
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          파트너를 더 초대하세요
        </h2>
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 16,
            color: "var(--text-secondary)",
            marginBottom: 20,
          }}
        >
          파트너가 수익을 올릴 때마다 후원 수당이 발생합니다
        </p>
        <a
          href="/partner/mylanding"
          style={{
            display: "inline-block",
            height: 48,
            lineHeight: "48px",
            padding: "0 28px",
            borderRadius: 10,
            backgroundColor: "#FF8800",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            textDecoration: "none",
          }}
        >
          초대 링크 복사하기
        </a>
      </div>
    </div>
  );
}

// ── 서브 컴포넌트 ────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
        fontWeight: 700,
        fontSize: 18,
        color: "var(--text-primary)",
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </h2>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p
      style={{
        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
        fontSize: 15,
        color: "var(--text-secondary)",
        padding: "20px 0",
        textAlign: "center",
      }}
    >
      {message}
    </p>
  );
}

interface PartnerData {
  id: string;
  name: string;
  depth: number;
  joinDate: string;
  totalReward: number;
  subPartners: number;
  parentName?: string;
}

function PartnerCard({ partner, showParent = false }: { partner: PartnerData; showParent?: boolean }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: 14,
        padding: "16px 20px",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      {/* 아바타 */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: partner.depth === 1 ? "rgba(255,136,0,0.15)" : "rgba(99,102,241,0.15)",
          border: `2px solid ${partner.depth === 1 ? "rgba(255,136,0,0.4)" : "rgba(99,102,241,0.4)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: partner.depth === 1 ? "#FF8800" : "#6366f1",
        }}
      >
        {partner.name[0]}
      </div>

      {/* 파트너 정보 */}
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span
            style={{
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontWeight: 700,
              fontSize: 17,
              color: "var(--text-primary)",
            }}
          >
            {partner.name}
          </span>
          {/* depth 뱃지 */}
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 6,
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: partner.depth === 1 ? "rgba(255,136,0,0.12)" : "rgba(99,102,241,0.12)",
              color: partner.depth === 1 ? "#FF8800" : "#6366f1",
            }}
          >
            {partner.depth}단계
          </span>
        </div>
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 13,
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >
          가입: {partner.joinDate}
          {showParent && partner.parentName ? ` · 상위: ${partner.parentName}` : ""}
          {partner.subPartners > 0 ? ` · 하위 ${partner.subPartners}명` : ""}
        </p>
      </div>

      {/* 누적 수당 */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: "#FF8800",
            margin: "0 0 2px",
          }}
        >
          {partner.totalReward.toLocaleString()}원
        </p>
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 12,
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >
          누적 수당
        </p>
      </div>
    </div>
  );
}
