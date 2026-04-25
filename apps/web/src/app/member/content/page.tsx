"use client";

// ============================================================
// 구매 콘텐츠 목록 페이지
// 구매한 콘텐츠 카드 + 외부 링크 접근 버튼
// 빈 상태: "아직 구매한 콘텐츠가 없습니다"
// ============================================================

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
  // 빈 상태 처리 — mockContents가 빈 배열이면 빈 상태 UI 표시
  if (mockContents.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          textAlign: "center",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 64 }}>📭</div>
        <h2
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: "var(--text-primary)",
          }}
        >
          아직 구매한 콘텐츠가 없습니다
        </h2>
        <p
          style={{
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            fontSize: 16,
            color: "var(--text-secondary)",
          }}
        >
          링크드롭 이용권을 구매하면 모든 콘텐츠에 접근할 수 있습니다
        </p>
        <a
          href="/order"
          style={{
            display: "inline-block",
            padding: "14px 32px",
            borderRadius: 10,
            backgroundColor: "#0055FF",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
            textDecoration: "none",
          }}
        >
          이용권 구매하기
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      {/* 페이지 제목 */}
      <h1
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontWeight: 800,
          fontSize: 26,
          color: "var(--text-primary)",
          marginBottom: 24,
        }}
      >
        구매 콘텐츠
      </h1>

      {/* 콘텐츠 카드 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {mockContents.map((content) => (
          <div
            key={content.id}
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: 16,
              padding: 24,
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "flex-start",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            {/* 썸네일 자리표시자 */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                backgroundColor: "rgba(0,85,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                flexShrink: 0,
              }}
            >
              📚
            </div>

            {/* 콘텐츠 정보 */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    padding: "2px 8px",
                    backgroundColor: "rgba(0,85,255,0.12)",
                    borderRadius: 6,
                    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                    fontSize: 12,
                    color: "#0055FF",
                    fontWeight: 600,
                  }}
                >
                  {content.category}
                </span>
                {/* 신규 뱃지 */}
                {content.isNew && (
                  <span
                    style={{
                      padding: "2px 8px",
                      backgroundColor: "rgba(239,68,68,0.12)",
                      borderRadius: 6,
                      fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                      fontSize: 12,
                      color: "#ef4444",
                      fontWeight: 600,
                    }}
                  >
                    NEW
                  </span>
                )}
              </div>
              <h3
                style={{
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "var(--text-primary)",
                  margin: "0 0 6px",
                }}
              >
                {content.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {content.description}
              </p>
            </div>

            {/* 접근 버튼 — window.open 팝업 (iframe 금지) */}
            <button
              onClick={() => window.open(content.accessUrl, "_blank")}
              style={{
                height: 48,
                padding: "0 20px",
                borderRadius: 10,
                backgroundColor: "rgba(111,255,0,0.12)",
                border: "1px solid rgba(111,255,0,0.3)",
                color: "var(--accent-neon)",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                cursor: "pointer",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              콘텐츠 열기 →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
