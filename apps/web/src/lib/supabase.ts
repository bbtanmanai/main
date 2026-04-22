// ============================================================
// supabase.ts — Supabase 클라이언트 생성 유틸리티
// @supabase/ssr의 createBrowserClient 사용
// (서버 컴포넌트에서는 createServerClient를 별도 사용)
// ============================================================

import { createBrowserClient } from "@supabase/ssr";

// 브라우저(클라이언트 컴포넌트)에서 사용하는 Supabase 클라이언트 생성
// .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 필요
export function createClient() {
  return createBrowserClient(
    // 환경변수 누락 시 빌드 에러 대신 런타임 에러로 처리 (!)
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
