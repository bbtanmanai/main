import React from "react";
import "@/styles/pages/landing2.css";
import LdCinematicVideoBg from "@/components/landing/cinematic/LdCinematicVideoBg";

// 🔒 ACCENT_COLOR는 --wg-accent CSS 커스텀 프로퍼티로 주입됨 (루트 div style 유지)
const ACCENT_COLOR = "#5784B8";

const STEPS = [
  { href: "#ch1", num: "1", label: "당신의 지식, 경험치, 노하우가 3천만원이 됩니다", sub: "경험·지식 = 자산" },
  { href: "#ch2", num: "2", label: "600달러 → 10만 달러의 비밀", sub: "러셀 브런슨 사례" },
  { href: "#ch3", num: "3", label: "Hook · Story · Sell 공식", sub: "가격 저항 깨기" },
  { href: "#ch4", num: "4", label: "배운 것을 팔아라", sub: "꿈의 고객 · 도미노 효과" },
  { href: "#ch5", num: "5", label: "무엇을 · 어떻게 · 어디서", sub: "5단계 + 3대 시장" },
  { href: "#ch6", num: "6", label: "3개월 3천만원 실천 로드맵", sub: "4단계 + LinkDrop 연결" },
] as const;

// LdLanding2 — landing2 전용 (구 LdEbookGuide)
// 주제: 경험·지식 수익화 가이드
export default function LdLanding2() {
  return (
    /* --wg-accent 동적 주입 — JS 런타임 변수이므로 인라인 유지 */
    <div
      className="ld-wg-wrap"
      style={{ "--wg-accent": ACCENT_COLOR } as React.CSSProperties}
    >
      {/* ══ 표지 — 풀스크린 동영상 배경 ══ */}
      <div className="ld-wg-cover" id="top">
        <LdCinematicVideoBg playbackId="ExchtTC1yIF00nVN32kc009f00LUu4yhMvVhQlR7Ce1ovc" />
        <div className="ld-wg-cover-inner">
          <div className="ld-wg-cover-left">
            <span className="ld-wg-cover-badge">경험·지식 수익화 가이드</span>
            <h1>
              당신의 경험은<br />
              생각보다 훨씬<br />
              <span>비쌉니다</span>
            </h1>
            <p className="ld-wg-cover-sub">
              러셀 브런슨이 600달러 아이폰을 10만 달러에 판 비밀 — Hook·Story·Sell 공식.<br />
              꿈의 고객 단 1명을 위해 가치를 쌓으면, 비슷한 사람 100명이 따라옵니다.<br />
              평균 3개월이면 첫 3천만원 가능 · 코딩·강의·스튜디오 불필요
            </p>
            <a
              href="https://open.kakao.com/o/linkdrop"
              target="_blank"
              rel="noopener noreferrer"
              className="ld-eb-cta-btn"
            >
              지금 가치 설계 상담받기 →
            </a>
          </div>

          <div className="ld-wg-cover-stepper" id="toc">
            {STEPS.map((step, i) => (
              <React.Fragment key={step.href}>
                <a href={step.href} className="ld-wg-stepper-step">
                  <div className="ld-wg-stepper-num">{step.num}</div>
                  <div className="ld-wg-stepper-text">
                    <div className="ld-wg-stepper-label">{step.label}</div>
                    <div className="ld-wg-stepper-sub">{step.sub}</div>
                  </div>
                </a>
                {i < STEPS.length - 1 && (
                  <div className="ld-wg-stepper-line" aria-hidden="true" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* .ld-wg-doc에 position:relative; z-index:1 — CSS로 이동 */}
      <div className="ld-wg-doc">

        {/* ══ Chapter 1 — 대표 영상 섹션 ══ */}
        <div className="ld-wg-section ld-eb-ch1-section" id="ch1">
          <video
            autoPlay
            loop
            muted
            playsInline
            src="https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/landing2/%5BDLBunny.com%5D%5Bxhs%5D2026-4-25-2-55-40.mp4"
            className="ld-eb-ch1-video"
            aria-hidden="true"
          />
          <div className="ld-eb-ch1-overlay">
            <div className="ld-eb-ch1-text-block">
              {["당신의", "지식,", "경험치,", "노하우가", "3천만원이 됩니다"].map((line) => (
                <span key={line} className="ld-eb-ch1-headline">
                  {line}
                </span>
              ))}
            </div>
            <p className="ld-eb-ch1-quote-wrap">
              <span className="ld-eb-ch1-quote">
                You don&apos;t need a degree to sell what you know.<br />
                You need one person who desperately needs what you&apos;ve learned.<br />
                Russell Brunson sold a $600 phone for $100,000 —<br />
                not because the phone changed,<br />
                but because he stacked the value.<br />
                Your experience is someone&apos;s missing chapter.<br />
                Stack it right. The market will pay.
              </span>
            </p>
          </div>
        </div>

        {/* ══ Chapter 2 — 가치 누적 행 리스트 + 대형 비교 스탯 ══ */}
        <div className="ld-wg-section" id="ch2">
          <div className="ld2-section-stack">
            {/* 헤딩 */}
            <div className="ld-eb-ch-heading-wrap">
              <span className="ld-eb-badge">Chapter 2</span>
              <h2 className="ld-eb-ch-h2">
                600달러를 10만 달러로 만든 비밀
              </h2>
              <p className="ld-eb-ch-lead">
                세계적인 마케터 러셀 브런슨은 세미나에서 600달러짜리 아이폰을 10만 달러에 제안했습니다.
                가격을 올린 게 아닙니다 — 가치를 쌓아 올렸을 뿐입니다.
              </p>
            </div>

            {/* 대형 비교 스탯 — Hook: 먼저 보여 충격을 준다 */}
            <div className="ld-eb-stat-compare">
              <div className="ld-eb-stat-compare-cell">
                <p className="ld-eb-stat-label">아이폰 실제 가격</p>
                <p className="ld-eb-stat-value">$600</p>
              </div>
              <div className="ld-eb-stat-arrow">→</div>
              <div className="ld-eb-stat-compare-cell">
                <p className="ld-eb-stat-label--accent">총 인지 가치</p>
                <p className="ld-eb-stat-value--accent">$100K</p>
              </div>
            </div>

            {/* 가치 누적 행 리스트 */}
            <p className="ld-eb-value-list-label">아이폰 위에 쌓인 4가지 가치</p>
            <div className="ld-eb-value-list">
              {[
                { n: "01", value: "$750K", tag: "강좌 라이브러리", desc: "세계적 거장들이 75만 달러를 투자해 만든 강좌 전체 — 원본·오디오북 풀패키지" },
                { n: "02", value: "직통", tag: "인플루언서 직통 라인", desc: "영향력 있는 인사들의 개인 번호·이메일·직접 추천 컨설팅 연결 권한" },
                { n: "03", value: "∞", tag: "Voxer 무제한 컨설팅", desc: "연 10만 달러 마스터 수강자 전용 앱으로 무제한 1:1 코칭 제공" },
                { n: "04", value: "실시간", tag: "운영 자료 전체 공유", desc: "모든 운영 매뉴얼 + 실시간 재무 분석 자료 구글 드라이브 전권 접근" },
              ].map(({ n, value, tag, desc }) => (
                <div key={n} className="ld-eb-value-row">
                  <span className="ld-eb-value-row-n">{n}</span>
                  <span className="ld-eb-value-row-val">{value}</span>
                  <div>
                    <p className="ld-eb-value-row-tag">{tag}</p>
                    <p className="ld-eb-value-row-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="ld-eb-footnote">
              가격이 오히려 <strong>90% 할인</strong>처럼 느껴지는 순간 — 이것이 당신의 경험을 팔 때도 그대로 적용됩니다
            </p>
          </div>
        </div>

        {/* ══ Chapter 3 — 연결 3-패널 + 테이블 ══ */}
        <div className="ld-wg-section" id="ch3">
          <div className="ld2-ch-banner">
            <img
              src="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1600&q=80"
              alt="강연자 — 스토리텔링으로 청중을 사로잡는 순간"
            />
            <div className="ld2-ch-banner-caption">
              사로잡고 → 이야기하고 → 가치를 쌓아라
            </div>
          </div>

          <div className="ld2-section-stack">
            <div className="ld-eb-ch3-heading-wrap">
              <span className="ld-eb-badge">Chapter 3</span>
              <h2 className="ld-eb-ch-h2">
                가격 저항을 무너뜨리는 3단 공식
              </h2>
              <p className="ld-eb-ch-lead">
                Hook → Story → Sell. 이 순서를 지키면 &quot;비싸다&quot;는 저항이 사라지고
                &quot;꼭 사야겠다&quot;는 확신으로 바뀝니다.
              </p>
            </div>

            {/* 연결 3-패널 — 경계선이 맞닿아 흐름을 표현 */}
            <div className="ld-eb-trio-grid">
              {[
                { n: "1", label: "Hook", title: "관심 사로잡기", panelMod: "1",
                  desc: "첫 3초 안에 시선을 멈추게 하는 호기심 자극. '왜 이게 100배 가치일까?'라는 질문을 던지게 만든다." },
                { n: "2", label: "Story", title: "가치 끌어올리기", panelMod: "2",
                  desc: "왜 이 제품이 만들어졌는지, 어떤 사람을 위해 만들었는지의 서사. '나도 저럴 수 있다'는 동일시를 만든다." },
                { n: "3", label: "Sell", title: "가치 10배 만들기", panelMod: "3",
                  desc: "본 제품 + 보너스 패키지 → 총 인지 가치가 가격의 10배 이상이 되는 순간, 가격이 저렴하게 느껴진다." },
              ].map(({ n, label, title, desc, panelMod }) => (
                <div key={n} className={`ld-eb-trio-panel ld-eb-trio-panel--${panelMod}`}>
                  <span className="ld-eb-trio-num">{n}</span>
                  <span className="ld-eb-trio-badge">{label}</span>
                  <h3 className="ld-eb-trio-h3">{title}</h3>
                  <p className="ld-eb-trio-p">{desc}</p>
                </div>
              ))}
            </div>

            {/* 용어 해설 테이블 */}
            <div className="ld-eb-glossary-box">
              <p className="ld-eb-glossary-label">용어 해설</p>
              <table className="ld-eb-glossary-table">
                <thead>
                  <tr>
                    {["용어", "뜻", "적용 시 효과"].map((h) => (
                      <th key={h} className="ld-eb-glossary-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { term: "Hook", meaning: "도입 후크 — 첫 문장·썸네일·제목", effect: "이탈률 70% → 30%로 감소" },
                    { term: "Value Stack", meaning: "가치 누적 — 핵심 + 보너스 패키지화", effect: "인지 가치를 가격의 10배 이상으로 확장" },
                    { term: "Offer", meaning: "제안 패키지 — 가격보다 가치를 비교하게 만듦", effect: "경쟁자 비교 차단" },
                    { term: "Story Selling", meaning: "이야기로 판매 — 감정 연결 방식", effect: "가격 저항 50% 감소" },
                  ].map(({ term, meaning, effect }) => (
                    <tr key={term}>
                      <td className="ld-eb-glossary-td-term">{term}</td>
                      <td className="ld-eb-glossary-td">{meaning}</td>
                      <td className="ld-eb-glossary-td-last">{effect}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ══ Chapter 4 — Before/After 히어로 + 아이콘 리스트 ══ */}
        <div className="ld-wg-section" id="ch4">
          <div className="ld2-ch-banner">
            <img
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80"
              alt="럭셔리 패키지 — 가치 구성의 시각화"
            />
            <div className="ld2-ch-banner-caption">
              같은 600달러 아이폰이 어떻게 10만 달러가 됐을까요?
            </div>
          </div>

          <div className="ld2-section-stack">
            <div className="ld-eb-ch-heading-wrap">
              <span className="ld-eb-badge">Chapter 4</span>
              <h2 className="ld-eb-ch-h2">
                배움을 돈으로 바꾸는 도미노 법칙
              </h2>
              <p className="ld-eb-ch-lead">
                기술이 아닌 <strong>변화</strong>를 팔면 가격 저항이 사라집니다.
                같은 내용이라도 무엇을 약속하느냐가 가격을 5배 이상 바꿉니다.
              </p>
            </div>

            {/* Before/After 히어로 비교 */}
            <div className="ld-eb-before-after">
              <div className="ld-eb-before-panel">
                <p className="ld-eb-before-label">기술 중심 — 가격 저항 발생</p>
                <p className="ld-eb-before-quote">
                  &ldquo;하루 30분<br />영어 회화&rdquo;
                </p>
                <p className="ld-eb-price-label">월 수강료</p>
                <p className="ld-eb-price-before">10만원</p>
                <p className="ld-eb-price-note">
                  &quot;비싸다&quot;는 말을 듣는 이유 —<br />기술은 흔하기 때문입니다
                </p>
              </div>
              <div className="ld-eb-after-panel">
                <p className="ld-eb-after-label">변화 중심 — 가격 저항 소멸</p>
                <p className="ld-eb-after-quote">
                  &ldquo;글로벌 클라이언트와<br />일하며 자존감을<br />회복하는 90일&rdquo;
                </p>
                <p className="ld-eb-price-label">월 수강료</p>
                <p className="ld-eb-price-after">50만원</p>
                <p className="ld-eb-price-note">
                  같은 내용, 5배 가격 —<br />변화의 약속이 만드는 차이
                </p>
              </div>
            </div>

            {/* 3가지 원칙 — 아이콘 리스트 */}
            <p className="ld-eb-principle-label">가격을 5배로 만드는 3가지 원칙</p>
            <div className="ld-eb-principle-list">
              {[
                { icon: "🌿", title: "기술이 아닌 '습관·자유·자존감'을 팔아라", desc: "영어를 가르치지 말고 '영어로 글 쓰며 얻는 자유'를 팔아라. 기술은 흔하지만 변화는 비싸다." },
                { icon: "👑", title: "마감·원칙·기준을 지켜 희소성을 만들어라", desc: "가격을 깎으면 가치도 함께 깎인다. 할인보다 희소성이 더 강한 구매 동기가 된다." },
                { icon: "💰", title: "'비싸다'가 아니라 '내 인생이 어떻게 달라지는가'로 프레임을 바꿔라", desc: "가격 비교가 아닌 변화 비교로 고객의 사고를 전환하라. 마인드가 가격을 결정한다." },
              ].map(({ icon, title, desc }, idx) => (
                <div
                  key={idx}
                  className={`ld-eb-principle-item${idx < 2 ? " ld-eb-principle-item--bordered" : ""}`}
                >
                  <span className="ld-eb-principle-icon">{icon}</span>
                  <div>
                    <h3 className="ld-eb-principle-h3">{title}</h3>
                    <p className="ld-eb-principle-p">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 도미노 인용 */}
            <div className="ld-eb-quote-box">
              <p className="ld-eb-quote-text">
                &ldquo;단 한 명의 이상적인 고객에게 정조준하면,<br />
                비슷한 사람 100명이 따라온다 — 도미노 효과&rdquo;
              </p>
              <p className="ld-eb-quote-attr">— 러셀 브런슨의 Dream Customer 원칙</p>
            </div>
          </div>
        </div>

        {/* ══ Chapter 5 — 3개 구분 존 ══ */}
        <div className="ld-wg-section" id="ch5">
          <div className="ld2-ch-banner">
            <img
              src="https://images.unsplash.com/photo-1484910292437-025e5d13ce87?w=1600&q=80"
              alt="로드맵 — 무엇을 어떻게 어디서 팔지의 3축 설계"
            />
            <div className="ld2-ch-banner-caption">
              무엇을 배우고 · 어떻게 키우고 · 어디서 팔지의 3축 설계도
            </div>
          </div>

          <div className="ld2-section-stack">
            <div className="ld-eb-ch-heading-wrap">
              <span className="ld-eb-badge">Chapter 5</span>
              <h2 className="ld-eb-ch-h2">
                무엇을 · 어떻게 · 어디서 — 3축 설계
              </h2>
              <p className="ld-eb-ch-lead">
                수익화의 골격은 세 가지 질문으로 완성됩니다.
              </p>
            </div>

            {/* Zone A — 무엇을 */}
            <div className="ld-eb-zone-mb">
              <div className="ld-eb-zone-header">
                <span className="ld-eb-zone-num">①</span>
                <h3 className="ld-eb-zone-h3">무엇을 배울까</h3>
              </div>
              <div className="ld-eb-zone-body">
                <p className="ld-eb-zone-lead">
                  내가 잘하는 것이 아니라, <strong>꿈의 고객이 잠 못 자며 검색하는 문제</strong>를 배워야 합니다.
                  네이버 카페·커뮤니티에서 반복 등장하는 질문 패턴 —
                  &quot;어떻게 해야 하나요?&quot; &quot;이거 진짜 되나요?&quot; — 이런 질문이 곧 콘텐츠 주제입니다.
                </p>
              </div>
            </div>

            <div className="ld-eb-divider" />

            {/* Zone B — 어떻게 (가로 스텝 배지) */}
            <div className="ld-eb-zone-mb">
              <div className="ld-eb-zone-header--mb20">
                <span className="ld-eb-zone-num">②</span>
                <h3 className="ld-eb-zone-h3">어떻게 키울까 — 전문가가 되는 5단계</h3>
              </div>
              <div className="ld-eb-zone-body">
                <div className="ld-eb-step-badges">
                  {[
                    { num: "①", title: "몽상가", desc: "막연한 동경" },
                    { num: "②", title: "기인", desc: "다른 시각·접근" },
                    { num: "③", title: "프로토타입", desc: "첫 결과물 검증" },
                    { num: "④", title: "내세움", desc: "공개 포지셔닝" },
                    { num: "⑤", title: "전문가", desc: "길을 안내하는 단계" },
                  ].map(({ num, title, desc }) => (
                    <div key={num} className="ld-eb-step-badge">
                      <span className="ld-eb-step-badge-num">{num}</span>
                      <span className="ld-eb-step-badge-title">{title}</span>
                      <span className="ld-eb-step-badge-desc">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="ld-eb-divider" />

            {/* Zone C — 어디서 (3대 시장 컬러 존) */}
            <div>
              <div className="ld-eb-zone-header--mb20">
                <span className="ld-eb-zone-num">③</span>
                <h3 className="ld-eb-zone-h3">어디서 팔까 — 3대 핵심 시장</h3>
              </div>
              <div className="ld-eb-zone-body">
                <div className="ld-eb-market-grid">
                  {[
                    { icon: "💰", title: "부 / 돈", desc: "재테크·창업·투자·N잡 — 가장 큰 시장, 결과 수치가 명확할수록 팔린다.", mod: "1" },
                    { icon: "🏃", title: "건강", desc: "다이어트·식단·운동·정신건강 — 평생 반복 구매되는 시장.", mod: "2" },
                    { icon: "💞", title: "관계", desc: "연애·육아·가족·인간관계 — 감정적 공감이 구매를 만든다.", mod: "3" },
                  ].map(({ icon, title, desc, mod }) => (
                    <div key={title} className={`ld-eb-market-card ld-eb-market-card--${mod}`}>
                      <span className="ld-eb-market-icon">{icon}</span>
                      <h3 className="ld-eb-market-h3">{title}</h3>
                      <p className="ld-eb-market-p">{desc}</p>
                    </div>
                  ))}
                </div>

                {/* 니치마켓 */}
                <div className="ld-eb-niche-box">
                  <p className="ld-eb-niche-label">니치마켓 시작 원칙</p>
                  <p className="ld-eb-niche-text">
                    3대 시장에 바로 뛰어들지 마세요.
                    <strong> &apos;50대 / 직장인 / 갱년기 우울&apos;</strong>처럼 좁힌 니치에서 1등이 된 후,
                    인접 니치로 담장 깨듯 확장하세요.
                    <br />
                    <span className="ld-eb-niche-note">큰 시장에 작게 들어가면 묻히고, 작은 시장에 크게 들어가면 1등이 됩니다.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ Chapter 6 — 세로 타임라인 + 대형 스탯 ══ */}
        <div className="ld-wg-section" id="ch6">
          <div className="ld2-ch-banner">
            <img
              src="https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=1600&q=80"
              alt="성공 — 첫 3천만원 달성 순간"
            />
            <div className="ld2-ch-banner-caption">
              롤모델 → 스터디 → 무료 나눔 → 전문가 데뷔 — 4단계 실천법
            </div>
          </div>

          <div className="ld2-section-stack">
            <div className="ld-eb-ch-heading-wrap">
              <span className="ld-eb-badge">Chapter 6</span>
              <h2 className="ld-eb-ch-h2">
                3개월 3천만원 — 4단계 실천 로드맵
              </h2>
              <p className="ld-eb-ch-lead">
                거창한 스튜디오·강의·자본 없이 시작합니다.
                필요한 건 꿈의 고객 1명과 4단계의 순서뿐입니다.
              </p>
            </div>

            {/* 세로 타임라인 */}
            <div className="ld-eb-timeline-wrap">
              <div className="ld-eb-timeline-line" />
              {[
                { num: "①", title: "롤모델 찾기", tag: "1~2주", desc: "내가 가고 싶은 위치에 이미 도달한 1명을 정해 그의 콘텐츠·언어·오퍼 구조를 30일 분석합니다." },
                { num: "②", title: "스터디 + 공유", tag: "2~4주", desc: "배운 내용을 SNS·블로그에 공개 정리하세요. 학습 자체가 마케팅이 됩니다." },
                { num: "③", title: "무료 나눔 + 피드백", tag: "4~8주", desc: "베타 그룹 5~10명에게 무료 제공 후 후기·문제·니즈 데이터를 수집합니다." },
                { num: "④", title: "전문가 데뷔", tag: "8~12주", desc: "후기·결과 사례 5개 확보 후 유료 전환. Hook-Story-Sell 적용한 첫 오퍼를 출시합니다." },
              ].map(({ num, title, tag, desc }) => (
                <div key={num} className="ld-eb-timeline-item">
                  <div className="ld-eb-timeline-dot">{num}</div>
                  <div className="ld-eb-timeline-card">
                    <div className="ld-eb-timeline-card-header">
                      <h3 className="ld-eb-timeline-card-h3">{title}</h3>
                      <span className="ld-eb-timeline-tag">{tag}</span>
                    </div>
                    <p className="ld-eb-timeline-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 대형 스탯 */}
            <div className="ld-eb-stat-grid">
              {[
                { label: "콘텐츠 직판", value: "월 800만", note: "10만원 × 80건 기준", accent: false },
                { label: "파트너 수당", value: "월 200~400만", note: "LinkDrop 추천 적립 기준", accent: false },
                { label: "3개월 누적", value: "3천~3,600만", note: "동일 분야 사례 평균", accent: true },
              ].map(({ label, value, note, accent }, idx) => (
                <div key={idx} className={accent ? "ld-eb-stat-cell--accent" : "ld-eb-stat-cell"}>
                  <p className="ld-eb-stat-cell-label">{label}</p>
                  <p className={accent ? "ld-eb-stat-cell-value--accent" : "ld-eb-stat-cell-value"}>{value}</p>
                  <p className="ld-eb-stat-cell-note">{note}</p>
                </div>
              ))}
            </div>
            <p className="ld-eb-disclaimer">
              위 수치는 동일 분야 사례 평균이며, 개인 상황·노력에 따라 달라질 수 있습니다.
            </p>

            {/* 실제 사례 */}
            <div className="ld-glass-card ld-glass-card-md ld-eb-case-card">
              <p className="ld-eb-case-quote">
                &ldquo;글을 못 쓴다고 생각했는데, AI가 초안을 잡아주니 제 경험만 더하면 됐어요.
                첫 달 870만원, 두 번째 달 1,200만원. 지금은 두 번째 오퍼를 준비 중입니다.&rdquo;
              </p>
              <p className="ld-eb-case-attr">
                — 김영희 (52세, 경기 수원, 은퇴 설계 컨설턴트)
              </p>
            </div>

            {/* LinkDrop + CTA */}
            <div className="ld-eb-linkdrop-box">
              <p className="ld-eb-linkdrop-label">LinkDrop 강점</p>
              <p className="ld-eb-linkdrop-text">
                <strong>링크 하나로 수당이 자동 적립됩니다</strong> — 콘텐츠 판매 + 파트너 추천 = 두 가지 수입원이 동시에 작동합니다.
                별도 관리 없이 공유만 해도 수익이 쌓이는 구조입니다.
              </p>
            </div>

            <div className="ld-eb-final-cta">
              <a
                href="https://open.kakao.com/o/linkdrop"
                target="_blank"
                rel="noopener noreferrer"
                className="ld-eb-cta-btn"
              >
                지금 90일 로드맵 시작하기 →
              </a>
              <p className="ld-eb-final-cta-note">
                카카오 상담 · 무료 · 앱 설치 불필요
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
