import type { Metadata } from "next";
import "@/styles/pages/certificate-teacher.css";
import CertSnowHero from "./_components/CertSnowHero";
import CertBoard from "./_components/CertBoard";


export const metadata: Metadata = {
  title: "강사신청 | LinkDrop",
  robots: { index: false },
};

const FEATURES = [
  {
    icon: "📚",
    title: "수강 경험",
    desc: "LinkDrop 원데이 클래스를 수강하고 프로젝트를 완성한 경험이 있으신 분",
  },
  {
    icon: "🚀",
    title: "결과물 보유",
    desc: "직접 배포하거나 운영해본 앱·콘텐츠 포트폴리오가 있으신 분",
  },
  {
    icon: "🤝",
    title: "소통 의지",
    desc: "새로운 수강생을 돕고자 하는 열정과 소통 능력을 갖추신 분",
  },
];

export default function CertificateTeacherPage() {
  return (
    <>
      <div className="lg-bg" aria-hidden="true">
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />
      </div>

      <CertSnowHero />

      <main className="ct-doc">

        {/* ── Chapter 1: 강사신청 프로그램 ───────────────────── */}
        <section id="ch1" className="ct-section">
          <p className="ct-section-eyebrow">Chapter 1 — 강사신청 프로그램</p>
          <h2 className="ct-section-h2">경험이 자격이 되는 순간</h2>
          <p className="ct-section-lead">
            전문가가 아니어도 됩니다. LinkDrop 안에서 성장한 경험이 가장 강력한 자격입니다.
          </p>

          <div className="ct-feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="ct-feature-card">
                <div className="ct-feature-icon">{f.icon}</div>
                <div className="ct-feature-title">{f.title}</div>
                <p className="ct-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Chapter 2: 강사신청 게시판 ──────────────────────── */}
        <section id="ch2" className="ct-section">
          <p className="ct-section-eyebrow">Chapter 2 — 강사신청 게시판</p>
          <h2 className="ct-section-h2">강사 신청 현황</h2>
          <CertBoard />
        </section>

      </main>

    </>
  );
}
