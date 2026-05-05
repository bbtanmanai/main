"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface LdHomepageCategoryFilterProps {
  categories: string[];
  current: string;
}

export default function LdHomepageCategoryFilter({
  categories,
  current,
}: LdHomepageCategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === "전체") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    params.delete("page");
    router.push(`/homepage?${params.toString()}`);
  };

  const allCategories = ["전체", ...categories];

  return (
    <div className="hp-filter-scroll-wrap">
      <div className="hp-filter-scroll">
        <div className="hp-filter-chip-list">
          {allCategories.map((cat) => {
            const isActive =
              cat === "전체"
                ? current === "" || current === "전체" || !current
                : current === cat;

            return (
              <button
                key={cat}
                className="hp-filter-chip"
                data-active={isActive ? "true" : "false"}
                onClick={() => handleSelect(cat)}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
