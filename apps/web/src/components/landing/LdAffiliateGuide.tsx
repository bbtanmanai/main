"use client";
import React from "react";
import "@/styles/pages/landing5.css";
import SuperFlowCover from "@/components/landing/SuperFlowCover";
import LdBonusSection from "@/components/landing/LdBonusSection";
import LdFinalCTASection from "@/components/landing/LdFinalCTASection";

// 🔒 LD-006: 정적 스타일 → landing5.css (ld-af-*). JS 런타임 동적 값만 style={{}} 유지.
// 콤보 색상: ACCENT #2B2D6E (indigo), 커버 배경 white

const STEPS = [
  { href: "#ch1",   num: "1", label: "제휴 마케팅이란?",      sub: "구조·시장 규모" },
  { href: "#ch2",   num: "2", label: "상품 선택의 기술",      sub: "쿠팡파트너스·기타" },
  { href: "#ch3",   num: "3", label: "AI 리뷰 글쓰기",       sub: "초안 자동 생성" },
  { href: "#ch4",   num: "4", label: "트래픽 · 수익 최적화",  sub: "채널 전략·링크 배치" },
  { href: "#proof", num: "5", label: "실제 수익 사례",        sub: "파트너 증언" },
] as const;

export default function LdAffiliateGuide() {
  return (
    <div className="ld-wg-wrap ld-wg-theme-orange">

      {/* ══ 커버 ══ */}
      <div className="ld-wg-cover ld-af-cover-bg" id="top">
        <SuperFlowCover />
        <div aria-hidden="true" className="ld-af-cover-grid" />
        <div className="ld-wg-cover-inner">
          <div className="ld-wg-cover-left">
            <span className="ld-wg-cover-badge">제휴 마케팅·추천 수익</span>
            <h1>
              내가 쓴 물건<br />
              <span>추천 글 하나로</span><br />
              매달 수수료가 쌓입니다
            </h1>
            <p className="ld-wg-cover-sub">
              쿠팡파트너스·애드센스 연동, AI가 리뷰 초안을 작성합니다.<br />
              링크 하나로 수당 자동 적립 — 블로그·SNS 경험 없어도 시작할 수 있어요.
            </p>
            <a
              href="https://open.kakao.com/o/linkdrop"
              target="_blank"
              rel="noopener noreferrer"
              className="ld-af-cta ld-af-cta-btn"
            >
              추천 수익 시작하기 →
            </a>
            <div className="ld-wg-cover-footer">
              ※ 월 평균 43만원 수익 중간값 (쿠팡파트너스+블로그 파트너 기준)
            </div>
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
                {i < STEPS.length - 1 && <div className="ld-wg-stepper-line" aria-hidden="true" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ══ A4 문서 영역 ══ */}
      <div className="ld-wg-doc">

        {/* ── Chapter 1 ── */}
        <div className="ld-wg-section ld-af-ch1-video" id="ch1">
          <div className="ld-af-chat-overlay">
            <div className="ld-af-chat-img">
              <svg
                viewBox="0 0 9 12"
                xmlns="http://www.w3.org/2000/svg"
                className="ld-af-chat-svg"
                aria-label="카카오톡 대화 예시 이미지"
                role="img"
              >
                <defs>
                  <clipPath id="kakao-clip">
                    <rect x="0.08" y="0.08" width="8.84" height="11.84" rx="0.55" ry="0.55" />
                  </clipPath>
                </defs>
                <rect x="0.08" y="0.08" width="8.84" height="11.84" rx="0.55" ry="0.55"
                  fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.08" />
                <image
                  href="https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/landing5/kakao_chat1.webp"
                  x="0" y="0" width="9" height="12"
                  clipPath="url(#kakao-clip)"
                  preserveAspectRatio="xMidYMin slice"
                />
              </svg>
            </div>
          </div>

          <video
            autoPlay loop muted playsInline
            src="https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/landing5/landing5.mp4"
            className="ld-af-ch1-video-elem"
            aria-hidden="true"
          />
          <div className="ld-af-ch1-content">
            <div className="ld-af-ch1-heading">
              {["추천 링크 하나가", "월급이 됩니다"].map((line) => (
                <span key={line} className="ld-af-ch1-title-line">{line}</span>
              ))}
            </div>
            <p className="ld-af-dancing-sub">
              <span className="ld-af-dancing-text">
                Every product you trust, every review you write, every link you share —<br />
                becomes a quiet stream of income that flows while you sleep.<br />
                Affiliate marketing is not about selling. It&apos;s about recommending<br />
                what you already believe in, and letting the numbers do the rest.<br />
                LinkDrop&apos;s AI drafts the content, structures the SEO, and places the links.<br />
                You simply live your life, share what you love, and watch the commissions grow.
              </span>
            </p>
          </div>
        </div>

        {/* ── Chapter 2 ── */}
        <div className="ld-wg-section" id="ch2">
          <div className="ld-af-ch-header">
            <span className="ld-wg-sec-label">Chapter 2</span>
            <h2 className="ld-af-ch-h2">
              어떤 상품을 추천해야 수수료가 쌓일까요?
            </h2>
          </div>
          <p className="ld-af-card-p ld-af-lead">
            제휴 마케팅의 성패는 상품 선택에서 90%가 결정됩니다.
            링크드랍은 <strong className="ld-af-accent-text">수수료율 · 전환율 · 재구매율</strong> 세 가지 지표를 기준으로 최적 상품군을 제안합니다.
          </p>
          <div className="ld-af-grid-2x2">
            <div className="ld-glass-card ld-glass-card-md ld-af-card">
              <div className="ld-af-card-header">
                <span className="ld-af-badge">입문 추천</span>
                <span className="ld-af-card-h3">쿠팡파트너스</span>
              </div>
              <p className="ld-af-card-p">국내 최대 이커머스. 수수료 2~8%. 생필품·가전·식품은 전환율이 높아 초보자에게 적합합니다.</p>
            </div>
            <div className="ld-glass-card ld-glass-card-md ld-af-card">
              <div className="ld-af-card-header">
                <span className="ld-af-badge">고수익</span>
                <span className="ld-af-card-h3">디지털 제품·강의</span>
              </div>
              <p className="ld-af-card-p">수수료 20~50%. 한 번 작성한 리뷰가 6~12개월 이상 수익을 만듭니다. 고수익 구조의 핵심.</p>
            </div>
            <div className="ld-glass-card ld-glass-card-md ld-af-card">
              <div className="ld-af-card-header">
                <span className="ld-af-badge">복리 구조</span>
                <span className="ld-af-card-h3">서비스 SaaS</span>
              </div>
              <p className="ld-af-card-p">구독형 수수료(Recurring). 추천인이 서비스를 쓰는 동안 매달 수수료 적립. 복리 구조입니다.</p>
            </div>
            <div className="ld-glass-card ld-af-card">
              <p className="ld-af-term-label">용어 해설</p>
              <p className="ld-af-term-text">
                <strong>전환율(CVR)</strong>: 링크 클릭 후 실제 구매로 이어진 비율. 쿠팡 평균 3~7%, 디지털 제품 10~25%.<br />
                <strong>Recurring 수수료</strong>: 추천한 회원이 유지되는 동안 매월 반복 지급되는 수수료 구조.
              </p>
            </div>
          </div>
        </div>

        {/* ── Chapter 3 ── */}
        <div className="ld-wg-section" id="ch3">
          <div className="ld-wg-chapter-banner">
            <img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1600&q=80" alt="AI 글쓰기 이미지" loading="lazy" />
            <span className="ld-wg-banner-cap">AI 리뷰 초안 생성 — 추후 실제 링크드랍 UI 스크린샷으로 교체 예정</span>
          </div>
          <div className="ld-af-ch-header">
            <span className="ld-wg-sec-label">Chapter 3</span>
            <h2 className="ld-af-ch-h2">
              글쓰기 경험 없어도 AI가 리뷰 초안을 만들어드립니다
            </h2>
          </div>
          <div className="ld-af-info-card">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ld-af-info-icon">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" /><path d="M12 8v4l3 3" />
            </svg>
            <p className="ld-af-info-card-text">
              <strong className="ld-af-accent-text">&ldquo;AI가 초안을 만들고 당신이 완성&rdquo;</strong>{" "}
              — 링크드랍의 핵심 가치입니다. 상품명만 입력하면 SEO에 최적화된 리뷰 글 초안이 30초 안에 완성됩니다. 코딩·글쓰기 경험 없어도 3주면 첫 수익이 납니다.
            </p>
          </div>
          <div className="ld-wg-section-inner">
            <div>
              <p className="ld-af-pipe-label">AI 리뷰 작성 3단계 파이프라인</p>
              {[
                { step: "01", title: "상품 키워드 입력", desc: "리뷰할 상품명·카테고리를 입력합니다. 쿠팡 링크를 붙여넣으면 자동으로 정보를 가져옵니다." },
                { step: "02", title: "AI 초안 자동 생성", desc: "SEO 제목 3종 · 본문 1,200자 · 장단점 요약 · 구매 추천 멘트까지 한 번에 완성됩니다." },
                { step: "03", title: "개인 경험 추가 후 발행", desc: "AI 초안에 본인의 한 줄 경험을 더하면 신뢰도가 올라갑니다. 블로그·카페에 바로 발행하세요." },
              ].map((item) => (
                <div key={item.step} className="ld-af-pipe-step">
                  <span className="ld-af-pipe-num" aria-hidden="true">{item.step}</span>
                  <div>
                    <p className="ld-af-pipe-title">{item.title}</p>
                    <p className="ld-af-card-p ld-af-opt-card-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="ld-af-term-box">
                <p className="ld-af-term-label">용어 해설</p>
                <p className="ld-af-term-text">
                  <strong>SEO(Search Engine Optimization)</strong>: 네이버·구글 검색에서 내 글이 앞에 노출되도록 최적화하는 작업. 링크드랍 AI가 키워드 배치까지 자동으로 처리합니다.<br />
                  <strong>롱테일 키워드</strong>: "쿠팡 에어프라이어 추천"처럼 구체적인 검색어. 경쟁이 적고 구매 의도가 높아 전환율이 3배 이상 높습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Chapter 4 ── */}
        <div className="ld-wg-section" id="ch4">
          <div className="ld-wg-chapter-banner">
            <img src="https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=1600&q=80" alt="트래픽·수익 최적화 이미지" loading="lazy" />
            <span className="ld-wg-banner-cap">트래픽 채널 다각화 · 링크 배치 최적화 — 추후 실제 데이터 이미지로 교체 예정</span>
          </div>
          <div className="ld-af-ch-header-sm">
            <span className="ld-wg-sec-label">Chapter 4</span>
            <h2 className="ld-af-ch-h2">
              트래픽을 만들고 수익으로 연결합니다
            </h2>
          </div>
          <p className="ld-af-card-p ld-af-lead-sm">
            트래픽 없이는 클릭도 없고 수수료도 없습니다. 링크드랍은
            <strong className="ld-af-accent-text"> SEO · SNS · 네이버 카페</strong> 세 채널을 동시에 공략하고, 링크 배치 최적화로 전환율까지 높입니다.
          </p>
          <div className="ld-af-channel-grid">
            {[
              { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>, title: "SEO 블로그", desc: "네이버 블로그·티스토리 최적화. AI가 제목·본문·태그를 자동 생성합니다.", timeline: "3~6개월 후 안정 수익" },
              { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 2H3v16h5v4l4-4h9V2z"/></svg>, title: "카카오·네이버 카페", desc: "50~60대 활성 커뮤니티. 신뢰도 높은 리뷰가 바이럴 효과를 냅니다.", timeline: "1~4주 내 빠른 클릭" },
              { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>, title: "인스타·유튜브 쇼츠", desc: "짧은 영상 + 링크 설명. AI가 영상 스크립트까지 작성해드립니다.", timeline: "콘텐츠 당 즉시 유입" },
            ].map((ch) => (
              <div key={ch.title} className="ld-glass-card ld-glass-card-md ld-af-card ld-af-card-flex-col">
                <div className="ld-af-card-flex-row">{ch.icon}<h3 className="ld-af-card-h3">{ch.title}</h3></div>
                <p className="ld-af-card-p">{ch.desc}</p>
                <p className="ld-af-opt-badge ld-af-opt-badge-self">{ch.timeline}</p>
              </div>
            ))}
          </div>
          <div className="ld-af-divider">
            <p className="ld-af-divider-p">링크 배치 최적화 — 클릭률을 2배로 높이는 방법</p>
          </div>
          <div className="ld-af-grid-2x2">
            {[
              { title: "본문 상단 배치", desc: "읽기 시작 직후 구매 의도가 가장 높습니다. 첫 두 단락 안에 링크를 삽입하세요.", rate: "+34% CTR" },
              { title: "비교표 활용", desc: "경쟁 상품과 나란히 비교하면 클릭률이 크게 높아집니다. AI가 표 형식으로 자동 생성합니다.", rate: "+51% CTR" },
              { title: "CTA 버튼 추가", desc: "'지금 쿠팡에서 확인하기' 버튼을 이미지 아래에 삽입하면 전환율이 올라갑니다.", rate: "+28% CVR" },
              { title: "모바일 최적화", desc: "국내 쇼핑 클릭의 78%는 모바일에서 발생합니다. 링크드랍 AI 글은 모바일 레이아웃에 최적화됩니다.", rate: "78% 모바일" },
            ].map((item) => (
              <div key={item.title} className="ld-glass-card ld-glass-card-md ld-af-card ld-af-opt-card-inner">
                <span className="ld-af-rate-badge">{item.rate}</span>
                <div>
                  <p className="ld-af-card-h3 ld-af-opt-card-title">{item.title}</p>
                  <p className="ld-af-card-p ld-af-opt-card-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="ld-af-partner-box">
            <p className="ld-af-partner-title">링크드랍 파트너 수당 체계</p>
            <p className="ld-af-card-p ld-af-partner-desc">링크 하나로 수당 자동 적립 — 내가 소개한 파트너가 수익을 올리면 나에게도 추천 수당이 지급됩니다. 제휴 수익 + 파트너 수당 이중 구조로 수익이 복리처럼 불어납니다.</p>
          </div>
        </div>

        {/* ── Chapter 5 — 실제 수익 사례 ── */}
        <div className="ld-wg-section" id="proof">
          <div className="ld-af-ch-header-sm">
            <span className="ld-wg-sec-label">Chapter 5</span>
            <h2 className="ld-af-ch-h2">
              &quot;링크 올린 지 2개월 만에 월 58만원 들어왔어요&quot;
            </h2>
          </div>
          <div className="ld-af-testimonial-grid">
            {[
              { name: "김영희 (58세, 경기 수원)", role: "쿠팡파트너스 블로거", quote: "처음엔 링크만 올리면 되는 줄 알았는데 클릭이 없었어요. 링크드랍 AI로 리뷰 글을 고쳐 쓰고 나서 한 달 만에 27만원이 들어왔어요.", income: "월 27만원" },
              { name: "박민준 (62세, 서울 강서)", role: "디지털 제품 추천 블로거", quote: "AI 강의 플랫폼 추천 글 하나가 지금도 매달 클릭이 옵니다. 작년에 쓴 글인데 아직도 돈이 들어오는 게 신기해요.", income: "월 43만원" },
              { name: "이순자 (55세, 부산 해운대)", role: "주방·생활용품 리뷰어", quote: "요리하면서 쓰는 제품 솔직하게 쓰니까 이웃분들이 많이 사더라고요. 카카오 상담 한 번에 시작했어요.", income: "월 61만원" },
            ].map((t) => (
              <div key={t.name} className="ld-glass-card ld-glass-card-md ld-af-card">
                <p className="ld-af-testimonial-quote">&quot;{t.quote}&quot;</p>
                <div className="ld-af-testimonial-footer">
                  <div>
                    <p className="ld-af-testimonial-name">{t.name}</p>
                    <p className="ld-af-testimonial-role">{t.role}</p>
                  </div>
                  <span className="ld-af-testimonial-income">{t.income}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="ld-af-stats-grid">
            {[
              { val: "43만원", label: "파트너 수익 중간값" },
              { val: "3주", label: "첫 수익까지 걸리는 시간" },
              { val: "2.4배", label: "AI 리뷰 사용 후 CTR 증가" },
              { val: "97%", label: "시니어 파트너 만족도" },
            ].map((s) => (
              <div key={s.label}>
                <p className="ld-af-stat-val">{s.val}</p>
                <p className="ld-af-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <LdBonusSection />
      <LdFinalCTASection />
    </div>
  );
}
