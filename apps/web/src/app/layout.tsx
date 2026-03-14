import "./globals.css";
import React from "react";
import { Noto_Sans_KR } from 'next/font/google';

const notoShadow = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

export const metadata = {
  title: "LinkDropV2 - AI 콘텐츠 공장",
  description: "실무에 바로 쓰는 AI 활용 가이드 및 자동화 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${notoShadow.className} bg-[#f8fafc]`}>
        {/* 루트에서는 공통 GNB를 제거하고 각 서비스 레이아웃에서 처리함 */}
        {children}
      </body>
    </html>
  );
}
