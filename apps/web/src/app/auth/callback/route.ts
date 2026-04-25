// ============================================================
// auth/callback/route.ts — OAuth 콜백 Route Handler
// PKCE code → session 교환 후 세션 쿠키를 redirect response에 직접 주입
// next/headers cookies()는 redirect response에 쿠키를 전달하지 않으므로
// createServerClient를 redirect response 객체에 직접 바인딩
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/member/dashboard";

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
                // localhost(HTTP)에서 작동하도록 secure 해제, 브라우저 클라이언트 접근 허용
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
      return redirectResponse;
    }
  }

  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
