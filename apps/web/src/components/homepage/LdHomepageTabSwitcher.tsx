"use client";

import { useRouter } from "next/navigation";

interface Props {
  active: "homepage" | "ai";
  homepageCount: number;
  aiCount: number;
}

function MonitorIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
      <path d="M20 3v4"/><path d="M22 5h-4"/>
      <path d="M4 17v2"/><path d="M5 18H3"/>
    </svg>
  );
}

export default function LdHomepageTabSwitcher({ active, homepageCount, aiCount }: Props) {
  const router = useRouter();

  const switchTab = (tab: "homepage" | "ai") => {
    const params = new URLSearchParams();
    if (tab === "ai") params.set("tab", "ai");
    router.push(`/homepage${params.size > 0 ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="hp-tab-switcher" role="tablist">
      <button
        role="tab"
        aria-selected={active === "homepage"}
        data-tab-id="homepage"
        className={`hp-tab-btn${active === "homepage" ? " hp-tab-btn--active" : ""}`}
        onClick={() => switchTab("homepage")}
      >
        <div className="hp-tab-icon"><MonitorIcon /></div>
        <div className="hp-tab-body">
          <div className="hp-tab-row">
            <span className="hp-tab-label">홈페이지 소스</span>
            <span className="hp-tab-count">{homepageCount}</span>
          </div>
          <span className="hp-tab-sub">웹사이트 템플릿 모음</span>
        </div>
      </button>

      <div className="hp-tab-divider" aria-hidden="true" />

      <button
        role="tab"
        aria-selected={active === "ai"}
        data-tab-id="ai"
        className={`hp-tab-btn${active === "ai" ? " hp-tab-btn--active" : ""}`}
        onClick={() => switchTab("ai")}
      >
        <div className="hp-tab-icon"><SparklesIcon /></div>
        <div className="hp-tab-body">
          <div className="hp-tab-row">
            <span className="hp-tab-label">AI 생성용 UI 소스</span>
            <span className="hp-tab-count">{aiCount}</span>
          </div>
          <span className="hp-tab-sub">AI 프롬프트 소스 라이브러리</span>
        </div>
      </button>
    </div>
  );
}
