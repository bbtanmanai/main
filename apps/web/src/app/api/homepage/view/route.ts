import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { slug } = await req.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    // TODO: Supabase 조회수 업데이트
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
