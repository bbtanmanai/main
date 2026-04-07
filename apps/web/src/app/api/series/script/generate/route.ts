import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// NEXT_PUBLIC_API_URL이 /api/v1 포함 여부에 무관하게 정규화
const _raw = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/api\/v1\/?$/, '');
const FASTAPI_BASE = _raw;

export async function POST(req: NextRequest) {
  try {
    const { world, chapter, chapterRole, apiKey, prev_chapter_ending, series_id } = await req.json();

    if (!apiKey?.trim()) {
      return Response.json(
        { error: 'GOOGLE_API_KEY가 필요합니다. 설정(⚙)에서 입력하세요.' },
        { status: 400 }
      );
    }

    // FastAPI STEP 2: NLM 팩트 주입 → Gemini 스트리밍
    const fastapiRes = await fetch(`${FASTAPI_BASE}/api/v1/series/generate-script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ world, chapter, chapterRole, api_key: apiKey, prev_chapter_ending, series_id }),
      signal: AbortSignal.timeout(180000),
    });

    if (!fastapiRes.ok) {
      const err = await fastapiRes.text();
      return Response.json({ error: `FastAPI 오류: ${err}` }, { status: fastapiRes.status });
    }

    // FastAPI SSE → 클라이언트 SSE 그대로 relay
    return new Response(fastapiRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
