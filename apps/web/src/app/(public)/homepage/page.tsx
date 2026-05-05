import "@/styles/homepage.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AI_UI_SOURCES } from "@/lib/ai-ui-homepage";
import { getAllHomepageItems } from "@/lib/homepage";
import LdHomepageTabSwitcher from "@/components/homepage/LdHomepageTabSwitcher";
import LdHomepageCategoryFilter from "@/components/homepage/LdHomepageCategoryFilter";
import LdHomepageGrid from "@/components/homepage/LdHomepageGrid";
import LdAiUiGrid from "@/components/homepage/LdAiUiGrid";

export const metadata: Metadata = {
  title: "홈페이지 소스 | LinkDrop",
  description: "AI로 만든 홈페이지 템플릿과 AI 생성용 UI 프롬프트 소스 라이브러리",
  robots: { index: false },
};

const PER_PAGE = 12;

interface PageProps {
  searchParams: Promise<{ tab?: string; category?: string; page?: string }>;
}

export default async function HomepagePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = params.tab === "ai" ? "ai" : "homepage";
  const category = params.category ?? "";
  const currentPage = Math.max(1, Number(params.page) || 1);

  const aiItems = AI_UI_SOURCES;
  const HOMEPAGE_ITEMS = getAllHomepageItems();

  const filtered = category
    ? HOMEPAGE_ITEMS.filter((item) => item.category === category)
    : HOMEPAGE_ITEMS;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const categories = [...new Set(HOMEPAGE_ITEMS.map((item) => item.category))];

  return (
    <main className="hp-page">
      <header className="hp-page-header">
        <h1 className="hp-page-title">
          홈페이지 <span>소스</span> 라이브러리
        </h1>
        <p className="hp-page-desc">
          AI 툴로 제작한 랜딩페이지 템플릿과 UI 프롬프트 소스를 자유롭게 활용하세요
        </p>
      </header>

      <div className="hp-container">
        <Suspense>
          <LdHomepageTabSwitcher
            active={tab}
            homepageCount={HOMEPAGE_ITEMS.length}
            aiCount={aiItems.length}
          />
        </Suspense>

        {tab === "homepage" && (
          <>
            {categories.length > 0 && (
              <Suspense>
                <LdHomepageCategoryFilter
                  categories={categories}
                  current={category}
                />
              </Suspense>
            )}
            <Suspense>
              <LdHomepageGrid
                items={pageItems}
                currentPage={currentPage}
                totalPages={totalPages}
                category={category}
              />
            </Suspense>
          </>
        )}

        {tab === "ai" && <LdAiUiGrid items={aiItems} />}
      </div>
    </main>
  );
}
