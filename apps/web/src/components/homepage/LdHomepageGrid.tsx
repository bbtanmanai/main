"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { HomepageItem } from "@/types/homepage";
import LdHomepageCard from "./LdHomepageCard";
import LdHomepageDrawer from "./LdHomepageDrawer";

interface LdHomepageGridProps {
  items: HomepageItem[];
  currentPage: number;
  totalPages: number;
  category: string;
}

export default function LdHomepageGrid({
  items,
  currentPage,
  totalPages,
  category,
}: LdHomepageGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedItem, setSelectedItem] = useState<HomepageItem | null>(null);

  useEffect(() => {
    setSelectedItem(null);
  }, [items]);

  const handleOpen = (item: HomepageItem) => {
    setSelectedItem(item);
    // 조회수 증가 — fire-and-forget (UI 블로킹 없음)
    fetch("/api/homepage/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: item.slug }),
    }).catch(() => {});
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/homepage?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {items.map((item) => (
          <LdHomepageCard
            key={item.slug}
            item={item}
            onOpen={handleOpen}
          />
        ))}
      </div>

      {/* 아이템 없음 */}
      {items.length === 0 && (
        <p className="hp-empty-state">해당 카테고리의 홈페이지 소스가 없습니다.</p>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="hp-paginator">
          <button
            className="hp-paginator-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            이전
          </button>

          <span className="hp-paginator-page">
            {currentPage} / {totalPages}
          </span>

          <button
            className="hp-paginator-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            다음
          </button>
        </div>
      )}

      {/* 오른쪽 슬라이딩 패널 */}
      <LdHomepageDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
