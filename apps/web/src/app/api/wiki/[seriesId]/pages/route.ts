import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
const API = process.env.API_URL ?? 'http://localhost:8000';

export async function GET(_req: NextRequest, { params }: { params: { seriesId: string } }) {
  try {
    const res = await fetch(`${API}/api/v1/wiki/${encodeURIComponent(params.seriesId)}/pages`);
    const data = await res.json().catch(() => ({ pages: [] }));
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ pages: [] }, { status: 503 });
  }
}
