// ============================================================
// (public) 라우트 그룹 레이아웃
// 다크/라이트 사용자 선택 허용 (기본 다크)
// SSG 빌드 대상 — 로그인 불필요 공개 페이지
// ============================================================

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 텍스처 오버레이를 포함한 공개 레이아웃
  // .ld-texture는 globals.css에 정의된 전역 고정 오버레이
  return (
    <>
      {/* 화면 전체 고정 텍스처 오버레이 — 포인터 이벤트 없음 */}
      <div className="ld-texture" aria-hidden="true" />
      {children}
    </>
  );
}
