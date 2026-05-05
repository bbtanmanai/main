import React from "react";
import "@/styles/pages/landing4.css";
import externalLinks from "@/data/external-links.json";

// ────────────────────────────────────────────────────────────
// LdAiClassGuide — landing4 전용
// 주제: 스마트폰 영상 제작 클래스 운영 (50대+ 타깃)
// 🔒 LD-006: 정적 스타일 → landing4.css (ld-ac-*). JS 런타임 동적 값만 style={{}} 유지.
// ────────────────────────────────────────────────────────────

const COVER_VIDEO =
  "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/landing4/landing4_top.mp4";

const STEPS = [
  { href: "#ch1", num: "1", label: "왜 지금 영상인가",   sub: "50대가 오히려 유리한 진짜 이유"    },
  { href: "#ch2", num: "2", label: "AI 이미지 자동 생성", sub: "화풍 3종 · 화당 50장 자동 제작"   },
  { href: "#ch3", num: "3", label: "AI 음성 + 영상 완성", sub: "TTS · 렌더링 · 유튜브 자동 업로드" },
  { href: "#ch4", num: "4", label: "3중 수익 구조",       sub: "광고 · 강의료 · 파트너 수당"      },
] as const;

// ── 이미지 블록 ────────────────────────────────────────────
function ChapterImage({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <div className="ld-ac-chapter-img">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
      <div className="ld-ac-chapter-img-caption">{caption}</div>
    </div>
  );
}

// ── 수익 시나리오 행 (accent prop → CSS modifier class) ───
function IncomeRow({ label, desc, amount, accent }: {
  label: string; desc: string; amount: string; accent?: boolean;
}) {
  return (
    <div className={`ld-ac-income-row${accent ? " ld-ac-income-row--accent" : " ld-ac-income-row--default"}`}>
      <div>
        <div className="ld-ac-income-label">{label}</div>
        <div className="ld-ac-income-desc">{desc}</div>
      </div>
      <div className={`ld-ac-income-amount${accent ? " ld-ac-income-amount--accent" : ""}`}>
        {amount}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function LdAiClassGuide() {
  return (
    <div className="ld-wg-wrap">

      {/* ══ 커버 ══ */}
      <div className="ld-wg-cover" id="top">
        <video
          autoPlay loop muted playsInline
          src={COVER_VIDEO}
          className="ld-ac-cover-video"
          aria-hidden="true"
        />
        <div aria-hidden="true" className="ld-ac-cover-overlay" />

        <div className="ld-wg-cover-inner">
          <div className="ld-wg-cover-left">
            <div className="ld-wg-cover-badge">영상 제작 클래스 · 50대+</div>
            <h1>
              내 이야기가<br />
              <span>영상이 되고</span><br />
              수익이 됩니다
            </h1>
            <p className="ld-wg-cover-sub">
              살면서 쌓아온 경험이 가장 강력한 콘텐츠입니다.<br />
              스마트폰 한 대로 찍고, AI가 편집하고,<br />
              채널 개설부터 수강생 모집까지 전담 지원합니다.
            </p>
            <a
              href={externalLinks.kakao}
              target="_blank"
              rel="noopener noreferrer"
              className="ld-ac-cover-cta"
            >
              카카오로 무료 상담받기 →
            </a>
            <p className="ld-wg-cover-footer">
              무료 상담 · 촬영 셋업 · AI 편집 · 채널 개설 · 수강생 모집 전담
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
      <div className="ld-wg-doc ld-ac-doc">

        {/* ── Chapter 1 ── */}
        <div className="ld-wg-section ld-ac-ch1-video" id="ch1">
          <video
            autoPlay loop muted playsInline
            src="https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/landing4/landing4.mp4"
            className="ld-ac-ch1-video-elem"
            aria-hidden="true"
          />
          <div className="ld-ac-ch1-content">
            <div className="ld-ac-ch1-titles">
              {["지금 영상을", "배워야 하는 이유"].map((line) => (
                <span key={line} className="ld-ac-ch1-title-line">{line}</span>
              ))}
            </div>
            <p className="ld-ac-ch1-sub">
              <span className="ld-ac-ch1-main-text">
                <span className="ld-ac-ch1-main-line">Video Is the New Currency.</span>
                <span className="ld-ac-ch1-main-line">Your Camera Is Your Business Card.</span>
              </span>
              <br />
              <span className="ld-ac-ch1-dancing">
                Those who appear on screen don&apos;t just get noticed —<br />
                they get trusted. In a world drowning in text,<br />
                video is the language that moves people.<br />
                Show your face, share your knowledge,<br />
                and turn every lesson into a paycheck.
              </span>
            </p>
          </div>
        </div>

        {/* ── Chapter 2 ── */}
        <div className="ld-wg-section" id="ch2">
          <div className="ld-ac-spacer-32" />
          <div className="ld-wg-sec-label">Chapter 2</div>
          <h2>AI가 장면마다 웹툰 이미지를 그려줍니다</h2>
          <p className="ld-wg-lead">
            그림을 그릴 줄 몰라도 됩니다. 대본의 각 장면마다 AI가 자동으로 이미지를 만들어냅니다.<br />
            한 화에 40~50장의 장면 이미지가 자동 생성됩니다 — 손으로 단 한 장도 그릴 필요가 없습니다.
          </p>

          <div className="ld-ac-flex-col-24">
            <div className="ld-glass-card ld-ac-card">
              <div className="ld-ac-card-icon">🎨</div>
              <h3 className="ld-ac-card-h3">3가지 화풍 — 이야기 분위기에 맞게 선택</h3>
              <p className="ld-ac-card-p">
                링크드랍는 세 가지 AI 화풍을 지원합니다. 시리즈를 만들 때 화풍을 고르면, 이후 모든 장면이 그 스타일로 통일됩니다.
              </p>
              <div className="ld-ac-style-grid">
                {[
                  { name: "폴리스타일", emoji: "🖌️", tag: "기본 화풍", desc: "선 굵고 색감 선명한 웹툰 스타일. 감정 표현이 직관적이고 10~30대 독자에게 친숙합니다. 로맨스·직장물에 최적.", accent: true },
                  { name: "마사코",    emoji: "🌸", tag: "일러스트 화풍", desc: "부드러운 수채화 느낌의 일본식 일러스트. 감성적·서정적 분위기. 멜로·가족 드라마에 어울립니다.", accent: false },
                  { name: "느와르 오일", emoji: "🕯️", tag: "시네마틱 화풍", desc: "어둡고 무거운 유화 질감. 복수극·심리 스릴러·범죄물의 긴장감을 시각적으로 표현합니다.", accent: false },
                ].map((style) => (
                  <div
                    key={style.name}
                    className={`ld-ac-style-card ${style.accent ? "ld-ac-style-card--accent" : "ld-ac-style-card--default"}`}
                  >
                    <div className="ld-ac-card-icon-sm">{style.emoji}</div>
                    <div className="ld-ac-style-name">{style.name}</div>
                    <div className={`ld-ac-style-tag${style.accent ? " ld-ac-style-tag--accent" : ""}`}>{style.tag}</div>
                    <p className="ld-ac-card-p ld-ac-card-p-sm">{style.desc}</p>
                  </div>
                ))}
              </div>
              <div className="ld-ac-term-box">
                <p className="ld-ac-term-title">💡 화풍은 한 번 고르면 시리즈 전체에 일관 적용됩니다</p>
                <p className="ld-ac-term-text">
                  1화부터 6화까지 모든 장면이 같은 화풍으로 자동 생성되어 시각적 통일감을 유지합니다. 화풍 변경은 새 시리즈에서 적용할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="ld-glass-card ld-ac-card">
              <div className="ld-ac-card-icon">🖼️</div>
              <h3 className="ld-ac-card-h3">장면 설명 → AI 이미지 자동 완성</h3>
              <p className="ld-ac-card-p">
                AI가 대본 각 컷의 <strong>한국어 장면 묘사</strong>를 읽고 이미지를 생성합니다.<br /><br />
                <strong>예시 장면 묘사 (image_hint)</strong><br />
                &ldquo;회의실 창가에 선 여자. 서류를 손에 쥐고 미소를 숨기려 하지만 눈빛에 분노가 담겨있다.&rdquo;<br /><br />
                → AI가 이 묘사를 읽고, 선택한 화풍으로 장면 이미지를 자동 생성합니다.<br /><br />
                한 화당 <strong>40~50장</strong>의 이미지가 생성됩니다. 촬영도 없고, 그림을 그릴 필요도 없습니다.
              </p>
            </div>
          </div>

          <div className="ld-glass-card ld-ac-card ld-ac-card-mt8">
            <div className="ld-ac-card-icon">🔧</div>
            <h3 className="ld-ac-card-h3">마음에 안 드는 장면은 바로 수정할 수 있습니다</h3>
            <div className="ld-ac-2col-grid">
              <div>
                <p className="ld-ac-card-p">
                  자동 생성된 이미지 중 원하는 장면이 아닌 경우, 키프레임 편집 도구에서 직접 수정할 수 있습니다.<br /><br />
                  장면 묘사를 바꾸거나 재생성 버튼만 누르면 새 이미지가 즉시 만들어집니다. 프로그램 설치 없이 웹 브라우저에서 모두 처리됩니다.
                </p>
              </div>
              <div>
                <p className="ld-ac-card-p ld-ac-col-heading">편집 도구 주요 기능</p>
                <p className="ld-ac-card-p">
                  ✅ <strong>장면별 이미지 재생성</strong>: 버튼 한 번으로 새 이미지<br />
                  ✅ <strong>2×2·3×3 그리드 비교</strong>: 여러 버전을 한눈에 비교 선택<br />
                  ✅ <strong>캐릭터 의상 고정</strong>: 전 화에 걸쳐 시각적 일관성 유지
                </p>
              </div>
            </div>
            <div className="ld-ac-term-box">
              <p className="ld-ac-term-title">💡 한 시리즈 = 총 240~300장 이미지 자동 생성</p>
              <p className="ld-ac-term-text">
                6화 × 화당 40~50장 = 시리즈 전체 240~300장의 장면 이미지가 자동으로 만들어집니다. 혼자서는 오랜시간이 걸릴 분량을 AI가 하루 만에 처리합니다.
              </p>
            </div>
          </div>

          <div className="ld-ac-term-section">
            <p className="ld-ac-term-section-title">
              📖 이미지 생성 용어 해설
            </p>
            <div className="ld-ac-term-grid">
              {[
                { term: "키프레임",         def: "장면(컷)을 대표하는 핵심 이미지 한 장" },
                { term: "image_hint",       def: "AI에게 전달하는 한국어 장면 묘사 텍스트" },
                { term: "화풍 (art style)", def: "이미지 전체에 적용되는 그림 스타일 설정" },
                { term: "재생성",           def: "같은 묘사로 다른 이미지를 새로 만드는 작업" },
                { term: "그리드 비교",      def: "여러 버전의 이미지를 격자 배치로 비교 선택" },
                { term: "의상 고정",        def: "캐릭터가 시리즈 내내 같은 옷을 입도록 설정" },
              ].map(({ term, def }) => (
                <div key={term} className="ld-ac-term-cell">
                  <p className="ld-ac-term-cell-title">{term}</p>
                  <p className="ld-ac-term-cell-text">{def}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chapter 3 ── */}
        <div className="ld-wg-section" id="ch3">
          <div className="ld-ac-spacer-32" />
          <div className="ld-wg-sec-label">Chapter 3</div>
          <h2>AI가 목소리를 입히고 영상을 완성합니다</h2>
          <p className="ld-wg-lead">
            대본과 이미지가 완성되면 나머지는 전부 자동입니다.<br />
            AI가 나레이션 음성을 합성하고, 이미지에 움직임을 주고, Full HD 영상으로 렌더링해 유튜브에 올려줍니다.
          </p>

          <div className="ld-glass-card ld-ac-card">
            <div className="ld-ac-card-icon">🎙️</div>
            <h3 className="ld-ac-card-h3">AI가 나레이션 목소리를 자동으로 만듭니다</h3>
            <div className="ld-ac-2col-grid">
              <div>
                <p className="ld-ac-card-p">
                  직접 마이크 앞에 앉아 녹음할 필요가 없습니다.<br /><br />
                  링크드랍는 <strong>한국어 AI 음성 합성(TTS)</strong> 기술로 대본의 나레이션 텍스트를 자연스러운 음성 파일로 변환합니다. 성별·톤·속도까지 설정 가능합니다.<br /><br />
                  생성된 음성은 각 장면 이미지의 길이에 맞게 자동으로 싱크가 맞춰집니다.
                </p>
              </div>
              <div>
                <p className="ld-ac-card-p ld-ac-col-heading">TTS 시스템 특징</p>
                <p className="ld-ac-card-p">
                  ✅ <strong>한국어 자연어 처리</strong>: 문장 끊김 없는 자연스러운 발화<br />
                  ✅ <strong>자동 싱크</strong>: 음성 길이 = 이미지 재생 시간 자동 계산<br />
                  ✅ <strong>SRT 자막 동시 생성</strong>: 음성과 함께 자막 파일도 자동 생성
                </p>
              </div>
            </div>
            <div className="ld-ac-term-box">
              <p className="ld-ac-term-title">💡 향후 EN·JP 더빙도 같은 파이프라인으로</p>
              <p className="ld-ac-term-text">
                한국어 TTS가 완성되면 같은 대본을 영어·일본어 TTS로 변환해 별도 채널에 업로드하는 다국어 확장을 준비 중입니다. 한 번 만든 시리즈로 3개 언어권 시청자를 동시에 공략합니다.
              </p>
            </div>
          </div>

          <div className="ld-ac-flex-col-24-mt8">
            <div className="ld-glass-card ld-ac-card">
              <div className="ld-ac-card-icon">🎬</div>
              <h3 className="ld-ac-card-h3">정지 이미지에 영화 같은 움직임을 더합니다</h3>
              <p className="ld-ac-card-p">
                AI가 생성한 정지 이미지를 그대로 쓰면 영상이 슬라이드쇼처럼 보입니다.<br /><br />
                링크드랍는 <strong>켄번스(Ken Burns) 효과</strong>를 자동 적용합니다. 이미지가 천천히 줌인·줌아웃·패닝되면서 마치 카메라가 움직이는 것처럼 보입니다.<br /><br />
                대사 장면에서는 캐릭터 입술이 음성에 맞게 움직이는 <strong>립싱크 애니메이션</strong>을 별도로 제작할 수 있습니다.
              </p>
            </div>

            <div className="ld-glass-card ld-ac-card">
              <div className="ld-ac-card-icon">⚙️</div>
              <h3 className="ld-ac-card-h3">Full HD 영상을 자동으로 렌더링합니다</h3>
              <p className="ld-ac-card-p">
                이미지·음성·자막·애니메이션이 모두 준비되면, <strong>자동 렌더링 엔진</strong>이 이것들을 하나의 Full HD(1920×1080) 영상 파일로 합칩니다.<br /><br />
                영상 편집 프로그램을 열 필요가 없습니다. 렌더링 버튼을 누르면 영상이 자동으로 만들어집니다.
              </p>
              <div className="ld-wg-tip ld-ac-card-mt16">
                <div className="ld-wg-tip-icon">📌</div>
                <div className="ld-wg-tip-text">
                  한 화(에피소드) 기준 영상 길이는 약 10~15분. 렌더링 완료까지 약 5~10분이 걸립니다. 그 사이 다음 화 대본 검토를 할 수 있습니다.
                </div>
              </div>
            </div>
          </div>

          <div className="ld-glass-card ld-ac-card ld-ac-card-mt8">
            <div className="ld-ac-card-icon">📡</div>
            <h3 className="ld-ac-card-h3">한국어 채널부터 시작해 3개 언어로 확장합니다</h3>
            <p className="ld-ac-card-p">
              완성된 영상은 YouTube에 바로 업로드됩니다. 링크드랍의 다국어 확장 전략은 단계적으로 설계되어 있습니다.
            </p>
            <div className="ld-ac-youtube-grid">
              {[
                { step: "지금 — KR 채널", desc: "한국어 TTS + 한국어 자막으로 국내 시청자 공략. 주 1화 업로드로 알고리즘 신뢰 구축." },
                { step: "Phase 2 — EN 채널 개설", desc: "같은 영상에 영어 자막 트랙 추가. 영어권 시청자를 위한 별도 채널 운영 시작." },
                { step: "Phase 3 — EN 풀 더빙", desc: "한국어 대본을 영어 TTS로 변환. 영어 음성 + 영어 자막으로 글로벌 시청자 공략." },
                { step: "Phase 4 — JP 채널 추가", desc: "일본어 TTS + 일본어 자막. 한류 콘텐츠 소비가 높은 일본 시장 진입." },
              ].map((item, i) => (
                <div key={i} className="ld-ac-youtube-item">
                  <div className="ld-ac-youtube-num">{i + 1}</div>
                  <div>
                    <div className="ld-ac-youtube-step">{item.step}</div>
                    <div className="ld-ac-youtube-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="ld-ac-term-box">
              <p className="ld-ac-term-title">💡 왜 언어별 별도 채널인가요?</p>
              <p className="ld-ac-term-text">
                YouTube 알고리즘은 오디오 언어를 기준으로 영상을 추천합니다. 한 채널에 영어 자막만 붙여도 영어권 시청자에게는 거의 노출되지 않습니다. MrBeast처럼 언어별 채널을 따로 운영해야 각 언어권 알고리즘에 최적화됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* ── Chapter 4 ── */}
        <div className="ld-wg-section" id="ch4">
          <div className="ld-ac-spacer-32" />
          <div className="ld-wg-sec-label">Chapter 4</div>
          <h2>영상 하나로 3가지 수익이 들어옵니다</h2>
          <p className="ld-wg-lead">
            영상을 만들면 수익이 하나가 아닙니다. 광고 수익, 강의 수익, 파트너 수당까지
            세 가지 수입 구조를 동시에 만들 수 있습니다.
          </p>

          <ChapterImage
            src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&q=80"
            alt="수익 분석 화면"
            caption="유튜브 스튜디오 수익 현황 화면 — 추후 실제 강사 수익 화면으로 교체 예정"
          />

          <div className="ld-ac-flex-col-24">
            <div className="ld-glass-card ld-ac-card">
              <div className="ld-ac-card-icon">📺</div>
              <h3 className="ld-ac-card-h3">① 유튜브 광고 수익</h3>
              <p className="ld-ac-card-p">
                구독자 <strong>1,000명 + 시청 시간 4,000시간</strong>이 넘으면 유튜브에서 광고 수익을 지급합니다.<br /><br />
                구독자 1,000명을 달성하면 유튜브에서 자동으로 광고를 붙여주고, 조회수에 따라 매월 수익이 입금됩니다. 강의를 하지 않는 날에도 이전에 올린 영상에서 계속 수익이 발생합니다.<br /><br />
                <strong>예상 수익 기준</strong>: 월 1만 조회수 기준 약 3~7만원 수준 (주제·시청자 특성에 따라 편차 있음)
              </p>
              <div className="ld-ac-term-box">
                <p className="ld-ac-term-title">💡 수익화 달성 목표 시간</p>
                <p className="ld-ac-term-text">주 1개 꾸준히 올리면 평균 6~12개월 내 수익화 달성이 가능합니다. 링크드랍이 초반 전략을 함께 설계해드립니다.</p>
              </div>
            </div>

            <div className="ld-glass-card ld-ac-card">
              <div className="ld-ac-card-icon">🏫</div>
              <h3 className="ld-ac-card-h3">② 영상 제작 클래스 수익</h3>
              <p className="ld-ac-card-p">
                영상을 만들면서 쌓인 경험을 바로 강의로 팔 수 있습니다. &ldquo;스마트폰으로 유튜브 시작하기&rdquo; 강의는 50대에게 인기 있는 주제입니다.<br /><br />
                <strong>수강료 예시</strong><br />
                4회차 오프라인 클래스: 수강료 12만 원<br />
                8회차 온라인 클래스: 수강료 19만 원<br />
                월 정기 멤버십: 월 5만 원<br /><br />
                강의 수강생이 곧 내 유튜브 채널 구독자가 되고, 구독자가 늘면 또 강의 수강생이 늘어납니다.
              </p>
            </div>
          </div>

          <div className="ld-glass-card ld-ac-card ld-ac-card-mt8">
            <div className="ld-ac-card-icon">🤝</div>
            <h3 className="ld-ac-card-h3">③ 링크드랍 파트너 수당 — 추가 수입</h3>
            <p className="ld-ac-card-p">
              링크드랍 파트너가 되면 수강생에게 링크드랍을 소개할 때마다 <strong>추천 수당</strong>이 자동으로 쌓입니다.
              강의 현장에서 &ldquo;이 앱이 저한테도 도움이 많이 됐어요&rdquo;라고 소개하기만 해도
              수강생이 가입하면 수당이 발생합니다. 강의를 열심히 할수록 파트너 네트워크가 자연스럽게 넓어집니다.
            </p>
          </div>

          <div className="ld-ac-income-section">
            <h3 className="ld-ac-income-h3">
              💰 월 수익 시나리오 — 현실적인 수치
            </h3>
            <IncomeRow label="유튜브 광고 수익" desc="월 조회수 1~2만 수준 (6개월 이후 안정화)" amount="월 3~10만원" />
            <IncomeRow label="4회차 클래스 × 8명" desc="수강료 12만원, 지역 커뮤니티·카페 모집" amount="월 96만원" />
            <IncomeRow label="8회차 온라인 클래스 × 10명" desc="수강료 19만원, 유튜브 채널 연계 모집" amount="월 190만원" />
            <IncomeRow label="파트너 수당" desc="수강생·지인 추천 링크 자동 적립" amount="월 20~50만원+" />
            <IncomeRow label="합산 (클래스 5명 + 수당)" desc="소규모로 시작하는 현실적 첫 달 목표" amount="월 90만원" accent />
            <IncomeRow label="합산 (클래스 10명 + 광고 + 수당)" desc="3~6개월 후 안정 궤도" amount="월 220만원+" accent />
          </div>

          <div className="ld-ac-testimonial">
            <div className="ld-ac-testimonial-body">
              <div className="ld-ac-testimonial-emoji">🎙️</div>
              <div>
                <p className="ld-ac-testimonial-quote">
                  &ldquo;처음엔 유튜브는 젊은 사람들이나 하는 거라고 생각했어요.
                  그런데 스마트폰 사용법을 가르쳐달라는 주변 분들이 계속 있더라고요.
                  제 채널에서 배운 분이 수업에 오시고, 수업에서 알게 된 분이 채널을 구독하고.
                  지금은 유튜브 광고비 5만원에 클래스 수강료 더해서 한 달에 180만원 들어와요.&rdquo;
                </p>
                <p className="ld-ac-testimonial-name">
                  — 박영숙 (63세, 서울 마포구) · 스마트폰 영상 제작 클래스 강사 · 유튜브 채널 구독자 1,340명
                </p>
              </div>
            </div>
          </div>

          <div className="ld-ac-timeline-section">
            <h3 className="ld-ac-timeline-h3">
              📅 시작부터 월 100만원까지 전체 로드맵
            </h3>
            <div className="ld-wg-timeline">
              {[
                { num: "1", sub: "상담 신청 (0주차)", desc: "링크드랍 무료 상담 → 강의 주제(스마트폰 영상 제작)·목표 수강생·채널 컨셉을 함께 설정합니다." },
                { num: "2", sub: "채널 개설 + 첫 영상 (1주차)", desc: "유튜브 채널 개설, 커버 사진·소개란 작성, 자기소개 영상 1개 촬영·업로드. 장비 세팅(삼각대·링라이트)도 이 주에 합니다." },
                { num: "3", sub: "커리큘럼 완성 (2~3주차)", desc: "AI 자동 생성 + 전담 매니저 피드백 → 4회차 클래스 커리큘럼 완성. 강의 자료(PPT·안내문)까지 한 번에 준비됩니다." },
                { num: "4", sub: "첫 수강생 모집 (3~4주차)", desc: "카카오 오픈채팅·네이버 카페·지역 문화센터로 수강생 모집. 링크드랍이 모집 문구와 채널을 함께 지원합니다." },
                { num: "5", sub: "첫 강의 + 채널 성장 (1~3개월)", desc: "주 1회 영상 업로드 + 월 1회 클래스 운영. 수강생 후기로 다음 기수 자동 모집, 채널 구독자도 함께 증가합니다." },
                { num: "6", sub: "월 100만원+ 안정화 (3~6개월)", desc: "구독자 300명+ → 클래스 수강생 확보 안정화 → 유튜브 광고 수익 시작. 파트너 수당까지 합산하면 월 100만원+ 현실적으로 가능합니다." },
              ].map((g) => (
                <div key={g.num} className="ld-wg-tl-item">
                  <div className="ld-wg-tl-dot ld-ac-tl-dot" />
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
        <div className="ld-ac-bottom-cta">
          <p className="ld-ac-bottom-eyebrow">지금 바로 시작하세요</p>
          <h2 className="ld-ac-bottom-h2">
            카카오 상담 하나로<br />모든 것이 시작됩니다
          </h2>
          <p className="ld-ac-bottom-sub">
            복잡한 신청 없이 카카오톡 채팅 하나로 시작하세요.<br />
            커리큘럼 설계 · 채널 개설 · 첫 수강생 모집까지 담당자가 함께합니다.
          </p>
          <a
            href={externalLinks.kakao}
            target="_blank"
            rel="noopener noreferrer"
            className="ld-wg-topic-btn ld-ac-topic-btn"
          >
            📞 지금 무료 상담 신청하기
            <span className="ld-ac-arrow">→</span>
          </a>
          <p className="ld-ac-bottom-note">
            상담 후 강의 여부 결정 · 무료 · 부담 없음
          </p>
        </div>

      </div>
    </div>
  );
}
