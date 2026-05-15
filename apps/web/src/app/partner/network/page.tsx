"use client";

// ============================================================
// 파트너 네트워크 페이지 — 내 파트너 트리 (1~2 depth)
// Architectural Precision 디자인 시스템
// ============================================================

import { Rocket } from "lucide-react";
import "@/styles/pages/partner.css";

// mock 데이터 — 실제 Supabase 연결 후 교체
const mockPartners = [
  {
    id: "p1",
    name: "박지영",
    depth: 1,
    joinDate: "2026-04-18",
    totalReward: 7500,
    subPartners: 1,
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
    depth: 2,
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
    <div className="pt-container">

      {/* ── 헤더 ── */}
      <div style={{ marginBottom: 20, position: "relative", zIndex: 1 }}>
        <p className="pt-eyebrow">파트너 대시보드</p>
        <h1 className="pt-page-title">파트너 네트워크</h1>
        <p className="pt-page-desc">총 {mockPartners.length}명의 파트너 네트워크</p>
      </div>

      {/* ── 직접 초대 파트너 ── */}
      <div className="pt-section-header" style={{ position: "relative", zIndex: 1 }}>
        <h2>직접 초대 파트너 ({depth1.length}명)</h2>
      </div>
      <div className="pt-partner-list">
        {depth1.map((p) => (
          <PartnerCard key={p.id} partner={p} />
        ))}
        {depth1.length === 0 && (
          <p className="pt-empty">아직 직접 초대한 파트너가 없습니다</p>
        )}
      </div>

      {/* ── 하위 파트너 ── */}
      <div className="pt-section-header" style={{ position: "relative", zIndex: 1 }}>
        <h2>하위 파트너 ({depth2.length}명)</h2>
      </div>
      <div className="pt-partner-list">
        {depth2.map((p) => (
          <PartnerCard key={p.id} partner={p} showParent />
        ))}
        {depth2.length === 0 && (
          <p className="pt-empty">하위 파트너가 아직 없습니다</p>
        )}
      </div>

      {/* ── 초대 CTA ── */}
      <div className="pt-invite-cta">
        <div className="pt-invite-icon">
          <Rocket size={32} strokeWidth={1.6} />
        </div>
        <h2 className="pt-invite-title">파트너를 더 초대하세요</h2>
        <p className="pt-invite-desc">
          파트너가 수익을 올릴 때마다 후원 수당이 발생합니다
        </p>
        <a href="/partner/mylanding" className="pt-invite-btn">
          초대 링크 복사하기
        </a>
      </div>

    </div>
  );
}

// ── 서브 컴포넌트 ────────────────────────────────────────────

interface PartnerData {
  id: string;
  name: string;
  depth: number;
  joinDate: string;
  totalReward: number;
  subPartners: number;
  parentName?: string;
}

function PartnerCard({
  partner,
  showParent = false,
}: {
  partner: PartnerData;
  showParent?: boolean;
}) {
  // depth별 색상 — 런타임 값이므로 inline style 허용
  const depthColor: string = partner.depth === 1 ? "#059669" : "#6366f1";
  const depthBg: string =
    partner.depth === 1
      ? "rgba(5,150,105,0.10)"
      : "rgba(99,102,241,0.10)";

  return (
    <div className="pt-partner-card">
      {/* 아바타 — 색상 동적 → inline style 허용 */}
      <div
        className="pt-partner-avatar"
        style={{
          background: depthBg,
          border: `1px solid ${depthColor}33`,
          color: depthColor,
        }}
      >
        {partner.name[0]}
      </div>

      {/* 파트너 정보 */}
      <div className="pt-partner-info">
        <div className="pt-partner-name-row">
          <span className="pt-partner-name">{partner.name}</span>
          {/* depth 뱃지 — 색상 동적 → inline style 허용 */}
          <span
            className="pt-depth-badge"
            style={{ background: depthBg, color: depthColor }}
          >
            {partner.depth}단계
          </span>
        </div>
        <p className="pt-partner-meta">
          가입: {partner.joinDate}
          {showParent && partner.parentName ? ` · 상위: ${partner.parentName}` : ""}
          {partner.subPartners > 0 ? ` · 하위 ${partner.subPartners}명` : ""}
        </p>
      </div>

      {/* 누적 수당 */}
      <div className="pt-partner-reward">
        <p className="pt-partner-reward-amount">
          ₩{partner.totalReward.toLocaleString()}
        </p>
        <p className="pt-partner-reward-label">누적 수당</p>
      </div>
    </div>
  );
}
