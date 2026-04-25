// ============================================================
// /about — 서비스 소개 (Liquid Glass 디자인시스템 기반)
// SSG Server Component — 클라이언트 훅 없음
// ============================================================

import type { Metadata } from "next";
import LgBackground from "@/components/lg/LgBackground";
import LdFooter from "@/components/layout/LdFooter";
import externalLinks from "@/data/external-links.json";

export const metadata: Metadata = {
  title: "서비스 소개 — LinkDrop",
  description:
    "링크드롭은 40·50·60대 시니어가 살아온 경험으로 온라인 수익을 만들 수 있도록 AI 도구와 1:1 코칭으로 지원하는 플랫폼입니다.",
};

const STATS = [
  { value: "4,200+", label: "활성 파트너",   sub: "매월 증가 중" },
  { value: "월 72만원", label: "수익 중간값", sub: "파트너 평균" },
  { value: "2.4개월", label: "첫 수익까지",  sub: "평균 기간" },
  { value: "97%",    label: "온보딩 완료율", sub: "1:1 코칭 완료" },
];

const PILLARS = [
  {
    badge: "인기",  badgeColor: "violet",
    icon: "✍️", title: "웹소설·글쓰기",
    desc: "살아온 이야기가 독자의 공감을 삽니다. AI가 초안을 잡아드립니다.",
    href: "/landing/webnovel-writer",
    tags: ["AI 초안 작성", "월 87만원 수익"],
  },
  {
    badge: "추천",  badgeColor: "aqua",
    icon: "🎬", title: "전문 영상 강의",
    desc: "30년 경험을 강의로. 촬영 장비 없이 AI로 전문가 강의를 만듭니다.",
    href: "/landing/expert-video",
    tags: ["촬영 장비 불필요", "월 156만원 수익"],
  },
  {
    badge: "신규",  badgeColor: "amber",
    icon: "📱", title: "시니어 온라인 부업",
    desc: "스마트폰 하나면 충분합니다. 기술 걱정 없이 맞춤 온보딩.",
    href: "/landing/senior-online-business",
    tags: ["스마트폰만 있으면 OK", "월 72만원 수익"],
  },
];

const HOW_IT_WORKS = [
  {
    num: "01", title: "무료 상담 신청",
    desc: "카카오톡으로 간단히 신청하면 담당 매니저가 24시간 내 연락드립니다.",
    color: "var(--accent-aqua, #5ee7df)",
    bg: "rgba(94, 231, 223, 0.12)",
    border: "rgba(94, 231, 223, 0.4)",
  },
  {
    num: "02", title: "나에게 맞는 과정 선택",
    desc: "경험·성향·목표에 맞는 수익화 방법을 함께 정합니다. 강요 없이 편안하게.",
    color: "var(--accent-violet, #b490f5)",
    bg: "rgba(180, 144, 245, 0.12)",
    border: "rgba(180, 144, 245, 0.4)",
  },
  {
    num: "03", title: "1:1 온보딩 코칭",
    desc: "60분 코칭으로 첫 콘텐츠를 만들 때까지 함께합니다. 혼자 하지 않아도 됩니다.",
    color: "var(--accent-amber, #ffd27f)",
    bg: "rgba(255, 210, 127, 0.12)",
    border: "rgba(255, 210, 127, 0.4)",
  },
  {
    num: "04", title: "수익 확인",
    desc: "파트너 대시보드에서 실시간으로 수익을 확인합니다. 매월 정산이 이루어집니다.",
    color: "var(--accent-lime, #a8f08a)",
    bg: "rgba(168, 240, 138, 0.12)",
    border: "rgba(168, 240, 138, 0.4)",
  },
];

const INCOME_LEVELS = [
  { range: "월 100만원 이상",  percent: 78, barColor: "aqua",   label: "상위 파트너 달성률" },
  { range: "월 50~100만원",   percent: 58, barColor: "violet", label: "6개월 이내 달성률" },
  { range: "첫 수익 발생",     percent: 91, barColor: "amber",  label: "1개월 이내 달성률" },
];

const TESTIMONIALS = [
  {
    period: "3개월 만에", income: "월 98만원", color: "aqua",
    quote: "처음엔 반신반의했는데, 3개월 만에 월 98만원을 벌었습니다. 은퇴 후 이런 보람이 있을 줄 몰랐어요.",
    author: "박○○ (62세, 前 교사)",
  },
  {
    period: "5개월 만에", income: "월 142만원", color: "violet",
    quote: "요리 30년 경력으로 강의를 만들었는데 수강생이 200명이 넘었습니다. 링크드롭 덕분에 새 인생이 시작됐어요.",
    author: "이○○ (58세, 前 요리사)",
  },
  {
    period: "2개월 만에", income: "월 67만원", color: "amber",
    quote: "스마트폰만 있으면 된다고 했는데 정말이었어요. 매니저님이 처음부터 끝까지 도와주셔서 혼자라는 느낌이 없었습니다.",
    author: "최○○ (55세, 주부)",
  },
];

const AVATAR_DATA = [
  { name: "박", from: "#5ee7df", to: "#3b82f6" },
  { name: "김", from: "#b490f5", to: "#ec4899" },
  { name: "이", from: "#ffd27f", to: "#f59e0b" },
  { name: "최", from: "#a8f08a", to: "#22c55e" },
  { name: "정", from: "#93c5fd", to: "#8b5cf6" },
  { name: "한", from: "#f7a8c4", to: "#fb7185" },
];

const ACCENT: Record<string, string> = {
  aqua:   "var(--accent-aqua, #5ee7df)",
  violet: "var(--accent-violet, #b490f5)",
  amber:  "var(--accent-amber, #ffd27f)",
  lime:   "var(--accent-lime, #a8f08a)",
};

const f = { fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif" };

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: "var(--bg-base)", color: "var(--color-text)", position: "relative", minHeight: "100vh", ...f }}>
      <LgBackground />

      <main style={{ position: "relative", zIndex: 1 }}>

        {/* ── 히어로 ── */}
        <section style={{ padding: "clamp(72px,12vw,100px) clamp(16px,4vw,24px) clamp(56px,8vw,72px)", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
          <div style={{ marginBottom: 20 }}>
            <span className="glass-badge glass-badge--aqua">
              <span className="glass-badge__dot" />
              ABOUT LINKDROP
            </span>
          </div>
          <h1
            className="ab-gradient-text"
            style={{ fontSize: "clamp(36px,8vw,68px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.01em" }}
          >
            살아온 경험이<br />수익이 됩니다
          </h1>
          <p style={{ fontSize: "clamp(18px,2.5vw,22px)", color: "var(--color-text-muted)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 36px" }}>
            링크드롭은 40·50·60대 시니어가 살아온 경험으로 온라인 수익을 만들 수 있도록
            AI 도구와 1:1 코칭으로 지원하는 플랫폼입니다.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={externalLinks.kakao}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "16px 36px", borderRadius: 999,
                background: "var(--accent-neon)", color: "#010828",
                fontWeight: 800, fontSize: 18, textDecoration: "none",
                minHeight: 56,
              }}
            >
              무료 상담 신청
            </a>
            <a
              href="/landing/senior-online-business"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "16px 32px", borderRadius: 999,
                background: "var(--glass-white)", border: "1px solid var(--glass-border)",
                backdropFilter: "var(--blur-sm)", WebkitBackdropFilter: "var(--blur-sm)",
                color: "var(--color-text)", fontWeight: 700, fontSize: 18, textDecoration: "none",
                minHeight: 56,
              }}
            >
              서비스 알아보기
            </a>
          </div>
        </section>

        {/* ── 신뢰 지표 — 아바타 + 파트너 수 ── */}
        <section style={{ padding: "0 clamp(16px,4vw,24px) 56px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div className="glass glass-card" style={{ padding: "22px 28px" }}>
              <div
                className="glass-content"
                style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "center" }}
              >
                {/* Avatar group */}
                <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  {AVATAR_DATA.map((av, i) => (
                    <div
                      key={i}
                      style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${av.from}, ${av.to})`,
                        border: "2.5px solid rgba(255,255,255,0.22)",
                        marginLeft: i === 0 ? 0 : -10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 700, color: "#fff",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                        position: "relative", zIndex: 6 - i,
                        flexShrink: 0,
                      }}
                    >
                      {av.name}
                    </div>
                  ))}
                </div>
                {/* Text */}
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                    <span style={{ color: "var(--accent-aqua, #5ee7df)" }}>4,200+</span>명의 파트너와 함께합니다
                  </p>
                  <p style={{ fontSize: 15, color: "var(--color-text-muted)", margin: "4px 0 0" }}>
                    매월 새로운 파트너가 합류하고 있습니다
                  </p>
                </div>
                {/* Tags */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="glass-badge glass-badge--lime">인증됨</span>
                  <span className="glass-tag">2026년 기준</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 숫자로 보는 링크드롭 ── */}
        <section style={{ padding: "0 clamp(16px,4vw,24px) 80px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div className="ab-grid-stats">
              {STATS.map((stat) => (
                <div key={stat.label} className="glass glass-card" style={{ textAlign: "center", padding: "clamp(20px,3vw,28px) 16px" }}>
                  <div className="glass-content">
                    <p style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, color: "var(--accent-aqua, #5ee7df)", marginBottom: 6, lineHeight: 1 }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: 16, color: "var(--color-text)", fontWeight: 600, marginBottom: 4 }}>
                      {stat.label}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                      {stat.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 세 가지 수익 방법 ── */}
        <section style={{ padding: "0 clamp(16px,4vw,24px) 80px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "var(--accent-aqua, #5ee7df)", textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>
              INCOME METHODS
            </p>
            <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, color: "var(--color-text)", textAlign: "center", marginBottom: 12 }}>
              세 가지 방법으로 수익을 만듭니다
            </h2>
            <p style={{ fontSize: 18, color: "var(--color-text-muted)", textAlign: "center", marginBottom: 48 }}>
              상담 후 나에게 맞는 방법을 함께 선택합니다
            </p>
            <div className="ab-grid-pillars">
              {PILLARS.map((p) => (
                <a key={p.href} href={p.href} style={{ textDecoration: "none" }}>
                  <div className="glass glass-card card-hover" style={{ height: "100%", cursor: "pointer" }}>
                    <div className="glass-content">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <span className={`glass-badge glass-badge--${p.badgeColor}`}>{p.badge}</span>
                        <span style={{ fontSize: 36 }}>{p.icon}</span>
                      </div>
                      <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", marginBottom: 12 }}>
                        {p.title}
                      </h3>
                      <p style={{ fontSize: 18, color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
                        {p.desc}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                        {p.tags.map((tag) => (
                          <span key={tag} className="glass-tag">{tag}</span>
                        ))}
                      </div>
                      <p style={{ fontSize: 15, color: "var(--accent-aqua, #5ee7df)", fontWeight: 700 }}>
                        자세히 보기 →
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── 파트너 수익 달성률 ── */}
        <section style={{ padding: "0 clamp(16px,4vw,24px) 80px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "var(--accent-violet, #b490f5)", textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>
              PARTNER INCOME
            </p>
            <h2 style={{ fontSize: "clamp(26px,4vw,36px)", fontWeight: 800, color: "var(--color-text)", textAlign: "center", marginBottom: 12 }}>
              파트너 수익 달성 현황
            </h2>
            <p style={{ fontSize: 18, color: "var(--color-text-muted)", textAlign: "center", marginBottom: 40 }}>
              6개월 이상 활동한 파트너 기준 (2026년)
            </p>
            <div className="glass glass-card">
              <div className="glass-content" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                {INCOME_LEVELS.map((level, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>{level.range}</p>
                        <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>{level.label}</p>
                      </div>
                      <span style={{ fontSize: 28, fontWeight: 800, color: ACCENT[level.barColor] }}>
                        {level.percent}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-bar__fill progress-bar__fill--${level.barColor}`}
                        style={{ width: `${level.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 4단계 시작 방법 ── */}
        <section style={{ padding: "0 clamp(16px,4vw,24px) 80px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "var(--accent-amber, #ffd27f)", textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>
              HOW TO START
            </p>
            <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, color: "var(--color-text)", textAlign: "center", marginBottom: 12 }}>
              4단계로 시작합니다
            </h2>
            <p style={{ fontSize: 18, color: "var(--color-text-muted)", textAlign: "center", marginBottom: 48 }}>
              처음부터 끝까지 혼자 하지 않아도 됩니다
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.num}>
                  <div className="glass glass-card" style={{ padding: "22px 24px" }}>
                    <div className="glass-content" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 48, height: 48, borderRadius: "50%",
                          background: step.bg, border: `2px solid ${step.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, fontWeight: 800, color: step.color,
                          flexShrink: 0,
                        }}
                      >
                        {step.num}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
                          {step.title}
                        </h3>
                        <p style={{ fontSize: 18, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div style={{ height: 16, width: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 파트너 후기 ── */}
        <section style={{ padding: "0 clamp(16px,4vw,24px) 80px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "var(--accent-lime, #a8f08a)", textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>
              PARTNER STORIES
            </p>
            <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, color: "var(--color-text)", textAlign: "center", marginBottom: 12 }}>
              실제 파트너 이야기
            </h2>
            <p style={{ fontSize: 18, color: "var(--color-text-muted)", textAlign: "center", marginBottom: 48 }}>
              링크드롭과 함께 새로운 수익을 만들어 가고 있습니다
            </p>
            <div className="ab-grid-testimonials">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="glass glass-card" style={{ padding: "28px 24px" }}>
                  <div className="glass-content">
                    <div style={{ marginBottom: 14 }}>
                      <span className={`glass-badge glass-badge--${t.color}`}>인증 후기</span>
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
                      {t.period}{" "}
                      <span style={{ color: ACCENT[t.color] }}>{t.income}</span>
                    </p>
                    <p style={{ fontSize: 16, color: "var(--color-text-muted)", lineHeight: 1.65, marginBottom: 20 }}>
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <p style={{ fontSize: 14, color: "var(--color-text-subtle, rgba(255,255,255,0.35))", fontWeight: 500 }}>
                      — {t.author}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 최종 CTA ── */}
        <section style={{ padding: "0 clamp(16px,4vw,24px) 100px", textAlign: "center" }}>
          <div className="glass glass-card" style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(40px,6vw,60px) clamp(24px,5vw,48px)" }}>
            <div className="glass-content">
              <div style={{ marginBottom: 16 }}>
                <span className="glass-badge glass-badge--aqua">
                  <span className="glass-badge__dot" />
                  지금 시작하세요
                </span>
              </div>
              <h2 style={{ fontSize: "clamp(26px,5vw,40px)", fontWeight: 800, color: "var(--color-text)", marginBottom: 16, lineHeight: 1.25 }}>
                무료 상담부터 시작합니다
              </h2>
              <p style={{ fontSize: 18, color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: 36 }}>
                10분 상담으로 나에게 맞는 방법을 찾아드립니다.
                <br />
                부담 없이 문의해 주세요.
              </p>
              <div className="ab-cta-row">
                <a
                  href={externalLinks.kakao}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    padding: "18px 40px", borderRadius: 999,
                    background: "var(--accent-neon)", color: "#010828",
                    fontWeight: 800, fontSize: 18, textDecoration: "none",
                    minHeight: 60,
                  }}
                >
                  카카오톡 무료 상담
                </a>
                <a
                  href="/signup"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    padding: "18px 40px", borderRadius: 999,
                    border: "1px solid var(--glass-border)", background: "var(--glass-white)",
                    backdropFilter: "var(--blur-sm)", WebkitBackdropFilter: "var(--blur-sm)",
                    color: "var(--color-text)", fontWeight: 700, fontSize: 18, textDecoration: "none",
                    minHeight: 60,
                  }}
                >
                  무료 회원가입
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      <LdFooter />
    </div>
  );
}
