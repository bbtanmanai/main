"use client";

import Image from "next/image";
import { useState } from "react";
import type { HomepageItem } from "@/types/homepage";

interface LdHomepageCardProps {
  item: HomepageItem;
  onOpen: (item: HomepageItem) => void;
}

export default function LdHomepageCard({ item, onOpen }: LdHomepageCardProps) {
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !item.thumbnail || imgError;

  return (
    <div
      className="ld-glass hp-card hp-card-root"
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(item); }}
      aria-label={`${item.title} 상세 보기`}
    >
      {/* 썸네일 — 카드 전체 1:1 채움 */}
      <div
        className="hp-card-thumb-layer"
        style={{
          background: showPlaceholder ? "var(--glass-white)" : "transparent",
        }}
      >
        {showPlaceholder ? (
          <span className="hp-card__placeholder">{item.slug}</span>
        ) : (
          <Image
            src={item.thumbnail!}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ objectFit: "cover" }}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* 정보 오버레이 — 하단 반투명 */}
      <div className="hp-card__info">
        <div className="hp-card-info-row">
          <span className="hp-card__category">{item.category}</span>
          {item.downloadUrl && (
            <a
              href={item.downloadUrl}
              className="hp-download-btn"
              onClick={(e) => e.stopPropagation()}
            >
              다운로드
            </a>
          )}
        </div>
        <p className="hp-card__title">{item.title}</p>
      </div>
    </div>
  );
}
