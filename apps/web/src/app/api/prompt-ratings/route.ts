import { NextResponse } from 'next/server';

const V3_API = process.env.V3_API_BASE_URL ?? process.env.V3_INTERNAL_URL ?? 'http://localhost:8001';

export async function GET() {
  try {
    const res = await fetch(`${V3_API}/api/v1/prompt-ratings`, { next: { revalidate: 0 } });
    if (!res.ok) return NextResponse.json({}, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({}, { status: 502 });
  }
}
