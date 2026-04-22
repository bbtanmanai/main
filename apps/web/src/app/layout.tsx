// ============================================================
// LinkDrop V2 — 루트 레이아웃
// ThemeProvider로 다크/라이트 테마 관리
// 폰트: globals.css @font-face 로컬 파일 사용 (CDN 제거)
//   Anton, Condiment → /public/fonts/*.woff2
//   Pretendard Variable → /public/fonts/PretendardVariable.woff2
// ============================================================

import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "LINKDROP — Empowering Creators Beyond the Content Horizon",
  description:
    "링크드롭 플랫폼 — 크리에이터를 위한 콘텐츠 수익화, 파트너 생태계, AI 자동화 파이프라인",
  keywords: ["링크드롭", "LinkDrop", "크리에이터", "콘텐츠 수익화", "AI 자동화"],
  // OG(Open Graph) 태그 — 카카오/페이스북/트위터 등 SNS 공유 시 표시되는 미리보기
  openGraph: {
    title: "LINKDROP — 크리에이터 수익화 플랫폼",
    description: "당신의 이야기가 비즈니스가 됩니다",
    url: "https://linkdrop.kr",
    siteName: "LinkDrop",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: next-themes가 서버/클라이언트 간 data-theme 불일치 경고 방지용
    <html lang="ko" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        {/* ── next-themes ThemeProvider 설정 ──
            defaultTheme="dark" : 처음 방문 시 다크 테마
            enableSystem=false  : 시스템 설정 무시 (디자인 의도 우선)
            attribute="data-theme" : CSS 토큰이 [data-theme] 선택자로 동작 */}
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
