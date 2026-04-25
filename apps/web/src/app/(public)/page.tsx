"use client";

// ============================================================
// LinkDrop V2 — Index 메인 페이지
// 4섹션 풀페이지: HERO / ABOUT / FEATURED / CTA
// 다크 테마 기본, liquid-glass UI, 시네마틱 디자인
// ============================================================

import { useEffect, useRef, useState, useCallback, memo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ArrowRight,
  Mail,
  AtSign,
  Globe,
  MessageCircle,
} from "lucide-react";

// ── 소셜 아이콘 목록 ───────────────────────────────────────
const SOCIAL_LINKS = [
  { icon: Mail, href: "mailto:contact@linkdrop.kr", label: "이메일 문의" },
  {
    icon: AtSign,
    href: "https://instagram.com/linkdrop",
    label: "인스타그램",
  },
  {
    icon: Globe,
    href: "https://youtube.com/@linkdrop",
    label: "유튜브 채널",
  },
  { icon: MessageCircle, href: "https://twitter.com/linkdrop", label: "SNS" },
];

// ── 섹션2 통계 데이터 ─────────────────────────────────────
const STATS = [
  { label: "파트너 수", value: 1240, suffix: "+" },
  { label: "누적 매출", value: 48, suffix: "억+" },
  { label: "콘텐츠 수", value: 32000, suffix: "+" },
];

// ── 섹션3 카드 데이터 ─────────────────────────────────────
const FEATURED_CARDS = [
  {
    title: "MONETIZE YOUR\nCONTENT",
    subtitle: "콘텐츠 수익화",
    tag: "REVENUE SYSTEM",
    value: "파트너 직접 판매 + 후원 네트워크",
    video:
      "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/index/index_01.mp4",
  },
  {
    title: "PARTNER\nECOSYSTEM",
    subtitle: "파트너 생태계",
    tag: "NETWORK EFFECT",
    value: "1,240+ 활성 파트너",
    video:
      "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/index/index_02.mp4",
  },
  {
    title: "AI-POWERED\nPIPELINE",
    subtitle: "AI 자동화",
    tag: "AUTOMATION",
    value: "콘텐츠 생산 완전 자동화",
    video:
      "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/index/index_03.mp4",
  },
];

// ── 비디오 URL 상수 ────────────────────────────────────────
const VIDEO_HERO =
  "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/index/index_background_top.mp4";
const VIDEO_ABOUT =
  "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/index/index_background_top2.mp4";
const VIDEO_CTA =
  "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/index/index_background_bottom.mp4";

// ── LazyVideo — 뷰포트 진입 시에만 src 주입 + 재생 (초기 버퍼링 방지) ──
const LazyVideo = memo(function LazyVideo({
  src,
  className,
  style,
}: {
  src: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setSrc] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loaded) {
          el.src = src;
          el.load();
          el.play().catch(() => {});
          setSrc(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // 뷰포트 200px 手前부터 미리 로딩
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src, loaded]);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      className={className}
      style={style}
    />
  );
});

// ── CountUp 훅 — 숫자가 0에서 목표값까지 올라가는 애니메이션 ──
function useCountUp(target: number, duration = 2000, active = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOut 곡선: 처음엔 빠르게, 끝날수록 느리게
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);

  return count;
}

// ── 섹션 인식 훅 — Intersection Observer로 화면 진입 감지 ──
function useIntersection(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// ── 통계 카드 컴포넌트 ────────────────────────────────────
function StatCard({
  label,
  value,
  suffix,
  active,
}: {
  label: string;
  value: number;
  suffix: string;
  active: boolean;
}) {
  const count = useCountUp(value, 2200, active);

  return (
    <div className="text-center px-6 py-4">
      {/* 숫자 — Anton 폰트, neon green */}
      <div
        className="font-anton text-4xl md:text-5xl text-neon leading-none"
        style={{ fontFamily: "Anton, sans-serif" }}
      >
        {count.toLocaleString()}
        {suffix}
      </div>
      {/* 레이블 — Pretendard 한글, 반투명 */}
      <div
        className="mt-2 text-sm tracking-widest uppercase opacity-60"
        style={{ color: "var(--text-secondary)", fontFamily: '"Pretendard Variable", "Pretendard", sans-serif' }}
      >
        {label}
      </div>
    </div>
  );
}

// ── 피처드 카드 컴포넌트 ──────────────────────────────────
function FeaturedCard({
  card,
  index,
  visible,
}: {
  card: (typeof FEATURED_CARDS)[0];
  index: number;
  visible: boolean;
}) {
  return (
    <div
      className={`ld-glass card-hover rounded-2xl overflow-hidden flex flex-col transition-all duration-700`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transitionDelay: `${index * 150}ms`,
      }}
    >
      {/* 정방형 비디오 영역 */}
      <div className="relative aspect-square w-full overflow-hidden">
        <LazyVideo
          src={card.video}
          className="w-full h-full object-cover"
        />
        {/* 하단 오버레이 바 */}
        <div
          className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between"
          style={{ background: "rgba(1,8,40,0.75)" }}
        >
          <div>
            {/* 태그 레이블 */}
            <div
              className="text-xs tracking-widest uppercase"
              style={{ color: "var(--text-secondary)" }}
            >
              {card.tag}
            </div>
            {/* 값 텍스트 */}
            <div
              className="text-sm font-semibold"
              style={{
                color: "var(--text-primary)",
                fontFamily: "Pretendard Variable, Pretendard, sans-serif",
              }}
            >
              {card.value}
            </div>
          </div>
          {/* 화살표 버튼 */}
          <button
            className="ld-glass rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0"
            style={{ color: "var(--accent-neon)" }}
            aria-label={`${card.subtitle} 더보기`}
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* 카드 하단 텍스트 */}
      <div className="p-5 flex-1">
        {/* 주제 분류 — 한글 Pretendard */}
        <div
          className="text-xs tracking-wider uppercase mb-2 font-semibold"
          style={{ color: "var(--accent-neon)", fontFamily: "Pretendard Variable, Pretendard, sans-serif" }}
        >
          {card.subtitle}
        </div>
        {/* 영문 헤딩 — Anton */}
        <h3
          className="text-xl leading-tight font-anton whitespace-pre-line"
          style={{
            color: "var(--text-primary)",
            fontFamily: "Anton, sans-serif",
          }}
        >
          {card.title}
        </h3>
      </div>
    </div>
  );
}

// ?auth=1 감지 → 소셜 모달 오픈 (useSearchParams는 Suspense 필수)
function AuthModalTrigger() {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("auth") === "1") {
      window.dispatchEvent(new CustomEvent("ld-auth-open"));
    }
  }, [searchParams]);
  return null;
}

// ============================================================
// 메인 페이지 컴포넌트
// ============================================================
export default function IndexPage() {
  // 섹션2 진입 감지 (CountUp + 섹션 애니메이션)
  const { ref: aboutRef, visible: aboutVisible } =
    useIntersection(0.2) as { ref: React.RefObject<HTMLElement>; visible: boolean };
  const { ref: featuredRef, visible: featuredVisible } =
    useIntersection(0.15) as { ref: React.RefObject<HTMLElement>; visible: boolean };
  const { ref: ctaRef, visible: ctaVisible } =
    useIntersection(0.1) as { ref: React.RefObject<HTMLElement>; visible: boolean };

  // 스크롤 위치 추적 — 패럴랙스 효과용
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <>
    <Suspense fallback={null}><AuthModalTrigger /></Suspense>
    <main style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* ================================================================
          섹션 1: HERO — 풀뷰포트 비디오 배경
          ================================================================ */}
      <section
        id="hero"
        className="relative w-full overflow-hidden"
        style={{ minHeight: "100svh" }}
      >
        {/* 비디오 배경 — 패럴랙스 translateY 효과 */}
        <div
          className="absolute inset-0 video-parallax"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
            willChange: "transform",
          }}
        >
          <video
            src={VIDEO_HERO}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ minHeight: "110%" }}
          />
          {/* 비디오 위 다크 오버레이 — 텍스트 가독성 확보 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(1,8,40,0.45) 0%, rgba(1,8,40,0.2) 40%, rgba(1,8,40,0.7) 100%)",
            }}
          />
        </div>

        {/* 하단 페이드 — ABOUT 섹션으로 자연스럽게 연결 */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: "180px",
            background: "linear-gradient(to bottom, transparent 0%, #010828 100%)",
          }}
        />

        {/* ── 히어로 메인 텍스트 블록 ── */}
        <div className="relative z-10 flex flex-col items-start justify-end h-full px-6 md:px-12 pb-24 md:pb-32 pt-32 max-w-[1400px] mx-auto"
          style={{ minHeight: "calc(100svh - 80px)" }}
        >
          {/* Condiment 커시브 액센트 — neon green */}
          <div
            className="condiment-fade text-5xl md:text-6xl mb-4"
            style={{
              fontFamily: '"NanumKalguksu", sans-serif',
              color: "var(--accent-neon)",
            }}
          >
            링크드롭 플랫폼
          </div>

          {/* 대형 Anton 헤딩 — 3~5줄, 모두 대문자 */}
          <h1
            className="font-anton text-5xl md:text-7xl lg:text-8xl xl:text-9xl leading-none tracking-tight uppercase"
            style={{
              fontFamily: "Anton, sans-serif",
              color: "var(--text-primary)",
              maxWidth: "900px",
            }}
          >
            EMPOWERING
            <br />
            CREATORS
            <br />
            <span style={{ color: "var(--accent-neon)" }}>BEYOND</span> THE
            <br />
            CONTENT
            <br />
            HORIZON
          </h1>

          {/* 스크롤 인디케이터 */}
          <div className="mt-12 flex flex-col items-center gap-2 scroll-bounce">
            <span
              className="text-xs tracking-widest uppercase"
              style={{ color: "var(--text-secondary)", fontFamily: "Pretendard Variable, Pretendard, sans-serif" }}
            >
              스크롤
            </span>
            <ChevronDown size={20} style={{ color: "var(--text-secondary)" }} />
          </div>
        </div>
      </section>

      {/* ================================================================
          섹션 2: ABOUT — 배경 비디오 + 소개 + CountUp 스탯
          ================================================================ */}
      <section
        id="about"
        ref={aboutRef as React.RefObject<HTMLDivElement>}
        className="relative w-full overflow-hidden"
        style={{ minHeight: "100svh" }}
      >
        {/* 비디오 배경 */}
        <div className="absolute inset-0">
          <LazyVideo
            src={VIDEO_ABOUT}
            className="w-full h-full object-cover"
          />
          {/* 색상 오버레이 — 상단 진빨강 → 하단 진파랑 */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(120,0,20,0.65) 0%, rgba(0,10,80,0.65) 100%)" }}
          />
          {/* 상단 페이드 — HERO 섹션(#010828)에서 자연스럽게 연결 */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{
              height: "260px",
              background: "linear-gradient(to bottom, #010828 0%, transparent 100%)",
            }}
          />
          {/* 하단 페이드 — FEATURED 섹션(#010828)으로 자연스럽게 연결 */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: "220px",
              background: "linear-gradient(to bottom, transparent 0%, #010828 100%)",
            }}
          />
        </div>

        {/* 콘텐츠 */}
        <div
          className={`relative z-10 flex flex-col h-full px-6 md:px-12 py-20 max-w-[1400px] mx-auto section-hidden ${aboutVisible ? "section-visible" : ""}`}
          style={{ minHeight: "100svh" }}
        >
          {/* 상단 — 좌: 헤딩, 우: 요약문 */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8 flex-1">
            {/* 좌상단 대형 헤딩 */}
            <div className="relative">
              <h2
                className="font-anton text-5xl md:text-7xl lg:text-8xl leading-none tracking-tight uppercase"
                style={{
                  fontFamily: "Anton, sans-serif",
                  color: "var(--text-primary)",
                }}
              >
                WHAT WE
                <br />
                <span style={{ color: "var(--accent-neon)" }}>DO</span>
              </h2>
              {/* Condiment 오버레이 액센트 */}
              <div
                className="font-condiment text-2xl md:text-3xl mt-3"
                style={{
                  fontFamily: "Condiment, cursive",
                  color: "var(--accent-neon)",
                  opacity: 0.85,
                }}
              >
                Platform
              </div>
            </div>

            {/* 우상단 핵심 가치 요약 — 나눔칼국수 대형 */}
            <div style={{ color: "var(--text-primary)", textAlign: "right" }}>
              <p
                style={{
                  fontFamily: '"NanumKalguksu", sans-serif',
                  fontSize: "clamp(1.25rem, 2.5vw, 2.5rem)",
                  lineHeight: 1.5,
                  letterSpacing: "0.02em",
                }}
              >
                콘텐츠 크리에이터를 위한
                <br />
                수익화 · 파트너십 · AI 자동화
                <br />
                통합 플랫폼.
                <br />
                <br />
                당신의 콘텐츠가
                <br />
                비즈니스가 되는 곳.
              </p>
            </div>
          </div>

          {/* 하단 — 키워드 클러스터 (데코레이티브) */}
          <div
            className="mt-auto pb-8 overflow-hidden"
            style={{ color: "#DDDDDD", opacity: 1 }}
          >
            <div
              className="font-anton text-3xl md:text-5xl tracking-widest uppercase whitespace-nowrap"
              style={{ fontFamily: "Anton, sans-serif" }}
            >
              MONETIZE / AUTOMATE / PARTNER / GROW / SCALE / CREATE / LINK /
              DROP / REVENUE / CONTENT / AI / PIPELINE
            </div>
          </div>

          {/* CountUp 스탯 3개 */}
          <div className="ld-glass rounded-2xl py-6 px-4 grid grid-cols-3 gap-0 divide-x"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            {STATS.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                suffix={stat.suffix}
                active={aboutVisible}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          섹션 3: FEATURED — 3개 카드 그리드
          ================================================================ */}
      <section
        id="featured"
        ref={featuredRef as React.RefObject<HTMLDivElement>}
        className="w-full px-6 md:px-12 py-24"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="max-w-[1400px] mx-auto">
          {/* 헤더 */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
            {/* 좌측 헤딩 */}
            <div>
              <h2
                className="font-anton text-4xl md:text-6xl lg:text-7xl leading-none tracking-tight uppercase"
                style={{
                  fontFamily: "Anton, sans-serif",
                  color: "var(--text-primary)",
                }}
              >
                FEATURED
                <br />
                <span
                  className="font-condiment"
                  style={{
                    fontFamily: "Condiment, cursive",
                    color: "var(--accent-neon)",
                    fontSize: "0.75em",
                  }}
                >
                  Services
                </span>
              </h2>
            </div>

            {/* 우측 버튼 */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <button
                className="font-anton text-base tracking-widest uppercase transition-colors hover:text-neon"
                style={{
                  fontFamily: "Anton, sans-serif",
                  color: "var(--text-primary)",
                }}
              >
                전체 서비스 보기
              </button>
              {/* neon underline 바 */}
              <div
                className="h-0.5 w-full"
                style={{ background: "var(--accent-neon)" }}
              />
            </div>
          </div>

          {/* 3 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_CARDS.map((card, i) => (
              <FeaturedCard
                key={card.subtitle}
                card={card}
                index={i}
                visible={featuredVisible}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          섹션 4: CTA / CONTACT — 풀스크린 비디오 배경
          ================================================================ */}
      <section
        id="contact"
        ref={ctaRef as React.RefObject<HTMLDivElement>}
        className="relative w-full overflow-hidden"
        style={{ minHeight: "100svh" }}
      >
        {/* 비디오 — 풀스크린 object-cover, 뷰포트 진입 시 로딩 */}
        <LazyVideo
          src={VIDEO_CTA}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />

        {/* 오버레이 — 우측 다크 그라데이션 (텍스트 가독성) */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background:
              "linear-gradient(to right, rgba(1,8,40,0.85) 0%, rgba(1,8,40,0.4) 60%, rgba(1,8,40,0.1) 100%)",
          }}
        />

        {/* 상단 페이드 — Section 3 배경색(#010828)에서 투명으로 자연스럽게 용해 */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            zIndex: 2,
            height: "220px",
            background: "linear-gradient(to bottom, #010828 0%, transparent 100%)",
          }}
        />

        {/* 텍스트 + 푸터 오버레이 — 섹션 전체를 flex column으로 채움 */}
        <div
          className={`absolute inset-0 flex flex-col justify-between p-8 md:p-14 section-hidden ${ctaVisible ? "section-visible" : ""}`}
          style={{ zIndex: 2 }}
        >
          {/* 상단 Condiment 액센트 */}
          <div
            className="font-condiment text-xl md:text-2xl"
            style={{
              fontFamily: "Condiment, cursive",
              color: "var(--accent-neon)",
            }}
          >
            Let&#39;s connect
          </div>

          {/* 중앙 대형 헤딩 */}
          <div>
            <h2
              className="font-anton text-3xl md:text-5xl lg:text-6xl leading-tight tracking-tight uppercase"
              style={{
                fontFamily: "Anton, sans-serif",
                color: "var(--text-primary)",
              }}
            >
              START YOUR JOURNEY.
              <br />
              JOIN THE PLATFORM.
              <br />
              CREATE WHAT&#39;S NEXT.
            </h2>
          </div>

          {/* 좌하단 — 소셜 아이콘 + 푸터 */}
          <div className="flex flex-col gap-6">
            {/* 수직 소셜 아이콘 스택 */}
            <div className="flex flex-col gap-2">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="ld-glass w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:text-neon"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>

            {/* 푸터 — 비디오 위 오버레이 안에 포함 */}
            <footer className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-4 border-t border-white/10">
              <div
                className="font-anton text-sm tracking-widest"
                style={{ fontFamily: "Anton, sans-serif", color: "var(--text-secondary)" }}
              >
                LINKDROP
              </div>
              <div
                className="text-xs"
                style={{
                  color: "var(--text-secondary)",
                  fontFamily: "Pretendard Variable, Pretendard, sans-serif",
                }}
              >
                © 2026 LinkDrop. All rights reserved.
              </div>
              <div className="flex gap-4">
                {["서비스 이용약관", "개인정보처리방침"].map((text) => (
                  <a
                    key={text}
                    href="#"
                    className="text-xs hover:text-neon transition-colors"
                    style={{
                      color: "var(--text-secondary)",
                      fontFamily: "Pretendard Variable, Pretendard, sans-serif",
                    }}
                  >
                    {text}
                  </a>
                ))}
              </div>
            </footer>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
