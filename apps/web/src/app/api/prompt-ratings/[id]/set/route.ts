import { NextRequest, NextResponse } from 'next/server';

const V3_API = process.env.V3_API_BASE_URL ?? process.env.V3_INTERNAL_URL ?? 'http://localhost:8001';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const res = await fetch(
      `${V3_API}/api/v1/prompt-ratings/${encodeURIComponent(id)}/set`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) return NextResponse.json({}, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({}, { status: 502 });
  }
}
