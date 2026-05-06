"use client";
import React from "react";
import Image from "next/image";
import "@/styles/pages/landing11.css";
import externalLinks from "@/data/external-links.json";

// ────────────────────────────────────────────────────────────
// LdLanding11 — landing11 전용
// 주제: 위치기반 맛집 영상앱 사업계획서
// 콤보: 코랄 #FF6B47 (accent) + Aqua #22D3EE (secondary)
// 🔒 LD-006: 정적 스타일 → landing11.css (ld-fm-*). JS 런타임 동적 값만 style={{}} 유지.
// ────────────────────────────────────────────────────────────

// ── 목차 스텝 데이터 ─────────────────────────────────────────
const STEPS = [
  { href: "#ch1", num: "1", label: "앱 개요 & 문제",     sub: "외국인의 맛집 고민",           aqua: false },
  { href: "#ch2", num: "2", label: "핵심 기능",           sub: "지도·영상·다국어·교통",        aqua: false },
  { href: "#ch3", num: "3", label: "비즈니스 모델",       sub: "광고·프랜차이즈·로컬",         aqua: true  },
  { href: "#ch4", num: "4", label: "기술 스택",           sub: "Next.js + Supabase + oEmbed",  aqua: false },
  { href: "#ch5", num: "5", label: "로드맵 & 시작하기",   sub: "1~6개월 플랜",                 aqua: true  },
] as const;

// ── 인라인 SVG 아이콘 ────────────────────────────────────────
function IconMapPin({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconMessage({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function IconNavigation({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
    </svg>
  );
}

function IconCode({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
// 메인 컴포넌트
// ═══════════════════════════════════════════════════════════
export default function LdLanding11() {
  return (
    <div className="ld-fm-wrap">
      {/* ── blob 배경 scene (전역 lg-bg 사용) ─────────────────── */}
      <div className="lg-bg" aria-hidden="true">
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />
      </div>

      {/* ══════════════════════════════════════════════════════
          커버 섹션
      ════════════════════════════════════════════════════════ */}
      <section className="ld-fm-cover">
        <div className="ld-fm-cover-inner">

          {/* ── 왼쪽: 텍스트 블록 ─────────────────────────── */}
          <div>
            <div className="ld-fm-cover-badge">
              <IconMapPin color="#FF6B47" />
              위치기반 맛집 영상앱
            </div>

            <h1 className="ld-fm-h1">
              {"외국인 관광객을\n"}
              <span>맛집 영상 지도</span>
              {"로\n안내하세요"}
            </h1>

            <p className="ld-fm-cover-sub">
              인스타·틱톡 맛집 영상 → 지도 핀 → 내 언어로 TTS 안내까지.
              한국 여행객이 가장 필요로 하는 앱을 만들고 운영하세요.
            </p>

            <div className="ld-fm-lang-pills">
              <span className="ld-fm-lang-pill">🇰🇷 한국어</span>
              <span className="ld-fm-lang-pill">🇺🇸 English</span>
              <span className="ld-fm-lang-pill">🇯🇵 日本語</span>
              <span className="ld-fm-lang-pill">🇨🇳 中文</span>
              <span className="ld-fm-lang-pill">🇭🇰 廣東話</span>
            </div>

            <a
              href={externalLinks.kakao}
              target="_blank"
              rel="noopener noreferrer"
              className="ld-fm-cta-btn"
            >
              앱 만드는 법 배우기 →
            </a>

            <p className="ld-fm-cover-note">
              ※ 관광객 1인당 체류 중 외식 평균 8~12회 (한국관광공사 기준)
            </p>
          </div>

          {/* ── 중앙: 스마트폰 목업 ───────────────────────── */}
          <div className="ld-fm-visual">
            <div className="ld-fm-phone-frame">
              <video
                className="ld-fm-phone-video"
                src="https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/landing11/01.mp4"
                autoPlay
                loop
                muted
                playsInline
              />
              <Image
                className="ld-fm-phone-overlay"
                src="/img/phone_bg.png"
                alt=""
                fill
                sizes="200px"
              />
            </div>
          </div>

          {/* ── 우측: 목차 스텝 ───────────────────────────── */}
          <nav className="ld-fm-cover-stepper" aria-label="페이지 목차">
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.href}>
                <a href={step.href} className="ld-fm-stepper-step">
                  <span className={`ld-fm-stepper-num${step.aqua ? " ld-fm-stepper-num--aqua" : ""}`}>
                    {step.num}
                  </span>
                  <span className="ld-fm-stepper-info">
                    <span className="ld-fm-stepper-label">{step.label}</span>
                    <span className="ld-fm-stepper-sub">{step.sub}</span>
                  </span>
                </a>
                {idx < STEPS.length - 1 && (
                  <div className="ld-fm-stepper-line" aria-hidden="true" />
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          본문 문서 영역
      ════════════════════════════════════════════════════════ */}
      <div className="ld-fm-doc">

        {/* ── Chapter 1: 문제 정의 ─────────────────────────── */}
        <section id="ch1" className="ld-fm-section">
          <div className="ld-fm-section-eyebrow">Chapter 1 — 문제 정의</div>
          <h2 className="ld-fm-section-h2">
            외국인이 한국 맛집에서 겪는 3가지 장벽
          </h2>
          <p className="ld-fm-section-lead">
            연 2천만 외국인 관광객이 한국을 방문하지만, 맛집 정보는 여전히
            &apos;언어의 벽&apos; 뒤에 숨어 있습니다.
          </p>

          <div className="ld-fm-feature-grid">
            <div className="ld-fm-feature-card">
              <div className="ld-fm-feature-icon">
                <IconMapPin color="#FF6B47" />
              </div>
              <div className="ld-fm-feature-title">지도가 없다</div>
              <p className="ld-fm-feature-desc">
                인스타·틱톡 맛집 영상은 넘쳐나지만, &apos;이게 지도 어디야?&apos;를
                알 수 없습니다. 외국인은 영상을 보고도 찾아갈 방법이 없어요.
              </p>
            </div>

            <div className="ld-fm-feature-card">
              <div className="ld-fm-feature-icon">
                <IconMessage color="#FF6B47" />
              </div>
              <div className="ld-fm-feature-title">언어가 다르다</div>
              <p className="ld-fm-feature-desc">
                한국어 리뷰·메뉴는 읽기 어렵고, 구글 번역은 맥락을 놓칩니다.
                내 언어로 자연스럽게 설명해주는 곳이 없어요.
              </p>
            </div>

            <div className="ld-fm-feature-card">
              <div className="ld-fm-feature-icon">
                <IconNavigation color="#FF6B47" />
              </div>
              <div className="ld-fm-feature-title">교통을 모른다</div>
              <p className="ld-fm-feature-desc">
                &quot;여기 어떻게 가요?&quot;가 더 큰 문제. 지하철·버스 경로를 내 언어로
                안내해주는 앱이 없어요.
              </p>
            </div>
          </div>
        </section>

        {/* ── Chapter 2: 핵심 기능 ─────────────────────────── */}
        <section id="ch2" className="ld-fm-section">
          <div className="ld-fm-section-eyebrow">Chapter 2 — 핵심 기능</div>
          <h2 className="ld-fm-section-h2">
            3가지 기능으로 &apos;보고 → 찾고 → 간다&apos;
          </h2>
          <p className="ld-fm-section-lead">
            SNS 바이럴 맛집을 지도에서 찾고, 내 언어로 듣고, 교통편까지 안내받는 완전한 경험.
          </p>

          <div className="ld-fm-feature-grid">
            <div className="ld-fm-feature-card">
              <div className="ld-fm-feature-icon--aqua ld-fm-feature-icon">
                <IconMapPin color="#22D3EE" />
              </div>
              <div className="ld-fm-feature-title">위치기반 맛집 지도</div>
              <p className="ld-fm-feature-desc">
                인스타·틱톡 인플루언서 계정을 연결하면 오늘 올라온 맛집 영상이
                지도 핀으로 자동 표시됩니다. oEmbed 기술로 영상을 직접 저장하지
                않아 서버 비용이 거의 없습니다.
              </p>
            </div>

            <div className="ld-fm-feature-card">
              <div className="ld-fm-feature-icon--aqua ld-fm-feature-icon">
                <IconMessage color="#22D3EE" />
              </div>
              <div className="ld-fm-feature-title">5개 언어 UI + TTS 안내</div>
              <p className="ld-fm-feature-desc">
                영어·한국어·일본어·중국어·광동어로 UI 전환. 메뉴, 위치 설명,
                영업시간을 TTS로 읽어줍니다. 글을 못 읽어도 앱을 쓸 수 있어요.
              </p>
            </div>

            <div className="ld-fm-feature-card">
              <div className="ld-fm-feature-icon--aqua ld-fm-feature-icon">
                <IconNavigation color="#22D3EE" />
              </div>
              <div className="ld-fm-feature-title">도보·지하철·버스 경로 안내</div>
              <p className="ld-fm-feature-desc">
                카카오맵·네이버맵 API로 현재 위치에서 해당 맛집까지 최적 경로를
                영어·일본어 등으로 안내합니다. &apos;지하철 2역, 도보 5분&apos; 수준의
                간결한 안내.
              </p>
            </div>
          </div>

          {/* 언어 지원 그리드 */}
          <div className="ld-fm-lang-grid">
            {[
              { flag: "🇰🇷", name: "한국어" },
              { flag: "🇺🇸", name: "English" },
              { flag: "🇯🇵", name: "日本語" },
              { flag: "🇨🇳", name: "中文" },
              { flag: "🇭🇰", name: "廣東話" },
            ].map((lang) => (
              <div key={lang.name} className="ld-fm-lang-card">
                <span className="ld-fm-lang-flag">{lang.flag}</span>
                <div className="ld-fm-lang-name">{lang.name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Chapter 3: 비즈니스 모델 ─────────────────────── */}
        <section id="ch3" className="ld-fm-section">
          <div className="ld-fm-section-eyebrow">Chapter 3 — 비즈니스 모델</div>
          <h2 className="ld-fm-section-h2">3가지 수익 채널</h2>

          <div className="ld-fm-revenue-grid">
            <div className="ld-fm-revenue-card">
              <div className="ld-fm-revenue-badge">광고 수익</div>
              <div className="ld-fm-revenue-title">앱 내 광고</div>
              <div className="ld-fm-revenue-amount">MAU 1만 = 월 0~10달러</div>
              <p className="ld-fm-revenue-desc">
                초기 배너 광고. MAU 10만 기준 월 50~100달러. 서버비가 낮아
                수익성이 빠릅니다.
              </p>
            </div>

            <div className="ld-fm-revenue-card">
              <div className="ld-fm-revenue-badge">로컬 B2B</div>
              <div className="ld-fm-revenue-title">로컬 맛집 프로모션</div>
              <div className="ld-fm-revenue-amount">가게당 월 3~10만원</div>
              <p className="ld-fm-revenue-desc">
                지도에 &apos;추천 맛집&apos; 노출 & 영상 홍보 상품. 동네 식당이 직접
                신청하는 구조.
              </p>
            </div>

            <div className="ld-fm-revenue-card">
              <div className="ld-fm-revenue-badge--aqua ld-fm-revenue-badge">교육 + 프랜차이즈</div>
              <div className="ld-fm-revenue-title">바이브코딩 프랜차이즈</div>
              <div className="ld-fm-revenue-amount">수강료 + 지역 운영권</div>
              <p className="ld-fm-revenue-desc">
                이 앱을 만드는 법을 수업으로 가르칩니다. 수강생이 본인 지역
                맛집 앱을 운영하고, 광고 수익의 일부가 본사에게 귀속됩니다.
              </p>
            </div>
          </div>

          {/* 수익 분배 구조 */}
          <div className="ld-fm-revenue-split">
            <div className="ld-fm-revenue-split-title">광고 슬롯 수익 분배 구조</div>
            <div className="ld-fm-slot-row">
              <span className="ld-fm-slot-label">슬롯 A</span>
              <span className="ld-fm-slot-desc">본사 공통 광고 — 전체 앱에 공통 노출, 수익은 본사 귀속</span>
            </div>
            <div className="ld-fm-slot-row">
              <span className="ld-fm-slot-label--aqua ld-fm-slot-label">슬롯 B</span>
              <span className="ld-fm-slot-desc">프랜차이즈 개인 광고 — 수강생 지역 앱에만 노출, 수익은 수강생 귀속</span>
            </div>
          </div>
        </section>

        {/* ── Chapter 4: 기술 스택 ─────────────────────────── */}
        <section id="ch4" className="ld-fm-section">
          <div className="ld-fm-section-eyebrow">Chapter 4 — 기술 스택</div>
          <h2 className="ld-fm-section-h2">코딩 초보도 1개월이면 배포 가능</h2>
          <p className="ld-fm-section-lead">
            최신 AI 코딩 도구(바이브코딩)로 복잡한 기술도 빠르게 구현합니다.
          </p>

          <div className="ld-fm-tech-list">
            {[
              { icon: "⚡", label: "Next.js + Supabase (PostGIS)", desc: "프론트·백엔드 통합, 위치 기반 DB 쿼리" },
              { icon: "🔗", label: "oEmbed API",                   desc: "인스타·틱톡 영상 URL 저장만으로 영상 재생 (서버 트래픽 0)" },
              { icon: "🗺️", label: "카카오맵 API",                desc: "월 30만 건 무료. 초기 비용 거의 없음" },
              { icon: "🤖", label: "LLM (GPT/Gemini)",             desc: "해시태그·캡션에서 식당 이름 자동 추출" },
              { icon: "🔊", label: "Edge TTS",                      desc: "Microsoft Edge 무료 TTS. 5개 언어 자연스러운 음성" },
            ].map((tech) => (
              <div key={tech.label} className="ld-fm-tech-item">
                <div className="ld-fm-tech-icon" aria-hidden="true">
                  <IconCode color="#22D3EE" />
                </div>
                <div className="ld-fm-tech-info">
                  <div className="ld-fm-tech-label">{tech.icon} {tech.label}</div>
                  <div className="ld-fm-tech-desc">{tech.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Chapter 5: 로드맵 ────────────────────────────── */}
        <section id="ch5" className="ld-fm-section">
          <div className="ld-fm-section-eyebrow">Chapter 5 — 로드맵</div>
          <h2 className="ld-fm-section-h2">6개월 안에 수익 내는 플랜</h2>

          <div className="ld-fm-roadmap">
            {[
              { period: "1~2개월", title: "MVP 개발",                   desc: "인스타/틱톡 연동 + 지도 핀 + 기본 UI 완성 및 배포",                    aqua: false },
              { period: "3개월",   title: "인플루언서 10명 온보딩",      desc: "서울·부산 맛집 인플루언서 계정 연결, 초기 데이터 수집",              aqua: false },
              { period: "4개월",   title: "다국어 UI + TTS 출시",        desc: "5개국어 베타 오픈, 실제 외국인 관광객 테스트",                      aqua: true  },
              { period: "5개월",   title: "교통 경로 안내 연동",          desc: "카카오맵 경로 API + 다국어 안내 문장 생성",                          aqua: false },
              { period: "6개월",   title: "1기 바이브코딩 클래스",        desc: "이 앱 만드는 법을 가르치는 첫 번째 수업 개강",                      aqua: true  },
            ].map((item, idx, arr) => (
              <div key={item.title} className="ld-fm-roadmap-item">
                <div className="ld-fm-roadmap-left">
                  <div className={`ld-fm-roadmap-dot${item.aqua ? " ld-fm-roadmap-dot--aqua" : ""}`} />
                  {idx < arr.length - 1 && (
                    <div className="ld-fm-roadmap-line" aria-hidden="true" />
                  )}
                </div>
                <div className="ld-fm-roadmap-content">
                  <div className="ld-fm-roadmap-period">{item.period}</div>
                  <div className="ld-fm-roadmap-title">{item.title}</div>
                  <p className="ld-fm-roadmap-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════
          최종 CTA 섹션
      ════════════════════════════════════════════════════════ */}
      <section className="ld-fm-final">
        <div className="ld-fm-final-inner">
          <h2 className="ld-fm-final-h2">지금 바로 이 앱을 만들어보세요</h2>
          <p className="ld-fm-final-sub">
            바이브코딩 클래스 수강 → 내 지역 맛집 앱 배포 → 프랜차이즈 운영
          </p>
          <div className="ld-fm-final-cta">
            <a
              href={externalLinks.kakao}
              target="_blank"
              rel="noopener noreferrer"
              className="ld-fm-cta-btn"
            >
              클래스 신청하기 →
            </a>
            <a
              href={externalLinks.kakao}
              target="_blank"
              rel="noopener noreferrer"
              className="ld-fm-cta-btn-ghost"
            >
              카카오톡 문의
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
