"use client";

import React, { useEffect, useState } from "react";
import "@/styles/pages/landing3.css";
import LdCinematicVideoBg from "@/components/landing/cinematic/LdCinematicVideoBg";

// 🔒 LD-006: 동적 JS 값만 style={{}} 허용. 정적 스타일은 landing3.css로 이동.

// ── 커버 롤링 동영상 목록 ──────────────────────────────
const COVER_VIDEOS: { playbackId?: string; src?: string }[] = [
  { src: "https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/landing8/landing8_top.mp4" },
  { playbackId: "MBwdIMmz2tTxH02HXvLQXhav4vs802gKOZUJ6xoe800r48" },
  { playbackId: "o6OwfjPw372zfR1k02ubDFNPfdNszEYGo6AS00Ga00Oygs" },
  { playbackId: "qMV2bGzaF6lkzPr7xxgvBbrd2OWWh5vJxP5EDeCgbr4" },
];

// ── 목차 스테퍼 ────────────────────────────────────────────────────
const STEPS = [
  { href: "#ch1", num: "1", label: "동화책 + 유튜브 영상 직접 만들기", sub: "배우면 누구나 할 수 있습니다" },
  { href: "#ch2", num: "2", label: "나도 정말 배울 수 있을까요?",      sub: "50대+ AI 초보자도 됩니다" },
  { href: "#ch3", num: "3", label: "얼굴이 바뀌지 않는 AI 삽화",      sub: "사진 그대로 책·영상 속 주인공" },
  { href: "#ch4", num: "4", label: "책 + 영상 제작부터 출판까지",     sub: "링크드랍이 단계별로 알려드립니다" },
  { href: "#ch5", num: "5", label: "유튜브·출판·부업 활용법",         sub: "만드는 법 알면 무한 활용" },
  { href: "#ch6", num: "6", label: "가격과 수익 구조",                sub: "책 + 영상으로 돈도 법니다" },
] as const;

// ── 챕터 상단 풀너비 이미지 블록 — 캡션 오버레이 포함
function ChapterImage({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <div className="ld-pb-chapter-img">
      <img src={src} alt={alt} loading="lazy" />
      <div className="ld-pb-chapter-img-caption">{caption}</div>
    </div>
  );
}

// ── 롤링 커버 비디오 (15초 간격, 크로스페이드) ─────────────────────
function LdRollingCover() {
  const [idx, setIdx] = useState(0);
  const [wrapperOpacity, setWrapperOpacity] = useState(1);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const interval = setInterval(() => {
      setWrapperOpacity(0);
      setTimeout(() => {
        setIdx((prev) => (prev + 1) % COVER_VIDEOS.length);
        setTimeout(() => setWrapperOpacity(1), 2500);
      }, 1000);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        opacity: wrapperOpacity,          // 동적 — 상태값
        transition: "opacity 1s ease",
      }}
    >
      <LdCinematicVideoBg
        key={COVER_VIDEOS[idx].playbackId ?? COVER_VIDEOS[idx].src}
        playbackId={COVER_VIDEOS[idx].playbackId}
        src={COVER_VIDEOS[idx].src}
      />
    </div>
  );
}

// ============================================================
// LdLanding3 — landing3 전용 (구 LdPictureBookGuide)
// 주제: AI 동화책 제작·출판
// 콤보 ⓒ: amber #FFCC00 / BG #2A1505
// 이미지 배치 규칙: 챕터 상단 풀너비 (그리드 칸 안 배치 금지)
// ============================================================
export default function LdLanding3() {
  return (
    <div className="ld-wg-wrap ld-wg-theme-amber">

      {/* ══ 커버 — 롤링 배경영상 ══ */}
      <div className="ld-wg-cover" id="top">
        <LdRollingCover />
        <div className="ld-wg-cover-inner">
          <div className="ld-wg-cover-left">
            <div className="ld-wg-cover-badge">AI 동화책 + 유튜브 영상 제작 — 배우면 내가 직접 만듭니다</div>
            <h1>손자·손녀가<br />주인공인 동화책<br />직접 만드세요</h1>
            <p className="ld-wg-cover-sub">
              링크드랍이 단계별로 알려드립니다.<br />
              AI 삽화로 동화책 만들고, 유튜브 영상으로 만들어 채널까지 운영합니다.<br />
              50대+ AI 초보자도 배우면 충분히 할 수 있습니다
            </p>
            <a
              href="https://open.kakao.com/o/linkdrop"
              target="_blank"
              rel="noopener noreferrer"
              className="ld-pb-cta"
            >
              지금 시작하기 →
            </a>
            <div className="ld-wg-cover-footer">
              · 그림 실력 불필요 &nbsp;·&nbsp; AI 경험 0이어도 됩니다 &nbsp;·&nbsp; 동화책 + 영상 동시 제작
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
                {i < STEPS.length - 1 && (
                  <div className="ld-wg-stepper-line" aria-hidden="true" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="ld-wg-doc">

        {/* ══ Chapter 1 — 대표 영상 섹션 (1:1) ══ */}
        <div className="ld-wg-section ld-pb-ch1-video" id="ch1">
          <LdCinematicVideoBg src="https://pub-3004911807a7429c89c576d1aa468160.r2.dev/V2/landing3/%5BDLBunny.com%5D%5Bxhs%5D2026-4-25-2-36-12.mp4" />
          <div className="ld-pb-ch1-content">
            <div className="ld-pb-ch1-titles">
              {["내가 직접 만드는", "AI 동화책", "유튜브 영상"].map((line) => (
                <span key={line} className="ld-pb-ch1-title-line">{line}</span>
              ))}
            </div>
            <p className="ld-pb-ch1-sub">
              <span className="ld-pb-ch1-dancing">
                You don&apos;t need to be an artist. You don&apos;t need to know coding.<br />
                LinkDrop shows you how to make a picture book — and a YouTube video.<br />
                AI draws the pictures. You tell the story.<br />
                A book for the shelf. A video for the screen.<br />
                Both with their face on every page, every frame.<br />
                &ldquo;할머니가 직접 만든 책이야&rdquo; — that&apos;s a gift they&apos;ll never forget.
              </span>
            </p>
          </div>
        </div>

        {/* ══ Chapter 2 — 설득·공감 (초보자 진입 섹션) ══ */}
        <div className="ld-wg-section" id="ch2">
          <div className="ld-pb-spacer" />
          <div className="ld-wg-sec-label">Chapter 2</div>
          <h2>"저는 그림도 못 그리고 글 실력도 없는데요…"</h2>
          <p className="ld-wg-lead">
            처음 들으셨을 때 당연히 드는 생각입니다. 그런데 이건 그림 실력이나
            글 실력의 문제가 아닙니다. <strong>AI 도구를 어떻게 쓰는지 아느냐</strong>의 문제입니다.
            링크드랍은 그 방법을 단계별로 알려드립니다.
          </p>

          {/* 핵심 전환 카드 */}
          <div className="ld-pb-pivot-card">
            <div className="ld-pb-pivot-badge">링크드랍을 통해 배우면 이걸 직접 할 수 있게 됩니다</div>
            <div className="ld-pb-pivot-list">
              ① AI로 삽화를 직접 생성하기<br />
              ② 한글·영어 동화책 편집하기<br />
              ③ 동화책을 유튜브 영상으로 만들기<br />
              ④ 부크크·아마존·유튜브에 직접 출판·업로드<br />
              ⑤ 책과 영상을 판매해 수익 만들기
            </div>
            <div className="ld-pb-pivot-desc">
              처음엔 낯설지만, 링크드랍의 단계별 가이드를 따라 하다 보면
              어느새 혼자서도 동화책 한 권을 완성하고 있는 자신을 발견하게 됩니다.
            </div>
          </div>

          {/* 흔한 걱정 4가지 */}
          <div className="ld-wg-section-inner">
            <div>
              {[
                {
                  q: "AI가 뭔지 잘 모르고, 컴퓨터도 서툴러요",
                  a: "링크드랍은 AI 완전 초보자를 기준으로 만들었습니다. 스마트폰이나 PC에서 따라 하기만 하면 됩니다. 실제로 60~70대 회원분들도 첫 책을 완성하셨습니다.",
                },
                {
                  q: "그림을 전혀 못 그려요",
                  a: "그림은 AI가 그립니다. '숲속에서 강아지랑 뛰어노는 장면'처럼 말로 설명하면 AI가 수채화·동화 스타일로 자동 생성합니다. 그림 실력은 0%도 필요 없습니다.",
                },
                {
                  q: "이야기를 어떻게 만들어야 할지 모르겠어요",
                  a: "링크드랍이 이야기 구조 짜는 법도 알려드립니다. AI에게 어떻게 말하면 기-승-전-결이 잡히는지, 손자·손녀 이름을 넣어 개인화하는 법까지 순서대로 배웁니다.",
                },
                {
                  q: "출판·판매는 너무 복잡할 것 같아요",
                  a: "ISBN 신청, 부크크 업로드, 교보문고 입점 신청 — 링크드랍 가이드에 화면 캡처와 함께 순서대로 나와 있습니다. 따라 하면 혼자서도 할 수 있습니다.",
                },
              ].map((item) => (
                <div key={item.q} className="ld-pb-worry-card">
                  <div className="ld-pb-worry-q">
                    <span className="ld-pb-worry-icon">🙋</span>
                    <div className="ld-pb-worry-text">{item.q}</div>
                  </div>
                  <div className="ld-pb-worry-answer">{item.a}</div>
                </div>
              ))}
            </div>

            <div>
              {/* 왜 이게 효과적인가 */}
              <div className="ld-pb-explain-card">
                <div className="ld-pb-explain-badge">내가 직접 만들면 무엇이 달라지나요?</div>
                <p className="ld-pb-explain-p">
                  서점에서 파는 동화책은 <strong className="ld-pb-explain-strong">누군가의 이야기</strong>입니다.
                  하지만 링크드랍으로 내가 직접 만든 책에는
                  <strong className="ld-pb-explain-strong">손자·손녀 얼굴과 이름</strong>이 들어갑니다.
                  아이들은 자기가 주인공인 이야기를 몇 번이고 다시 읽습니다.
                </p>
                <p className="ld-pb-explain-p">
                  그리고 이 능력은 <strong className="ld-pb-explain-strong">한 번만 배우면</strong> 계속 씁니다.
                  손자에게 한 권, 손녀에게 한 권, 이웃에게 팔아 수익도 —
                  배운 것이 <strong className="ld-pb-explain-strong">나만의 새로운 무기</strong>가 됩니다.
                </p>
              </div>

              {/* before / after 비교 */}
              <div className="ld-pb-compare-card">
                <div className="ld-pb-compare-badge">링크드랍으로 배우기 전 vs 후</div>
                {[
                  { label: "삽화", before: "못 그리면 포기", after: "AI로 내가 직접 생성" },
                  { label: "이야기", before: "글 실력 없어서 막막", after: "AI와 대화로 완성" },
                  { label: "출판", before: "복잡해서 엄두 못 냄", after: "가이드 따라 직접 등록" },
                  { label: "수익", before: "불가능하다고 생각", after: "판매·파트너 수당으로 현실화" },
                ].map((row) => (
                  <div key={row.label} className="ld-pb-compare-row">
                    <div className="ld-pb-compare-label">{row.label}</div>
                    <div className="ld-pb-compare-before">{row.before}</div>
                    <div><span className="ld-pb-compare-after-badge">{row.after}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 설득 마무리 CTA */}
          <div className="ld-wg-tip">
            <div className="ld-wg-tip-icon">💬</div>
            <div className="ld-wg-tip-text">
              <strong>아직도 망설여지시나요?</strong>&nbsp;
              카카오로 먼저 물어보세요. 링크드랍이 어떤 내용인지, 나 같은 초보자도 정말 할 수 있는지
              솔직하게 설명해드립니다.
              &nbsp;<a href="https://open.kakao.com/o/linkdrop" target="_blank" rel="noopener noreferrer"
                className="ld-pb-kakao-link">
                카카오로 먼저 물어보기 →
              </a>
            </div>
          </div>
        </div>

        {/* ══ Chapter 3 — AI 얼굴 일관성 기술 ══ */}
        <div className="ld-wg-section" id="ch3">
          <div className="ld-pb-spacer" />
          <div className="ld-wg-sec-label">Chapter 3</div>
          <h2>사진 속 손자·손녀 얼굴이<br />책 첫 장부터 마지막 장까지 그대로입니다</h2>
          <p className="ld-wg-lead">
            AI로 동화책을 만들 때 가장 흔한 실망이 있습니다.
            &ldquo;페이지마다 얼굴이 달라요.&rdquo; 저희는 이 문제를 해결했습니다.
            사진을 한 번 등록하면, 책 전체에서 같은 얼굴이 유지됩니다.
          </p>

          <ChapterImage
            src="https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=1200&q=80"
            alt="할머니와 손자가 함께 동화책을 읽는 장면"
            caption="손자·손녀 사진 그대로 — 책 전 페이지에서 얼굴이 일관되게 유지됩니다"
          />

          <div className="ld-wg-section-inner">
            <div>
              <p>
                링크드랍이 알려주는 방법으로 손자·손녀 사진 <strong>5~10장</strong>을
                AI에 직접 학습시킵니다. 한 번 학습이 완료되면 숲속이든, 우주든, 바닷속이든
                어떤 장면에서도 처음 사진의 그 얼굴 그대로 일관되게 그려냅니다.
              </p>
              <p>
                한글판과 영어판 두 권 모두 같은 방식으로 직접 제작하기 때문에,
                어느 쪽을 펼쳐도 손자·손녀 얼굴이 흔들리지 않습니다.
              </p>
              <div className="ld-wg-tip">
                <div className="ld-wg-tip-icon">💡</div>
                <div className="ld-wg-tip-text">
                  <strong>어떻게 가능한가요?</strong>&nbsp;
                  사진을 바탕으로 AI에게 &ldquo;이 얼굴만 그리는 법&rdquo;을 짧게 학습시키는 기술(LoRA)을 사용합니다.
                  링크드랍이 이 과정을 순서대로 알려드리기 때문에, 기술 용어를 몰라도 직접 할 수 있습니다.
                </div>
              </div>
            </div>
            <div>
              <div className="ld-wg-stat-grid">
                {[
                  { icon: "📸", val: "5~10장", desc: "필요한 사진 수" },
                  { icon: "🎨", val: "전 페이지", desc: "얼굴 일관성 유지" },
                  { icon: "📅", val: "4주", desc: "완성까지 평균 기간" },
                  { icon: "📚", val: "한글+영어", desc: "두 권 동시 제작" },
                ].map((s) => (
                  <div key={s.desc} className="ld-wg-stat-card">
                    <div className="ld-wg-stat-icon">{s.icon}</div>
                    <div className="ld-wg-stat-val">{s.val}</div>
                    <div className="ld-wg-stat-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ Chapter 4 — 5단계 제작 과정 ══ */}
        <div className="ld-wg-section" id="ch4">
          <div className="ld-pb-spacer" />
          <div className="ld-wg-sec-label">Chapter 4</div>
          <h2>배워서 내가 직접 — 5단계 제작 과정</h2>
          <p className="ld-wg-lead">
            동화책 한 권이 완성되면 그 삽화와 스토리로 유튜브 영상까지 만듭니다.
            링크드랍은 책부터 영상까지 전 과정을 순서대로 알려드립니다.
          </p>

          {[
            {
              num: "1",
              title: "이야기 기획 — AI와 대화로 스토리 만들기",
              desc: "손자·손녀 이름과 '어떤 모험을 담을지' 한 줄만 생각하세요. 링크드랍이 알려주는 프롬프트 방식으로 AI에게 말하면, 기-승-전-결이 갖춰진 동화 스토리가 완성됩니다. 글 실력은 필요 없습니다.",
            },
            {
              num: "2",
              title: "AI 삽화 생성 — 사진 넣으면 얼굴이 나옵니다",
              desc: "손자·손녀 사진을 AI에 학습시키는 법을 링크드랍이 알려드립니다. 이후 장면마다 원하는 그림을 텍스트로 설명하면 AI가 수채화·동화 스타일 삽화를 자동 생성합니다. 같은 삽화가 책과 영상 모두에 활용됩니다.",
            },
            {
              num: "3",
              title: "동화책 편집 — 한글판·영어판 완성",
              desc: "링크드랍이 알려주는 편집 도구(캔바 등)로 직접 레이아웃을 잡습니다. 한글 버전과 영어 버전을 따로 만들면 쌍둥이 동화책이 완성됩니다. 부크크 인쇄 규격(PDF)으로 내보내는 법까지 가이드합니다.",
            },
            {
              num: "4",
              title: "유튜브 영상 제작 — 동화책을 영상으로",
              desc: "완성된 삽화와 스토리를 그대로 활용해 유튜브용 동화 영상을 만듭니다. AI 나레이션·자막·BGM 삽입법을 링크드랍이 알려드립니다. 책 한 권이 영상 콘텐츠로 재탄생해 유튜브 채널 운영의 시작점이 됩니다.",
            },
            {
              num: "5",
              title: "출판·유튜브 업로드 — 채널·서점 동시 수익화",
              desc: "부크크 ISBN 발급 후 교보문고·YES24 입점, 아마존 KDP 영어판 등록, 유튜브 채널 업로드 — 전부 링크드랍 가이드에 화면 캡처와 함께 나와 있습니다. 책과 영상 두 채널로 수익이 들어옵니다.",
            },
          ].map((step) => (
            <div key={step.num} className="ld-wg-step">
              <div className="ld-wg-step-num">{step.num}</div>
              <div>
                <div className="ld-wg-step-title">{step.title}</div>
                <div className="ld-wg-step-desc">{step.desc}</div>
              </div>
            </div>
          ))}

          <div className="ld-glass-card ld-glass-card-md ld-pb-card-base">
            <p className="ld-pb-summary-card">
              <strong className="ld-pb-summary-accent">한 번 배우면 책도 영상도 계속 만듭니다.</strong>&nbsp;
              손자 이야기로 책 한 권, 그 책으로 유튜브 영상 하나 — 같은 소재로 두 가지 콘텐츠가 나옵니다.
              주변에서 "나도 만들어달라"는 말이 나오는 순간, 부업이 시작됩니다.
            </p>
          </div>
        </div>

        {/* ══ Chapter 5 — 활용법 ══ */}
        <div className="ld-wg-section" id="ch5">
          <div className="ld-pb-spacer" />
          <div className="ld-wg-sec-label">Chapter 5</div>
          <h2>한 번 배우면 — 활용처가 다섯 가지입니다</h2>
          <p className="ld-wg-lead">
            동화책과 유튜브 영상을 직접 만들 수 있게 되면 활용처가 넓어집니다.
            선물로만 써도 충분하고, 채널 운영과 판매 부업으로 수익을 만드는 분들도 많습니다.
          </p>

          <ChapterImage
            src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80"
            alt="동화책과 유튜브 영상을 직접 만든 장면"
            caption="책으로도, 영상으로도 — 하나의 이야기가 두 가지 콘텐츠가 됩니다"
          />

          {[
            { name: "활용 A — 손자·손녀 맞춤 선물 (책+영상)", desc: "만든 파일로 부크크에서 소량 인쇄 주문하고, 영상은 USB나 링크로 함께 전달합니다. 손자 얼굴이 책과 영상 속 주인공으로 등장하는 세상에 하나뿐인 선물이 됩니다.", badge: "선물" },
            { name: "활용 B — 유튜브 채널 운영", desc: "만든 동화 영상을 유튜브에 직접 업로드합니다. 구독자가 쌓이면 광고 수익이 발생합니다. '할머니표 AI 동화' 콘셉트로 틈새 채널을 운영하는 분들이 이미 있습니다.", badge: "유튜브" },
            { name: "활용 C — 부크크·교보문고 정식 출판", desc: "무료 ISBN을 직접 발급받고 교보문고·YES24에 직접 입점 신청합니다. 주문이 들어올 때만 인쇄되는 POD 방식이라 재고 걱정이 없습니다.", badge: "출판" },
            { name: "활용 D — 맞춤 제작 부업 (책+영상 세트)", desc: "지인·SNS·육아 카페를 통해 '맞춤 동화책+영상 제작 서비스'로 판매합니다. 책만 판매할 때보다 세트 단가가 높아져 건당 5~15만 원 수익이 납니다. 링크드랍 파트너 수당까지 더해집니다.", badge: "부업" },
            { name: "활용 E — 아마존 영문판 글로벌 판매", desc: "영어판 동화책을 아마존 KDP에 직접 등록하면 190개국 독자에게 재고 없이 로열티 수익이 들어옵니다. 링크드랍이 등록 전 과정을 가이드합니다.", badge: "글로벌" },
          ].map((ch) => (
            <div key={ch.name} className="ld-glass-card ld-glass-card-md ld-pb-card-base ld-pb-usage-card-inner">
              <div className="ld-pb-usage-badge">{ch.badge}</div>
              <div>
                <div className="ld-pb-usage-title">{ch.name}</div>
                <div className="ld-pb-usage-desc">{ch.desc}</div>
              </div>
            </div>
          ))}

          <div className="ld-glass-card ld-pb-card-base ld-pb-transparency-card">
            <div className="ld-pb-transparency-badge">AI 생성물 투명성 안내</div>
            <div className="ld-pb-transparency-title">AI로 만든 책임을 솔직하게 표기합니다</div>
            <div className="ld-pb-transparency-desc">
              링크드랍은 AI 기본법 및 2025 저작권 가이드라인에 따라 책 내부에 AI 생성물임을 표기하는 방법을 알려드립니다.
              투명하게 밝히는 것이 독자 신뢰를 높이고, 아마존·부크크 계정을 안전하게 유지하는 방법입니다.
            </div>
          </div>
        </div>

        {/* ══ Chapter 6 — 가격과 수익 구조 ══ */}
        <div className="ld-wg-section" id="ch6">
          <div className="ld-pb-spacer" />
          <div className="ld-wg-sec-label">Chapter 6</div>
          <h2>링크드랍 가격 — 책 + 영상으로 배워서 수익까지</h2>
          <p className="ld-wg-lead">
            링크드랍 파트너로 시작하면 동화책 제작·유튜브 영상 제작·출판·판매법 전체를 배울 수 있습니다.
            옵션A는 책+영상 기본 구성, 옵션B는 한글판·영어판 쌍둥이 세트+영상입니다.
          </p>

          <ChapterImage
            src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80"
            alt="할머니와 손자가 함께 동화책을 읽는 모습"
            caption="손자·손녀에게 드리는 세상에 하나뿐인 선물"
          />

          <div className="ld-glass-card ld-glass-card-md ld-pb-card-base">
            <p className="ld-pb-option-heading">상품 옵션 비교</p>

            {/* 옵션 A */}
            <div className="ld-pb-option-row">
              <div className="ld-pb-option-header">
                <div className="ld-pb-option-badge-a">옵션 A — 한영 병기 단행본</div>
              </div>
              <div className="ld-wg-ui-label">한 페이지에 한글·영어가 함께 있는 동화책 1권 + 영상</div>
              <div className="ld-pb-option-margin">
                <span className="ld-pb-option-price">₩35,000 ~ 39,000</span>
              </div>
              <div className="ld-wg-ui-desc">인쇄비 약 8,000원 / 직접 판매 시 권당 수익 약 27,000~31,000원 / 처음 시작하시는 분께 추천</div>
            </div>

            {/* 옵션 B */}
            <div className="ld-pb-option-row">
              <div className="ld-pb-option-header">
                <div className="ld-pb-option-badge-b">옵션 B — 쌍둥이 세트 ★ 추천</div>
              </div>
              <div className="ld-wg-ui-label">한글판 1권 + 영어판 1권 (따로 제작) + 영상</div>
              <div className="ld-pb-option-margin">
                <span className="ld-pb-option-price">₩49,000 ~ 55,000</span>
              </div>
              <div className="ld-wg-ui-desc">인쇄비 약 16,000원 / 직접 판매 시 권당 수익 약 33,000~39,000원 / 영어 교육 효과 + 선물 가치 모두 극대화</div>
            </div>
          </div>

          {/* 마무리 CTA 카드 */}
          <div className="ld-pb-closing-card">
            <div className="ld-pb-closing-badge">LinkDrop 약속</div>
            <div className="ld-pb-closing-title">
              AI 몰라도, 그림 못 그려도<br />
              <span className="ld-pb-closing-accent">배우면 내가 직접 만듭니다</span>
            </div>
            <div className="ld-pb-closing-desc">
              링크드랍은 50대+ AI 초보자를 기준으로 만든 단계별 가이드입니다.
              먼저 카카오로 어떤 내용인지 확인해보세요. 궁금한 점 먼저 물어보셔도 됩니다.
            </div>
            <a
              href="https://open.kakao.com/o/linkdrop"
              target="_blank"
              rel="noopener noreferrer"
              className="ld-pb-cta"
            >
              지금 시작하기 →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
