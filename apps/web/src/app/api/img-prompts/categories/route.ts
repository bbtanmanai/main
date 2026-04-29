import { NextResponse } from 'next/server';

const V3_API = process.env.V3_API_BASE_URL ?? 'http://localhost:8001';

export async function GET() {
  try {
    const res = await fetch(`${V3_API}/api/v1/img-prompts/categories`, { next: { revalidate: 60 } });
    if (!res.ok) return NextResponse.json([], { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
