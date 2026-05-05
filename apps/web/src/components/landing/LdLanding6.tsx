import React from "react";
import "@/styles/pages/landing6.css";
import externalLinks from "@/data/external-links.json";
import SuperFlowCover from "@/components/landing/SuperFlowCover";

// ────────────────────────────────────────────────────────────
// LdLanding6 — landing6 전용 (구 LdVibecodingGuide)
// 주제: 바이브코딩으로 웹사이트·웹앱 만들기
// 🔒 LD-006: 정적 스타일 → landing6.css (ld-vc-*). JS 런타임 동적 값만 style={{}} 유지.
// ACCENT #5B21B6 (violet-800) — BG_COLOR #0C0C1E (ch1 전용)
// ────────────────────────────────────────────────────────────

const STEPS = [
  { href: "#ch1", num: "1", label: "코딩 없이 웹앱을",    sub: "바이브코딩이 바꾼 개발의 문턱"     },
  { href: "#ch2", num: "2", label: "바이브코딩이란?",     sub: "아이디어만 있으면 됩니다"          },
  { href: "#ch3", num: "3", label: "첫 웹앱 완성 4단계",  sub: "3주 안에 실제 서비스 오픈"         },
  { href: "#ch4", num: "4", label: "수익 연결 3가지",     sub: "프리랜서·창업·파트너 수당"         },
] as const;

// ── 챕터 이미지 (fullBleed → CSS 클래스로 분기) ─────────────
function ChapterImage({ src, alt, caption, fullBleed }: {
  src: string; alt: string; caption: string; fullBleed?: boolean;
}) {
  return (
    <div className={fullBleed ? "ld-vc-chapter-img ld-vc-chapter-img--full-bleed" : "ld-vc-chapter-img ld-vc-chapter-img--card"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="ld-vc-chapter-img-elem" />
      <div className="ld-vc-chapter-img-caption">{caption}</div>
    </div>
  );
}

// ── 수익 시나리오 행 (accent prop → CSS modifier class) ─────
function IncomeRow({ label, desc, amount, accent }: {
  label: string; desc: string; amount: string; accent?: boolean;
}) {
  return (
    <div className={`ld-vc-income-row${accent ? " ld-vc-income-row--accent" : " ld-vc-income-row--default"}`}>
      <div>
        <div className="ld-vc-income-label">{label}</div>
        <div className="ld-vc-income-desc">{desc}</div>
      </div>
      <div className={`ld-vc-income-amount${accent ? " ld-vc-income-amount--accent" : ""}`}>
        {amount}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function LdLanding6() {
  return (
    <div className="ld-wg-wrap">

      {/* ══ 커버 ══ */}
      <div className="ld-wg-cover ld-vc-cover-bg" id="top">
        <SuperFlowCover />
        <div aria-hidden="true" className="ld-vc-cover-grid" />
        <div className="ld-wg-cover-inner">
          <div className="ld-wg-cover-left">
            <div className="ld-wg-cover-badge">바이브코딩 · AI 웹앱 개발</div>
            <h1>
              코딩 몰라도<br />
              <span>웹앱을 만들고</span><br />
              수익을 냅니다
            </h1>
            <p className="ld-wg-cover-sub">
              아이디어를 말하면 AI가 코드를 씁니다.<br />
              기획부터 배포까지 평균 3주. 프리랜서·창업·파트너 수당까지.<br />
              코딩 경험 없어도 지금 바로 시작할 수 있습니다.
            </p>
            <a
              href={externalLinks.kakao}
              target="_blank"
              rel="noopener noreferrer"
              className="ld-vc-cover-cta"
            >
              카카오로 무료 상담받기 →
            </a>
            <p className="ld-wg-cover-footer">
              무료 상담 · 아이디어 구체화 · 첫 웹앱 완성 · 수익 연결 전담
            </p>
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

      {/* ══ A4 문서 영역 ══ */}
      <div className="ld-wg-doc ld-vc-doc">

        {/* ── Chapter 1 ── */}
        <div className="ld-wg-section ld-vc-ch1-video" id="ch1">
          <video
            autoPlay loop muted playsInline aria-hidden="true"
            className="ld-vc-ch1-video-elem"
            src="https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/landing6/landing6.mp4"
          />
          <div aria-hidden="true" className="ld-vc-ch1-code-grid" />
          <div aria-hidden="true" className="ld-vc-ch1-glow" />

          <div className="ld-vc-ch1-content">
            <div className="ld-vc-ch1-titles">
              {["당신의 아이디어로", "잠자는 시간에도", "돈이 벌리는", "구조를 만들어보세요"].map((line) => (
                <span key={line} className="ld-vc-ch1-title-line">{line}</span>
              ))}
            </div>
            <p className="ld-vc-ch1-dancing-wrap">
              <span className="ld-vc-ch1-dancing">
                You don&apos;t need to speak code. You need to speak ideas.<br />
                The best builders of tomorrow aren&apos;t the ones<br />
                who type the fastest —<br />
                they&apos;re the ones who imagine the clearest.
              </span>
            </p>
          </div>
        </div>

        {/* ── Chapter 2 ── */}
        <div className="ld-wg-section" id="ch2">
          <div className="ld-vc-spacer-32" />
          <div className="ld-wg-sec-label">Chapter 2</div>
          <h2>바이브코딩이란 무엇인가</h2>
          <p className="ld-wg-lead">
            바이브코딩(Vibe Coding)은 <strong>AI와 대화하며 소프트웨어를 만드는 새로운 개발 방식</strong>입니다.<br />
            &ldquo;로그인 버튼을 만들어줘&rdquo; &ldquo;이 데이터를 표로 보여줘&rdquo; — 말 그대로 이렇게 하면 됩니다.<br />
            코딩 경험이 없어도 3주 안에 실제 서비스를 오픈한 사례가 이미 수백 건입니다.
          </p>

          <div className="ld-vc-flex-col-24">
            <div className="ld-glass-card ld-vc-card">
              <div className="ld-vc-card-icon">💬</div>
              <h3 className="ld-vc-card-h3">AI에게 말로 시키면 코드가 나옵니다</h3>
              <p className="ld-vc-card-p">
                기존 개발자는 파이썬·자바스크립트 등 프로그래밍 언어를 직접 작성합니다.<br /><br />
                바이브코딩은 다릅니다. Claude, ChatGPT, Cursor 같은 AI 도구에게 <strong>원하는 기능을 한국어로 설명</strong>하면
                AI가 코드를 작성해줍니다. 당신은 결과물을 보고 &ldquo;좀 더 크게 해줘&rdquo; &ldquo;버튼 색을 파란색으로 바꿔줘&rdquo;라고
                말하기만 하면 됩니다.
              </p>
              <div className="ld-vc-concept-grid">
                {[
                  { emoji: "💬", name: "프롬프트", tag: "당신이 하는 것", desc: "원하는 기능을 한국어로 설명합니다. '예약 시스템 만들어줘', '결제 버튼 추가해줘' 수준으로 충분합니다.", accent: true },
                  { emoji: "🤖", name: "AI 코딩", tag: "AI가 하는 것",   desc: "Claude·ChatGPT·Cursor가 코드를 자동으로 작성합니다. 오류가 나면 AI가 스스로 수정합니다.", accent: false },
                  { emoji: "🚀", name: "배포",     tag: "3분이면 완성",   desc: "Vercel·Netlify 같은 무료 서비스에 버튼 하나로 올립니다. 도메인 연결까지 자동으로 처리됩니다.", accent: false },
                ].map((item) => (
                  <div
                    key={item.name}
                    className={`ld-vc-concept-card${item.accent ? " ld-vc-concept-card--accent" : ""}`}
                  >
                    <div className="ld-vc-card-icon-sm">{item.emoji}</div>
                    <div className="ld-vc-concept-name">{item.name}</div>
                    <div className={`ld-vc-concept-tag${item.accent ? " ld-vc-concept-tag--accent" : ""}`}>{item.tag}</div>
                    <p className="ld-vc-card-p ld-vc-card-p-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="ld-glass-card ld-vc-card">
              <div className="ld-vc-card-icon">🛠️</div>
              <h3 className="ld-vc-card-h3">바이브코딩에 쓰는 도구 3가지</h3>
              <p className="ld-vc-card-p">도구 설치나 계정 생성은 처음 30분이면 됩니다. 이후는 대화만 하면 됩니다.</p>
              <div className="ld-vc-tools-grid">
                {[
                  { name: "Cursor",   desc: "AI가 내장된 코드 편집기. 코드를 모르는 사람도 직접 보고 수정 요청 가능. 월 $20 / 무료 플랜 있음.", tag: "코드 편집" },
                  { name: "Claude",   desc: "Anthropic의 AI. 복잡한 기능 구현·로직 설계에 강합니다. 최신 소나넷 모델 사용 권장.", tag: "AI 브레인" },
                  { name: "Vercel",   desc: "무료 배포 플랫폼. 깃허브와 연결하면 코드 변경 즉시 자동 배포됩니다. 도메인 연결 포함.", tag: "배포" },
                  { name: "Bolt.new", desc: "브라우저에서 바로 웹앱을 만들고 배포하는 서비스. 설치 없이 즉시 시작 가능.", tag: "올인원" },
                ].map((tool) => (
                  <div key={tool.name} className="ld-vc-tool-row">
                    <div className="ld-vc-tool-tag">{tool.tag}</div>
                    <div>
                      <div className="ld-vc-tool-name">{tool.name}</div>
                      <div className="ld-vc-tool-desc">{tool.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ld-vc-term-section">
            <p className="ld-vc-term-section-title">
              📖 바이브코딩 용어 해설
            </p>
            <div className="ld-vc-term-grid">
              {[
                { term: "바이브코딩",    def: "AI와 대화하며 소프트웨어를 만드는 개발 방식. 코딩 지식 없이도 가능" },
                { term: "프롬프트",      def: "AI에게 주는 지시문. '로그인 버튼 만들어줘' 같은 자연어 문장" },
                { term: "배포(Deploy)", def: "만든 앱을 인터넷에 올려서 다른 사람이 접속할 수 있게 하는 것" },
                { term: "컴포넌트",     def: "버튼·카드·메뉴 같은 재사용 가능한 화면 조각" },
                { term: "API",          def: "앱 간 데이터 주고받기 창구. '카카오 로그인' 같은 기능이 API로 연결됨" },
                { term: "풀스택",       def: "화면(프론트)과 서버(백엔드)를 모두 다루는 것. AI와 함께하면 1인도 가능" },
              ].map(({ term, def }) => (
                <div key={term} className="ld-vc-term-item">
                  <p className="ld-vc-term-title">{term}</p>
                  <p className="ld-vc-term-text">{def}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chapter 3 ── */}
        <div className="ld-wg-section" id="ch3">
          <ChapterImage
            src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80"
            alt="노트북 앞에서 개발 중인 모습"
            caption="아이디어 → 기획 → AI 코딩 → 배포까지 평균 3주 · 추후 실제 수강생 화면으로 교체 예정"
            fullBleed
          />

          <div className="ld-wg-sec-label">Chapter 3</div>
          <h2>첫 웹앱 완성까지 4단계</h2>
          <p className="ld-wg-lead">
            &ldquo;뭘 만들어야 할지 모르겠어요&rdquo; — 가장 많은 분이 하시는 말씀입니다.<br />
            링크드랍이 아이디어 발굴부터 배포까지 전 과정을 함께합니다. 평균 <strong>3주면 첫 서비스가 오픈</strong>됩니다.
          </p>

          <div className="ld-vc-flex-col-24">
            <div className="ld-glass-card ld-vc-card">
              <div className="ld-vc-card-icon">🗺️</div>
              <h3 className="ld-vc-card-h3">4단계 로드맵 — 아이디어에서 서비스까지</h3>
              <div className="ld-vc-flex-col-16-mt8">
                {[
                  { step: "1단계", title: "아이디어 정리 (1~3일)", desc: "해결하고 싶은 불편함 또는 팔고 싶은 서비스를 구체화합니다. 링크드랍 매니저가 비즈니스 모델·타깃 사용자·핵심 기능 3가지를 함께 정리해드립니다." },
                  { step: "2단계", title: "AI와 함께 만들기 (1~2주)", desc: "Cursor + Claude로 기능을 하나씩 만들어갑니다. 로그인·폼·결제·대시보드를 대화만으로 구현합니다. 막히는 부분은 링크드랍 매니저가 프롬프트를 대신 작성해드립니다." },
                  { step: "3단계", title: "테스트·피드백 (3~5일)", desc: "지인 5~10명에게 베타 테스트를 진행합니다. 피드백을 받아 AI와 함께 즉시 수정합니다. 이 과정에서 실제 사용자 니즈가 드러납니다." },
                  { step: "4단계", title: "배포·공개 (1일)", desc: "Vercel에 버튼 하나로 배포합니다. 도메인을 연결하고 SNS에 공개합니다. 첫 방문자가 들어오는 순간부터 서비스 운영이 시작됩니다." },
                ].map((item) => (
                  <div key={item.step} className="ld-vc-step-item">
                    <div className="ld-vc-step-badge">{item.step}</div>
                    <div>
                      <div className="ld-vc-step-title">{item.title}</div>
                      <div className="ld-vc-step-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ld-vc-term-box">
                <p className="ld-vc-term-box-title">💡 코딩 경험 없어도 시작할 수 있습니다</p>
                <p className="ld-vc-term-box-text">
                  수강생 중 70%가 코딩을 전혀 모르는 상태에서 시작했습니다. AI가 코드를 쓰기 때문에 당신은 &ldquo;무엇을 만들지&rdquo;만 결정하면 됩니다. 개발자가 아닌 기획자·사장님의 시선이 오히려 유리합니다.
                </p>
              </div>
            </div>

            <div className="ld-glass-card ld-vc-card">
              <div className="ld-vc-card-icon">🎯</div>
              <h3 className="ld-vc-card-h3">실제로 만든 것들 — 수강생 실제 사례</h3>
              <div className="ld-vc-examples-grid">
                {[
                  { title: "예약 관리 앱",    desc: "미용실·학원·개인 레슨 예약을 온라인으로. 카카오 알림 연동." },
                  { title: "PDF 판매 페이지", desc: "전자책·강의 자료를 결제 후 다운로드. 토스페이먼츠 연동." },
                  { title: "포트폴리오 사이트", desc: "디자이너·사진작가·강사를 위한 작품 전시 + 문의 폼." },
                  { title: "커뮤니티 플랫폼",  desc: "유료 멤버십 게시판. 결제 후 가입, 댓글·파일 업로드." },
                  { title: "간단한 SaaS",     desc: "특정 문제를 해결하는 도구. 월 구독료로 수익화." },
                  { title: "로컬 비즈니스 사이트", desc: "소상공인 홈페이지 + 메뉴판 + 예약 + 리뷰 관리." },
                ].map((item) => (
                  <div key={item.title} className="ld-vc-example-card">
                    <div className="ld-vc-example-title">{item.title}</div>
                    <div className="ld-vc-example-desc">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Chapter 4 ── */}
        <div className="ld-wg-section" id="ch4">
          <ChapterImage
            src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80"
            alt="노트북과 수익 그래프"
            caption="바이브코딩으로 만든 서비스 → 프리랜서·SaaS·파트너 수당 3가지 수익 루트 · 추후 실제 수익 화면으로 교체 예정"
            fullBleed
          />

          <div className="ld-wg-sec-label">Chapter 4</div>
          <h2>웹앱 하나로 3가지 수익이 생깁니다</h2>
          <p className="ld-wg-lead">
            웹앱을 만드는 능력은 그 자체로 수익이 됩니다. 만든 결과물을 팔거나, 만드는 서비스를 팔거나,
            링크드랍 파트너로 수당을 받거나 — <strong>최소 1가지에서 3가지 모두</strong> 가능합니다.
          </p>

          <div className="ld-vc-flex-col-24">
            <div className="ld-glass-card ld-vc-card">
              <div className="ld-vc-card-icon">💼</div>
              <h3 className="ld-vc-card-h3">① 프리랜서 수익 — 소상공인 사이트 만들어주기</h3>
              <p className="ld-vc-card-p">
                동네 식당·미용실·학원은 홈페이지가 없거나 오래되었습니다. 바이브코딩으로 하루 이틀이면 충분한 수준의 사이트를 만들 수 있습니다.<br /><br />
                <strong>건당 단가 예시</strong><br />
                기본 소개 사이트: 30~70만원<br />
                예약 시스템 포함: 70~150만원<br />
                결제·멤버십 포함: 150~300만원<br /><br />
                처음 3건은 지인·주변 가게에 절반 금액으로 진행하며 포트폴리오를 쌓습니다. 이후 크몽·숨고·탈잉에 등록하면 외부 고객이 들어옵니다.
              </p>
              <div className="ld-vc-term-box">
                <p className="ld-vc-term-box-title">💡 AI가 도와주기 때문에 속도가 전혀 다릅니다</p>
                <p className="ld-vc-term-box-text">
                  기존 개발자가 2~3주 걸리는 작업을 바이브코딩으로는 3~5일에 완성합니다. 단가는 낮춰도 수익률이 높습니다.
                </p>
              </div>
            </div>

            <div className="ld-glass-card ld-vc-card">
              <div className="ld-vc-card-icon">🚀</div>
              <h3 className="ld-vc-card-h3">② 내 서비스 창업 — SaaS·구독 수익</h3>
              <p className="ld-vc-card-p">
                특정 문제를 해결하는 작은 서비스를 만들고 월 구독료를 받는 방식입니다.<br /><br />
                <strong>실제 아이디어 예시</strong><br />
                - 소상공인 리뷰 자동 답변 서비스 (월 2만원)<br />
                - 강사용 수강생 관리 대시보드 (월 1만원)<br />
                - AI 카피라이팅 도구 (월 3만원)<br /><br />
                100명 구독자만 모여도 월 100~300만원. 서비스가 돌아가는 동안 자동으로 수익이 발생합니다.
              </p>
            </div>

            <div className="ld-glass-card ld-vc-card">
              <div className="ld-vc-card-icon">🤝</div>
              <h3 className="ld-vc-card-h3">③ 링크드랍 파트너 수당 — 추가 수입</h3>
              <p className="ld-vc-card-p">
                링크드랍 파트너가 되면 바이브코딩 수강 문의를 소개할 때마다 <strong>추천 수당</strong>이 자동으로 쌓입니다.<br /><br />
                고객에게 포트폴리오 사이트를 만들어주면서 &ldquo;이 도구로 배우면 직접 관리도 하실 수 있어요&rdquo;라고 소개하기만 해도 됩니다. 일 잘할수록 파트너 네트워크가 자연스럽게 넓어집니다.
              </p>
            </div>
          </div>

          <div className="ld-vc-income-section">
            <h3 className="ld-vc-income-h3">
              💰 월 수익 시나리오 — 현실적인 수치
            </h3>
            <IncomeRow label="프리랜서 — 소개 사이트 2건/월" desc="건당 50만원, 지인·소상공인 초기 고객" amount="월 100만원" />
            <IncomeRow label="SaaS 구독 — 구독자 50명" desc="월 1만원 구독료, 특정 문제 해결 서비스" amount="월 50만원" />
            <IncomeRow label="파트너 수당" desc="수강생·고객 추천 링크 자동 적립" amount="월 20~50만원+" />
            <IncomeRow label="합산 (프리랜서 2건 + 수당)" desc="소규모로 시작하는 현실적 첫 달 목표" amount="월 120만원" accent />
            <IncomeRow label="합산 (프리랜서 3건 + SaaS + 수당)" desc="3~6개월 후 안정 궤도" amount="월 220만원+" accent />
          </div>

          <div className="ld-vc-testimonial">
            <div className="ld-vc-testimonial-body">
              <div className="ld-vc-testimonial-emoji">💻</div>
              <div>
                <p className="ld-vc-testimonial-quote">
                  &ldquo;퇴직 후에 뭔가 배워야 한다는 생각은 했는데, 코딩은 너무 어려울 것 같아서 미뤘어요.
                  링크드랍에서 시작해보니까 AI한테 말하면 되더라고요. 4주 만에 동네 치과 예약 시스템을 만들었고
                  지금은 소상공인 사이트 전문으로 한 달에 180만원 벌고 있어요. 60대에 이런 게 가능한지 저도 몰랐습니다.&rdquo;
                </p>
                <p className="ld-vc-testimonial-name">
                  — 이상철 (62세, 경기 성남) · 바이브코딩 프리랜서 · 소상공인 사이트 전문
                </p>
              </div>
            </div>
          </div>

          <div className="ld-vc-timeline-section">
            <h3 className="ld-vc-timeline-h3">
              📅 시작부터 월 100만원까지 전체 로드맵
            </h3>
            <div className="ld-wg-timeline">
              {[
                { num: "1", sub: "상담 신청 (0주차)",       desc: "링크드랍 무료 상담 → 만들고 싶은 서비스 아이디어·수익 목표·도구 설정을 함께 정합니다." },
                { num: "2", sub: "도구 셋업 (1주차)",       desc: "Cursor 설치·Claude 계정·Vercel 가입. 30분이면 완료. 첫 'Hello World' 페이지를 배포합니다." },
                { num: "3", sub: "첫 프로젝트 (2~3주차)",   desc: "실제 서비스를 하나 만듭니다. 막히는 부분은 링크드랍 매니저에게 바로 물어볼 수 있습니다." },
                { num: "4", sub: "포트폴리오 완성 (4주차)", desc: "만든 프로젝트를 정리해서 크몽·숨고에 올립니다. 지인 3곳에 반값으로 제안해 첫 계약을 따냅니다." },
                { num: "5", sub: "첫 수익 (1~2개월)",       desc: "첫 프리랜서 의뢰 또는 SaaS 첫 구독자. 파트너 수당 추가. 결과물이 생기면 단가가 오릅니다." },
                { num: "6", sub: "월 100만원+ (3~6개월)",   desc: "월 3~5건 의뢰 또는 SaaS 50명+ 구독자. 파트너 수당 포함 월 100만원 이상 가능합니다." },
              ].map((g) => (
                <div key={g.num} className="ld-wg-tl-item">
                  <div className="ld-wg-tl-dot ld-vc-tl-dot" />
                  <div>
                    <div className="ld-wg-tl-label">Step {g.num}</div>
                    <div className="ld-wg-tl-text">
                      <strong>{g.sub}</strong>: {g.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ 하단 CTA ══ */}
        <div className="ld-vc-bottom-cta">
          <p className="ld-vc-bottom-eyebrow">지금 바로 시작하세요</p>
          <h2 className="ld-vc-bottom-h2">
            아이디어만 있으면<br />웹앱을 만들 수 있습니다
          </h2>
          <p className="ld-vc-bottom-sub">
            코딩 몰라도 됩니다. 복잡한 신청 없이<br />
            카카오톡 채팅 하나로 시작하세요.
          </p>
          <a
            href={externalLinks.kakao}
            target="_blank"
            rel="noopener noreferrer"
            className="ld-wg-topic-btn ld-vc-topic-btn"
          >
            💬 지금 무료 상담 신청하기
            <span className="ld-vc-arrow">→</span>
          </a>
          <p className="ld-vc-bottom-note">
            상담 후 진행 여부 결정 · 무료 · 부담 없음
          </p>
        </div>

      </div>
    </div>
  );
}
