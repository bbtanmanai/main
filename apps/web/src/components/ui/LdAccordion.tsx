"use client";

// ============================================================
// LdAccordion — FAQ 아코디언 컴포넌트
// 클릭 시 답변이 부드럽게 펼쳐지고 접혀지는 UI
// height 250ms + opacity 150ms 트랜지션
// ============================================================

import { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";

// 아코디언 한 항목의 데이터 형태 정의
interface AccordionItem {
  q: string; // 질문 텍스트
  a: string; // 답변 텍스트
}

interface LdAccordionProps {
  items: AccordionItem[];
}

export default function LdAccordion({ items }: LdAccordionProps) {
  // 현재 열려있는 항목의 인덱스 (null이면 모두 닫힘)
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(idx: number) {
    // 이미 열려있는 항목을 클릭하면 닫고, 새 항목 클릭하면 열기
    setOpenIndex(openIndex === idx ? null : idx);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, idx) => (
        <AccordionRow
          key={idx}
          item={item}
          isOpen={openIndex === idx}
          onToggle={() => toggle(idx)}
        />
      ))}
    </div>
  );
}

// ── 개별 아코디언 행 컴포넌트 ────────────────────────────
interface AccordionRowProps {
  item: AccordionItem;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionRow({ item, isOpen, onToggle }: AccordionRowProps) {
  // 답변 영역의 실제 높이를 측정하기 위한 ref
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="ld-glass rounded-xl overflow-hidden"
      style={{ borderRadius: "12px" }}
    >
      {/* 질문 버튼 — 클릭 시 열기/닫기 */}
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        style={{
          // 시니어 터치 타깃 최소 48px 보장
          minHeight: "56px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
        }}
      >
        {/* 질문 텍스트 — 최소 18px 시니어 가독성 */}
        <span
          style={{
            fontSize: "18px",
            fontWeight: 600,
            lineHeight: 1.5,
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
          }}
        >
          {item.q}
        </span>

        {/* 열림/닫힘 화살표 아이콘 — 회전 애니메이션 */}
        <ChevronDown
          size={20}
          style={{
            flexShrink: 0,
            color: "var(--accent-neon)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 250ms ease",
          }}
        />
      </button>

      {/* 답변 영역 — height + opacity 동시 트랜지션 */}
      <div
        style={{
          // 열린 상태: 실제 높이 / 닫힌 상태: 0
          maxHeight: isOpen ? "400px" : "0px",
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
          // height 250ms, opacity 150ms 별도 타이밍
          transition: "max-height 250ms ease, opacity 150ms ease",
        }}
      >
        <div
          ref={contentRef}
          style={{
            padding: "0 24px 20px 24px",
            color: "var(--text-secondary)",
            fontSize: "17px",
            lineHeight: 1.7,
            fontFamily: "Pretendard Variable, Pretendard, sans-serif",
          }}
        >
          {item.a}
        </div>
      </div>
    </div>
  );
}
