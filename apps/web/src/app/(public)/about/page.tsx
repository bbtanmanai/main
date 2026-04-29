// ============================================================
// /about — 서비스 소개
// 콤보 #4: #0A1F44 - #D6F0FF → var(--accent-aqua) 단독 사용
// 배경: .lg-bg + .lg-blob (globals.css 정의, 다크/라이트 자동)
// SSG Server Component — 클라이언트 훅 없음
// ============================================================

import type { Metadata } from "next";
import LdFooter from "@/components/layout/LdFooter";
import LdBonusSection from "@/components/landing/LdBonusSection";
import externalLinks from "@/data/external-links.json";

export const metadata: Metadata = {
  title: "서비스 소개 — LinkDrop",
  description:
    "링크드롭은 50·60·70대 시니어가 살아온 경험과 전문성으로 온라인 수익을 만들 수 있도록 AI 도구·전자책·강의·파트너 네트워크를 통합 지원하는 플랫폼입니다.",
};

// ── 데이터 ────────────────────────────────────────────────────

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

const CHALLENGES = [
  {
    num: "01",
    icon: "📖",
    title: "웹소설 작가",
    subtitle: "블로그·브런치 연재",
    desc: "살아온 이야기에 AI가 이야기 구조를 입혀줍니다. 처음 쓰는 소설이 연재 콘텐츠가 됩니다.",
    href: "/landing/landing1",
  },
  {
    num: "02",
    icon: "📚",
    title: "전자책 출간",
    subtitle: "노하우·경험을 한 권으로",
    desc: "머릿속에 있는 전문 지식이 그대로 책이 됩니다. 목차부터 초안까지 AI가 함께 잡아줍니다.",
    href: "/landing/landing2",
  },
  {
    num: "03",
    icon: "🎨",
    title: "동화책 제작",
    subtitle: "그림·글 모두 AI로",
    desc: "손주에게 들려주던 이야기, 이제는 세상에 내놓을 수 있습니다. 삽화도 AI가 만들어드립니다.",
    href: "/landing/landing3",
  },
  {
    num: "04",
    icon: "🎓",
    title: "AI 클래스 강의",
    subtitle: "강의 스크립트·PPT 자동 생성",
    desc: "가르치는 것이 즐겁다면, 강사가 될 수 있습니다. 커리큘럼은 링크드롭이 다 만들어놨습니다.",
    href: "/landing/landing4",
  },
  {
    num: "05",
    icon: "🎬",
    title: "유튜브 쇼츠",
    subtitle: "자막·썸네일·스크립트 자동화",
    desc: "카메라 앞에 서지 않아도 됩니다. 경험담을 텍스트로 쓰면 영상이 완성됩니다.",
    href: "/landing/landing5",
  },
  {
    num: "06",
    icon: "💻",
    title: "바이브코딩 웹앱",
    subtitle: "코딩 없이 웹사이트·앱 제작",
    desc: "아이디어만 있으면 됩니다. 코드 한 줄 없이 AI와 대화만으로 내 서비스를 만듭니다.",
    href: "/landing/landing6",
  },
  {
    num: "07",
    icon: "🎙️",
    title: "구술 생애사 기록가",
    subtitle: "Oral History Archivist",
    desc: "어르신들의 삶을 기록하는 전문 직업. 인터뷰·편집·출판 전 과정을 AI가 보조합니다.",
    href: "/landing/landing7",
  },
  {
    num: "08",
    icon: "📱",
    title: "소상공인 SNS 대행",
    subtitle: "1인기업 마케팅·CS 자동화",
    desc: "동네 식당, 미용실, 학원의 SNS를 대신 운영해주는 1인 에이전시. 자동화로 여러 곳을 동시에.",
    href: "/landing/landing8",
  },
  {
    num: "09",
    icon: "📈",
    title: "트레이딩 커뮤니티 운영",
    subtitle: "주식·암호화폐 자동매매 솔루션",
    desc: "수년간 쌓아온 투자 노하우를 시스템으로 만들고, 커뮤니티로 공유하는 방법이 있습니다.",
    href: "/landing/landing9",
  },
];

const STATS = [
  { value: "4,200+", label: "활성 파트너" },
  { value: "월 72만원", label: "수익 중간값" },
  { value: "2.4개월", label: "첫 수익까지" },
  { value: "97%", label: "온보딩 완료율" },
];

const STEPS = [
  {
    num: "01",
    title: "무료 상담 신청",
    desc: "카카오톡으로 간단히 신청하면 담당 매니저가 24시간 내 연락드립니다.",
    comfort: "전화 통화도 괜찮아요.",
  },
  {
    num: "02",
    title: "나에게 맞는 방법 선택",
    desc: "경험·성향·목표에 맞는 수익화 방법을 함께 정합니다. 강요 없이, 편안하게.",
    comfort: "천천히 생각해도 됩니다.",
  },
  {
    num: "03",
    title: "1:1 온보딩 코칭",
    desc: "60분 코칭으로 첫 콘텐츠를 만들 때까지 함께합니다.",
    comfort: "모르면 다시 물어봐도 됩니다.",
  },
  {
    num: "04",
    title: "수익 확인",
    desc: "파트너 대시보드에서 실시간으로 수익을 확인합니다. 매월 정산됩니다.",
    comfort: "통장에 실제로 입금됩니다.",
  },
];

const AVATAR_INITIALS = ["박", "김", "이", "최", "정", "한"];

// ── 페이지 ────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div
      style={{
        position: "relative",
        color: "var(--color-text)",
        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
        minHeight: "100vh",
      }}
    >
      {/* ══ Blob 배경 (globals.css .lg-bg/.lg-blob, 다크/라이트 자동 전환) ══ */}
      <div className="lg-bg" style={{ position: "fixed" }}>
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />
      </div>

      <main style={{ position: "relative", zIndex: 1 }}>

        {/* ══════════════════════════════════════════
            HERO — 링크드롭이 무엇인가
        ══════════════════════════════════════════ */}
        <section
          style={{
            padding: "clamp(80px,12vw,120px) clamp(20px,5vw,40px) clamp(64px,8vw,96px)",
            textAlign: "center",
            maxWidth: 800,
            margin: "0 auto",
          }}
        >
          {/* 배지 */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "var(--accent-aqua)",
              border: "1px solid var(--glass-border)",
              background: "var(--glass-white)",
              backdropFilter: "var(--blur-sm)",
              WebkitBackdropFilter: "var(--blur-sm)",
              borderRadius: 999,
              padding: "7px 18px",
              marginBottom: 28,
              letterSpacing: "0.04em",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "var(--accent-aqua)",
                display: "inline-block",
              }}
            />
            50·60·70대를 위한 AI 수익화 플랫폼
          </div>

          {/* 헤드라인 */}
          <h1
            style={{
              fontSize: "clamp(34px,6.5vw,64px)",
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              marginBottom: 24,
              color: "var(--color-text)",
            }}
          >
            당신이 살아온 이야기가
            <br />
            <span style={{ color: "var(--accent-aqua)" }}>
              진짜 수익
            </span>
            이 되는 곳
          </h1>

          {/* 서비스 한 줄 설명 */}
          <p
            style={{
              fontSize: "clamp(18px,2.2vw,22px)",
              color: "var(--color-text-muted)",
              lineHeight: 1.8,
              maxWidth: 620,
              margin: "0 auto 14px",
            }}
          >
            링크드롭은 50·60·70대가{" "}
            <strong style={{ color: "var(--color-text)", fontWeight: 700 }}>
              살아온 경험과 전문성
            </strong>
            으로
            <br />
            온라인 강의·전자책·파트너 수익을 만들 수 있도록
            <br />
            AI 도구와 교육, 커뮤니티를 통합 지원합니다.
          </p>
          <p
            style={{
              fontSize: 18,
              color: "var(--color-text-muted)",
              lineHeight: 1.7,
              maxWidth: 560,
              margin: "0 auto 40px",
            }}
          >
            기술을 몰라도 됩니다. 스마트폰 하나면 충분합니다.
            <br />
            AI가 만들고, 링크드롭이 판매까지 함께합니다.
          </p>

          {/* CTA */}
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href={externalLinks.kakao}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "18px 40px",
                borderRadius: 999,
                backgroundColor: "var(--accent-neon)",
                color: "#010828",
                fontWeight: 800,
                fontSize: 18,
                textDecoration: "none",
                minHeight: 60,
                letterSpacing: "-0.01em",
              }}
            >
              무료 상담 신청
            </a>
            <a
              href="#how-it-works"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "18px 36px",
                borderRadius: 999,
                background: "var(--glass-white)",
                border: "1px solid var(--glass-border)",
                backdropFilter: "var(--blur-sm)",
                WebkitBackdropFilter: "var(--blur-sm)",
                color: "var(--color-text)",
                fontWeight: 700,
                fontSize: 18,
                textDecoration: "none",
                minHeight: 60,
              }}
            >
              서비스 자세히 보기
            </a>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            브랜드 스토리 — 왜 만들었는가
        ══════════════════════════════════════════ */}
        <section style={{ padding: "0 clamp(20px,5vw,40px) 96px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <SectionLabel>OUR STORY</SectionLabel>
            <h2 style={sectionH2}>
              링크드롭이
              <br />
              만들어진 이유
            </h2>

            {/* 이야기 단락들 */}
            <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 24 }}>
              {BRAND_STORY.paragraphs.map((para, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: "clamp(18px,2vw,20px)",
                    color: i === 2 ? "var(--color-text)" : "var(--color-text-muted)",
                    lineHeight: 1.85,
                    fontWeight: i === 2 ? 600 : 400,
                  }}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* 브랜드 선언 인용 */}
            <div
              className="ld-glass"
              style={{
                marginTop: 48,
                background: "var(--glass-white)",
                border: "1.5px solid var(--accent-aqua)",
                borderRadius: 20,
                padding: "32px 36px",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -1,
                  left: 36,
                  width: 3,
                  height: 48,
                  background: "var(--accent-aqua)",
                  borderRadius: "0 0 2px 2px",
                  transform: "translateY(-100%)",
                }}
              />
              <p
                style={{
                  fontSize: "clamp(18px,2.2vw,22px)",
                  fontWeight: 700,
                  color: "var(--color-text)",
                  lineHeight: 1.65,
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                <span
                  style={{
                    color: "var(--accent-aqua)",
                    fontSize: "clamp(20px,2.5vw,26px)",
                    fontWeight: 800,
                  }}
                >
                  &ldquo;
                </span>
                {BRAND_STORY.quote}
                <span
                  style={{
                    color: "var(--accent-aqua)",
                    fontSize: "clamp(20px,2.5vw,26px)",
                    fontWeight: 800,
                  }}
                >
                  &rdquo;
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            서비스 3대 기둥
        ══════════════════════════════════════════ */}
        <section id="how-it-works" style={{ padding: "0 clamp(20px,5vw,40px) 96px" }}>
          <LdBonusSection />
        </section>

        {/* ══════════════════════════════════════════
            어떻게 작동하는가 — 4단계 흐름
        ══════════════════════════════════════════ */}
        <section style={{ padding: "0 clamp(20px,5vw,40px) 96px" }}>
          <div style={{ maxWidth: 880, margin: "0 auto" }}>
            <SectionLabel>HOW IT WORKS</SectionLabel>
            <h2 style={sectionH2}>구매부터 수익까지 한 번에</h2>
            <p style={sectionDesc}>복잡한 단계 없이 딱 4단계입니다</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 0,
                marginTop: 48,
                background: "var(--glass-white)",
                border: "1px solid var(--glass-border)",
                backdropFilter: "var(--blur-sm)",
                WebkitBackdropFilter: "var(--blur-sm)",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              {HOW_IT_WORKS.map((h, i) => (
                <div
                  key={i}
                  className="about-how-cell"
                  style={{
                    padding: "32px 24px",
                    textAlign: "center",
                    borderRight:
                      i < HOW_IT_WORKS.length - 1
                        ? "1px solid var(--glass-border)"
                        : "none",
                    position: "relative",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{h.icon}</div>
                  <p
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "var(--accent-aqua)",
                      marginBottom: 8,
                    }}
                  >
                    {h.step}
                  </p>
                  <p
                    style={{
                      fontSize: 15,
                      color: "var(--color-text-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {h.desc}
                  </p>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <span
                      style={{
                        position: "absolute",
                        right: -12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 20,
                        color: "var(--accent-aqua)",
                        zIndex: 1,
                        display: "none",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            파트너 신뢰 바
        ══════════════════════════════════════════ */}
        <section style={{ padding: "0 clamp(20px,5vw,40px) 64px" }}>
          <div
            className="ld-glass"
            style={{
              maxWidth: 880,
              margin: "0 auto",
              background: "var(--glass-white)",
              border: "1px solid var(--glass-border)",
              borderRadius: 20,
              padding: "24px 32px",
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {AVATAR_INITIALS.map((name, i) => (
                <div
                  key={i}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background:
                      i % 3 === 0
                        ? "linear-gradient(135deg, #5ee7df, #3b82f6)"
                        : i % 3 === 1
                        ? "linear-gradient(135deg, #22d3ee, #0891b2)"
                        : "linear-gradient(135deg, #a5f3fc, #22d3ee)",
                    border: "2.5px solid var(--glass-white-lg)",
                    marginLeft: i === 0 ? 0 : -12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#fff",
                    position: "relative",
                    zIndex: 6 - i,
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
            <div>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--color-text)",
                  margin: 0,
                }}
              >
                <span style={{ color: "var(--accent-aqua)" }}>4,200+</span>
                명의 파트너와 함께합니다
              </p>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--color-text-muted)",
                  margin: "4px 0 0",
                }}
              >
                매월 새로운 파트너가 합류하고 있습니다
              </p>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--accent-aqua)",
                background: "var(--glass-white)",
                border: "1px solid var(--glass-border)",
                borderRadius: 999,
                padding: "5px 14px",
              }}
            >
              2026년 기준 인증
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════════
            숫자로 보는 링크드롭
        ══════════════════════════════════════════ */}
        <section style={{ padding: "0 clamp(20px,5vw,40px) 96px" }}>
          <div style={{ maxWidth: 1040, margin: "0 auto" }}>
            <SectionLabel>BY THE NUMBERS</SectionLabel>
            <h2 style={sectionH2}>숫자가 증명합니다</h2>
            <p style={sectionDesc}>실제 파트너 활동 데이터 기준 (2026년)</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 20,
                marginTop: 48,
              }}
            >
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="ld-glass about-card"
                  style={{
                    background: "var(--glass-white)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: 20,
                    padding: "32px 24px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: "clamp(28px,4vw,44px)",
                      fontWeight: 800,
                      color: "var(--accent-aqua)",
                      lineHeight: 1,
                      marginBottom: 10,
                    }}
                  >
                    {stat.value}
                  </p>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--color-text)",
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            우리가 믿는 것 — 가치 선언
        ══════════════════════════════════════════ */}
        <section style={{ padding: "0 clamp(20px,5vw,40px) 96px" }}>
          <div style={{ maxWidth: 1040, margin: "0 auto" }}>
            <SectionLabel>WHAT WE BELIEVE</SectionLabel>
            <h2 style={sectionH2}>
              링크드롭이
              <br />
              지키는 세 가지 약속
            </h2>
            <p style={sectionDesc}>
              플랫폼이 달라지면 결과가 달라집니다.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 24,
                marginTop: 48,
              }}
            >
              {VALUES.map((v, i) => (
                <div
                  key={i}
                  className="ld-glass about-card"
                  style={{
                    background: "var(--glass-white)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: 20,
                    padding: "36px 28px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* 배경 심볼 */}
                  <div
                    style={{
                      position: "absolute",
                      top: -10,
                      right: 16,
                      fontSize: 100,
                      fontWeight: 800,
                      color: "var(--accent-aqua)",
                      opacity: 0.05,
                      lineHeight: 1,
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  >
                    {v.symbol}
                  </div>

                  {/* 순서 심볼 */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: "2px solid var(--accent-aqua)",
                      background: "rgba(34,211,238,0.08)",
                      fontSize: 18,
                      color: "var(--accent-aqua)",
                      fontWeight: 800,
                      marginBottom: 20,
                    }}
                  >
                    {v.symbol}
                  </div>

                  <h3
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--color-text)",
                      lineHeight: 1.35,
                      marginBottom: 14,
                    }}
                  >
                    {v.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 18,
                      color: "var(--color-text-muted)",
                      lineHeight: 1.75,
                    }}
                  >
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            4단계 시작 방법
        ══════════════════════════════════════════ */}
        <section style={{ padding: "0 clamp(20px,5vw,40px) 96px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <SectionLabel>HOW TO START</SectionLabel>
            <h2 style={sectionH2}>
              어렵지 않습니다
              <br />
              4단계면 충분합니다
            </h2>
            <p style={sectionDesc}>처음부터 끝까지 혼자 하지 않아도 됩니다</p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                marginTop: 48,
              }}
            >
              {STEPS.map((step, i) => (
                <div key={step.num}>
                  <div
                    className="ld-glass about-card"
                    style={{
                      background: "var(--glass-white)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: 20,
                      padding: "24px 28px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 20,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: "50%",
                          border: "2px solid var(--accent-aqua)",
                          background: "rgba(34,211,238,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 15,
                          fontWeight: 800,
                          color: "var(--accent-aqua)",
                          flexShrink: 0,
                        }}
                      >
                        {step.num}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: "var(--color-text)",
                            marginBottom: 6,
                          }}
                        >
                          {step.title}
                        </h3>
                        <p
                          style={{
                            fontSize: 18,
                            color: "var(--color-text-muted)",
                            lineHeight: 1.65,
                            marginBottom: 8,
                          }}
                        >
                          {step.desc}
                        </p>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--accent-aqua)",
                          }}
                        >
                          ✓ {step.comfort}
                        </p>
                      </div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        height: 20,
                        background: "var(--glass-border)",
                        margin: "0 auto",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            9가지 도전 주제 — 소프트 탐색 섹션
        ══════════════════════════════════════════ */}
        <section style={{ padding: "0 clamp(20px,5vw,40px) 96px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <SectionLabel>WHAT YOU CAN DO</SectionLabel>
            <h2 style={sectionH2}>
              어떤 것에 도전해볼 수 있을까요?
            </h2>
            <p style={sectionDesc}>
              하나라도 "이건 나랑 맞겠다" 싶은 게 있으면 충분합니다.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
                gap: 20,
                marginTop: 48,
              }}
            >
              {CHALLENGES.map((c) => (
                <a
                  key={c.num}
                  href={c.href}
                  className="about-challenge-link"
                >
                  <div
                    className="ld-glass about-link-card"
                    style={{
                      background: "var(--glass-white)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: 20,
                      padding: "28px 26px",
                      height: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* 번호 + 아이콘 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 16,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          color: "var(--color-text-subtle)",
                        }}
                      >
                        {c.num}
                      </span>
                      <span style={{ fontSize: 32 }}>{c.icon}</span>
                    </div>

                    {/* 제목 */}
                    <h3
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: "var(--color-text)",
                        marginBottom: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {c.title}
                    </h3>

                    {/* 부제 */}
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--accent-aqua)",
                        marginBottom: 14,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {c.subtitle}
                    </p>

                    {/* 설명 */}
                    <p
                      style={{
                        fontSize: 16,
                        color: "var(--color-text-muted)",
                        lineHeight: 1.7,
                        marginBottom: 18,
                      }}
                    >
                      {c.desc}
                    </p>

                    {/* 소프트 링크 */}
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--color-text-subtle)",
                      }}
                    >
                      더 알아보기 →
                    </p>
                  </div>
                </a>
              ))}
            </div>

            {/* 하단 안내 문구 — 소프트 */}
            <p
              style={{
                textAlign: "center",
                fontSize: 18,
                color: "var(--color-text-muted)",
                lineHeight: 1.75,
                marginTop: 52,
              }}
            >
              뭘 해야 할지 아직 모르겠어도 괜찮습니다.
              <br />
              상담에서 함께 방향을 찾아드립니다.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            마무리 — 소프트 안내
        ══════════════════════════════════════════ */}
        <section style={{ padding: "0 clamp(20px,5vw,40px) 120px" }}>
          <div
            className="ld-glass"
            style={{
              maxWidth: 660,
              margin: "0 auto",
              background: "var(--glass-white)",
              border: "1px solid var(--glass-border)",
              borderRadius: 28,
              padding: "clamp(40px,6vw,64px) clamp(24px,5vw,56px)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.14em",
                color: "var(--accent-aqua)",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              NEXT STEP
            </p>

            <h2
              style={{
                fontSize: "clamp(24px,4vw,36px)",
                fontWeight: 800,
                color: "var(--color-text)",
                lineHeight: 1.4,
                marginBottom: 20,
                letterSpacing: "-0.01em",
              }}
            >
              마음에 드는 주제가 하나라도 있었나요?
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "var(--color-text-muted)",
                lineHeight: 1.85,
                marginBottom: 40,
              }}
            >
              결정하지 않아도 됩니다. 지금은 그냥 궁금한 것만 여쭤봐도 충분합니다.
              <br />
              "나한테 가능한 것인지"부터 같이 확인해드립니다.
            </p>

            {/* 소프트 연락 안내 — 버튼보다 텍스트 링크 느낌 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                alignItems: "center",
              }}
            >
              <a
                href={externalLinks.kakao}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "16px 36px",
                  borderRadius: 999,
                  background: "var(--glass-white)",
                  border: "1px solid var(--glass-border)",
                  backdropFilter: "var(--blur-sm)",
                  WebkitBackdropFilter: "var(--blur-sm)",
                  color: "var(--color-text)",
                  fontWeight: 700,
                  fontSize: 17,
                  textDecoration: "none",
                  minHeight: 54,
                }}
              >
                카카오톡으로 편하게 물어보기
              </a>
              <a
                href={externalLinks.phone}
                style={{
                  fontSize: 15,
                  color: "var(--color-text-subtle)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                전화로 문의하기
              </a>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "var(--color-text-subtle)",
                marginTop: 20,
              }}
            >
              평일 10:00 ~ 18:00 · 주말 상담 가능
            </p>
          </div>
        </section>

      </main>

      <LdFooter />
    </div>
  );
}

// ── 공통 스타일 ───────────────────────────────────────────────

const sectionH2: React.CSSProperties = {
  fontSize: "clamp(28px,4vw,42px)",
  fontWeight: 800,
  color: "var(--color-text)",
  textAlign: "center",
  lineHeight: 1.3,
  letterSpacing: "-0.01em",
  marginBottom: 12,
};

const sectionDesc: React.CSSProperties = {
  fontSize: 18,
  color: "var(--color-text-muted)",
  textAlign: "center",
  lineHeight: 1.7,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.14em",
        color: "var(--accent-aqua)",
        textTransform: "uppercase",
        textAlign: "center",
        marginBottom: 14,
      }}
    >
      {children}
    </p>
  );
}
