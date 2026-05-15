"use client";
import React, { useState, useEffect } from "react";
import "@/styles/pages/landing12.css";
import externalLinks from "@/data/external-links.json";

// ────────────────────────────────────────────────────────────
// LdLanding12 — landing12 전용
// 주제: 사주×타로 글로벌 AI 상담 앱 사업계획서
// 커버+Ch1: 감성·설득 (유저), Ch2~5: 투자자 수치
// 콤보: 퍼플 #7C3AED (BaZi/동양) + 골드 #F59E0B (Tarot/서양)
// ────────────────────────────────────────────────────────────

export default function LdLanding12() {
  const [screen, setScreen] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setScreen(s => (s + 1) % 3), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="ld-st-wrap">
      {/* blob 배경 */}
      <div className="lg-bg" aria-hidden="true">
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />
      </div>

      {/* ════════════════════════════════════════════════════
          커버 — 감성
      ════════════════════════════════════════════════════ */}
      <section className="ld-st-cover">
        <video
          src="https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/landing12/landing12_cover.mp4"
          className="ld-st-cover-video"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="ld-st-cover-overlay" />

        {/* 왼쪽 텍스트 */}
        <div className="ld-st-cover-content">
          <div className="ld-st-cover-app-name">소원 · Sowon</div>
          <div className="ld-st-cover-app-sub">BaZi × Tarot AI</div>
          <p className="ld-st-cover-tagline">
            당신이 태어난 순간이<br />
            오늘 당신의 선택을 말합니다
          </p>
          <div className="ld-st-trust-badges">
            <div className="ld-st-trust-badge">
              <span className="ld-st-trust-badge-icon">🔒</span>
              사주 계산은 기기 내 알고리즘 — 서버 전송 없음
            </div>
            <div className="ld-st-trust-badge">
              <span className="ld-st-trust-badge-icon">🛡️</span>
              고민 내용은 AI 학습에 사용되지 않습니다
            </div>
            <div className="ld-st-trust-badge">
              <span className="ld-st-trust-badge-icon">💳</span>
              결제는 Apple · Google이 직접 처리
            </div>
          </div>
        </div>

        {/* 오른쪽 폰 목업 */}
        <div className="ld-st-iframe-stage">
          <iframe
            src="/sample/01_splash.html"
            className={`ld-st-iframe${screen === 0 ? " active" : ""}`}
            title="Sowon Splash"
            scrolling="no"
          />
          <iframe
            src="/sample/06_CardDraw.html"
            className={`ld-st-iframe${screen === 1 ? " active" : ""}`}
            title="Card Draw"
            scrolling="no"
          />
          <iframe
            src="/sample/07_CardReveal.html"
            className={`ld-st-iframe${screen === 2 ? " active" : ""}`}
            title="Card Reveal"
            scrolling="no"
          />
          <div className="ld-st-iframe-dots">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`ld-st-idot${screen === i ? " on" : ""}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          본문
      ════════════════════════════════════════════════════ */}
      <div className="ld-st-doc">

        {/* Ch1 — 서비스 개요 (감성) */}
        <section id="ch1" className="ld-st-section">
          <div className="ld-st-section-eyebrow">Chapter 1 — 서비스 개요</div>
          <h2 className="ld-st-section-h2">
            세상에 똑같은 사람은 없습니다.<br />
            당신의 사주가 말하는 오늘
          </h2>
          <p className="ld-st-section-lead">
            생년월일시로 당신만의 에너지 패턴을 읽고, 마음이 끌리는 타로 3장을 뽑습니다.
            AI가 두 언어를 하나의 답으로 엮어 지금 이 고민에 맞는 리딩을 건넵니다.
          </p>

          <div className="ld-st-feature-grid">
            <div className="ld-st-feature-card">
              <div className="ld-st-feature-icon">🀄</div>
              <div className="ld-st-feature-title">사주 자동 계산</div>
              <p className="ld-st-feature-desc">
                생년월일시만 입력하세요. 태어난 순간의 에너지를 8글자로 읽어냅니다.
                입력이 끝나면 다음 상담엔 묻지 않습니다.
              </p>
            </div>
            <div className="ld-st-feature-card">
              <div className="ld-st-feature-icon">🃏</div>
              <div className="ld-st-feature-title">타로 3장 드로우</div>
              <p className="ld-st-feature-desc">
                78장의 카드 중 마음이 끌리는 3장을 고르세요.
                과거, 지금, 앞으로 — 손이 먼저 압니다.
              </p>
            </div>
            <div className="ld-st-feature-card">
              <div className="ld-st-feature-icon">✨</div>
              <div className="ld-st-feature-title">AI 통합 리딩</div>
              <p className="ld-st-feature-desc">
                사주가 밑그림이라면, 타로는 오늘의 색입니다.
                AI가 두 언어를 하나의 답으로 엮어 당신의 질문에 답합니다.
              </p>
            </div>
          </div>

          {/* AI 리딩 샘플 */}
          <div className="ld-st-chat-sample">
            <div className="ld-st-chat-label">AI 리딩 샘플</div>
            <div className="ld-st-reading-frame-wrap">
              <iframe
                src="/sample/reading_sample.html"
                className="ld-st-reading-frame"
                title="AI 리딩 샘플"
                scrolling="no"
              />
            </div>
          </div>
        </section>

        <hr className="ld-st-divider" />

        {/* Ch2 — 시장 공백 (투자자) */}
        <section id="ch2" className="ld-st-section">
          <div className="ld-st-section-eyebrow">Chapter 2 — 시장 공백</div>
          <h2 className="ld-st-section-h2">
            $2.2B 시장,<br />아무도 BaZi를 넣지 않았다
          </h2>
          <p className="ld-st-section-lead">
            글로벌 점성술·운세 앱 시장은 2023년 $2.2B, 2030년 $3.9B으로 성장합니다.
            Co-Star·The Pattern·Sanctuary 등 주요 플레이어는 전부 서양 점성술 기반입니다.
            영어로 사주명리를 제공하는 글로벌 앱은 현재 존재하지 않습니다.
          </p>

          {/* TAM / SAM / SOM */}
          <div className="ld-st-market-grid">
            <div className="ld-st-market-card">
              <div className="ld-st-market-label">TAM</div>
              <div className="ld-st-market-value">$3.9B</div>
              <div className="ld-st-market-desc">글로벌 점성술·운세 앱 시장<br />(2030 예측)</div>
            </div>
            <div className="ld-st-market-card">
              <div className="ld-st-market-label">SAM</div>
              <div className="ld-st-market-value">200만+</div>
              <div className="ld-st-market-desc">영어권 동양 문화 관심층<br />+ 한국계 디아스포라</div>
            </div>
            <div className="ld-st-market-card">
              <div className="ld-st-market-label">SOM · 12개월 목표</div>
              <div className="ld-st-market-value">DAU 1,000</div>
              <div className="ld-st-market-desc">ARR $365K<br />(4회/월 × $1 기준)</div>
            </div>
          </div>

          {/* 경쟁사 테이블 */}
          <div className="ld-st-table-wrap">
            <table className="ld-st-table">
              <thead>
                <tr>
                  <th>서비스</th>
                  <th>기반</th>
                  <th>강점</th>
                  <th>약점</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Co-Star</td>
                  <td>서양 점성술</td>
                  <td>세련된 UX, Z세대 친화 브랜드</td>
                  <td>사주 없음, 동양 문화 부재</td>
                </tr>
                <tr>
                  <td>The Pattern</td>
                  <td>서양 점성술</td>
                  <td>관계·성향 분석 특화</td>
                  <td>사주 없음</td>
                </tr>
                <tr>
                  <td>Sanctuary</td>
                  <td>타로 + 점성술</td>
                  <td>실시간 리딩, 콘텐츠 풍부</td>
                  <td>사주 없음, 동양 맥락 미흡</td>
                </tr>
                <tr>
                  <td>국내 사주 앱들</td>
                  <td>사주</td>
                  <td>로컬 사용자 기반</td>
                  <td>글로벌 진출 취약, 영어 UX 부재</td>
                </tr>
                <tr className="ld-st-table-highlight">
                  <td>✦ 소원 Sowon</td>
                  <td>사주 + 타로</td>
                  <td>유일한 사주×타로 결합, 영어 우선 글로벌 설계</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 경쟁 해자 */}
          <div className="ld-st-section-eyebrow" style={{ marginTop: 40, marginBottom: 16 }}>경쟁 해자 (Moat)</div>
          <div className="ld-st-moat-list">
            <div className="ld-st-moat-item">
              <div className="ld-st-moat-num">①</div>
              <div>
                <div className="ld-st-moat-title">데이터 해자</div>
                <p className="ld-st-moat-desc">한국 명리학 전문가 검증 사주 키워드 DB — 영어권에 이 데이터셋 자체가 존재하지 않습니다. Co-Star가 BaZi를 추가하려면 데이터부터 새로 쌓아야 합니다.</p>
              </div>
            </div>
            <div className="ld-st-moat-item">
              <div className="ld-st-moat-num">②</div>
              <div>
                <div className="ld-st-moat-title">문화 네트워크</div>
                <p className="ld-st-moat-desc">한국·동아시아 커뮤니티 바이럴 채널은 서양 점성술 앱의 맹점입니다. 한인 디아스포라 + K-컬처 관심층이 자발적 전파 채널이 됩니다.</p>
              </div>
            </div>
            <div className="ld-st-moat-item">
              <div className="ld-st-moat-num">③</div>
              <div>
                <div className="ld-st-moat-title">카테고리 선점</div>
                <p className="ld-st-moat-desc">글로벌 BaZi × 타로 앱 카테고리는 공백입니다. 앱스토어에서 1위가 표준이 됩니다 — Co-Star가 서양 점성술에서 그랬듯.</p>
              </div>
            </div>
          </div>

          {/* 왜 지금인가 */}
          <div className="ld-st-why-now">
            <div className="ld-st-why-now-label">왜 지금인가</div>
            <p className="ld-st-why-now-text">
              2012년 Co-Star 창업 당시, 서양 점성술 앱 시장도 지금 사주 시장과 같았습니다.
              AI API 비용이 처음으로 1인 개발자 수준으로 내려온 2024년,
              IAP 인프라가 전 세계 동시 출시를 혼자 가능하게 만든 지금이 그 창업 시점입니다.
            </p>
          </div>
        </section>

        <hr className="ld-st-divider" />

        {/* Ch3 — 사용자 흐름 (투자자) */}
        <section id="ch3" className="ld-st-section">
          <div className="ld-st-section-eyebrow ld-st-section-eyebrow--gold">Chapter 3 — 사용자 흐름</div>
          <h2 className="ld-st-section-h2">
            생년월일시 입력부터<br />AI 리딩까지 5단계
          </h2>
          <p className="ld-st-section-lead">
            첫 상담은 5단계로 진행됩니다. 두 번째 상담부터는 사주 정보가 저장되어
            타로 드로우 + 질문 입력만으로 바로 리딩이 가능합니다.
          </p>

          <div className="ld-st-flow">
            {[
              { num: "1", gold: false, title: "기본 정보 입력", desc: "출생 연도(필수)·태어난 시간(선택)을 입력합니다. 이후 상담에서는 저장된 정보를 그대로 사용합니다." },
              { num: "2", gold: false, title: "타로 3장 선택", desc: "78장의 카드 중 마음이 끌리는 3장을 고릅니다. Past · Present · Future 포지션에 따라 의미가 배치됩니다." },
              { num: "3", gold: true,  title: "$1 결제 (IAP)", desc: "상담 1회 = $1. Apple IAP / Google Billing을 통해 결제합니다. Apple·Google 수수료 30% 차감 후 실수익 $0.70." },
              { num: "4", gold: false, title: "고민 입력", desc: "결제 후 채팅 UI가 활성화됩니다. 사용자가 질문을 자유롭게 입력합니다." },
              { num: "5", gold: true,  title: "AI 리딩 수신", desc: "사주 패턴 + 타로 3장 + 질문을 통합 분석해 따뜻한 채팅 버블 3~5개로 맞춤 답변을 생성합니다." },
            ].map((step, idx, arr) => (
              <div key={step.num} className="ld-st-flow-step">
                <div className="ld-st-flow-left">
                  <div className={`ld-st-flow-num${step.gold ? " ld-st-flow-num--gold" : ""}`}>{step.num}</div>
                  {idx < arr.length - 1 && <div className="ld-st-flow-connector" />}
                </div>
                <div className="ld-st-flow-body">
                  <div className="ld-st-flow-title">{step.title}</div>
                  <p className="ld-st-flow-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="ld-st-divider" />

        {/* Ch4 — 기술 스택 (투자자) */}
        <section id="ch4" className="ld-st-section">
          <div className="ld-st-section-eyebrow">Chapter 4 — 기술 스택</div>
          <h2 className="ld-st-section-h2">
            1인 개발자도 6개월 안에<br />런칭할 수 있는 스택
          </h2>
          <p className="ld-st-section-lead">
            검증된 오픈소스 조합으로 최소 비용, 최단 기간 MVP를 구성합니다.
            사주 계산과 타로 키워드는 순수 알고리즘으로 처리해 LLM 호출 비용을 최소화합니다.
          </p>

          <div className="ld-st-tech-grid">
            <div className="ld-st-tech-card">
              <div className="ld-st-tech-label">프론트엔드</div>
              <div className="ld-st-tech-value">React Native + Expo</div>
              <p className="ld-st-tech-desc">iOS·Android 동시 개발. Expo Go로 즉시 테스트 가능.</p>
            </div>
            <div className="ld-st-tech-card">
              <div className="ld-st-tech-label">인증</div>
              <div className="ld-st-tech-value">Supabase Auth</div>
              <p className="ld-st-tech-desc">Google·Apple 소셜 로그인. 별도 인증 서버 불필요.</p>
            </div>
            <div className="ld-st-tech-card">
              <div className="ld-st-tech-label">로컬 DB</div>
              <div className="ld-st-tech-value">SQLite (expo-sqlite)</div>
              <p className="ld-st-tech-desc">기기 내 상담 내역 저장. 앱 재설치·기기 교체 시 서버 백업으로 복원.</p>
            </div>
            <div className="ld-st-tech-card">
              <div className="ld-st-tech-label">백엔드</div>
              <div className="ld-st-tech-value">FastAPI + Supabase</div>
              <p className="ld-st-tech-desc">사주 계산 API·LLM 호출·IAP 영수증 검증. PostgreSQL 백업 DB.</p>
            </div>
            <div className="ld-st-tech-card">
              <div className="ld-st-tech-label">AI / LLM</div>
              <div className="ld-st-tech-value">Gemini Free Tier 우선</div>
              <p className="ld-st-tech-desc">비용 효율 우선. 구조화된 컨텍스트로 모델 교체 시 품질 격차 최소화.</p>
            </div>
            <div className="ld-st-tech-card">
              <div className="ld-st-tech-label">결제</div>
              <div className="ld-st-tech-value">Apple IAP + Google Billing</div>
              <p className="ld-st-tech-desc">디지털 콘텐츠 앱 정책상 IAP 필수. Stripe 등 외부 결제 사용 불가.</p>
            </div>
          </div>
        </section>

        <hr className="ld-st-divider" />

        {/* Ch5 — 수익 & 로드맵 (투자자) */}
        <section id="ch5" className="ld-st-section">
          <div className="ld-st-section-eyebrow ld-st-section-eyebrow--gold">Chapter 5 — 수익 모델 & 로드맵</div>
          <h2 className="ld-st-section-h2">상담 1회 = $1, 단순하고 명확한 수익</h2>
          <p className="ld-st-section-lead">
            구독 없이 1회 결제 구조로 진입 장벽을 낮춥니다.
            무료 첫 체험 → 유료 전환 → 패키지 상품 확장 순서로 수익을 키웁니다.
          </p>

          <div className="ld-st-revenue-grid">
            <div className="ld-st-revenue-card">
              <div className="ld-st-revenue-value">$1</div>
              <div className="ld-st-revenue-label">상담 1회 가격<br />(Apple·Google IAP)</div>
            </div>
            <div className="ld-st-revenue-card">
              <div className="ld-st-revenue-value ld-st-revenue-value--gold">$0.70</div>
              <div className="ld-st-revenue-label">회당 실수익<br />(수수료 30% 차감 후)</div>
            </div>
            <div className="ld-st-revenue-card">
              <div className="ld-st-revenue-value">≈0</div>
              <div className="ld-st-revenue-label">서버 비용 (초기)<br />(Gemini Free + Supabase Free)</div>
            </div>
          </div>

          {/* 유닛 이코노믹스 */}
          <table className="ld-st-metrics-table">
            <thead>
              <tr>
                <th>지표</th>
                <th>수치</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>상담 단가</td>
                <td>$1.00</td>
                <td>Apple·Google IAP</td>
              </tr>
              <tr>
                <td>실수익 / 건</td>
                <td>$0.70</td>
                <td>스토어 수수료 30% 차감</td>
              </tr>
              <tr>
                <td>연간 LTV (월 4회 유저)</td>
                <td>$33.6</td>
                <td>$0.70 × 4 × 12</td>
              </tr>
              <tr>
                <td>목표 CAC</td>
                <td>$5 이하</td>
                <td>소셜 바이럴 기반</td>
              </tr>
              <tr>
                <td>손익분기 DAU</td>
                <td>500명</td>
                <td>Gemini Free + Supabase Free 구간</td>
              </tr>
            </tbody>
          </table>

          <div className="ld-st-roadmap">
            <div className="ld-st-roadmap-card">
              <div className="ld-st-roadmap-stage">Stage 1</div>
              <div className="ld-st-roadmap-period">1 ~ 2개월</div>
              <div className="ld-st-roadmap-title">데이터 & 설계</div>
              <ul className="ld-st-roadmap-list">
                <li>타로 78장 × 정/역 156개 키워드 정리</li>
                <li>사주(연주·일주) 계산 알고리즘 구현</li>
                <li>AI 프롬프트 템플릿 설계</li>
              </ul>
            </div>
            <div className="ld-st-roadmap-card">
              <div className="ld-st-roadmap-stage">Stage 2</div>
              <div className="ld-st-roadmap-period">2 ~ 4개월</div>
              <div className="ld-st-roadmap-title">앱 & 백엔드 개발</div>
              <ul className="ld-st-roadmap-list">
                <li>FastAPI 백엔드 (사주 API, LLM 호출, IAP 검증)</li>
                <li>Supabase 스키마 & Auth 연동</li>
                <li>React Native UI (정보 입력, 카드 셔플, 채팅, 마이페이지)</li>
              </ul>
            </div>
            <div className="ld-st-roadmap-card">
              <div className="ld-st-roadmap-stage">Stage 3</div>
              <div className="ld-st-roadmap-period">4 ~ 6개월</div>
              <div className="ld-st-roadmap-title">결제 연동 & 출시</div>
              <ul className="ld-st-roadmap-list">
                <li>Apple IAP / Google Play Billing 연동 & QA</li>
                <li>소규모 영어권 베타 테스트</li>
                <li>피드백 반영 후 App Store·Google Play 심사 제출</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 결론 — 이원화 CTA */}
        <div className="ld-st-conclusion">
          <div className="ld-st-conclusion-eyebrow">✦ Conclusion</div>
          <h2 className="ld-st-conclusion-h2">
            아무도 없는 자리,<br />지금 시작할 수 있습니다
          </h2>
          <p className="ld-st-conclusion-desc">
            글로벌 미스틱 앱 시장은 이미 수천만 유저가 검증했습니다.
            그 시장에 사주를 더하는 자리는 아직 비어 있습니다.
          </p>
          <div className="ld-st-cta-group">
            <a
              href={externalLinks.kakao}
              target="_blank"
              rel="noopener noreferrer"
              className="ld-st-cta-btn"
            >
              베타 웨이트리스트 등록 →
            </a>
            <a
              href={externalLinks.kakao}
              target="_blank"
              rel="noopener noreferrer"
              className="ld-st-cta-btn--ghost"
            >
              투자·파트너 미팅 요청 →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
