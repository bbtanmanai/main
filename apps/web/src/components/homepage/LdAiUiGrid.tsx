"use client";

import Image from "next/image";
import { useState } from "react";
import type { AiUiSource } from "@/types/homepage";

const CATEGORY_COLORS: Record<string, string> = {
  "히어로": "aqua",
  "카드": "neon",
  "네비게이션": "amber",
  "레이아웃": "rose",
  "가격": "lime",
  "섹션": "aqua",
  "인증": "amber",
};

const DIFFICULTY_LEVEL: Record<string, number> = {
  "초급": 1, "중급": 2, "고급": 3,
};

function ToolIcon({ name }: { name: string }) {
  if (name === "v0") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M5.394 0L0 12.192V24h13.737L19.131 12.192V0H5.394z"/>
      </svg>
    );
  }
  if (name === "Cursor") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 4l16 8-8 2-6 6z"/>
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  );
}

function DifficultyDots({ label }: { label: string }) {
  const level = DIFFICULTY_LEVEL[label] ?? 1;
  return (
    <div className="hp-ai-difficulty-wrap" title={label}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`hp-ai-dot${i <= level ? " hp-ai-dot--on" : ""}`} />
      ))}
      <span className="hp-ai-difficulty-label">{label}</span>
    </div>
  );
}

function AiUiCard({ item }: { item: AiUiSource }) {
  const colorKey = CATEGORY_COLORS[item.category] ?? "aqua";
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!item.prompt) return;
    navigator.clipboard.writeText(item.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleOpenChatGPT() {
    if (!item.prompt) return;
    const url = "https://chatgpt.com/?q=" + encodeURIComponent(item.prompt);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={`hp-ai-card hp-ai-card--${colorKey}`}>

      {/* 상단: 썸네일 (1:1 비율) */}
      <div className={`hp-ai-card-image hp-ai-card-image--${colorKey}${item.previewUrl ? " hp-ai-card-image--clickable" : ""}`}>
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="hp-ai-image-pattern" aria-hidden="true">
            <div className="hp-ai-image-bar hp-ai-image-bar--a" />
            <div className="hp-ai-image-bar hp-ai-image-bar--b" />
            <div className="hp-ai-image-bar hp-ai-image-bar--c" />
            <div className="hp-ai-image-bar hp-ai-image-bar--d" />
          </div>
        )}
        <span className={`hp-ai-badge hp-ai-badge--${colorKey} hp-ai-image-badge`}>
          {item.category}
        </span>
        {item.previewUrl && (
          <a
            href={item.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hp-ai-preview-overlay"
            aria-label={`${item.title} 미리보기`}
          >
            <span className="hp-ai-preview-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              </svg>
              미리보기
            </span>
          </a>
        )}
      </div>

      {/* 하단: 내용 */}
      <div className="hp-ai-card-content">
        {/* 툴 칩 (최상단) */}
        <div className="hp-ai-tools">
          {item.tools.map((tool) => (
            <span key={tool} className="hp-ai-tool-chip">
              <ToolIcon name={tool} />
              {tool}
            </span>
          ))}
        </div>

        {/* 난이도 */}
        <DifficultyDots label={item.difficulty} />

        {/* 제목 */}
        <h3 className="hp-ai-title">{item.title}</h3>

        {/* 설명 */}
        <p className="hp-ai-desc">{item.description}</p>

        {/* 푸터: CTA */}
        <div className="hp-ai-footer">
          <button
            className={`hp-ai-cta-btn${copied ? " hp-ai-cta-btn--copied" : ""}`}
            onClick={handleCopy}
            disabled={!item.prompt}
            aria-label="프롬프트 복사"
          >
            {copied ? "복사됨 ✓" : "프롬프트 복사"}
          </button>
          <button
            className="hp-ai-chatgpt-btn"
            onClick={handleOpenChatGPT}
            disabled={!item.prompt}
            aria-label="ChatGPT에 프롬프트 주입 후 이동"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.392.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
            </svg>
            ChatGPT로 열기
          </button>
        </div>
      </div>

    </div>
  );
}

export default function LdAiUiGrid({ items }: { items: AiUiSource[] }) {
  return (
    <>
      {/* 카드 그리드 */}
      <div className="hp-ai-grid">
        {items.map((item) => (
          <AiUiCard key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}
