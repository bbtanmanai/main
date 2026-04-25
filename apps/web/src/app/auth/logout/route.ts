// ============================================================
// auth/logout/route.ts — 로그아웃 Route Handler
// POST 요청 시 Supabase signOut() 후 홈으로 redirect
// 사용 예: <form action="/auth/logout" method="POST">
// ============================================================

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createServerSupabaseClient();

  // 세션 종료
  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/`, { status: 302 });
}
