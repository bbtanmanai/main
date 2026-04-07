import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const FASTAPI_URL = process.env.API_URL ?? 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${FASTAPI_URL}/api/v1/series/sub-image-hints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    try {
      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch {
      return Response.json({ results: [] }, { status: 502 });
    }
  } catch {
    return Response.json({ results: [] }, { status: 503 });
  }
}
