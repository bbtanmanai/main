"use client";

import { useState, useEffect, useRef } from "react";
import externalLinks from "@/data/external-links.json";
import LdCinematicVideoBg from "@/components/landing/cinematic/LdCinematicVideoBg";
import "@/styles/cinematic.css";

// ── 콤보 색상 ⓙ — 포인트 전용 (DESIGN.md §18) ──────────────────
// AC  (#F1E9E4 크림): 챕터 뱃지 bg, CTA 버튼 bg, 텍스트 포인트
// BGA (#5A0F2E 와인): border-left accent, CTA 텍스트
const AC  = "#F1E9E4";
const BGA = "#5A0F2E";

// ── glass 카드 — CSS 변수 필수, 하드코딩 금지 ────────────────────
const CARD: React.CSSProperties = {
  background: "var(--glass-white)",
  border: "1.5px solid var(--glass-border)",
  borderRadius: 16,
  padding: "28px 32px",
  backdropFilter: "var(--blur-sm)",
  WebkitBackdropFilter: "var(--blur-sm)",
  marginBottom: 16,
};

// 인용·강조 카드 — 좌측 accent 바 1개만 AC 사용
const ACCENT_CARD: React.CSSProperties = {
  ...CARD,
  borderLeft: `4px solid ${AC}`,
};

// CTA 버튼 — 주 CTA 1개에만 AC
const CTA_BTN: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  background: AC, color: BGA,
  borderRadius: 14, padding: "20px 48px",
  fontWeight: 800, fontSize: 18, minHeight: 60,
  textDecoration: "none", letterSpacing: "-0.01em",
  fontFamily: '"Pretendard Variable", Pretendard, sans-serif',
  transition: "opacity 0.18s",
};

// 챕터 뱃지 — AC 배경
const CHAPTER_BADGE: React.CSSProperties = {
  display: "inline-block", background: AC, color: BGA,
  borderRadius: 999, padding: "5px 16px",
  fontSize: 13, fontWeight: 800, marginBottom: 16,
};

// 이미지 캡션 — 중립 어둠 그라디언트 (콤보색 금지)
const IMG_CAPTION: React.CSSProperties = {
  position: "absolute", bottom: 0, left: 0, right: 0,
  background: "linear-gradient(transparent, rgba(0,0,0,0.72))",
  color: "#fff", padding: "24px 24px 18px",
  fontSize: "0.85rem", fontStyle: "italic",
};

// ── 목차 스테퍼 ──────────────────────────────────────────────────
const STEPS = [
  { href: "#ch1", num: "1", label: "구술 생애사란?",  sub: "정의 · 역사적 가치" },
  { href: "#ch2", num: "2", label: "왜 지금인가",     sub: "사라지는 기억 · 기회" },
  { href: "#ch3", num: "3", label: "AI 제작 과정",    sub: "녹취 → 편집 → 납품" },
  { href: "#ch4", num: "4", label: "누가 잘하나",     sub: "성향 · 페르소나" },
  { href: "#ch5", num: "5", label: "수익 패키지",     sub: "베이직 ~ 프리미엄" },
] as const;

// ── 데이터 ────────────────────────────────────────────────────────
const PAINS = [
  { icon: "🎙️", text: "인터뷰를 어떻게 진행해야 할지 막막해요" },
  { icon: "⏱️",  text: "수십 시간 녹취를 편집할 엄두가 안 나요" },
  { icon: "💝",  text: "의미 있는 효도 선물을 드리고 싶은데 방법을 모르겠어요" },
];

const VALUES = [
  { icon: "🕊️", title: "이야기 수호자", desc: "사라질 뻔한 한 사람의 한평생을, 당신이 책과 영상으로 남깁니다." },
  { icon: "🫂", title: "누군가의 인생 전체를 듣는 특권", desc: "자식에게도 못한 이야기를 당신에게 들려주십니다. 그 무게를 아는 사람만이 이 일을 할 수 있습니다." },
  { icon: "📜", title: "가족이 두고두고 꺼내볼 유산", desc: "손주가, 그 손주가, 50년 뒤에도 펼쳐볼 기록입니다. 당신이 만든 것이 역사가 됩니다." },
];

const GLOSSARY = [
  { term: "구술 생애사",     en: "Oral Life History",    desc: "당사자의 말을 그대로 채록해 한 사람의 삶 전체를 재구성하는 기록 방식. 단순 회고록과 달리 육성(肉聲)과 감정이 살아있습니다." },
  { term: "녹취 (전사)",     en: "Transcription",        desc: "음성 파일을 텍스트로 변환하는 과정. AI 도구를 쓰면 1시간 분량을 5분 안에 처리합니다." },
  { term: "디지털 아카이빙", en: "Digital Archiving",     desc: "음성·영상·텍스트를 클라우드에 영구 보존하는 작업. 물리적 테이프나 사진이 훼손돼도 원본이 남습니다." },
  { term: "화자 분리",       en: "Speaker Diarization",   desc: "AI가 인터뷰이와 인터뷰어의 목소리를 자동 구분하는 기술. CLOVA Note 같은 도구가 기본 제공합니다." },
];

const TIMING = [
  { icon: "👴", title: "고령화 사회, 좁아지는 기록의 창", desc: "한국은 가장 빠르게 늙어가는 나라입니다. 지금 기록하지 않으면 다시 들을 수 없는 이야기들이 매일 사라집니다." },
  { icon: "🤖", title: "AI가 장벽을 허물었습니다", desc: "과거엔 방송사·출판사가 팀으로 해야 했던 일을, 이제는 노트북 한 대로 혼자 완성합니다." },
  { icon: "🔍", title: "이 일을 하는 사람이 거의 없습니다", desc: "의미 있고 진입 장벽이 사라진 이 영역에, 아직 기록가가 턱없이 부족합니다." },
];

const WORKFLOW = [
  { icon: "🎙️", step: "① 인터뷰", desc: "어르신의 한평생을 천천히 듣습니다. 어떤 분은 피난길을, 어떤 분은 첫사랑을, 어떤 분은 자식 키운 이야기를 꺼내십니다." },
  { icon: "🤖", step: "② AI 편집", desc: "수십 시간의 녹취를 AI가 글로 옮기고 정리합니다. 당신은 흐름을 다듬고 의미를 골라냅니다." },
  { icon: "📖", step: "③ 납품", desc: "책 한 권, 영상 한 편으로 가족에게 전달합니다. 어떤 가족은 그 자리에서 함께 울었습니다." },
];

const AI_TOOLS = [
  { icon: "🎬", name: "Vrew",        role: "자동 녹취 변환",   desc: "음성 파일을 텍스트로 자동 변환. 수십 시간 작업이 10분으로 줄어듭니다.",       level: "카카오톡 수준" },
  { icon: "🗣️", name: "CLOVA Note", role: "화자 분리",        desc: "인터뷰이와 인터뷰어 목소리를 자동으로 구분해 대화 형식으로 정리합니다.",     level: "유튜브 수준" },
  { icon: "🖼️", name: "Leonardo AI",role: "사진 복원·삽화",   desc: "낡은 흑백 사진을 고화질 컬러로 복원하고, 회상 장면을 삽화로 생성합니다.", level: "카카오톡 수준" },
];

const PERSONAS = [
  { icon: "👂", text: "누군가의 이야기를 끝까지 듣는 게 어렵지 않은 분" },
  { icon: "🧓", text: "어르신 세대의 말투와 맥락을 자연스럽게 이해하는 분" },
  { icon: "🔍", text: "한 사람의 삶에 진심으로 호기심을 갖는 분" },
  { icon: "📋", text: "기록과 정리에 차분히 시간을 쓰는 분" },
];

const PACKAGES = [
  { name: "베이직",    price: "50~100만 원",    unit: "건당", desc: "온라인 인터뷰 3회 + PDF 생애사",          items: ["온라인 인터뷰 3회 (회당 60분)", "AI 녹취·편집 전 과정", "생애사 PDF 전자책 1부", "가족 공유용 링크"],                recommended: false },
  { name: "스탠다드", price: "150~300만 원",   unit: "건당", desc: "인터뷰 + 사진 복원 + 전자책 출판",        items: ["온라인 인터뷰 5회 (회당 60분)", "AI 사진 복원·채색 (최대 20장)", "전자책 + 인쇄본 1부", "음성 파일 + 가족 공유 링크"], recommended: true  },
  { name: "프리미엄", price: "500만 원 이상",  unit: "건당", desc: "영상 인터뷰 + AI 다큐 + 하드커버",        items: ["인터뷰 무제한 + 방문 촬영 옵션", "AI 다큐멘터리 영상 편집", "하드커버 양장 제본", "USB + 클라우드 영구 보관"],      recommended: false },
];

const REVIEWS = [
  { headline: "어르신이 손을 잡고 우셨습니다",  content: "마지막 인터뷰 날, 어머님이 제 손을 꼭 잡으시고 '고맙다'고 우셨어요. 그 순간 이 일을 평생 하고 싶다고 생각했습니다.", note: "부수입은 따라왔습니다", name: "김은영", age: 61, region: "서울 노원", bg: "전직 교사" },
  { headline: "자식들이 영상을 보고 통곡했습니다", content: "납품 자리에서 따님이 영상을 보다가 주저앉아 울었습니다. '아빠를 이렇게 깊이 알게 된 게 처음'이라고요.", note: "생계가 아닌 소명이 됐습니다", name: "박성준", age: 54, region: "경기 성남", bg: "전직 PD" },
  { headline: "내가 더 큰 선물을 받았습니다",   content: "어르신들을 인터뷰하면서, 제가 살면서 어떻게 살아야 하는지를 배웠습니다. 돈 받고 배운 셈입니다.", note: "수익도 안정적으로 따라옵니다", name: "이선미", age: 57, region: "부산 연제", bg: "자영업" },
];

const FAQS = [
  { q: "글을 잘 써야 하나요?", a: "글쓰기보다 듣기가 훨씬 중요합니다. 정리와 편집은 AI가 도와주고, 당신은 이야기의 흐름과 맥락을 잡는 역할입니다." },
  { q: "인터뷰 경험이 없는데 가능할까요?", a: "처음부터 끝까지 안내하는 인터뷰 가이드와 질문 목록을 제공합니다. 첫 인터뷰는 링크드랍 파트너 매니저가 함께 동행합니다." },
  { q: "의뢰인을 어떻게 만나나요?", a: "링크드랍이 의뢰 매칭을 책임집니다. 당신은 인터뷰와 제작에 집중하고, 고객 모집과 계약 연결은 본사가 지원합니다." },
  { q: "AI 도구를 전혀 모르는데 배울 수 있나요?", a: "카카오톡을 쓰실 줄 알면 충분합니다. Vrew와 CLOVA Note는 스마트폰처럼 직관적이며 단계별 영상 교육도 제공합니다." },
  { q: "시간이 얼마나 걸리나요?", a: "1건당 평균 3~6주입니다. 인터뷰는 주말·저녁에도 진행할 수 있어 본업과 병행 가능합니다." },
];

// ── 유틸 훅·헬퍼 ─────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// 섹션 — 배경 지정 없음, blob scene이 배경 담당
function Section({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ padding: "88px 24px", fontFamily: '"Pretendard Variable", Pretendard, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

// 챕터 헤더
function ChapterHeader({ num, title, sub }: { num: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <span style={CHAPTER_BADGE}>Chapter {num}</span>
      <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2, margin: "0 0 14px", whiteSpace: "pre-line", color: "var(--color-heading)" }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 18, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.7 }}>{sub}</p>}
    </div>
  );
}

// 이미지 블록
function ImgBlock({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", marginBottom: 32 }}>
      <img src={src} alt={alt} style={{ width: "100%", height: "auto", display: "block", maxHeight: 420, objectFit: "cover" }} />
      <div style={IMG_CAPTION}>{caption} — 추후 실제 이미지로 교체 예정</div>
    </div>
  );
}

// ── 컴포넌트 ─────────────────────────────────────────────────────
// LdLanding7 — landing7 전용 (구 LdOralHistoryLanding)
// 주제: 디지털 구술 생애사 기록가
export default function LdLanding7() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const ch3Reveal = useReveal();
  const reviewReveal = useReveal();
  const pkgReveal = useReveal();

  return (
    // (public)/layout.tsx가 LgBackground를 제공 — 내부 blob scene 중복 제거
    <div
      style={{
        position: "relative",
        color: "var(--color-text)",
        fontFamily: '"Pretendard Variable", Pretendard, sans-serif',
      }}
    >
      <main style={{ position: "relative", zIndex: 1, overflowX: "hidden" }}>

        {/* ══════════════════════════════════════════════════════
            커버 — cinematic.css bg:#000, 중립 오버레이
        ══════════════════════════════════════════════════════ */}
        <section id="top" className="ld-cine-section">
          <LdCinematicVideoBg playbackId="MLuczZc01U8DdU01T5Y6Z4oX8ZcVFnJgPlhdgWb202T4MI" />

          {/* 중립 어둠 오버레이 — 콤보 색 금지 */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.50)", zIndex: 1 }} />

          {/* 콘텐츠 행: 헤딩 | 스테퍼 */}
          <div style={{
            position: "relative", zIndex: 10,
            width: "100%", maxWidth: 1200, margin: "0 auto",
            padding: "0 clamp(20px,5vw,48px)",
            display: "flex", gap: 48, alignItems: "center",
          }}>
            {/* 좌: 헤딩 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                display: "inline-block",
                background: "rgba(241,233,228,0.14)", color: AC,
                borderRadius: 100, padding: "8px 22px", fontSize: 15, fontWeight: 700,
                marginBottom: 36, border: "1px solid rgba(241,233,228,0.22)",
              }}>
                디지털 구술 생애사 기록
              </span>
              <h1 style={{
                fontSize: "clamp(34px,5.5vw,62px)", fontWeight: 800,
                color: "#ffffff", lineHeight: 1.15, letterSpacing: "-0.03em",
                marginBottom: 28, whiteSpace: "pre-line",
              }}>
                {"지금 이 순간에도\n누군가의 이야기가\n영원히 사라집니다"}
              </h1>
              <p style={{ fontSize: "clamp(18px,2.2vw,22px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.75, marginBottom: 44, maxWidth: 560 }}>
                어르신이 살아온 한 평생의 기억은 그분이 떠나시는 순간 함께 사라집니다.<br />
                <strong style={{ color: "#ffffff" }}>그 이야기를 붙잡는 사람이, 당신이 될 수 있습니다.</strong>
              </p>
              <a
                href="#pain"
                style={CTA_BTN}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                이야기를 붙잡는 사람이 되기 →
              </a>
            </div>

            {/* 우: 수직 목차 스테퍼 — 커버 내부는 항상 다크, cream 사용 허용 */}
            <nav style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column" }}>
              {STEPS.map((step) => (
                <a
                  key={step.num}
                  href={step.href}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 14,
                    padding: "14px 0 14px 20px",
                    borderLeft: "2px solid rgba(241,233,228,0.20)",
                    textDecoration: "none",
                    transition: "border-left-color 0.18s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderLeftColor = AC)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderLeftColor = "rgba(241,233,228,0.20)")}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(241,233,228,0.10)",
                    border: "1.5px solid rgba(241,233,228,0.28)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800, color: AC, flexShrink: 0, marginTop: 2,
                  }}>
                    {step.num}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: AC, lineHeight: 1.3 }}>{step.label}</div>
                    <div style={{ fontSize: 12, color: "rgba(241,233,228,0.60)", marginTop: 2 }}>{step.sub}</div>
                  </div>
                </a>
              ))}
            </nav>
          </div>
        </section>

        {/* Pain — 공감 섹션 */}
        <Section id="pain">
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14, textAlign: "center" }}>
            이런 마음이 드셨나요?
          </p>
          <h2 style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 800, textAlign: "center", marginBottom: 48, lineHeight: 1.25, color: "var(--color-heading)" }}>
            하고 싶은 마음은 있는데 시작이 막막합니다
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {PAINS.map((p) => (
              <div key={p.text} style={{ ...CARD, display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 0 }}>
                <span style={{ fontSize: 30, flexShrink: 0 }}>{p.icon}</span>
                <p style={{ fontSize: 18, fontWeight: 700, margin: 0, lineHeight: 1.55, color: "var(--color-text)" }}>{p.text}</p>
              </div>
            ))}
          </div>
          <div style={{ ...CARD, marginTop: 24, textAlign: "center", borderTop: "3px solid var(--glass-border)", marginBottom: 0 }}>
            <p style={{ fontSize: "clamp(18px,2.2vw,22px)", fontWeight: 800, margin: 0, lineHeight: 1.6, color: "var(--color-text)" }}>
              링크드랍은 그 막막함을{" "}
              <span style={{ color: "var(--cj-accent-text)" }}>단계별 가이드 + AI 도구 + 의뢰 매칭</span>
              으로 해결합니다
            </p>
          </div>
        </Section>

        {/* Chapter 1 — 구술 생애사란? */}
        <Section id="ch1">
          <ChapterHeader num="1" title={"구술 생애사란?\n한 사람의 인생 전체를 듣는 일"} sub="역사가가 하던 일, 다큐멘터리 감독이 하던 일을 — 이제 한 사람이 합니다." />

          <ImgBlock
            src="https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=1200&q=80"
            alt="어르신과 기록가의 인터뷰 장면"
            caption="한 사람의 한평생이 당신의 손을 거칩니다"
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
            {VALUES.map((v) => (
              <div key={v.title} style={{ ...CARD, marginBottom: 0 }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{v.icon}</div>
                <p style={{ fontSize: 19, fontWeight: 800, margin: "0 0 12px", lineHeight: 1.4, color: "var(--color-text)" }}>{v.title}</p>
                <p style={{ fontSize: 17, color: "var(--color-text-muted)", lineHeight: 1.7, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ ...ACCENT_CARD, marginBottom: 40 }}>
            <p style={{ fontSize: "clamp(18px,2.2vw,21px)", fontWeight: 700, lineHeight: 1.65, margin: 0, fontStyle: "italic", color: "var(--color-text)" }}>
              &ldquo;인터뷰를 마칠 때쯤이면 어르신은 이렇게 말씀하십니다.<br />
              &lsquo;내 평생 이런 이야기를 처음 해봤어.&rsquo;&rdquo;
            </p>
          </div>

          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            📖 용어 해설
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
              <thead>
                <tr>
                  <th style={{ background: "var(--glass-white-md)", color: "var(--color-text)", padding: "12px 16px", textAlign: "left", fontSize: 13, letterSpacing: "0.06em", fontWeight: 700, border: "1px solid var(--glass-border)", width: "20%" }}>용어</th>
                  <th style={{ background: "var(--glass-white-md)", color: "var(--color-text)", padding: "12px 16px", textAlign: "left", fontSize: 13, letterSpacing: "0.06em", fontWeight: 700, border: "1px solid var(--glass-border)", width: "22%" }}>영문</th>
                  <th style={{ background: "var(--glass-white-md)", color: "var(--color-text)", padding: "12px 16px", textAlign: "left", fontSize: 13, letterSpacing: "0.06em", fontWeight: 700, border: "1px solid var(--glass-border)" }}>뜻 및 활용</th>
                </tr>
              </thead>
              <tbody>
                {GLOSSARY.map((g, i) => (
                  <tr key={g.term} style={{ background: i % 2 === 0 ? "var(--glass-white)" : "transparent" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text)", border: "1px solid var(--glass-border)" }}>{g.term}</td>
                    <td style={{ padding: "12px 16px", color: "var(--color-text-muted)", fontStyle: "italic", border: "1px solid var(--glass-border)" }}>{g.en}</td>
                    <td style={{ padding: "12px 16px", color: "var(--color-text-muted)", lineHeight: 1.6, border: "1px solid var(--glass-border)" }}>{g.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Chapter 2 — 왜 지금인가? */}
        <Section id="ch2">
          <ChapterHeader num="2" title={"왜 지금이어야 하나요?\n기록의 창은 영원하지 않습니다"} sub="기회는 조용히 줄어들고 있습니다." />

          <ImgBlock
            src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=1200&q=80"
            alt="어르신과 가족 세대간 사진"
            caption="지금 기록하지 않으면 다시 들을 수 없는 이야기들이 매일 사라집니다"
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            {TIMING.map((t) => (
              <div key={t.title} style={{ ...CARD, display: "flex", gap: 22, alignItems: "flex-start", marginBottom: 0 }}>
                <div style={{ fontSize: 36, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{t.icon}</div>
                <div>
                  <p style={{ fontSize: 19, fontWeight: 800, margin: "0 0 10px", lineHeight: 1.4, color: "var(--color-text)" }}>{t.title}</p>
                  <p style={{ fontSize: 17, color: "var(--color-text-muted)", lineHeight: 1.7, margin: 0 }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...CARD, background: "var(--glass-white-md)", marginBottom: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text-muted)", margin: "0 0 10px", letterSpacing: "0.04em", textTransform: "uppercase" }}>🔑 LinkDrop 강점</p>
            <p style={{ fontSize: 17, lineHeight: 1.75, margin: 0, color: "var(--color-text-muted)" }}>
              링크드랍은{" "}
              <strong style={{ color: "var(--color-text)" }}>의뢰 매칭부터 인터뷰 교육·AI 편집 지원·납품까지</strong>
              {" "}전 과정을 파트너와 함께합니다. 당신이 어르신의 이야기에 집중할 수 있도록, 기술과 사업 부분은 본사가 전담합니다.
            </p>
          </div>
        </Section>

        {/* Chapter 3 — AI 제작 과정 */}
        <Section id="ch3">
          <ChapterHeader num="3" title={"AI 제작 과정\n녹취 → 편집 → 납품"} sub="어려운 작업은 AI가 합니다. 당신은 가장 사람다운 일에만 집중합니다." />

          <ImgBlock
            src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&q=80"
            alt="인터뷰 녹음 마이크"
            caption="수십 시간의 녹취를 AI가 10분 안에 텍스트로 변환합니다"
          />

          {/* 3단계 플로우 */}
          <div
            ref={ch3Reveal.ref}
            style={{
              display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "stretch",
              gap: 0, marginBottom: 28,
              opacity: ch3Reveal.visible ? 1 : 0,
              transform: ch3Reveal.visible ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            {WORKFLOW.map((w, i) => (
              <div key={w.step} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ ...CARD, textAlign: "center", minWidth: 200, maxWidth: 260, marginBottom: 0 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{w.icon}</div>
                  <p style={{ fontSize: 17, fontWeight: 800, margin: "0 0 10px", color: "var(--color-text)" }}>{w.step}</p>
                  <p style={{ fontSize: 15, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.65 }}>{w.desc}</p>
                </div>
                {i < WORKFLOW.length - 1 && (
                  <div style={{ fontSize: 22, color: "var(--color-text-muted)", padding: "0 14px", flexShrink: 0 }}>→</div>
                )}
              </div>
            ))}
          </div>

          {/* AI 도구 3종 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 24 }}>
            {AI_TOOLS.map((tool) => (
              <div key={tool.name} style={{ ...CARD, marginBottom: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <span style={{ fontSize: 34 }}>{tool.icon}</span>
                  <div>
                    <p style={{ fontSize: 19, fontWeight: 800, margin: 0, color: "var(--color-text)" }}>{tool.name}</p>
                    <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0, fontWeight: 700 }}>{tool.role}</p>
                  </div>
                </div>
                <p style={{ fontSize: 16, color: "var(--color-text-muted)", lineHeight: 1.7, margin: "0 0 14px" }}>{tool.desc}</p>
                <span style={{ display: "inline-block", background: "var(--glass-white-md)", color: "var(--color-text-muted)", borderRadius: 100, padding: "5px 14px", fontSize: 13, fontWeight: 700, border: "1px solid var(--glass-border)" }}>
                  난이도: {tool.level}
                </span>
              </div>
            ))}
          </div>

          <div style={{ ...CARD, textAlign: "center", marginBottom: 0 }}>
            <p style={{ fontSize: "clamp(18px,2.2vw,22px)", fontWeight: 800, margin: 0, color: "var(--color-text)" }}>
              AI가 70%를 합니다.{" "}
              <strong style={{ fontWeight: 800 }}>당신은 가장 사람다운 30%만 하면 됩니다.</strong>
            </p>
          </div>
        </Section>

        {/* Chapter 4 — 누가 잘하나? */}
        <Section id="ch4">
          <ChapterHeader num="4" title={"누가 잘하나요?\n잘 듣는 사람, 그 세대를 이해하는 사람"} sub="인터뷰 기술이나 글솜씨보다 먼저, 어르신의 침묵을 기다려줄 줄 아는 사람입니다." />

          <ImgBlock
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&q=80"
            alt="인터뷰 대화 장면"
            caption="중요한 건 기술보다 경청하는 태도입니다"
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 24 }}>
            {PERSONAS.map((p) => (
              <div key={p.text} style={{ ...CARD, display: "flex", alignItems: "center", gap: 16, marginBottom: 0 }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{p.icon}</span>
                <p style={{ fontSize: 17, fontWeight: 700, margin: 0, lineHeight: 1.5, color: "var(--color-text)" }}>{p.text}</p>
              </div>
            ))}
          </div>

          <div style={{ ...CARD, display: "flex", alignItems: "center", gap: 28, marginBottom: 0 }}>
            <img src="/img/mascot-astronaut.png" alt="링크드랍 마스코트 우주인" style={{ width: 76, height: 76, objectFit: "contain", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px", color: "var(--color-text)" }}>링크드랍이 처음부터 함께합니다</p>
              <p style={{ fontSize: 16, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.65 }}>
                첫 인터뷰는 파트너 매니저가 동행합니다. 혼자 시작하지 않아도 됩니다.
              </p>
            </div>
          </div>
        </Section>

        {/* Chapter 5 — 수익 패키지 */}
        <Section id="ch5">
          <ChapterHeader num="5" title={"수익 패키지\n의미 있는 일이 수익도 됩니다"} sub="한 사람의 인생을 책과 영상으로 남기는 일은 단순 노동이 아닙니다. 그래서 가격이 매겨집니다." />

          <ImgBlock
            src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80"
            alt="아름답게 제본된 책과 앨범"
            caption="월 2~3건이면 충분합니다. 양보다 깊이를 파는 일입니다."
          />

          <div
            ref={pkgReveal.ref}
            style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20, alignItems: "start",
              opacity: pkgReveal.visible ? 1 : 0,
              transform: pkgReveal.visible ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.name}
                style={{
                  ...CARD,
                  marginBottom: 0,
                  border: pkg.recommended ? `2px solid ${AC}` : "1.5px solid var(--glass-border)",
                  position: "relative",
                }}
              >
                {pkg.recommended && (
                  <div style={{
                    position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                    background: AC, color: BGA,
                    borderRadius: 100, padding: "5px 18px", fontSize: 13, fontWeight: 800, whiteSpace: "nowrap",
                  }}>
                    가장 많이 선택
                  </div>
                )}
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", margin: "0 0 6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>{pkg.name}</p>
                <p style={{ fontSize: "clamp(24px,3.5vw,32px)", fontWeight: 800, margin: "0 0 4px", color: "var(--color-text)", letterSpacing: "-0.02em" }}>{pkg.price}</p>
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 8px" }}>{pkg.unit}</p>
                <p style={{ fontSize: 15, color: "var(--color-text-muted)", marginBottom: 20, lineHeight: 1.5 }}>{pkg.desc}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {pkg.items.map((item) => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 15, lineHeight: 1.5, color: "var(--color-text-muted)" }}>
                      <span style={{ color: "var(--color-text)", fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--color-text-muted)", marginTop: 14, opacity: 0.55 }}>
            * 위 단가는 패키지 기준 예시이며, 실제 수익은 계약 건수·협의 단가에 따라 달라집니다.
          </p>
        </Section>

        {/* Proof — 파트너 후기 */}
        <Section>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14, textAlign: "center" }}>
            먼저 시작한 기록가들의 이야기
          </p>
          <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 800, textAlign: "center", marginBottom: 48, lineHeight: 1.2, color: "var(--color-heading)" }}>
            &ldquo;이 일을 선택하길 정말 잘했습니다&rdquo;
          </h2>

          <div
            ref={reviewReveal.ref}
            style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18,
              opacity: reviewReveal.visible ? 1 : 0,
              transform: reviewReveal.visible ? "translateY(0)" : "translateY(32px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            {REVIEWS.map((r, idx) => (
              <div
                key={r.name}
                style={{
                  ...CARD, marginBottom: 0,
                  opacity: reviewReveal.visible ? 1 : 0,
                  transition: `opacity 0.5s ease ${idx * 120}ms, transform 0.5s ease ${idx * 120}ms`,
                  transform: reviewReveal.visible ? "translateY(0)" : "translateY(20px)",
                }}
              >
                <p style={{ fontSize: 16, fontWeight: 800, margin: "0 0 14px", color: "var(--color-text)", lineHeight: 1.4 }}>
                  &ldquo;{r.headline}&rdquo;
                </p>
                <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--color-text-muted)", marginBottom: 20, fontStyle: "italic" }}>
                  &ldquo;{r.content}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--glass-white-md)", border: "1px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "var(--color-text)", flexShrink: 0 }}>
                    {r.name[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "var(--color-text)" }}>{r.name}</p>
                    <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>{r.age}세 · {r.region} · {r.bg}</p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "14px 0 0", opacity: 0.65, borderTop: "1px solid var(--glass-border)", paddingTop: 12 }}>
                  * {r.note}
                </p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--color-text-muted)", marginTop: 16, opacity: 0.5 }}>
            * 위 후기는 파트너 인터뷰를 바탕으로 재구성한 내용입니다.
          </p>
        </Section>

        {/* FAQ */}
        <Section>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14, textAlign: "center" }}>
            시작 전에 이런 점이 궁금하실 겁니다
          </p>
          <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, textAlign: "center", marginBottom: 48, lineHeight: 1.2, color: "var(--color-heading)" }}>
            자주 묻는 질문
          </h2>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={faq.q} style={{ background: "var(--glass-white)", border: isOpen ? `1.5px solid ${AC}` : "1.5px solid var(--glass-border)", borderRadius: 18, overflow: "hidden" }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, textAlign: "left", color: "var(--color-text)", fontFamily: '"Pretendard Variable", Pretendard, sans-serif' }}
                  >
                    <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>{faq.q}</span>
                    <span style={{ color: "var(--color-text-muted)", fontSize: 22, flexShrink: 0, transition: "transform 0.22s", transform: isOpen ? "rotate(45deg)" : "rotate(0deg)", display: "inline-block", lineHeight: 1 }}>+</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 28px 24px" }}>
                      <p style={{ fontSize: 17, color: "var(--color-text-muted)", lineHeight: 1.75, margin: 0 }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* 마무리 CTA */}
        <section style={{ padding: "96px 24px 120px", textAlign: "center" }}>
          <div style={{ maxWidth: 660, margin: "0 auto" }}>
            <span style={CHAPTER_BADGE}>지금 시작하세요</span>
            <h2 style={{ fontSize: "clamp(32px,5.5vw,56px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 20, whiteSpace: "pre-line", color: "var(--color-heading)" }}>
              {"사라지기 전에\n붙잡아 주세요"}
            </h2>
            <p style={{ fontSize: 18, color: "var(--color-text-muted)", lineHeight: 1.75, marginBottom: 48 }}>
              누군가의 한평생이 매일 사라지고 있습니다.<br />
              그 이야기를 붙잡는 사람이 되어주세요.<br />
              시작은 한 분의 어르신부터입니다.
            </p>
            <a
              href={externalLinks.kakao}
              target="_blank"
              rel="noopener noreferrer"
              style={CTA_BTN}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              이야기 수호자가 되기
            </a>
            <p style={{ fontSize: 15, color: "var(--color-text-muted)", marginTop: 18, opacity: 0.6 }}>
              누군가의 인생을 듣는 특권이 당신에게 주어집니다
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
