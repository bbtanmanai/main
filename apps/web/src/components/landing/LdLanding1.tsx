import React from "react";
import "@/styles/webnovel-guide.css";
import "@/styles/cinematic.css";
import LdCinematicVideoBg from "@/components/landing/cinematic/LdCinematicVideoBg";

const STEPS = [
  { href: "#ch1",      num: "1", label: "웹소설이란?",       sub: "개념 · 시장 규모" },
  { href: "#overview", num: "2", label: "파이프라인 개요",    sub: "아이디어 → 대본" },
  { href: "#gate1",    num: "3", label: "Gate 1 시리즈 설정", sub: "장르 공식 · HOOK" },
  { href: "#gate2",    num: "4", label: "Gate 2 캐스팅",      sub: "주인공 · 관계 설정" },
  { href: "#gate3",    num: "5", label: "Gate 3 아키텍처",    sub: "6화 구조 설계" },
  { href: "#gate4",    num: "6", label: "Gate 4 스크립트",    sub: "5대 원칙 · 검증" },
  { href: "#quality",  num: "7", label: "품질 관리",          sub: "자동화된 품질 보장" },
] as const;

const CARD_STYLE_BASE: React.CSSProperties = {
  background: "var(--glass-white-md)",
  borderRadius: 16,
  padding: 32,
  boxShadow: "var(--shadow-glass)",
  border: "1.5px solid var(--glass-border)",
  backdropFilter: "var(--blur-sm)",
  WebkitBackdropFilter: "var(--blur-sm)",
  marginBottom: 24,
};

const IMG_CAPTION_STYLE: React.CSSProperties = {
  position: "absolute", bottom: 0, left: 0, right: 0,
  background: "linear-gradient(transparent, rgba(26,16,24,0.75))",
  color: "#fff", padding: "20px 24px 16px", fontSize: "0.85rem", fontStyle: "italic",
};

const CARD_H3: React.CSSProperties = {
  fontSize: "1.25rem", fontWeight: 700, marginBottom: 12, color: "var(--color-text)",
};
const CARD_P: React.CSSProperties = {
  fontSize: "0.95rem", color: "var(--color-text-muted)", lineHeight: 1.8, margin: 0,
};
const CARD_ICON: React.CSSProperties = { fontSize: "2rem", marginBottom: 12 };

// ============================================================
// LdLanding1 — landing1 전용 (구 LdWebnovelGuide)
// 커버 + 1장(웹소설 개요) 유지 / 2~7장은 링크드랍 파이프라인 가이드
// 문체: ~해요/~습니다 통일 (semi-formal, 초보자 친화)
// ============================================================

export default function LdLanding1() {
  return (
    <div className="ld-wg-wrap">
      {/* ══ 표지 — 900px 무관, 전체 화면 풀블리드 ══ */}
      <div className="ld-wg-cover" id="top">
        <LdCinematicVideoBg playbackId="ExchtTC1yIF00nVN32kc009f00LUu4yhMvVhQlR7Ce1ovc" />
        <div className="ld-wg-cover-inner">
          {/* 좌측: 히어로 텍스트 */}
          <div className="ld-wg-cover-left">
            <h1>나도<br /><span>웹소설 작가</span>가<br />될 수 있습니다</h1>
            <p className="ld-wg-cover-sub">
              컴퓨터가 낯설어도 괜찮습니다.<br />
              링크드랍 웹사이트 하나로 시작합니다.<br />
              앱 설치 불필요 · 브라우저에서 바로 사용
            </p>
            {/* 표지 CTA */}
            <a
              href="https://open.kakao.com/o/linkdrop"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                background: "#fbbf24",
                color: "#1a1a1a",
                fontWeight: 700,
                fontSize: 18,
                padding: "16px 40px",
                borderRadius: 100,
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(251,191,36,0.4)",
              }}
            >
              무료로 시작하기 →
            </a>
          </div>
          {/* 우측: 수직 스테퍼 목차 */}
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

      <div className="ld-wg-doc" style={{ position: "relative", zIndex: 1 }}>

        {/* ══ 1장 — 웹소설이란? ══ */}
        <div className="ld-wg-section" id="ch1">
          <div style={{ height: 32 }} />
          <div className="ld-wg-sec-label">Chapter 1</div>
          <h2>웹소설이란 무엇인가요?</h2>
          <p className="ld-wg-lead">
            종이책이 아니라 인터넷 브라우저·앱으로 읽는 소설입니다. 독자가 매일 새 회차를 기다리며 읽습니다.
          </p>
          <div className="ld-wg-section-inner">
            <div>
              <p>
                웹소설은 보통 <strong>1회차당 1,000~3,000자</strong> 분량으로 씁니다. A4 한 장 반 정도입니다.
                독자들은 매일 또는 매주 새 회차를 기다립니다.
              </p>
              <p>
                글을 쓰고 플랫폼에 올리면 독자가 유료로 열람합니다.
                독자가 많아질수록 수익도 함께 늘어납니다.
              </p>
              <div className="ld-wg-tip">
                <div className="ld-wg-tip-icon">💡</div>
                <div className="ld-wg-tip-text">
                  <strong>핵심은 완성도가 아닙니다.</strong> 독자가 다음 회차를 기다리게 만드는 흡입력이 중요합니다.
                  맞춤법이 조금 틀려도 괜찮아요.
                </div>
              </div>
              {/* 실제 파트너 수익 사례 */}
              <div className="ld-wg-case" style={{ marginTop: 20 }}>
                <div className="ld-wg-case-name">🌟 김미숙 (58세, 경기 수원)</div>
                <p>
                  "처음엔 글쓰기가 자신 없었는데, 링크드랍이 방향을 잡아주니까 생각보다 빨리 완성됐어요.
                  3개월 만에 첫 수익이 생겼고 지금은 매달 꾸준히 들어오고 있어요."
                </p>
              </div>
            </div>
            <div>
              <div className="ld-wg-stat-grid">
                {[
                  { icon: "📊", name: "국내 시장 규모", val: "1조↑",    desc: "2024년 기준" },
                  { icon: "👥", name: "월간 독자 수",   val: "700만↑", desc: "네이버·카카오" },
                  { icon: "✍️", name: "등록 작가 수",   val: "30만↑",  desc: "아마추어 포함" },
                  { icon: "💰", name: "파트너 월 수익", val: "87만원",  desc: "링크드랍 파트너 중간값" },
                ].map((s) => (
                  <div key={s.name} className="ld-wg-stat-card">
                    <div className="ld-wg-stat-icon">{s.icon}</div>
                    <div className="ld-wg-stat-name">{s.name}</div>
                    <div className="ld-wg-stat-val">{s.val}</div>
                    <div className="ld-wg-stat-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ margin: "32px auto 0", width: "80%" }}>
            <svg width="100%" viewBox="0 0 520 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="44" cy="38" r="20" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5"/>
              <circle cx="44" cy="32" r="8" fill="#93c5fd"/>
              <path d="M30,52 Q44,42 58,52" fill="#93c5fd"/>
              <text x="44" y="68" textAnchor="middle" fill="#1e40af" fontSize="12" fontFamily="-apple-system,sans-serif" fontWeight="600">작가</text>
              <path d="M70,38 L100,38" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3"/>
              <polygon points="98,33 108,38 98,43" fill="#94a3b8"/>
              <rect x="114" y="20" width="90" height="36" rx="8" fill="#1e40af"/>
              <text x="159" y="36" textAnchor="middle" fill="#fff" fontSize="12" fontFamily="-apple-system,sans-serif" fontWeight="700">Linkdrop</text>
              <text x="159" y="49" textAnchor="middle" fill="#93c5fd" fontSize="10" fontFamily="-apple-system,sans-serif">웹서비스</text>
              <path d="M210,38 L240,38" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3"/>
              <polygon points="238,33 248,38 238,43" fill="#94a3b8"/>
              <rect x="254" y="20" width="80" height="36" rx="8" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="1.5"/>
              <text x="294" y="36" textAnchor="middle" fill="#0369a1" fontSize="11" fontFamily="-apple-system,sans-serif" fontWeight="700">네이버·카카오</text>
              <text x="294" y="49" textAnchor="middle" fill="#0284c7" fontSize="10" fontFamily="-apple-system,sans-serif">연재 플랫폼</text>
              <path d="M340,38 L370,38" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3"/>
              <polygon points="368,33 378,38 368,43" fill="#94a3b8"/>
              <circle cx="396" cy="38" r="20" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5"/>
              <circle cx="396" cy="32" r="8" fill="#86efac"/>
              <path d="M382,52 Q396,42 410,52" fill="#86efac"/>
              <text x="396" y="68" textAnchor="middle" fill="#166534" fontSize="12" fontFamily="-apple-system,sans-serif" fontWeight="600">독자</text>
              <path d="M396,75 L396,86 L159,86 L159,75" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" fill="none"/>
              <polygon points="154,77 159,67 164,77" fill="#f59e0b"/>
              <rect x="440" y="26" width="68" height="24" rx="8" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1"/>
              <text x="474" y="42" textAnchor="middle" fill="#92400e" fontSize="12" fontFamily="-apple-system,sans-serif" fontWeight="700">💰 수익 정산</text>
              <path d="M416,38 L436,38" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2"/>
              <text x="270" y="98" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="-apple-system,sans-serif">독자 유료 열람 → 플랫폼 정산 → 작가 수익</text>
            </svg>
          </div>
        </div>

        {/* ══ 파이프라인 바 — 전체 흐름 내비게이션 ══ */}
        <div style={{ background: "#1a1018", color: "#fff", padding: "28px 64px" }}>
          <p style={{ fontSize: "0.95rem", opacity: 0.85, marginBottom: 20, maxWidth: 700 }}>
            👀 전체 흐름을 먼저 보세요 → 매 단계마다 사람이 직접 OK 사인을 눌러야 다음으로 넘어가요
          </p>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0 }}>
            {[
              { num: "1", label: "시리즈 설정" },
              { num: "2", label: "캐스팅" },
              { num: "3", label: "아키텍처" },
              { num: "4", label: "스크립트 작성" },
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    background: "#c45c72", color: "#fff",
                    width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>{s.num}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>{s.label}</span>
                </div>
                {i < 3 && <span style={{ color: "#e8a4b0", fontSize: 18, margin: "0 12px" }}>→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ══ 2장: 전체 개요 ══ */}
        <div className="ld-wg-section" id="overview">
          <div style={{ height: 32 }} />
          <div className="ld-wg-sec-label">전체 개요</div>
          <h2>링크드랍이 하는 일<br />아이디어부터 대본까지</h2>
          <p className="ld-wg-lead">
            "AI가 소설을 써준다고?" — 맞아요. 하지만 AI 혼자 다 하는 건 아니에요.<br />
            사람이 방향을 잡아주고, AI가 이어쓰고, 다시 사람이 검토하는 구조예요.
          </p>

          <div style={{ borderRadius: 16, overflow: "hidden", margin: "40px 0", boxShadow: "var(--shadow-float)", position: "relative" }}>
            <img
              src="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=900&q=80"
              alt="글쓰기 파이프라인 개요"
              style={{ width: "100%", height: 320, objectFit: "cover", display: "block" }}
            />
            <div style={IMG_CAPTION_STYLE}>✍️ 아이디어에서 완성된 대본까지 — 창의와 기술의 합작</div>
          </div>

          <div className="ld-wg-section-inner">
            <div style={{ ...CARD_STYLE_BASE, borderLeft: "4px solid var(--accent-aqua)" }}>
              <div style={CARD_ICON}>🏭</div>
              <h3 style={CARD_H3}>파이프라인이 뭔가요?</h3>
              <p style={CARD_P}>
                공장의 컨베이어 벨트를 생각해 보세요. 자동차를 만들 때 부품이 한 공정에서 다음 공정으로 넘어가듯,
                웹소설 대본도 <strong>설정 → 캐릭터 → 구조 → 글쓰기</strong> 순서로 단계를 밟아가요.
                각 공정에서 사람이 "이거 맞나요?" 하고 확인해야만 다음으로 넘어갈 수 있어요.
                이걸 <strong>Human Gate(사람 확인 단계)</strong>라고 불러요.
              </p>
            </div>

            <div style={{ ...CARD_STYLE_BASE, borderLeft: "4px solid var(--accent-amber)" }}>
              <div style={CARD_ICON}>🤔</div>
              <h3 style={CARD_H3}>왜 이 방식이 필요한가요?</h3>
              <p style={CARD_P}>
                AI에게 그냥 "재벌 남주 이야기 써줘" 하면 글은 써줘요. 하지만 캐릭터 설정이 흔들리거나
                원하는 감정선이 엉뚱하게 바뀌는 경우가 많아요.
                심지어 남편 옆의 사랑을 남자 주인공의 사랑으로 묘사하는 황당한 실수도 실제로 있었어요.
                그래서 <strong>규칙을 시스템에 직접 내장해</strong> AI가 스스로 벗어나지 못하게 만든 거예요.
              </p>
            </div>
          </div>
        </div>

        {/* ══ 3장: Gate 1 시리즈 설정 ══ */}
        <div className="ld-wg-section" id="gate1">
          <div style={{ height: 32 }} />
          <div className="ld-wg-sec-label">Gate 1</div>
          <h2>시리즈 설정<br />"어떤 이야기를 만들까요?"</h2>
          <p className="ld-wg-lead">
            글쓰기를 시작하기 전에 사람이 직접 두 가지를 결정해요.<br />
            장르 공식(트로프)과 첫 장면 힌트(HOOK). 이 두 가지가 모든 것의 기반이 돼요.
          </p>

          <div style={{ borderRadius: 16, overflow: "hidden", margin: "40px 0", boxShadow: "var(--shadow-float)", position: "relative" }}>
            <img
              src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=80"
              alt="웹소설 장르와 트로프"
              style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
            />
            <div style={IMG_CAPTION_STYLE}>📖 장르 공식(트로프) — 독자가 기대하는 감정의 지도</div>
          </div>

          <div className="ld-wg-section-inner">
            <div style={{ ...CARD_STYLE_BASE, borderLeft: "4px solid var(--accent-aqua)" }}>
              <div style={CARD_ICON}>🎭</div>
              <h3 style={CARD_H3}>트로프(Trope)란 무엇인가요?</h3>
              <p style={CARD_P}>
                장르 공식이라고 생각하면 돼요. 재벌-히민, 계약 연인, 알파 주인공처럼
                독자들이 이미 좋아한다고 검증된 이야기 패턴이에요.
                레시피 앱에서 베스트셀러 레시피를 고르는 것처럼, 트로프도 공식을 먼저 고르는 거예요.
                어떤 걸 골라야 할지 모르면 링크드랍이 인기 트로프를 추천해 줘요.
              </p>
            </div>

            <div style={{ ...CARD_STYLE_BASE, borderLeft: "4px solid var(--accent-amber)" }}>
              <div style={CARD_ICON}>🪝</div>
              <h3 style={CARD_H3}>HOOK — 독자의 감정을 잡아두는 장치</h3>
              <p style={CARD_P}>
                HOOK은 이야기에서 가장 인상적인 장면이에요. 이걸 두 번 활용해요.
                <strong> ① 첫 번째</strong>: 1화 맨 첫 장면에 살짝 보여줘서 "이 이야기 어떻게 되는 거지?" 하고 독자를 끌어당겨요.
                <strong> ② 두 번째</strong>: 스토리가 진행되다가 그 장면이 진짜 맥락에서 다시 등장해요. 독자가 "이 장면이었구나!" 하면서 감동을 받게 되는 거예요.
                유튜브 미리보기를 보여주고, 나중에 본편에서 다시 나오는 구조와 똑같아요.
              </p>
            </div>
          </div>
        </div>

        {/* ══ 4장: Gate 2 캐스팅 ══ */}
        <div className="ld-wg-section" id="gate2">
          <div style={{ height: 32 }} />
          <div className="ld-wg-sec-label">Gate 2</div>
          <h2>캐스팅<br />"주인공 둘, 누구로 할까요?"</h2>
          <p className="ld-wg-lead">
            두 주인공을 정하는 단계예요.<br />
            중요한 건 관계 설정이 딱 고정돼 있어야 한다는 것 — AI가 멋대로 바꿀 수 없어요.
          </p>

          <div style={{ borderRadius: 16, overflow: "hidden", margin: "40px 0", boxShadow: "var(--shadow-float)", position: "relative" }}>
            <img
              src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=900&q=80"
              alt="캐릭터 관계 설계"
              style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
            />
            <div style={IMG_CAPTION_STYLE}>👥 두 주인공의 관계 설정 — 1화 시작 시 거리감이 전부를 결정한다</div>
          </div>

          <div className="ld-wg-section-inner">
            <div style={{ ...CARD_STYLE_BASE, borderLeft: "4px solid var(--accent-aqua)" }}>
              <div style={CARD_ICON}>🎴</div>
              <h3 style={CARD_H3}>캐릭터 카드에 담긴 정보들</h3>
              <p style={CARD_P}>
                각 캐릭터는 이름과 외모만이 아니에요. <strong>장르 어울림 점수</strong>(이 장르에 얼마나 잘 맞나),
                <strong>감정 변화 유형</strong>(이 캐릭터는 어떤 감정 서사를 겪나), <strong>가족 관계</strong>,
                <strong>인간관계 지도</strong>까지 갖추고 있어요.
                영화 오디션처럼, 이 역할에 가장 잘 맞는 캐릭터를 AI가 추천하고 사람이 최종 결정해요.
              </p>
            </div>

            <div>
              <div style={{ ...CARD_STYLE_BASE, borderLeft: "4px solid var(--accent-lime)" }}>
                <div style={CARD_ICON}>🔐</div>
                <h3 style={CARD_H3}>관계 잠금 — AI가 멋대로 못 고치는 보호 장치</h3>
                <p style={CARD_P}>
                  '1화 시작 시 두 사람의 관계 상태'를 처음에 딱 한 번 설정해 두면,
                  이후 AI가 글을 쓸 때 이 설정이 <strong>자동으로 적용</strong>돼요.
                  우연히 만난 사이인지, 직장 동료인지, 처음 보는 사이인지 — 이걸 고정해두면
                  AI가 "이미 부부 사이인 것처럼" 쓰는 실수를 원천적으로 막을 수 있어요.
                </p>
              </div>
              <div className="ld-wg-tip">
                <div className="ld-wg-tip-icon">💡</div>
                <div className="ld-wg-tip-text">
                  <strong>실제 발생했던 오류</strong>: 남편이 바로 옆에 있는 사랑을 AI가 남자 주인공의 사랑으로 잘못 묘사한 적이 있었어요.
                  이 경험 덕분에 관계 잠금 기능을 만들게 됐어요.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ 5장: Gate 3 아키텍처 ══ */}
        <div className="ld-wg-section" id="gate3">
          <div style={{ height: 32 }} />
          <div className="ld-wg-sec-label">Gate 3</div>
          <h2>아키텍처<br />"6화 전체 지도를 먼저 그려요"</h2>
          <p className="ld-wg-lead">
            이제 6화 전체의 이야기 설계도를 만드는 단계예요.<br />
            건물을 짓기 전 설계도를 먼저 완성하는 것처럼, 글쓰기 전에 구조를 확정해요.
          </p>

          <div style={{ borderRadius: 16, overflow: "hidden", margin: "40px 0", boxShadow: "var(--shadow-float)", position: "relative" }}>
            <img
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=80"
              alt="스토리 아크 설계"
              style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
            />
            <div style={IMG_CAPTION_STYLE}>🗺️ 6화 이야기 아크 — 감정의 흐름과 긴장감의 배치</div>
          </div>

          <div className="ld-wg-section-inner">
            <div style={{ ...CARD_STYLE_BASE, borderLeft: "4px solid var(--accent-aqua)" }}>
              <div style={CARD_ICON}>🗺️</div>
              <h3 style={CARD_H3}>스토리 아크란 무엇인가요?</h3>
              <p style={CARD_P}>
                드라마 6화를 만든다면, 1화에서 6화까지 각 화마다
                <strong>감정이 어느 방향으로 흘러야 하는지</strong>, <strong>어디서 갈등이 터지는지</strong>,
                <strong>다음 화가 기다려지게 어디서 끊어야 하는지(클리프행어)</strong>를 미리 설계하는 거예요.
                소설 목차를 짜기 전에 <em>감정 설계도</em>를 그린다고 생각하면 돼요.
              </p>
            </div>

            <div style={{ ...CARD_STYLE_BASE, borderLeft: "4px solid #9b8ec4" }}>
              <div style={CARD_ICON}>⚡</div>
              <h3 style={CARD_H3}>설계도가 완성되면 AI가 움직여요</h3>
              <p style={CARD_P}>
                스토리 아크가 확정되면, 개별 화를 쓸 때마다 AI에게 "이번 화 어떻게 써줘?" 하고 다시 물어볼 필요가 없어요.
                링크드랍 시스템이 아크와 캐릭터 관계 정보를 <strong>자동으로 조합</strong>해서
                AI에게 딱 맞는 지시를 내려줘요. AI가 자기 멋대로 이야기를 꾸밀 여지를 최소화하는 거예요.
              </p>
            </div>
          </div>
        </div>

        {/* ══ 6장: Gate 4 스크립트 작성 ══ */}
        <div className="ld-wg-section" id="gate4">
          <div style={{ height: 32 }} />
          <div className="ld-wg-sec-label">Gate 4</div>
          <h2>스크립트 작성<br />"이제 AI가 실제로 써요"</h2>
          <p className="ld-wg-lead">
            드디어 글쓰기 단계예요! AI가 씬(장면) → 컷(단위 장면) 순서로 대본을 써내려가요.<br />
            하지만 마음대로 쓰지 않아요 — 5가지 원칙을 반드시 지켜야 해요.
          </p>

          <div style={{ borderRadius: 16, overflow: "hidden", margin: "40px 0", boxShadow: "var(--shadow-float)", position: "relative" }}>
            <img
              src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=900&q=80"
              alt="스크립트 작성 프로세스"
              style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
            />
            <div style={IMG_CAPTION_STYLE}>✍️ 씬에서 컷으로 — AI가 원칙을 지키며 대본을 쓰는 과정</div>
          </div>

          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 20, color: "var(--color-text)" }}>✍️ 글쓰기 5대 원칙</h3>

          <div style={{ overflowX: "auto", marginBottom: 32 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {["원칙 이름", "규칙 내용", "이 규칙이 없다면"].map((h) => (
                    <th key={h} style={{ background: "#1a1018", color: "#fff", padding: "14px 18px", textAlign: "left", fontSize: 13, letterSpacing: "1px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "서사 우선",      rule: "지문 중심으로 쓰고, 대사는 보조로만 사용해요",                              why: "대사만 많으면 드라마 대본처럼 보여 독자가 이탈해요" },
                  { name: "대사 상한",      rule: "1화는 3장면 이하, 2화부터는 5장면 이하. 초과분은 자동으로 지문으로 변환돼요", why: "대사가 너무 많으면 몰입 흐름이 깨져요" },
                  { name: "HOOK 이중 등장", rule: "첫 장면에 한 번, 이야기 절정부에서 한 번 더 등장해요",                      why: "독자를 끝까지 붙들어두는 감정 장치가 없어지게 돼요" },
                  { name: "장면 묘사 고정", rule: "장면 묘사는 미리 설정된 한국어 표현 규칙을 따라요",                          why: "규칙이 없으면 AI가 표현을 제멋대로 바꿔버려요" },
                  { name: "캐릭터 고정",    rule: "외모·성격 기본값은 고정이에요. 사이 변동이나 외모 수정은 없어요",             why: "화마다 외모가 달라지면 독자가 혼란스러워요" },
                ].map((row, i) => (
                  <tr key={row.name}>
                    <td style={{ padding: "14px 18px", fontSize: "0.93rem", borderBottom: "1px solid var(--glass-border)", background: i % 2 === 1 ? "rgba(0,0,0,0.03)" : "transparent", fontWeight: 700, color: "var(--accent-aqua)", whiteSpace: "nowrap" }}>{row.name}</td>
                    <td style={{ padding: "14px 18px", fontSize: "0.93rem", borderBottom: "1px solid var(--glass-border)", background: i % 2 === 1 ? "rgba(0,0,0,0.03)" : "transparent", color: "var(--color-text-muted)" }}>{row.rule}</td>
                    <td style={{ padding: "14px 18px", fontSize: "0.93rem", borderBottom: "1px solid var(--glass-border)", background: i % 2 === 1 ? "rgba(0,0,0,0.03)" : "transparent", color: "var(--color-text-muted)" }}>{row.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ld-wg-tip">
            <div className="ld-wg-tip-icon">📋</div>
            <div className="ld-wg-tip-text">
              <strong>작성 후 사람 검토 체크리스트</strong><br /><br />
              ① 캐릭터 관계 묘사가 처음 설정한 내용과 일치하나요?<br />
              ② 대사 장면 수가 원칙 이내인가요?<br />
              ③ HOOK 장면이 감정적으로 살아있나요?<br />
              ④ 지문 문체가 웹소설답게 읽히나요?<br /><br />
              이 4가지를 사람이 직접 읽고 확인해야 다음 단계(이미지 생성)로 넘어갈 수 있어요.
            </div>
          </div>
        </div>

        {/* ══ 7장: 품질 관리 ══ */}
        <div className="ld-wg-section" id="quality">
          <div style={{ height: 32 }} />
          <div className="ld-wg-sec-label">품질 관리</div>
          <h2>원칙이 시스템에<br />자동으로 내장돼 있어요</h2>
          <p className="ld-wg-lead">
            이 파이프라인의 가장 강력한 특징 — 좋은 글쓰기 원칙이 사람의 기억이 아닌<br />
            <strong>시스템 자체에 내장</strong>되어 있다는 거예요.
          </p>

          <div style={{ borderRadius: 16, overflow: "hidden", margin: "40px 0", boxShadow: "var(--shadow-float)", position: "relative" }}>
            <img
              src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=900&q=80"
              alt="품질 관리 체크리스트"
              style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
            />
            <div style={IMG_CAPTION_STYLE}>✔ 품질 관리 — 사람의 기억이 아닌 시스템이 지켜줘요</div>
          </div>

          <div className="ld-wg-section-inner">
            <div style={{ ...CARD_STYLE_BASE, borderLeft: "4px solid var(--accent-aqua)" }}>
              <div style={CARD_ICON}>⚙️</div>
              <h3 style={CARD_H3}>"시스템에 내장된 원칙"이란?</h3>
              <p style={CARD_P}>
                요리법에 "소금 1 티스푼"이라고 써 있어도, 피곤한 날엔 2 티스푼을 넣을 수 있잖아요.
                하지만 기계가 정확히 1 티스푼만 나오도록 설계돼 있다면 실수가 없겠죠.
                링크드랍이 딱 그 구조예요 — 대사 상한, 관계 설정, HOOK 구조 같은 원칙이 시스템에 내장돼 있어서
                <strong>AI도, 사람도 실수로 어길 수 없어요.</strong>
              </p>
            </div>

            <div>
              <div style={{ ...CARD_STYLE_BASE, borderLeft: "4px solid #c45c72" }}>
                <div style={CARD_ICON}>🔒</div>
                <h3 style={CARD_H3}>핵심 품질 원칙 17가지</h3>
                <p style={CARD_P}>
                  링크드랍의 핵심 설계 원칙 17가지는 <strong>잠금 처리</strong>가 돼 있어요.
                  개발 중에 "이거 바꿔도 될까?" 하더라도 임의로 변경할 수 없어요.
                  건물의 기초 공사처럼, 한번 올라간 다음엔 함부로 바꿀 수 없는 결정들이에요.
                </p>
                <div style={{
                  background: "rgba(196,92,114,0.07)", border: "1.5px solid rgba(196,92,114,0.2)",
                  borderRadius: 10, padding: "16px 18px", marginTop: 20,
                  fontSize: "0.9rem", color: "var(--color-text)",
                }}>
                  <strong>한 줄 요약</strong>: AI가 생성하고, 사람이 매 단계 확인하고, 원칙이 시스템에 내장되어 품질을 최소 기준 이상 보장해요.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 56 }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 28, color: "var(--color-text)" }}>전체 게이트 흐름 한눈에 보기</h3>
            <div className="ld-wg-timeline">
              {[
                { num: "1", sub: "시리즈 설정",   desc: "장르 공식(트로프) + 첫 장면 힌트(HOOK) 선택. 사람이 직접 결정하고, AI는 추천만 해요." },
                { num: "2", sub: "캐스팅",        desc: "두 주인공 선정. 1화 시작 시 관계 상태를 시스템에 잠금. AI 추천 → 사람이 최종 승인해요." },
                { num: "3", sub: "아키텍처",      desc: "6화 감정 설계도 작성. 화별 갈등·클리프행어 위치 확정. 사람 승인 후에는 변경되지 않아요." },
                { num: "4", sub: "스크립트 작성", desc: "AI가 5가지 원칙 안에서 대본 작성. 사람 검토 후 이미지 생성 단계로 진행돼요." },
              ].map((g) => (
                <div key={g.num} className="ld-wg-tl-item">
                  <div className="ld-wg-tl-dot" style={{ background: "#c45c72" }} />
                  <div>
                    <div className="ld-wg-tl-label">Gate {g.num}</div>
                    <div className="ld-wg-tl-text"><strong>{g.sub}</strong>: {g.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ 온라인부업 주제 찾기 → landing10 이동 버튼 ══ */}
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <a
            href="/landing/landing10"
            className="ld-wg-topic-btn"
          >
            🎯 내 온라인 부업 주제 찾기
            <span style={{ fontSize: "1.4em" }}>→</span>
          </a>
        </div>


      </div>
    </div>
  );
}
