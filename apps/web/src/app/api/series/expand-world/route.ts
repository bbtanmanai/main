import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Vercel/Next.js Route Handler 최대 실행 시간 (초)

const FASTAPI_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/api\/v1\/?$/, '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = body.api_key?.trim() || process.env.GOOGLE_API_KEY || '';

    const res = await fetch(`${FASTAPI_BASE}/api/v1/series/expand-world`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, api_key: apiKey }),
      signal: AbortSignal.timeout(115000),
    });

    let data: any;
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { detail: text || `FastAPI ${res.status}` };
    }
    return Response.json(data, { status: res.status });
  } catch (e: any) {
    return Response.json({ detail: String(e) }, { status: 500 });
  }
}
