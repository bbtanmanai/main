"use client";

import "@/styles/pages/index.css";
import { useEffect, useState, useCallback, Suspense } from "react";
import LdBonusSection from "@/components/landing/LdBonusSection";
import LazyVideo from "@/components/ui/LazyVideo";
import { useCountUp } from "@/hooks/useCountUp";
import { useIntersection } from "@/hooks/useIntersection";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ArrowRight, Mail, AtSign, Globe, MessageCircle } from "lucide-react";

const SOCIAL_LINKS = [
  { icon: Mail, href: "mailto:contact@linkdrop.kr", label: "이메일 문의" },
  { icon: AtSign, href: "https://instagram.com/linkdrop", label: "인스타그램" },
  { icon: Globe, href: "https://youtube.com/@linkdrop", label: "유튜브 채널" },
  { icon: MessageCircle, href: "https://twitter.com/linkdrop", label: "SNS" },
];

const STATS = [
  { label: "파트너 수", value: 1240, suffix: "+" },
  { label: "누적 매출", value: 48, suffix: "억+" },
  { label: "콘텐츠 수", value: 32000, suffix: "+" },
];

const FEATURED_CARDS = [
  {
    title: "MONETIZE YOUR\nCONTENT",
    subtitle: "콘텐츠 수익화",
    tag: "REVENUE SYSTEM",
    value: "파트너 직접 판매 + 후원 네트워크",
    video: "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/index/index_01.mp4",
  },
  {
    title: "PARTNER\nECOSYSTEM",
    subtitle: "파트너 생태계",
    tag: "NETWORK EFFECT",
    value: "1,240+ 활성 파트너",
    video: "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/index/index_02.mp4",
  },
  {
    title: "AI-POWERED\nPIPELINE",
    subtitle: "AI 자동화",
    tag: "AUTOMATION",
    value: "콘텐츠 생산 완전 자동화",
    video: "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/index/index_03.mp4",
  },
];

const VIDEO_HERO = "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/index/index_background_top.mp4";
const VIDEO_ABOUT = "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/index/index_background_top2.mp4";
const VIDEO_CTA = "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/index/index_background_bottom.mp4";

function StatCard({ label, value, suffix, active }: { label: string; value: number; suffix: string; active: boolean }) {
  const count = useCountUp(value, 2200, active);
  return (
    <div className="text-center px-6 py-4">
      <div className="font-anton text-4xl md:text-5xl leading-none idx-stat-number">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="mt-2 text-sm tracking-widest uppercase opacity-60 idx-stat-label">
        {label}
      </div>
    </div>
  );
}

function FeaturedCard({ card, index, visible }: { card: (typeof FEATURED_CARDS)[0]; index: number; visible: boolean }) {
  return (
    <div
      className="ld-glass card-hover rounded-2xl overflow-hidden flex flex-col transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transitionDelay: `${index * 150}ms`,
      }}
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <LazyVideo src={card.video} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between idx-feat-overlay">
          <div>
            <div className="text-xs tracking-widest uppercase idx-feat-tag">{card.tag}</div>
            <div className="text-sm font-semibold idx-feat-value">{card.value}</div>
          </div>
          <button className="ld-glass rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0 idx-feat-arrow" aria-label={`${card.subtitle} 더보기`}>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <div className="p-5 flex-1">
        <div className="text-xs tracking-wider uppercase mb-2 font-semibold idx-feat-subtitle">{card.subtitle}</div>
        <h3 className="font-anton text-xl leading-tight whitespace-pre-line idx-page">{card.title}</h3>
      </div>
    </div>
  );
}

function AuthModalTrigger() {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("auth") === "1") {
      window.dispatchEvent(new CustomEvent("ld-auth-open"));
    }
  }, [searchParams]);
  return null;
}

export default function IndexPage() {
  const { ref: aboutRef, visible: aboutVisible } = useIntersection<HTMLElement>(0.2);
  const { ref: featuredRef, visible: featuredVisible } = useIntersection<HTMLElement>(0.15);
  const { ref: ctaRef, visible: ctaVisible } = useIntersection<HTMLElement>(0.1);
  const [scrollY, setScrollY] = useState(0);
  const handleScroll = useCallback(() => setScrollY(window.scrollY), []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <>
      <Suspense fallback={null}><AuthModalTrigger /></Suspense>
      <main data-page="home" className="idx-page">

        {/* ── 섹션 1: HERO ─────────────────────────────────────── */}
        <section id="hero" className="relative w-full overflow-hidden idx-hero">
          <div
            className="absolute inset-0 video-parallax"
            style={{ transform: `translateY(${scrollY * 0.3}px)`, willChange: "transform" }}
          >
            <video src={VIDEO_HERO} autoPlay loop muted playsInline className="w-full h-full object-cover idx-hero-bg-video" />
            <div className="absolute inset-0 idx-hero-overlay" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none idx-hero-fade" />
          <div className="relative z-10 flex flex-col items-start justify-end h-full px-6 md:px-12 pb-24 md:pb-32 pt-32 max-w-[1400px] mx-auto idx-hero-content">
            <div className="condiment-fade text-5xl md:text-6xl mb-4 idx-hero-script">링크드롭 플랫폼</div>
            <h1 className="font-anton text-5xl md:text-7xl lg:text-8xl xl:text-9xl leading-none tracking-tight uppercase idx-page idx-hero-h1">
              EMPOWERING<br />CREATORS<br />
              <span className="idx-feat-arrow">BEYOND</span> THE<br />
              CONTENT<br />HORIZON
            </h1>
            <div className="mt-12 flex flex-col items-center gap-2 scroll-bounce idx-scroll-wrap">
              <span className="text-xs tracking-widest uppercase idx-scroll-label">스크롤</span>
              <ChevronDown size={20} />
            </div>
          </div>
        </section>

        {/* ── 섹션 2: ABOUT ────────────────────────────────────── */}
        <section id="about" ref={aboutRef as React.RefObject<HTMLElement>} className="relative w-full overflow-hidden idx-about">
          <div className="absolute inset-0">
            <LazyVideo src={VIDEO_ABOUT} className="w-full h-full object-cover" />
            <div className="absolute inset-0 idx-about-overlay" />
            <div className="absolute top-0 left-0 right-0 pointer-events-none idx-about-fade-top" />
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none idx-about-fade-bottom" />
          </div>
          <div className={`relative z-10 flex flex-col h-full px-6 md:px-12 py-20 max-w-[1400px] mx-auto section-hidden idx-about-content ${aboutVisible ? "section-visible" : ""}`}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8 flex-1">
              <div className="relative">
                <h2 className="font-anton text-5xl md:text-7xl lg:text-8xl leading-none tracking-tight uppercase idx-page">
                  WHAT WE<br />
                  <span className="idx-feat-arrow">DO</span>
                </h2>
                <div className="font-condiment text-2xl md:text-3xl mt-3 idx-about-script">Platform</div>
              </div>
              <p className="idx-about-intro">
                콘텐츠 크리에이터를 위한<br />
                수익화 · 파트너십 · AI 자동화<br />
                통합 플랫폼.<br /><br />
                당신의 콘텐츠가<br />
                비즈니스가 되는 곳.
              </p>
            </div>
            <div className="mt-auto pb-8 overflow-hidden">
              <div className="font-anton text-3xl md:text-5xl tracking-widest uppercase whitespace-nowrap idx-ticker">
                MONETIZE / AUTOMATE / PARTNER / GROW / SCALE / CREATE / LINK / DROP / REVENUE / CONTENT / AI / PIPELINE
              </div>
            </div>
            <div className="ld-glass rounded-2xl py-6 px-4 grid grid-cols-3 gap-0 divide-x idx-stat-grid">
              {STATS.map((stat) => <StatCard key={stat.label} {...stat} active={aboutVisible} />)}
            </div>
          </div>
        </section>

        {/* ── 섹션 3: FEATURED ─────────────────────────────────── */}
        <section id="featured" ref={featuredRef as React.RefObject<HTMLElement>} className="w-full px-6 md:px-12 py-24">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
              <h2 className="font-anton text-4xl md:text-6xl lg:text-7xl leading-none tracking-tight uppercase idx-page">
                FEATURED<br />
                <span className="font-condiment idx-featured-script">Services</span>
              </h2>
              <div className="flex flex-col items-start md:items-end gap-2">
                <button className="font-anton text-base tracking-widest uppercase transition-colors hover:text-neon idx-page">
                  전체 서비스 보기
                </button>
                <div className="h-0.5 w-full idx-feat-accent-bar" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURED_CARDS.map((card, i) => (
                <FeaturedCard key={card.subtitle} card={card} index={i} visible={featuredVisible} />
              ))}
            </div>
          </div>
        </section>

        {/* ── 섹션 3-B/C: 원데이 클래스 + 프롬프트 + 보너스 ─── */}
        <LdBonusSection />

        {/* ── 섹션 4: CTA / CONTACT ────────────────────────────── */}
        <section id="contact" ref={ctaRef as React.RefObject<HTMLElement>} className="relative w-full overflow-hidden idx-cta">
          <LazyVideo src={VIDEO_CTA} className="absolute inset-0 w-full h-full object-cover idx-cta-video" />
          <div className="absolute inset-0 idx-cta-overlay" />
          <div className="absolute top-0 left-0 right-0 pointer-events-none idx-cta-fade-top" />
          <div className={`absolute inset-0 flex flex-col justify-between p-8 md:p-14 section-hidden idx-cta-content ${ctaVisible ? "section-visible" : ""}`}>
            <div className="font-condiment text-xl md:text-2xl idx-cta-script">Let&#39;s connect</div>
            <div>
              <h2 className="font-anton text-3xl md:text-5xl lg:text-6xl leading-tight tracking-tight uppercase idx-page">
                START YOUR JOURNEY.<br />
                JOIN THE PLATFORM.<br />
                CREATE WHAT&#39;S NEXT.
              </h2>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="ld-glass w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:text-neon idx-scroll-wrap"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
              <footer className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-4 border-t border-white/10">
                <div className="font-anton text-sm tracking-widest idx-footer-brand">LINKDROP</div>
                <div className="text-xs idx-footer-copy">© 2026 LinkDrop. All rights reserved.</div>
                <div className="flex gap-4">
                  {["서비스 이용약관", "개인정보처리방침"].map((text) => (
                    <a key={text} href="#" className="text-xs hover:text-neon transition-colors idx-footer-link">{text}</a>
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
