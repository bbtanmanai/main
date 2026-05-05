"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HomepageItem } from "@/types/homepage";

interface LdHomepageDrawerProps {
  item: HomepageItem | null;
  onClose: () => void;
}

export default function LdHomepageDrawer({ item, onClose }: LdHomepageDrawerProps) {
  const isOpen = item !== null;
  const [imgError, setImgError] = useState(false);

  // 아이템 변경 시 이미지 에러 상태 초기화
  useEffect(() => { setImgError(false); }, [item?.slug]);

  // ESC 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // 바디 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`hp-drawer-overlay${isOpen ? " hp-drawer-overlay--open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 패널 */}
      <aside
        className={`hp-drawer-panel${isOpen ? " hp-drawer-panel--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={item ? `${item.title} 상세 정보` : "상세 정보"}
      >
        {/* 헤더 */}
        <div className="hp-drawer-header">
          <span className="hp-drawer-header-title">홈페이지 소스 상세</span>
          <button className="hp-drawer-close" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        {item && (
          <div className="hp-drawer-body">
            {/* 썸네일 */}
            {item.thumbnail && !imgError ? (
              <div className="hp-drawer-thumb-wrap">
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  sizes="480px"
                  style={{ objectFit: "contain", objectPosition: "top center" }}
                  onError={() => setImgError(true)}
                />
              </div>
            ) : (
              <div className="hp-drawer-thumb-wrap hp-drawer-thumb-wrap--placeholder">
                <span className="hp-drawer-thumb-emoji">🖼️</span>
              </div>
            )}

            {/* 라이브 미리보기 링크 */}
            {item.previewUrl && (
              <a
                href={item.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hp-drawer-live-link"
              >
                <span>라이브 미리보기 열기</span>
                <span className="hp-drawer-new-tab">↗ 새 창</span>
              </a>
            )}

            {/* 카테고리 + 타이틀 */}
            <span className="hp-prev-category hp-drawer-category">
              {item.category}
            </span>
            <h2 className="hp-drawer-title">{item.title}</h2>

            {/* 태그 */}
            {item.tags.length > 0 && (
              <div className="hp-drawer-tags">
                {item.tags.map((tag) => (
                  <span key={tag} className="hp-prev-tag">#{tag}</span>
                ))}
              </div>
            )}

            <div className="hp-prev-divider" />

            {/* CTA 박스 */}
            <div className="ld-glass hp-prev-cta-box">
              <p className="hp-prev-cta-desc">
                LinkDrop 멤버십 가입 시<br />
                <strong>모든 홈페이지 소스를 무제한 다운로드</strong>할 수 있습니다.
              </p>

              <div className="hp-drawer-cta-btns">
                <Link href="/checkout" className="hp-prev-btn-buy" onClick={onClose}>
                  멤버십 시작하기 →
                </Link>

                {item.downloadUrl && (
                  <a href={item.downloadUrl} className="hp-prev-btn-download">
                    다운로드 (멤버 전용)
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
