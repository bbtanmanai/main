// ============================================================
// LinkDrop V2 — 루트 레이아웃
// ThemeProvider로 다크/라이트 테마 관리
// 폰트: globals.css @font-face 로컬 파일 사용 (CDN 제거)
//   Anton, Condiment → /public/fonts/*.woff2
//   Pretendard Variable → /public/fonts/PretendardVariable.woff2
// ============================================================

import type { Metadata } from "next";
import LdThemeProvider from "@/components/layout/LdThemeProvider";
import LdGnbConditional from "@/components/layout/LdGnbConditional";
import LdAuthModal from "@/components/auth/LdAuthModal";
import LdAuthBottomSheet from "@/components/auth/LdAuthBottomSheet";
import LdViewTransitionHandler from "@/components/layout/LdViewTransitionHandler";
import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "LINKDROP — Empowering Creators Beyond the Content Horizon",
  description:
    "링크드롭 플랫폼 — 크리에이터를 위한 콘텐츠 수익화, 파트너 생태계, AI 자동화 파이프라인",
  keywords: ["링크드롭", "LinkDrop", "크리에이터", "콘텐츠 수익화", "AI 자동화"],
  icons: {
    icon: [
      { url: "/img/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/img/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/img/favicons/apple-touch-icon.png", sizes: "180x180" },
    shortcut: "/img/favicons/favicon.ico",
  },
  manifest: "/img/favicons/manifest.json",
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
      <body suppressHydrationWarning>
        {/* ── next-themes ThemeProvider 설정 ──
            defaultTheme="dark" : 처음 방문 시 다크 테마
            enableSystem=false  : 시스템 설정 무시 (디자인 의도 우선)
            attribute="data-theme" : CSS 토큰이 [data-theme] 선택자로 동작 */}
        <LdThemeProvider>
          <LdViewTransitionHandler />
          <LdGnbConditional />
          {children}
          <LdAuthModal />
          <LdAuthBottomSheet />
        </LdThemeProvider>
      </body>
    </html>
  );
}
