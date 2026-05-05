import "@/styles/pages/about-project.css";
import type { Metadata } from "next";
import externalLinks from "@/data/external-links.json";
import RainyHeroSection from "./_components/RainyHeroSection";
import ProjectCardGrid from "@/components/project/ProjectCardGrid";

export const metadata: Metadata = {
  title: "원데이 클래스 — LinkDrop",
  description:
    "링크드랍 구매자들과 함께 하는 소규모 원데이 ON/OFF 클래스. 12가지 프로젝트 중 하나를 골라 다 같이 하루 안에 실제로 만들어봅니다.",
};

export default function AboutProjectPage() {
  return (
    <div className="aprj-root">
      <div className="lg-bg" style={{ position: "fixed" }}>
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />
      </div>

      <main className="aprj-main">
        <RainyHeroSection />

        <ProjectCardGrid />

        <section className="aprj-section">
          <div className="aprj-cta">
            <p className="aprj-cta-title">어떤 클래스에 참여하고 싶으신가요?</p>
            <p className="aprj-cta-desc">
              다 같이 만드는 클래스 — 일정과 주제는 카카오 상담에서 확인하세요.
            </p>
            <a
              href={externalLinks.kakao}
              target="_blank"
              rel="noopener noreferrer"
              className="aprj-cta-btn"
            >
              클래스 참여 신청
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
