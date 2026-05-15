import type { Metadata } from "next";

import LdBonusSection from "@/components/landing/LdBonusSection";
import externalLinks from "@/data/external-links.json";
import "@/styles/pages/about.css";

export const metadata: Metadata = {
  title: "서비스 소개 — LinkDrop",
  description:
    "링크드롭은 50·60·70대 시니어가 살아온 경험과 전문성으로 온라인 수익을 만들 수 있도록 AI 도구·전자책·강의·파트너 네트워크를 통합 지원하는 플랫폼입니다.",
};

const BRAND_STORY = {
  paragraphs: [
    "2024년 어느 날, 30년간 아이들을 가르치다 은퇴한 한 분이 있었습니다. 유튜브를 해보려 했지만 편집 소프트웨어 앞에서 세 번 포기했습니다. AI 도구를 써보려 했지만 영어 인터페이스에 막혔습니다. 블로그를 시작했지만 어떻게 수익과 연결되는지 알 수 없었습니다.",
    "그분에게 부족한 것은 아무것도 없었습니다. 30년의 교육 노하우, 수천 명을 바꿔놓은 경험, 아직 나누지 못한 이야기들. 전부 있었습니다. 단지 온라인 세계가 그분을 위해 만들어지지 않았을 뿐입니다.",
    "링크드롭은 거기서 시작했습니다. 기술 장벽을 낮추는 것이 아니라, 없애는 것. AI가 기술을 대신하고 당신은 내용만 가져오면 됩니다.",
  ],
  quote: "₩59,000으로 시작해 AI 원데이클래스 강사가 되는 길 — 그 길을 링크드롭이 만들었습니다.",
};

const VALUES = [
  {
    symbol: "→",
    title: "경험이 먼저, 기술이 나중입니다",
    desc: "강의부터 들으라는 플랫폼은 많습니다. 링크드롭은 반대입니다. 첫날부터 만들고, 첫 주에 공유하고, 첫 달에 수익을 확인합니다. 배우면서 버는 구조입니다.",
  },
  {
    symbol: "✦",
    title: "당신 안에 이미 콘텐츠가 있습니다",
    desc: "AI는 도구입니다. 내용은 당신에게 있습니다. 20년 간 쌓아온 경험은 어떤 전문 작가도 대신 쓸 수 없습니다. AI는 그 경험에 형식을 입힐 뿐입니다.",
  },
  {
    symbol: "◎",
    title: "혼자 하지 않아도 됩니다",
    desc: "온보딩 코칭, 매니저 지원, 강사 커뮤니티. 모르면 물어보면 됩니다. 다시 물어봐도 됩니다. 처음부터 끝까지 누군가 함께합니다.",
  },
];

const HOW_IT_WORKS = [
  { step: "구매", desc: "₩59,000 스타터 구매", icon: "🛒" },
  { step: "학습", desc: "AI 분야 핵심 교육 수료", icon: "📖" },
  { step: "제작", desc: "V3 AI 도구로 첫 콘텐츠 완성", icon: "🎬" },
  { step: "수익", desc: "판매·파트너 수당 수령", icon: "🏦" },
];


const STATS = [
  { value: "4,200+", label: "활성 파트너" },
  { value: "월 72만원", label: "수익 중간값" },
  { value: "2.4개월", label: "첫 수익까지" },
  { value: "97%", label: "온보딩 완료율" },
];

const STEPS = [
  { num: "01", title: "무료 상담 신청",      desc: "카카오톡으로 간단히 신청하면 담당 매니저가 24시간 내 연락드립니다.",                      comfort: "전화 통화도 괜찮아요." },
  { num: "02", title: "나에게 맞는 방법 선택", desc: "경험·성향·목표에 맞는 수익화 방법을 함께 정합니다. 강요 없이, 편안하게.",                  comfort: "천천히 생각해도 됩니다." },
  { num: "03", title: "1:1 온보딩 코칭",     desc: "60분 코칭으로 첫 콘텐츠를 만들 때까지 함께합니다.",                                    comfort: "모르면 다시 물어봐도 됩니다." },
  { num: "04", title: "수익 확인",           desc: "파트너 대시보드에서 실시간으로 수익을 확인합니다. 매월 정산됩니다.",                       comfort: "통장에 실제로 입금됩니다." },
];

const AVATAR_INITIALS = ["박", "김", "이", "최", "정", "한"];
const AVATAR_CLASSES = ["ab-avatar--cyan", "ab-avatar--teal", "ab-avatar--sky"] as const;

export default function AboutPage() {
  return (
    <div className="ab-root">
      <div className="lg-bg" style={{ position: "fixed" }}>
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />
      </div>

      <main className="ab-main">

        {/* ── VIDEO COVER + HERO ─────────────────────────────── */}
        <section className="ab-cover">
          <video
            className="ab-cover-video"
            src="https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/about/about_cover2.mp4"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
          <div className="ab-cover-overlay" />
          <div className="ab-hero">
            <div className="ld-glass ab-badge">
              <span className="ab-badge-dot" />
              50·60·70대 전용 AI 수익화 플랫폼
            </div>
            <h1 className="ab-hero-title">
              당신의 경험으로
              <br />
              <span className="ab-hero-title-accent">AI 수익화</span>를 시작하세요
            </h1>
            <p className="ab-lead-1">
              링크드랍은 50·60·70대가 살아온 경험과 전문성으로
              <br />
              <strong>AI 강의·전자책·파트너 수익</strong>을 만드는 플랫폼입니다.
              <br />
              강의 제작도, 전자책도, AI가 전부 만들어드립니다.
            </p>
            <p className="ab-lead-2">
              기술 없이 스마트폰 하나면 됩니다.
              <br />
              ₩59,000 스타터 하나로 오늘 바로 시작합니다.
            </p>
            <div className="ab-cta-buttons">
              <a
                href={externalLinks.kakao}
                target="_blank"
                rel="noopener noreferrer"
                className="ab-cta-primary"
              >
                무료 상담 신청
              </a>
              <a href="#how-it-works" className="ld-glass ab-cta-secondary">
                서비스 자세히 보기
              </a>
            </div>
          </div>
        </section>

        {/* ── BRAND STORY ────────────────────────────────────── */}
        <section className="ab-section">
          <div className="ab-container-sm">
            <p className="ab-section-label">OUR STORY</p>
            <h2 className="ab-section-h2">
              링크드롭이
              <br />
              만들어진 이유
            </h2>
            <div className="ab-story-paragraphs">
              {BRAND_STORY.paragraphs.map((para, i) => (
                <p key={i} className={`ab-story-p${i === 2 ? " ab-story-p--highlight" : ""}`}>
                  {para}
                </p>
              ))}
            </div>
            <div className="ld-glass ab-quote-box">
              <div className="ab-quote-connector" />
              <p className="ab-quote-text">
                <span className="ab-quote-mark">&ldquo;</span>
                {BRAND_STORY.quote}
                <span className="ab-quote-mark">&rdquo;</span>
              </p>
            </div>
          </div>
        </section>

        {/* ── 서비스 3대 기둥 ────────────────────────────────── */}
        <section id="how-it-works" className="ab-section">
          <LdBonusSection />
        </section>

        {/* ── 4단계 흐름 ─────────────────────────────────────── */}
        <section className="ab-section">
          <div className="ab-container-md">
            <p className="ab-section-label">HOW IT WORKS</p>
            <h2 className="ab-section-h2">구매부터 수익까지 한 번에</h2>
            <p className="ab-section-desc">복잡한 단계 없이 딱 4단계입니다</p>
            <div className="ld-glass ab-how-grid">
              {HOW_IT_WORKS.map((h, i) => (
                <div key={i} className="about-how-cell ab-how-cell-inner">
                  <div className="ab-how-icon">{h.icon}</div>
                  <p className="ab-how-step">{h.step}</p>
                  <p className="ab-how-desc">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 파트너 신뢰 바 ─────────────────────────────────── */}
        <section className="ab-section-tight">
          <div className="ld-glass ab-trust-bar">
            <div className="ab-avatar-stack">
              {AVATAR_INITIALS.map((name, i) => (
                <div
                  key={i}
                  className={`ab-avatar ${AVATAR_CLASSES[i % 3]}`}
                  style={{ marginLeft: i === 0 ? 0 : -12, zIndex: 6 - i }}
                >
                  {name}
                </div>
              ))}
            </div>
            <div>
              <p className="ab-trust-title">
                <span className="ab-trust-title-accent">4,200+</span>
                명의 파트너와 함께합니다
              </p>
              <p className="ab-trust-subtitle">매월 새로운 파트너가 합류하고 있습니다</p>
            </div>
            <div className="ld-glass ab-trust-badge">2026년 기준 인증</div>
          </div>
        </section>

        {/* ── 숫자 통계 ──────────────────────────────────────── */}
        <section className="ab-section">
          <div className="ab-container-lg">
            <p className="ab-section-label">BY THE NUMBERS</p>
            <h2 className="ab-section-h2">숫자가 증명합니다</h2>
            <p className="ab-section-desc">실제 파트너 활동 데이터 기준 (2026년)</p>
            <div className="ab-stats-grid">
              {STATS.map((stat) => (
                <div key={stat.label} className="ld-glass about-card ab-stat-card">
                  <p className="ab-stat-number">{stat.value}</p>
                  <p className="ab-stat-label">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VALUES ─────────────────────────────────────────── */}
        <section className="ab-section">
          <div className="ab-container-lg">
            <p className="ab-section-label">WHAT WE BELIEVE</p>
            <h2 className="ab-section-h2">
              링크드롭이
              <br />
              지키는 세 가지 약속
            </h2>
            <p className="ab-section-desc">플랫폼이 달라지면 결과가 달라집니다.</p>
            <div className="ab-values-grid">
              {VALUES.map((v, i) => (
                <div key={i} className="ld-glass about-card ab-value-card">
                  <div className="ab-value-bg-symbol">{v.symbol}</div>
                  <div className="ab-value-symbol-badge">{v.symbol}</div>
                  <h3 className="ab-value-title">{v.title}</h3>
                  <p className="ab-value-desc">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STEPS ──────────────────────────────────────────── */}
        <section className="ab-section">
          <div className="ab-container-steps">
            <p className="ab-section-label">HOW TO START</p>
            <h2 className="ab-section-h2">
              어렵지 않습니다
              <br />
              4단계면 충분합니다
            </h2>
            <p className="ab-section-desc">처음부터 끝까지 혼자 하지 않아도 됩니다</p>
            <div className="ab-steps-list">
              {STEPS.map((step, i) => (
                <div key={step.num}>
                  <div className="ld-glass about-card ab-step-card">
                    <div className="ab-step-inner">
                      <div className="ab-step-num-circle">{step.num}</div>
                      <div className="ab-step-body">
                        <h3 className="ab-step-title">{step.title}</h3>
                        <p className="ab-step-desc">{step.desc}</p>
                        <p className="ab-step-comfort">✓ {step.comfort}</p>
                      </div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && <div className="ab-step-connector" />}
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* ── 마무리 CTA ─────────────────────────────────────── */}
        <section className="ab-section-bottom-lg">
          <div className="ld-glass ab-closing-card ab-container-cta">
            <p className="ab-closing-label">NEXT STEP</p>
            <h2 className="ab-closing-title">마음에 드는 주제가 하나라도 있었나요?</h2>
            <p className="ab-closing-desc">
              결정하지 않아도 됩니다. 지금은 그냥 궁금한 것만 여쭤봐도 충분합니다.
              <br />
              &ldquo;나한테 가능한 것인지&rdquo;부터 같이 확인해드립니다.
            </p>
            <div className="ab-closing-actions">
              <a
                href={externalLinks.kakao}
                target="_blank"
                rel="noopener noreferrer"
                className="ld-glass ab-closing-kakao"
              >
                카카오톡으로 편하게 물어보기
              </a>
              <a href={externalLinks.phone} className="ab-closing-phone">
                전화로 문의하기
              </a>
            </div>
            <p className="ab-closing-hours">평일 10:00 ~ 18:00 · 주말 상담 가능</p>
          </div>
        </section>

      </main>

    </div>
  );
}
