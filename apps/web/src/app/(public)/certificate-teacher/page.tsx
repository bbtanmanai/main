import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "강사자격 | LinkDrop",
  robots: { index: false },
};

export default function CertificateTeacherPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 900,
          marginBottom: "1.2rem",
          color: "var(--text-primary)",
        }}
      >
        강사 자격 안내
      </h1>
      <p
        style={{
          fontSize: "1.125rem",
          lineHeight: 1.7,
          color: "var(--text-secondary)",
          maxWidth: "52ch",
          marginBottom: "2.4rem",
        }}
      >
        LinkDrop 강사 자격 요건 및 심사 기준을 안내합니다.
        해당 페이지는 현재 준비 중입니다.
      </p>
      <a
        href="mailto:hello@linkdrop.kr"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: 56,
          padding: "0 2rem",
          borderRadius: 999,
          background: "var(--accent-neon, #6fff00)",
          color: "#010828",
          fontWeight: 700,
          fontSize: "1rem",
          textDecoration: "none",
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
        }}
      >
        강사 자격 문의
      </a>
    </main>
  );
}
