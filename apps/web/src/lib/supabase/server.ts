// ============================================================
// supabase/server.ts — 서버 컴포넌트 / Route Handler용 Supabase 클라이언트
// @supabase/ssr의 createServerClient 사용
// cookies()는 Next.js App Router 서버 전용 — 클라이언트 컴포넌트에서 호출 금지
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Route Handler가 아닌 Server Component에서 set은 무시됨 (읽기 전용)
          }
        },
      },
    }
  );
}
