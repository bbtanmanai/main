// ============================================================
// (public) 라우트 그룹 레이아웃
// 다크/라이트 사용자 선택 허용 (기본 다크)
// SSG 빌드 대상 — 로그인 불필요 공개 페이지
// LgBackground: GNB glass가 blob scene을 일관되게 비추도록 전역 제공
// ============================================================

import LgBackground from "@/components/lg/LgBackground";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LgBackground />
      {children}
    </>
  );
}
