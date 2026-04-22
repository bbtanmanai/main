// ============================================================
// (checkout) 라우트 그룹 레이아웃
// 결제 페이지는 항상 라이트 테마 강제
// 이유: 결제/입력 폼은 밝은 배경이 가독성·신뢰감 높음
// ============================================================

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // data-theme="light" 강제 적용 — ThemeProvider 설정과 무관하게 항상 라이트
    <div data-theme="light" style={{ minHeight: "100vh" }}>
      {children}
    </div>
  );
}
