// ============================================================
// signup/page.tsx — redirect stub
// 이메일 회원가입 폼 제거 → 소셜 로그인 모달(/?auth=1)로 대체
// ============================================================

import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect("/?auth=1");
}
