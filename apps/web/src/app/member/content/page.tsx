"use client";

// ============================================================
// 구매 콘텐츠 목록 페이지
// Architectural Precision 디자인 시스템
// ============================================================

import { Inbox, BookOpen } from "lucide-react";
import "@/styles/pages/member.css";

// mock 콘텐츠 데이터 — 실제 Supabase 연결 후 교체
const mockContents = [
  {
    id: "cnt-001",
    title: "링크드롭 스타터 가이드",
    category: "기본 교육",
    description: "링크드롭 플랫폼을 시작하는 모든 것. 계정 설정부터 첫 수익까지.",
    accessUrl: "https://content.linkdrop.kr/starter",
    thumbnail: null,
    isNew: true,
  },
  {
    id: "cnt-002",
    title: "콘텐츠 제작 마스터클래스",
    category: "고급 과정",
    description: "AI 도구를 활용해 하루 1시간으로 주간 콘텐츠 생산하는 법",
    accessUrl: "https://content.linkdrop.kr/masterclass",
    thumbnail: null,
    isNew: false,
  },
];

export default function ContentPage() {
  if (mockContents.length === 0) {
    return (
      <div className="mc-empty">
        <div className="mc-empty-icon">
          <Inbox size={56} strokeWidth={1.2} />
        </div>
        <h2 className="mc-empty-title">아직 구매한 콘텐츠가 없습니다</h2>
        <p className="mc-empty-desc">
          링크드롭 이용권을 구매하면 모든 콘텐츠에 접근할 수 있습니다
        </p>
        <a href="/order" className="mc-empty-btn">
          이용권 구매하기
        </a>
      </div>
    );
  }

  return (
    <div className="mc-container">
      <h1 className="mc-heading">구매 콘텐츠</h1>

      <div className="mc-list">
        {mockContents.map((content) => (
          <div key={content.id} className="mc-card">
            {/* 썸네일 */}
            <div className="mc-thumb">
              <BookOpen size={28} strokeWidth={1.6} />
            </div>

            {/* 콘텐츠 정보 */}
            <div className="mc-info">
              <div className="mc-badge-row">
                <span className="mc-badge mc-badge--category">
                  {content.category}
                </span>
                {content.isNew && (
                  <span className="mc-badge mc-badge--new">NEW</span>
                )}
              </div>
              <h3 className="mc-title">{content.title}</h3>
              <p className="mc-desc">{content.description}</p>
            </div>

            {/* 접근 버튼 — window.open 팝업 (iframe 금지) */}
            <button
              onClick={() => window.open(content.accessUrl, "_blank")}
              className="mc-action-btn"
            >
              콘텐츠 열기 →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
