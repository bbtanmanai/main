import { NextRequest, NextResponse } from 'next/server';

const V3_API = process.env.V3_API_BASE_URL ?? 'http://localhost:8001';

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams.toString();
    const url = `${V3_API}/api/v1/img-prompts${params ? `?${params}` : ''}`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) return NextResponse.json({ total: 0, page: 1, page_size: 20, items: [] }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ total: 0, page: 1, page_size: 20, items: [] }, { status: 502 });
  }
}
