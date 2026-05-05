"use client";

import { useState, useEffect, useCallback } from "react";
import "@/styles/topic-guide.css";

// ─── 타입 ─────────────────────────────────────────────────────────
type OptKey = "A" | "B" | "C" | "D";
type ResultType = "knowledge" | "coach" | "template" | "executor" | "curator";
type Screen = "start" | "quiz" | "loading" | "result";

interface LandingLink { slug: string; label: string; }
interface ResultData {
  emoji: string; type: string; title: string; desc: string;
  position: string; products: string[]; tip: string;
  landings: LandingLink[];
}

// ─── 질문 데이터 ───────────────────────────────────────────────────
const QUESTIONS = [
  {
    q: "당신이 가진 가장 강력한 '자산(무기)'은 무엇인가요?",
    opts: [
      { key: "A" as OptKey, label: "직접 겪고 극복하며 얻은 <strong>경험과 성과</strong>" },
      { key: "B" as OptKey, label: "남들의 실수나 패턴을 분석하는 <strong>관찰력</strong>" },
      { key: "C" as OptKey, label: "사람들을 모으고 소통하는 <strong>네트워킹과 관계</strong>" },
      { key: "D" as OptKey, label: "효율적으로 일하고 정리하는 <strong>템플릿·도구 활용력</strong>" },
    ],
  },
  {
    q: "어떤 방식(수익모델)으로 돈을 벌고 싶나요?",
    opts: [
      { key: "A" as OptKey, label: "한 번 만들어두고 자동으로 팔리는 <strong>전자책/가이드북</strong>" },
      { key: "B" as OptKey, label: "고객 상황에 맞춰 직접 피드백 주는 <strong>1:1 코칭/컨설팅</strong>" },
      { key: "C" as OptKey, label: "고객이 바로 가져다 쓸 수 있는 <strong>템플릿/체크리스트</strong>" },
      { key: "D" as OptKey, label: "고객의 귀찮은 일을 내가 직접 해주는 <strong>대행/구축 서비스</strong>" },
    ],
  },
  {
    q: "당신의 서비스로 고객에게 어떤 변화를 주고 싶나요?",
    opts: [
      { key: "A" as OptKey, label: "수익 창출이나 <strong>획기적인 시간 절약</strong>" },
      { key: "B" as OptKey, label: "감정적 스트레스 감소와 <strong>불안 해소</strong>" },
      { key: "C" as OptKey, label: "건강, 외모 등 <strong>눈에 보이는 뚜렷한 결과</strong>" },
      { key: "D" as OptKey, label: "복잡하고 답답한 업무나 <strong>일상의 단순화</strong>" },
    ],
  },
  {
    q: "첫 고객 10명을 모으기 위해 당장 시작하고 싶은 행동은?",
    opts: [
      { key: "A" as OptKey, label: "블로그·브런치에 <strong>문제 해결 관련 깊이 있는 글</strong> 쓰기" },
      { key: "B" as OptKey, label: "인스타그램 등 SNS에 <strong>시각적 팁·노하우</strong> 올리기" },
      { key: "C" as OptKey, label: "무료 템플릿(리드마그넷)을 배포하며 <strong>사람들 반응 확인</strong>하기" },
      { key: "D" as OptKey, label: "지인·커뮤니티 사람들을 <strong>직접 인터뷰하며 도와주기</strong>" },
    ],
  },
];

const SCORE_MAP: Record<number, Record<OptKey, ResultType>> = {
  0: { A: "knowledge", B: "curator",  C: "coach",    D: "template" },
  1: { A: "knowledge", B: "coach",    C: "template", D: "executor" },
  2: { A: "template",  B: "coach",    C: "executor", D: "curator"  },
  3: { A: "knowledge", B: "curator",  C: "template", D: "executor" },
};

// ─── 결과 데이터 (유형별 추천 랜딩 포함) ─────────────────────────
const RESULTS: Record<ResultType, ResultData> = {
  knowledge: {
    emoji: "📖", type: "지식 전달자",
    title: "경험을 콘텐츠로 바꾸는\n지식 크리에이터",
    desc: "당신은 직접 겪고 이겨낸 경험이 최강 무기입니다. 그 경험을 체계적으로 정리하면 누군가에게는 수백만 원짜리 가이드가 됩니다. 전자책, 온라인 강의, 유료 뉴스레터가 당신의 영역입니다.",
    position: '나는 <em>[특정 문제로 고통받는 초보자]</em>가 <em>[막막하고 시행착오 많은 과정]</em>을 건너뛰어 <em>[6개월 빠른 성과]</em>에 도달하도록 돕는다.',
    products: ["1만원대 PDF 전자책", "무료 3일 챌린지 이메일", "유료 뉴스레터 월 9,900원"],
    tip: "완성형 전자책을 먼저 쓰지 마세요. 먼저 블로그 글 3개를 올려서 어떤 글에 댓글·저장이 몰리는지 확인하세요. 그게 팔리는 주제입니다.",
    landings: [
      { slug: "landing1", label: "📖 웹소설 작가로 월 수익 만들기" },
      { slug: "landing2", label: "📘 전자책 출간으로 내 경험 수익화" },
      { slug: "landing3", label: "📚 AI로 만드는 나만의 동화책" },
    ],
  },
  coach: {
    emoji: "🤝", type: "공감형 코치",
    title: "고객 감정을 읽는\n공감형 1:1 코치",
    desc: "당신은 사람의 말 뒤에 있는 진짜 감정과 니즈를 잘 파악합니다. 1:1 코칭과 컨설팅이 가장 잘 맞습니다. 처음엔 저가 진단 세션으로 시작해서 점점 단가를 높여가는 전략이 유효합니다.",
    position: '나는 <em>[번아웃·방향 상실로 힘든 직장인]</em>이 <em>[혼자 끙끙 앓는 상황]</em>에서 벗어나 <em>[명확한 커리어 방향과 자신감 회복]</em>에 도달하도록 돕는다.',
    products: ["무료 30분 진단 코칭 1회권", "3회 패키지 코칭 197,000원", "카카오톡 채널 무료 Q&A"],
    tip: "지금 당장 주변 5명에게 DM을 보내세요. '무료로 30분 고민 들어드릴게요.' 이 한 마디로 첫 고객을 만들고, 그 대화에서 유료 상품 아이디어가 나옵니다.",
    landings: [
      { slug: "landing4", label: "🎓 AI 기초 클래스 운영으로 수강료 수익" },
    ],
  },
  template: {
    emoji: "⚡", type: "효율 설계자",
    title: "시간을 파는 사람,\n효율성 끝판왕 템플릿 제작자",
    desc: "당신은 복잡한 것을 단순하게 만드는 능력이 있습니다. 한 번 만든 템플릿이 자는 동안 팔립니다. 노션, 엑셀, 구글 시트 기반의 디지털 상품이 당신의 주력 아이템입니다.",
    position: '나는 <em>[업무 정리에 지쳐있는 직장인·1인 사업자]</em>가 <em>[매번 새로 만드는 반복 작업]</em>을 없애고 <em>[하루 2시간 업무 단축]</em>에 도달하도록 돕는다.',
    products: ["크몽·탈잉 템플릿 9,900원 판매", "노션 템플릿 번들 33,000원", "구글폼 무료 배포 후 유료 업그레이드"],
    tip: "템플릿 10개를 만들지 말고, 1개를 무료로 배포해서 100명이 다운로드하는지 먼저 확인하세요. 수요가 확인되면 그때 유료 버전을 만드는 겁니다.",
    landings: [
      { slug: "landing4", label: "🎓 AI 기초 클래스 운영으로 수강료 수익" },
      { slug: "landing6", label: "💻 바이브코딩으로 웹사이트·웹앱 만들기" },
    ],
  },
  executor: {
    emoji: "🛠️", type: "실행 대행러",
    title: "고객 대신 실행해주는\n실행력 갑 대행 전문가",
    desc: "당신은 실제로 손을 움직여서 결과물을 만드는 것에 강점이 있습니다. 고객이 하기 싫거나 못 하는 것을 대신 해주면 됩니다. SNS 운영 대행, 블로그 글쓰기 대행, 영상 편집 대행 등이 딱 맞습니다.",
    position: '나는 <em>[SNS 운영이 필요하지만 시간 없는 소상공인]</em>이 <em>[꾸준히 못 올리는 문제]</em>를 해결해 <em>[월 인스타 팔로워 500명 성장]</em>에 도달하도록 돕는다.',
    products: ["인스타 운영 대행 월 30만원", "블로그 포스팅 대행 건당 3만원", "첫 달 50% 할인 파일럿 패키지"],
    tip: "포트폴리오가 없어도 됩니다. 지금 당장 주변 소상공인 사장님 1명에게 '한 달 무료로 해드릴게요'라고 하세요. 그 결과물이 최고의 포트폴리오입니다.",
    landings: [
      { slug: "landing8", label: "⚡ 소상공인 SNS 대행·1인기업 자동화" },
      { slug: "landing5", label: "🎬 유튜브 쇼츠로 경험담 영상화" },
    ],
  },
  curator: {
    emoji: "🔍", type: "인사이트 큐레이터",
    title: "패턴을 보는 눈,\n인사이트 큐레이터",
    desc: "당신은 남들이 그냥 지나치는 것에서 패턴과 의미를 발견합니다. 이 능력은 리포트, 분석 콘텐츠, 유료 뉴스레터로 탁월하게 연결됩니다. 정보의 홍수 속에서 '핵심만 추려주는 사람'은 언제나 귀합니다.",
    position: '나는 <em>[정보가 너무 많아 혼란스러운 마케터·기획자]</em>가 <em>[무엇이 진짜 중요한지 모르는 상황]</em>에서 벗어나 <em>[핵심 인사이트로 빠른 의사결정]</em>에 도달하도록 돕는다.',
    products: ["주간 유료 뉴스레터 월 9,900원", "업계 트렌드 리포트 PDF 19,000원", "무료 구독자 모집 후 전환"],
    tip: "지금 가장 관심 있는 분야의 뉴스를 3개 골라서 '이번 주 핵심 트렌드 3가지'로 무료 뉴스레터 1회를 발행해 보세요. 구독자 50명이 모이면 유료 전환을 시작하세요.",
    landings: [
      { slug: "landing7", label: "🎙️ 디지털 구술 생애사 기록가" },
      { slug: "landing9", label: "📊 트레이딩 노하우 커뮤니티 운영" },
    ],
  },
};

const TYPE_CHIPS = [
  { emoji: "📖", label: "지식 전달자" },
  { emoji: "🤝", label: "공감형 코치" },
  { emoji: "⚡", label: "효율 설계자" },
  { emoji: "🛠️", label: "실행 대행러" },
  { emoji: "🔍", label: "인사이트 큐레이터" },
];

// ─── 컴포넌트 ───────────────────────────────────────────────────────
// LdLanding10 — landing10 전용 (구 LdTopicGuide)
// 주제: 온라인 부업 성향 진단 테스트 (4문항 → 5유형 결과)
export default function LdLanding10() {
  const [screen,      setScreen]      = useState<Screen>("start");
  const [currentQ,   setCurrentQ]    = useState(0);
  const [answers,    setAnswers]      = useState<string[]>([]);
  const [selectedOpt,setSelectedOpt] = useState<string | null>(null);
  const [resultType, setResultType]  = useState<ResultType | null>(null);

  // 로딩 → 결과 전환
  useEffect(() => {
    if (screen !== "loading") return;
    const t = setTimeout(() => {
      const scores: Record<ResultType, number> = {
        knowledge: 0, coach: 0, template: 0, executor: 0, curator: 0,
      };
      answers.forEach((a, i) => {
        const type = SCORE_MAP[i]?.[a as OptKey];
        if (type) scores[type]++;
      });
      const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as ResultType;
      setResultType(best);
      setScreen("result");
    }, 1800);
    return () => clearTimeout(t);
  }, [screen, answers]);

  const startQuiz = useCallback(() => {
    setCurrentQ(0); setAnswers([]); setSelectedOpt(null); setScreen("quiz");
  }, []);

  const nextQuestion = useCallback(() => {
    if (!selectedOpt) return;
    const next = [...answers];
    next[currentQ] = selectedOpt;
    setAnswers(next);
    if (currentQ < 3) { setCurrentQ(q => q + 1); setSelectedOpt(null); }
    else { setScreen("loading"); }
  }, [selectedOpt, answers, currentQ]);

  const retry = useCallback(() => {
    setCurrentQ(0); setAnswers([]); setSelectedOpt(null); setResultType(null); setScreen("start");
  }, []);

  const copyResult = useCallback((type: string) => {
    const txt = `나의 온라인 부업 유형은 "${type}"!\n링크드랍에서 테스트해보세요 → linkdrop.co.kr/landing/landing10`;
    navigator.clipboard?.writeText(txt).then(() =>
      alert("✅ 클립보드에 복사됐어요!\n카카오톡, 인스타에 붙여넣기 하세요.")
    );
  }, []);

  const pct    = Math.round(((currentQ + 1) / 4) * 100);
  const q      = QUESTIONS[currentQ];
  const result = resultType ? RESULTS[resultType] : null;

  return (
    <main className="ld-tg-root">
      <div className="ld-tg-orb ld-tg-orb--1" aria-hidden="true" />
      <div className="ld-tg-orb ld-tg-orb--2" aria-hidden="true" />

      <div className="ld-tg-app">

        {/* ── 시작 화면 ── */}
        {screen === "start" && (
          <div className="ld-tg-card">
            <div className="ld-tg-badge ld-tg-fade-up ld-tg-d1">✦ 무료 성향 진단 테스트</div>
            <h1 className="ld-tg-start-title ld-tg-fade-up ld-tg-d2">
              나의 온라인 부업<br />유형은 무엇일까?
            </h1>
            <p className="ld-tg-start-sub ld-tg-fade-up ld-tg-d2">
              4가지 질문에 답하면 AI가 당신의 성향을 분석해<br />
              가장 잘 맞는 온라인 사업 유형을 알려드립니다.
            </p>
            <div className="ld-tg-start-meta ld-tg-fade-up ld-tg-d3">
              <span className="ld-tg-meta-item">⏱️ 약 2분 소요</span>
              <span className="ld-tg-meta-item">❓ 4가지 질문</span>
              <span className="ld-tg-meta-item">🎯 5가지 유형</span>
            </div>
            <div className="ld-tg-chips ld-tg-fade-up ld-tg-d4">
              {TYPE_CHIPS.map(c => (
                <span key={c.label} className="ld-tg-chip">{c.emoji} {c.label}</span>
              ))}
            </div>
            <button className="ld-tg-btn-start ld-tg-fade-up ld-tg-d5" onClick={startQuiz}>
              ✦ 지금 바로 테스트 시작
            </button>
          </div>
        )}

        {/* ── 퀴즈 화면 ── */}
        {screen === "quiz" && (
          <div className="ld-tg-card">
            <div className="ld-tg-progress">
              <div className="ld-tg-progress-top">
                <span className="ld-tg-progress-label">질문 {currentQ + 1} / 4</span>
                <span className="ld-tg-progress-num">{pct}%</span>
              </div>
              <div className="ld-tg-progress-track">
                <div className="ld-tg-progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="ld-tg-q-num">QUESTION {currentQ + 1}</div>
            <div className="ld-tg-q-text">{q.q}</div>
            <div className="ld-tg-options">
              {q.opts.map(o => (
                <button
                  key={o.key}
                  className={`ld-tg-opt${selectedOpt === o.key ? " selected" : ""}`}
                  onClick={() => setSelectedOpt(o.key)}
                >
                  <span className="ld-tg-opt-key">{o.key}</span>
                  <span className="ld-tg-opt-text" dangerouslySetInnerHTML={{ __html: o.label }} />
                </button>
              ))}
            </div>
            <button
              className={`ld-tg-btn-next${selectedOpt ? " active" : ""}`}
              onClick={nextQuestion}
              disabled={!selectedOpt}
            >
              {currentQ < 3 ? "다음 질문 →" : "결과 보기 🎯"}
            </button>
          </div>
        )}

        {/* ── 로딩 화면 ── */}
        {screen === "loading" && (
          <div className="ld-tg-card ld-tg-loading">
            <div className="ld-tg-spinner" />
            <div className="ld-tg-loading-text">성향을 분석 중입니다...</div>
            <div className="ld-tg-loading-sub">4가지 답변을 종합하고 있어요</div>
          </div>
        )}

        {/* ── 결과 화면 ── */}
        {screen === "result" && result && (
          <div className="ld-tg-card">
            <div className="ld-tg-result-badge ld-tg-fade-up ld-tg-d1">✦ 분석 완료</div>
            <span className="ld-tg-result-emoji ld-tg-fade-up ld-tg-d1">{result.emoji}</span>
            <div className="ld-tg-result-type ld-tg-fade-up ld-tg-d1">{result.type}</div>
            <h2 className="ld-tg-result-title ld-tg-fade-up ld-tg-d1">
              {result.title.split("\n").map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h2>
            <p className="ld-tg-result-desc ld-tg-fade-up ld-tg-d1">{result.desc}</p>

            <div className="ld-tg-result-block ld-tg-fade-up ld-tg-d2">
              <div className="ld-tg-block-label">포지셔닝 선언문</div>
              <p className="ld-tg-positioning" dangerouslySetInnerHTML={{ __html: result.position }} />
            </div>

            <div className="ld-tg-result-block ld-tg-fade-up ld-tg-d3">
              <div className="ld-tg-block-label">첫 시작 추천 상품</div>
              <div className="ld-tg-products">
                {result.products.map(p => (
                  <span key={p} className="ld-tg-product-pill">🎁 {p}</span>
                ))}
              </div>
            </div>

            {/* 추천 랜딩페이지 */}
            <div className="ld-tg-result-block ld-tg-fade-up ld-tg-d3">
              <div className="ld-tg-block-label">📌 당신에게 맞는 링크드랍 서비스</div>
              <div className="ld-tg-landing-links">
                {result.landings.map(l => (
                  <a
                    key={l.slug}
                    href={`/landing/${l.slug}`}
                    className="ld-tg-landing-link"
                  >
                    {l.label}
                    <span className="ld-tg-landing-arrow">→</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="ld-tg-tip ld-tg-fade-up ld-tg-d4">
              <span className="ld-tg-tip-icon">💡</span>
              <p><strong>실행 꿀팁.</strong> {result.tip}</p>
            </div>

            <div className="ld-tg-fade-up ld-tg-d5">
              <button className="ld-tg-btn-share" onClick={() => copyResult(result.type)}>
                📤 결과 공유하기
              </button>
              <button className="ld-tg-btn-retry" onClick={retry}>
                🔄 테스트 다시하기
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
