import type { Metadata } from "next";
import { Fragment } from "react";
import "@/styles/pages/about-project.css";
import "@/styles/pages/recruit-teacher.css";
import RecruitRainyHero from "./_components/RecruitRainyHero";


export const metadata: Metadata = {
  title: "강사 모집 | LinkDrop",
  description: "처음부터 잘할 필요 없습니다. LinkDrop과 함께 성장해서 강사가 되세요.",
  robots: { index: false },
};

const WHAT_CARDS = [
  {
    icon: "🌱",
    title: "처음부터 잘할 필요 없습니다",
    desc: "수강생으로 시작해 프로젝트를 완성하고, 실력이 붙으면 자연스럽게 강사로 전환됩니다. 전문가만 가르칠 수 있다는 편견은 여기 없습니다.",
  },
  {
    icon: "🤝",
    title: "같이 배운 사람이 가장 잘 가르칩니다",
    desc: "\"저도 처음엔 막막했는데 이렇게 했어요.\" 이 한 마디가 최고의 커리큘럼입니다. 내 경험이 곧 강의 자료가 됩니다.",
  },
  {
    icon: "🔄",
    title: "억지로 강사 되는 게 아닙니다",
    desc: "성장하면 자연스럽게 전환됩니다. 강사가 되고 싶은 의지만 있다면, 나머지는 LinkDrop과 함께 만들어 갑니다.",
  },
] as const;

const JOURNEY_STEPS = [
  {
    num: "01",
    title: "수강생 참여",
    desc: "원데이 클래스에서 관심 있는 프로젝트를 직접 만들어봅니다.",
    active: false,
  },
  {
    num: "02",
    title: "실전 경험 축적",
    desc: "프로토타입을 배포하고 실제로 운영하며 노하우를 쌓습니다.",
    active: false,
  },
  {
    num: "03",
    title: "파트너 강사 전환",
    desc: "성장이 확인되면 LinkDrop 파트너 강사로 합류합니다.",
    active: true,
  },
  {
    num: "04",
    title: "내 클래스 운영",
    desc: "나만의 클래스를 운영하고 수익을 창출합니다.",
    active: true,
  },
] as const;

const BENEFITS = [
  {
    icon: "💰",
    title: "수익 구조",
    desc: "수강료의 일정 비율을 직접 가져가고, 앱 내 광고 슬롯 B 수익까지 추가로 얻습니다. 수강생이 늘수록 함께 성장하는 구조입니다.",
    tag: null,
  },
  {
    icon: "🏗️",
    title: "운영 인프라 제공",
    desc: "사업계획서 랜딩 페이지, 발표 자료, 클래스 운영 가이드를 LinkDrop이 함께 준비합니다. 강의에만 집중할 수 있습니다.",
    tag: null,
  },
  {
    icon: "🏛️",
    title: "정부지원 연계",
    desc: "TourAPI 등 공공 API 연동 프로젝트 운영 시 관광벤처 등 정부지원 사업 지원 자격이 생깁니다.",
    tag: "한국관광공사 TourAPI",
  },
  {
    icon: "🌐",
    title: "파트너 네트워크",
    desc: "LinkDrop 파트너 강사 커뮤니티에 합류해 다른 강사들과 협업하고, 마스터 DB 데이터를 함께 활용합니다.",
    tag: null,
  },
] as const;

const WHO_ITEMS = [
  "성장 의지가 있는 분 — 지금 실력보다 앞으로의 방향이 중요합니다",
  "함께 만들고 나누는 것을 좋아하는 분",
  "AI·바이브코딩·콘텐츠 수익화에 관심 있는 분",
];

const WHO_PREFERRED = [
  "LinkDrop 원데이 클래스 수강 경험자",
  "직접 만든 프로젝트나 포트폴리오가 있는 분",
];

const PROCESS_STEPS = [
  {
    num: "01",
    title: "관심 신청",
    desc: "아래 버튼으로 메일을 보내주세요. 간단한 자기소개와 관심 분야를 적어주시면 됩니다.",
  },
  {
    num: "02",
    title: "첫 수강 참여",
    desc: "원데이 클래스에 수강생으로 참여해 프로젝트를 직접 완성합니다.",
  },
  {
    num: "03",
    title: "강사 전환",
    desc: "성장을 함께 확인한 후, 파트너 강사 계약을 맺고 첫 클래스를 함께 준비합니다.",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "강의 경험이 전혀 없어도 괜찮나요?",
    a: "네, 전혀 없어도 됩니다. 강의 경험보다 중요한 건 본인이 직접 무언가를 만들어본 경험과 그걸 나누고 싶은 의지입니다. 커리큘럼과 운영 방법은 LinkDrop이 함께 준비합니다.",
  },
  {
    q: "어떤 분야로 강의할 수 있나요?",
    a: "바이브코딩, AI 앱 개발, SNS 수익화, 전자책 출간, 유튜브 쇼츠 등 LinkDrop 원데이 클래스에서 다루는 모든 주제가 가능합니다. 본인이 가장 경험해본 분야를 선택하면 됩니다.",
  },
  {
    q: "수익은 어떻게 나눠지나요?",
    a: "수강료의 일정 비율을 강사에게 드리며, 앱을 배포한 경우 광고 슬롯 B 수익도 추가됩니다. 구체적인 비율은 파트너 계약 시 협의합니다.",
  },
  {
    q: "온라인으로만 운영할 수 있나요?",
    a: "온·오프라인 모두 가능합니다. 강사의 상황에 맞게 선택할 수 있고, LinkDrop에서 온라인 운영 도구를 지원합니다.",
  },
  {
    q: "LinkDrop 수강 경험이 없어도 신청할 수 있나요?",
    a: "신청 자체는 가능합니다. 다만 파트너 강사 전환 전 원데이 클래스 수강 참여를 권장합니다. 직접 경험해야 더 잘 가르칠 수 있습니다.",
  },
] as const;

export default function RecruitTeacherPage() {
  return (
    <>
    <main className="rt-wrap">

      {/* ── 1. 히어로 (Rain Cover) ──────────────────────────── */}
      <RecruitRainyHero />

      {/* ── 2. LinkDrop 강사란? ─────────────────────────────── */}
      <section id="what" className="rt-section rt-what-section">
        <div className="rt-section-inner">
          <p className="rt-eyebrow">WHAT IS LINKDROP INSTRUCTOR</p>
          <h2 className="rt-h2">LinkDrop 강사란?</h2>
          <p className="rt-h2-sub">
            외부에서 초빙하는 전문가가 아닙니다. LinkDrop 안에서 함께 성장한 사람입니다.
          </p>
          <div className="rt-what-grid">
            {WHAT_CARDS.map((card) => (
              <div key={card.title} className="rt-what-card ld-glass-card">
                <span className="rt-what-icon">{card.icon}</span>
                <h3 className="rt-what-title">{card.title}</h3>
                <p className="rt-what-desc">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. 성장 여정 ────────────────────────────────────── */}
      <section className="rt-section">
        <div className="rt-section-inner">
          <p className="rt-eyebrow">GROWTH JOURNEY</p>
          <h2 className="rt-h2">수강생에서 강사까지</h2>
          <p className="rt-h2-sub">
            단계마다 LinkDrop이 함께합니다.
          </p>
          <div className="rt-journey-steps">
            {JOURNEY_STEPS.map((step, i) => (
              <Fragment key={step.num}>
                <div className="rt-journey-step ld-glass-card">
                  <div className={`rt-journey-num${step.active ? " rt-journey-num-active" : ""}`}>
                    {step.num}
                  </div>
                  <p className="rt-journey-title">{step.title}</p>
                  <p className="rt-journey-desc">{step.desc}</p>
                </div>
                {i < JOURNEY_STEPS.length - 1 && (
                  <div className="rt-journey-arrow" aria-hidden="true">→</div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. 강사 혜택 ────────────────────────────────────── */}
      <section className="rt-section rt-what-section">
        <div className="rt-section-inner">
          <p className="rt-eyebrow">BENEFITS</p>
          <h2 className="rt-h2">강사 혜택</h2>
          <p className="rt-h2-sub">
            강의에만 집중할 수 있도록, 나머지는 LinkDrop이 지원합니다.
          </p>
          <div className="rt-benefits-grid">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rt-benefit-card ld-glass-card">
                <span className="rt-benefit-icon">{b.icon}</span>
                <h3 className="rt-benefit-title">{b.title}</h3>
                <p className="rt-benefit-desc">{b.desc}</p>
                {b.tag && <span className="rt-benefit-tag">{b.tag}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. 이런 분을 찾습니다 ───────────────────────────── */}
      <section className="rt-section rt-who-section">
        <div className="rt-section-inner">
          <p className="rt-eyebrow">WHO WE ARE LOOKING FOR</p>
          <h2 className="rt-h2 rt-h2-center">이런 분을 찾습니다</h2>
          <div className="rt-who-card ld-glass-card">
            <ul className="rt-who-list">
              {WHO_ITEMS.map((item) => (
                <li key={item} className="rt-who-item">
                  <span className="rt-who-check">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="rt-who-divider" />
            <p className="rt-who-preferred-label">★ 우대 조건</p>
            <div className="rt-who-list">
              {WHO_PREFERRED.map((item) => (
                <div key={item} className="rt-who-preferred-item">
                  <span className="rt-who-star">★</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. 신청 프로세스 ─────────────────────────────────── */}
      <section className="rt-section">
        <div className="rt-section-inner">
          <p className="rt-eyebrow">HOW TO APPLY</p>
          <h2 className="rt-h2">신청 프로세스</h2>
          <p className="rt-h2-sub">총 3단계, 부담 없이 시작할 수 있습니다.</p>
          <div className="rt-process-steps">
            {PROCESS_STEPS.map((step) => (
              <div key={step.num} className="rt-process-step ld-glass-card">
                <div className="rt-process-step-num">{step.num}</div>
                <h3 className="rt-process-step-title">{step.title}</h3>
                <p className="rt-process-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. FAQ ───────────────────────────────────────────── */}
      <section className="rt-section rt-what-section">
        <div className="rt-section-inner">
          <p className="rt-eyebrow">FAQ</p>
          <h2 className="rt-h2 rt-h2-center">자주 묻는 질문</h2>
          <div className="rt-faq-list">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="rt-faq-item ld-glass-card">
                <summary>
                  {item.q}
                  <span className="rt-faq-chevron">▼</span>
                </summary>
                <p className="rt-faq-answer">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. CTA ───────────────────────────────────────────── */}
      <section className="rt-cta-section">
        <div className="rt-cta-box ld-glass-card">
          <h2 className="rt-cta-h2">
            성장할 의지만 있다면<br />충분합니다
          </h2>
          <p className="rt-cta-sub">
            지금 메일 한 통으로 시작할 수 있습니다.<br />
            간단한 자기소개와 관심 분야를 보내주세요.
          </p>
          <a href="mailto:hello@linkdrop.kr" className="rt-cta-btn">
            강사 성장 프로그램 신청하기
          </a>
          <p className="rt-cta-note">hello@linkdrop.kr · 보통 1~2 영업일 내 답변</p>
        </div>
      </section>

    </main>
    </>
  );
}
