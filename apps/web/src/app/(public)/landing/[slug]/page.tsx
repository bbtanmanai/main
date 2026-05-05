// ============================================================
// 랜딩 페이지 — SSG (정적 사이트 생성)
// 경로: /landing/[slug] (9개 슬러그, generateStaticParams로 빌드 타임 생성)
// 각 슬러그는 topics.json에서 정의됨
// GNB: 루트 레이아웃의 LdCommonGnb 전역 적용 (별도 헤더 렌더 금지)
// ============================================================

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
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
const LdCinematicLanding = dynamic(() => import("@/components/landing/cinematic/LdCinematicLanding"));
const LdWebnovelGuide = dynamic(() => import("@/components/landing/LdWebnovelGuide"));
const LdEbookGuide = dynamic(() => import("@/components/landing/LdEbookGuide"));
const LdPictureBookGuide = dynamic(() => import("@/components/landing/LdPictureBookGuide"));
const LdAffiliateGuide = dynamic(() => import("@/components/landing/LdAffiliateGuide"));
const LdVibecodingGuide = dynamic(() => import("@/components/landing/LdVibecodingGuide"));
const LdTopicGuide = dynamic(() => import("@/components/landing/LdTopicGuide"));
const LdOralHistoryLanding = dynamic(() => import("@/components/landing/LdOralHistoryLanding"));
import LdTopicFinderBanner from "@/components/landing/LdTopicFinderBanner";
import LdMascotFloat from "@/components/landing/LdMascotFloat";
import LdPromptPreview from "@/components/landing/LdPromptPreview";
import LdBonusSection from "@/components/landing/LdBonusSection";
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

  const BonusSection = <LdBonusSection />;

  // 프롬프트 미리보기 공통 섹션 — 모든 랜딩 variant에 삽입
  const PromptSection = (
    <section style={{ padding: "72px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{
            fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 700,
            margin: "0 0 12px", lineHeight: 1.8,
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
          }}>
            <span style={{
              display: "inline",
              color: "rgba(255,255,255,0.92)",
              background: "rgba(0,0,0,0.82)",
              padding: "2px 10px",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}>
              프롬프트 라이브러리
            </span>
          </h2>
          <p style={{ margin: 0, fontSize: "0.87rem",
            fontFamily: "Pretendard Variable, Pretendard, sans-serif", lineHeight: 2,
          }}>
            <span style={{
              display: "inline",
              color: "rgba(255,255,255,0.55)",
              background: "rgba(0,0,0,0.82)",
              padding: "2px 10px",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}>
              200개+ 프롬프트 중 랜덤 샘플 — 전체는 멤버십 가입 후 이용 가능합니다
            </span>
          </p>
        </div>
        <LdPromptPreview />
      </div>
    </section>
  );

  // 부업 주제 가이드 분기 — landing10 variant: "topic-guide" (라이트/다크 공용)
  if ((landing as Record<string, unknown>).variant === "topic-guide") {
    return (
      <>
        <LdTopicGuide />
        {PromptSection}
        {BonusSection}
        <LdFooter />
      </>
    );
  }

  // 구술 생애사 기록 분기 — landing7 variant: "oral-history"
  if ((landing as Record<string, unknown>).variant === "oral-history") {
    return (
      <>
        <LdOralHistoryLanding />
        {PromptSection}
        {BonusSection}
        <LdFooter />
        <LdStickyBottomCTA />
      </>
    );
  }

  // 웹소설 가이드 분기 — landing1 variant: "webnovel-guide"
  if ((landing as Record<string, unknown>).variant === "webnovel-guide") {
    return (
      <>
        <LdWebnovelGuide />
        {PromptSection}
        {BonusSection}
        <LdFooter />
        <LdStickyBottomCTA />
      </>
    );
  }

  // 전자책·경험 수익화 가이드 분기 — landing2 variant: "ebook-guide"
  if ((landing as Record<string, unknown>).variant === "ebook-guide") {
    return (
      <>
        <LdEbookGuide />
        {PromptSection}
        {BonusSection}
        <LdFooter />
        <LdStickyBottomCTA />
      </>
    );
  }

  // 동화책 가이드 분기 — landing3 variant: "picture-book-guide"
  if ((landing as Record<string, unknown>).variant === "picture-book-guide") {
    return (
      <>
        <LdPictureBookGuide />
        {PromptSection}
        {BonusSection}
        <LdFooter />
        <LdStickyBottomCTA />
      </>
    );
  }

  // 제휴 마케팅 가이드 분기 — landing5 variant: "affiliate-guide"
  if ((landing as Record<string, unknown>).variant === "affiliate-guide") {
    return (
      <>
        <LdAffiliateGuide />
        {PromptSection}
        {BonusSection}
        <LdFooter />
        <LdStickyBottomCTA />
      </>
    );
  }

  // 바이브코딩 가이드 분기 — landing6 variant: "vibecoding-guide"
  if ((landing as Record<string, unknown>).variant === "vibecoding-guide") {
    return (
      <>
        <LdVibecodingGuide />
        {PromptSection}
        {BonusSection}
        <LdFooter />
        <LdStickyBottomCTA />
      </>
    );
  }

  // 시네마틱 분기 — expert-video 등 variant: "cinematic" 페이지
  if ((landing as Record<string, unknown>).variant === "cinematic") {
    const videoSections: VideoSection[] = (landing as Record<string, unknown>).videoSections as VideoSection[];
    return (
      <>
        <LdCinematicLanding sections={videoSections} />
        {PromptSection}
        {BonusSection}
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

        {/* 마스코트 A — 솔루션 전환 직전, 오른쪽 등장 */}
        <LdMascotFloat side="right" />

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

        {/* 마스코트 B — FAQ 진입 직전, 왼쪽 등장 */}
        <LdMascotFloat side="left" />

        {/* 섹션 8: FAQ */}
        <LdFAQSection slug={slug} />

        {/* 프롬프트 라이브러리 */}
        {PromptSection}

        {/* 보너스 */}
        {BonusSection}

        {/* 온라인부업 주제 찾기 배너 — 모든 랜딩 공통 */}
        <LdTopicFinderBanner />

        {/* 섹션 9: 마지막 CTA */}
        <LdFinalCTASection />
      </main>

      <LdFooter />

      {/* 모바일 하단 고정 CTA 바 — 스크롤 300px 이상일 때만 노출 */}
      <LdStickyBottomCTA />
    </>
  );
}
