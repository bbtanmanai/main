// ============================================================
// robots.ts — 검색엔진 크롤러 제어
// Next.js 13+ MetadataRoute.Robots 형식
// 빌드 타임에 /robots.txt 파일이 자동 생성됨
// 관리자/회원/파트너/강사 경로는 크롤링 차단
// ============================================================

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      // 모든 검색엔진 봇 대상
      userAgent: "*",
      // 공개 페이지는 크롤링 허용
      allow: "/",
      // 로그인이 필요한 내부 페이지는 인덱싱 차단
      disallow: ["/admin", "/member", "/partner", "/instructor"],
    },
    // 생성된 사이트맵 위치 안내
    sitemap: "https://linkdrop.kr/sitemap.xml",
  };
}
