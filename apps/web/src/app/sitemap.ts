// ============================================================
// sitemap.ts — 사이트맵 자동 생성
// Next.js 13+ MetadataRoute.Sitemap 형식
// 빌드 타임에 /sitemap.xml 파일이 자동 생성됨
// 검색엔진이 이 파일을 보고 크롤링 우선순위를 결정
// ============================================================

import { MetadataRoute } from "next";
import topicsData from "@/data/topics.json";

// 프로덕션 도메인 (배포 전 실제 도메인으로 확인 필요)
const BASE_URL = "https://linkdrop.kr";

export default function sitemap(): MetadataRoute.Sitemap {
  // 9개 랜딩 페이지 슬러그별 사이트맵 항목 생성
  const landings: MetadataRoute.Sitemap = topicsData.map((t) => ({
    url: `${BASE_URL}/landing/${t.slug}`,
    lastModified: new Date(),
    // 주간 업데이트 — 콘텐츠가 자주 변경됨
    changeFrequency: "weekly" as const,
    // 홈보다 약간 낮은 우선순위
    priority: 0.8,
  }));

  return [
    // 홈페이지 — 최우선 크롤링 대상
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    // 9개 랜딩 페이지
    ...landings,
  ];
}
