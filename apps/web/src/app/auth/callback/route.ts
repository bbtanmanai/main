// ============================================================
// auth/callback/route.ts — OAuth 콜백 Route Handler
// PKCE code → session 교환 후 세션 쿠키를 redirect response에 직접 주입
// 신규 사용자 첫 로그인 시 profiles(role='guest') 레코드 자동 생성
// next/headers cookies()는 redirect response에 쿠키를 전달하지 않으므로
// createServerClient를 redirect response 객체에 직접 바인딩
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // open redirect 방지 — next는 반드시 상대 경로여야 함
  const rawNext = searchParams.get("next") ?? "/member/dashboard";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/member/dashboard";

  if (code) {
    const redirectUrl = `${origin}${next}`;
    const redirectResponse = NextResponse.redirect(redirectUrl);

    // redirect response에 쿠키를 직접 주입하는 클라이언트 생성
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              redirectResponse.cookies.set(name, value, {
                ...options,
                httpOnly: false,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
              });
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 신규 사용자 프로필 생성 — 기존 role이 있으면 유지 (ignoreDuplicates)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("profiles")
          .upsert(
            { id: user.id, role: "guest" },
            { onConflict: "id", ignoreDuplicates: true }
          );
      }

      return redirectResponse;
    }
  }

  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
