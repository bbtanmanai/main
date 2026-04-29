"use client";

// ─────────────────────────────────────────────
// LdTopicFinderBanner — 모든 랜딩페이지 공통 배너
// "온라인부업 주제 찾기" → /landing/landing10
// 라이트/다크 CSS 변수 자동 대응
// ─────────────────────────────────────────────

export default function LdTopicFinderBanner() {
  return (
    <section
      style={{
        width: "100%",
        padding: "64px 24px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          borderRadius: 24,
          padding: "52px 40px",
          background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.08) 100%)",
          border: "1px solid rgba(124,58,237,0.2)",
          backdropFilter: "blur(12px)",
          textAlign: "center",
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 30,
            padding: "5px 16px",
            fontSize: 12,
            fontWeight: 700,
            color: "#a78bfa",
            letterSpacing: "0.4px",
            marginBottom: 20,
          }}
        >
          ✦ 무료 성향 진단
        </div>

        <h2
          style={{
            fontSize: "clamp(22px, 4vw, 32px)",
            fontWeight: 800,
            lineHeight: 1.3,
            marginBottom: 14,
            color: "var(--text-primary, #1e1235)",
          }}
        >
          내가 잘할 수 있는<br />
          <span style={{ color: "#7c3aed" }}>온라인 부업 주제</span>는 뭘까?
        </h2>

        <p
          style={{
            fontSize: 16,
            lineHeight: 1.75,
            color: "var(--text-secondary, #64748b)",
            marginBottom: 36,
          }}
        >
          4가지 질문으로 내 성향에 맞는 사업 유형을 찾아드립니다.<br />
          약 2분이면 결과가 나옵니다.
        </p>

        <a
          href="/landing/landing10"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "#fff",
            fontSize: 18,
            fontWeight: 800,
            padding: "18px 48px",
            borderRadius: 14,
            textDecoration: "none",
            boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
            transition: "transform 0.15s, box-shadow 0.15s",
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 40px rgba(124,58,237,0.55)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 32px rgba(124,58,237,0.4)";
          }}
        >
          🎯 온라인부업 주제 찾기
          <span style={{ fontSize: 20 }}>→</span>
        </a>

        <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-secondary, #94a3b8)" }}>
          무료 · 5가지 유형 중 내 유형 즉시 확인
        </p>
      </div>
    </section>
  );
}
