// ============================================================
// 랜딩 페이지 — SSG (정적 사이트 생성)
// 경로: /landing/[slug] (9개 슬러그, generateStaticParams로 빌드 타임 생성)
// 각 슬러그는 topics.json에서 정의됨
// LdNavHeader는 랜딩 전용으로 이 파일에서 직접 포함
// ============================================================

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import topicsData from "@/data/topics.json";
import landingsData from "@/data/landings.json";
import LdFooter from "@/components/layout/LdFooter";
import LdHeroSection from "@/components/landing/LdHeroSection";
import LdProblemEmpathySection from "@/components/landing/LdProblemEmpathySection";
import LdV3PipelineSection from "@/components/landing/LdV3PipelineSection";
import LdGrowthPathSection from "@/components/landing/LdGrowthPathSection";
import LdSimulatorSection from "@/components/landing/LdSimulatorSection";
import LdProofSection from "@/components/landing/LdProofSection";
import LdPricingSection from "@/components/landing/LdPricingSection";
import LdFAQSection from "@/components/landing/LdFAQSection";
import LdFinalCTASection from "@/components/landing/LdFinalCTASection";
import LdStickyBottomCTA from "@/components/landing/LdStickyBottomCTA";
import LdCinematicLanding from "@/components/landing/cinematic/LdCinematicLanding";
import type { VideoSection } from "@/types/landing";

// ── SSG: 빌드 타임에 9개 슬러그 페이지 전부 생성 ──────────
export async function generateStaticParams() {
  return topicsData.map((t) => ({ slug: t.slug }));
}

// ── 메타데이터: 각 슬러그별 title 동적 생성 ───────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = topicsData.find((t) => t.slug === slug);
  if (!topic) return {};
  // \n 제거 후 제목 생성
  const title = topic.title.replace(/\n/g, " ");
  return {
    title: `${title} — LinkDrop`,
    description: topic.desc,
  };
}

// ── 페이지 컴포넌트 ────────────────────────────────────────
export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 슬러그 유효성 검사 — 없으면 404
  const topic = topicsData.find((t) => t.slug === slug);
  const landing = (landingsData as Record<string, typeof landingsData[keyof typeof landingsData]>)[slug];

  if (!topic || !landing) {
    notFound();
  }

  // 시네마틱 분기 — expert-video 등 variant: "cinematic" 페이지
  if ((landing as Record<string, unknown>).variant === "cinematic") {
    const videoSections: VideoSection[] = (landing as Record<string, unknown>).videoSections as VideoSection[];
    return (
      <>
        <LdCinematicLanding sections={videoSections} />
        <LdFooter />
        <LdStickyBottomCTA />
      </>
    );
  }

  return (
    <>
      <main>
        {/* 섹션 1: 히어로 */}
        <LdHeroSection data={landing.hero} />

        {/* 섹션 2: 공감 포인트 */}
        <LdProblemEmpathySection pains={landing.pain} />

        {/* 섹션 3: 3단계 파이프라인 */}
        <LdV3PipelineSection />

        {/* 섹션 4: 성장 경로 스테퍼 */}
        <LdGrowthPathSection />

        {/* 섹션 5: 수익 시뮬레이터 */}
        <LdSimulatorSection />

        {/* 섹션 6: 사용자 후기 */}
        <LdProofSection slug={slug} />

        {/* 섹션 7: 가격 */}
        <LdPricingSection />

        {/* 섹션 8: FAQ */}
        <LdFAQSection slug={slug} />

        {/* 섹션 9: 마지막 CTA */}
        <LdFinalCTASection />
      </main>

      <LdFooter />

      {/* 모바일 하단 고정 CTA 바 — 스크롤 300px 이상일 때만 노출 */}
      <LdStickyBottomCTA />
    </>
  );
}
