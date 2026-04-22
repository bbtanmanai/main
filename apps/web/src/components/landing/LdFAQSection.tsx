// ============================================================
// LdFAQSection — 랜딩 섹션 8: FAQ
// faq-common.json 5개 + faq-topics.json[slug] 2개 = 최대 7개
// LdAccordion 컴포넌트 사용
// 서버 컴포넌트 (데이터 import만, 인터랙션은 LdAccordion에서)
// ============================================================

import commonFAQ from "@/data/faq-common.json";
import topicFAQ from "@/data/faq-topics.json";
import LdAccordion from "@/components/ui/LdAccordion";

interface LdFAQSectionProps {
  slug: string; // 현재 랜딩 슬러그 (토픽별 FAQ 선택용)
}

export default function LdFAQSection({ slug }: LdFAQSectionProps) {
  // 토픽별 FAQ 2개 추출 (없으면 빈 배열)
  const topicItems =
    (topicFAQ as Record<string, { q: string; a: string }[]>)[slug] ?? [];

  // 공통 5개 + 토픽 2개 = 최대 7개
  const allItems = [...commonFAQ, ...topicItems];

  return (
    <section
      style={{
        padding: "80px 24px",
        fontFamily: "Pretendard Variable, Pretendard, sans-serif",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* 섹션 제목 */}
        <h2
          style={{
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 40px)",
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          자주 묻는 질문
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "17px",
            marginBottom: "48px",
          }}
        >
          더 궁금하신 점은 카카오채널로 문의해 주세요
        </p>

        {/* 아코디언 목록 */}
        <LdAccordion items={allItems} />
      </div>
    </section>
  );
}
