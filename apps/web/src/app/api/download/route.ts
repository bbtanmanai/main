// /api/download?slug=moban3268
// 인증 확인 후 R2 다운로드 URL로 리다이렉트
// partner 이상 role만 허용 — guest/미로그인 → 결제 페이지로

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAllHomepageItems } from "@/lib/homepage";

const BUYER_ROLES = new Set(["partner", "gold_partner", "instructor", "admin"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // slug 유효성 + R2 URL 조회
  const items = getAllHomepageItems();
  const item = items.find((i) => i.slug === slug);
  if (!item) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // R2_BASE가 설정되어 있어야 실제 다운로드 URL이 존재
  const R2_BASE = (process.env.NEXT_PUBLIC_R2_BASE_URL ?? "").replace(/\/$/, "");
  if (!R2_BASE) {
    return new NextResponse("Download not available", { status: 503 });
  }
  const r2DownloadUrl = `${R2_BASE}/homepage/${slug}/${slug}.zip`;

  // Supabase 미연결 시 → 그냥 통과 (개발환경)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.redirect(r2DownloadUrl);
  }

  // 세션 확인
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 미로그인 → 인증 모달
  if (!user) {
    return NextResponse.redirect(
      new URL(`/?auth=1&next=/api/download?slug=${slug}`, request.url)
    );
  }

  // role 확인 — partner 이상만 다운로드
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!BUYER_ROLES.has(profile?.role ?? "")) {
    // 일반회원(guest) → 결제 페이지
    return NextResponse.redirect(new URL("/checkout", request.url));
  }

  // 인증 통과 → R2 직접 URL로 리다이렉트 (브라우저가 파일 다운로드)
  return NextResponse.redirect(r2DownloadUrl);
}
