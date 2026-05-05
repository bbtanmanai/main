import { NextResponse } from 'next/server';

export interface V3Series {
  id: string;
  series_code: string;
  title: string;
  topic: string;
  settings: { genre?: string; description?: string; [key: string]: unknown };
  status: string;
  created_at: string;
}

export async function GET() {
  const base = process.env.V3_INTERNAL_URL ?? 'http://localhost:8001';
  const secret = process.env.V2_API_SECRET ?? '';

  if (!secret) return NextResponse.json([]);

  try {
    const res = await fetch(`${base}/api/v1/public/series`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json([]);
    const data: V3Series[] = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
