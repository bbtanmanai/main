"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WebnovelShell from "./_components/WebnovelShell";

interface V3Series {
  id: string;
  series_code: string;
  title: string;
  topic: string;
  settings: { genre?: string; description?: string };
  status: string;
  created_at: string;
}

/* ── 상태 뱃지 색상 맵 (런타임 값 — TSX 유지) ── */
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "연재중",  color: "#16a34a", bg: "rgba(22,163,74,0.10)"  },
  draft:    { label: "초안",    color: "#d97706", bg: "rgba(217,119,6,0.10)"  },
  complete: { label: "완결",    color: "#6366f1", bg: "rgba(99,102,241,0.10)" },
};

/* ── 스켈레톤 카드 ── */
function SkeletonCard() {
  return (
    <div className="wn-skeleton-card">
      <div className="wn-skeleton-row">
        <div className="wn-skeleton-bar wn-skeleton-title" />
        <div className="wn-skeleton-bar wn-skeleton-badge" />
      </div>
      <div className="wn-skeleton-bar wn-skeleton-line-lg" />
      <div className="wn-skeleton-bar wn-skeleton-line-sm" />
      <div className="wn-skeleton-bar wn-skeleton-btn" />
    </div>
  );
}

/* ── 상태 뱃지 ── */
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span
      className="wn-status-badge"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

/* ── 시리즈 카드 ── */
function SeriesCard({ s, onClick }: { s: V3Series; onClick: () => void }) {
  const createdAt = new Date(s.created_at).toLocaleDateString("ko-KR", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="wn-series-card"
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(-4px)";
        el.style.boxShadow = "0 16px 40px rgba(0,0,0,0.10)";
        el.style.borderColor = "rgba(0,0,0,0.18)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "";
        el.style.boxShadow = "";
        el.style.borderColor = "#E5E7EB";
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLElement).style.outline = "2px solid #1E293B";
        (e.currentTarget as HTMLElement).style.outlineOffset = "2px";
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLElement).style.outline = "none";
      }}
    >
      {/* 상단 행 */}
      <div className="wn-series-card-top">
        <StatusBadge status={s.status} />
        <span className="wn-series-code">{s.series_code}</span>
      </div>

      {/* 제목 */}
      <h2 className="wn-series-title">{s.title || s.series_code}</h2>

      {/* 주제 */}
      {s.topic && <p className="wn-series-topic">{s.topic}</p>}
      {!s.topic && <div style={{ flex: 1 }} />}

      {/* 하단 */}
      <div className="wn-series-footer">
        <span className="wn-series-date">{createdAt}</span>
        <span className="wn-series-open">
          열기
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </div>
    </div>
  );
}

/* ── 빈 상태 ── */
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="wn-empty-state">
      <div className="wn-empty-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
      <h2 className="wn-empty-title">첫 시리즈를 시작해보세요</h2>
      <p className="wn-empty-desc">
        AI가 도와주는 웹소설 창작 도구로<br />나만의 이야기를 만들어보세요.
      </p>
      <button
        onClick={onCreateClick}
        className="wn-empty-btn"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.18)";
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        새 시리즈 만들기
      </button>
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function WebnovelIndexPage() {
  const router = useRouter();
  const [series, setSeries] = useState<V3Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v3/series")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setSeries)
      .catch(() =>
        setError("시리즈 목록을 불러오지 못했습니다. V3 API 서버(localhost:8001)가 실행 중인지 확인하세요.")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <WebnovelShell>
      {/* ── 페이지 헤더 ── */}
      <div className="wn-page-header">
        <div>
          <p className="wn-page-header-label">웹소설 스튜디오</p>
          <h1 className="wn-page-title">
            내 시리즈
            {!loading && series.length > 0 && (
              <span className="wn-page-title-count">{series.length}편</span>
            )}
          </h1>
        </div>

        <button
          onClick={() => router.push("/webnovel/create")}
          className="wn-page-btn"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(0,0,0,0.24)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(0,0,0,0.18)";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          새 시리즈
        </button>
      </div>

      {/* ── 에러 배너 ── */}
      {error && (
        <div className="wn-page-error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="wn-page-error-text">{error}</span>
        </div>
      )}

      {/* ── 스켈레톤 ── */}
      {loading && (
        <div className="wn-series-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── 빈 상태 ── */}
      {!loading && !error && series.length === 0 && (
        <EmptyState onCreateClick={() => router.push("/webnovel/create")} />
      )}

      {/* ── 시리즈 카드 그리드 (Bento) ── */}
      {!loading && !error && series.length > 0 && (
        <div className="wn-series-grid">
          {series.map((s) => (
            <SeriesCard
              key={s.id}
              s={s}
              onClick={() => router.push(`/webnovel/series/${s.id}`)}
            />
          ))}
        </div>
      )}
    </WebnovelShell>
  );
}
