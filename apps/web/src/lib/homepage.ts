/**
 * homepage.ts — R2 기반 HomepageItem 목록 생성
 * homepages-meta.json을 소스로 사용, NEXT_PUBLIC_R2_BASE_URL 환경변수로 URL 조합
 * 환경변수 미설정 시 → /homepage/... 로컬 경로 폴백 (로컬 개발용)
 */
import { cache } from "react";
import type { HomepageItem, HomepageMeta } from "@/types/homepage";
import metaJson from "@/data/homepages-meta.json";

const META_LIST = metaJson as HomepageMeta[];

// R2 베이스 URL — 설정 없으면 로컬 public/ 폴백
const R2_BASE = (process.env.NEXT_PUBLIC_R2_BASE_URL ?? "").replace(/\/$/, "");

function _getAllHomepageItems(): HomepageItem[] {
  const items: HomepageItem[] = META_LIST.map((meta) => {
    const slug = meta.slug;
    const num = slug.replace("moban", "");
    const base = R2_BASE
      ? `${R2_BASE}/homepage/${slug}`
      : `/homepage/${slug}`;

    return {
      slug,
      num,
      title: meta.title ?? slug,
      category: meta.category ?? "기타",
      tags: meta.tags ?? [],
      thumbnail: `${base}/${num}.webp`,
      previewUrl: `${base}/index.html`,
      downloadUrl: `/api/download?slug=${slug}`,
    };
  });

  // slug 기준 오름차순 정렬
  items.sort((a, b) => a.slug.localeCompare(b.slug));
  return items;
}

export const getAllHomepageItems = cache(_getAllHomepageItems);
