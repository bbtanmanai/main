// ============================================================
// middleware.ts — 인증 기반 라우트 보호 + 세션 쿠키 refresh
//
// [보호 규칙]
// - /member /partner /instructor /admin /checkout
//   → 비로그인 시 /?auth=1&next={pathname} 으로 redirect (소셜 모달 오픈)
//
// Supabase 미연결(환경변수 없음) 시 → 모든 요청 그대로 통과
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/member", "/partner", "/instructor", "/admin", "/checkout"];

export async function proxy(request: NextRequest) {
  // Supabase 미연결 환경에서는 통과
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser()는 항상 서버 검증 — getSession()보다 안전
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 보호 경로 → 비로그인이면 /?auth=1 redirect (소셜 모달 자동 오픈)
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("auth", "1");
    redirectUrl.searchParams.set("next", pathname); // 로그인 후 원래 경로로 복귀
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // _next 정적 파일, 이미지, 파비콘, 공개 파일 제외
    "/((?!_next/static|_next/image|favicon.ico|img/|fonts/|texture.png|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
