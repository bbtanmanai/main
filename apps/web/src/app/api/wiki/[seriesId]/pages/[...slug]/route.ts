import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
const API = process.env.API_URL ?? 'http://localhost:8000';

export async function GET(
  _req: NextRequest,
  { params }: { params: { seriesId: string; slug: string[] } }
) {
  const slug = params.slug.join('/');
  try {
    const res = await fetch(`${API}/api/v1/wiki/${encodeURIComponent(params.seriesId)}/pages/${slug}`);
    const data = await res.json().catch(() => ({ content_md: '' }));
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ content_md: '' }, { status: 503 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { seriesId: string; slug: string[] } }
) {
  const slug = params.slug.join('/');
  try {
    const body = await req.json();
    const res = await fetch(`${API}/api/v1/wiki/${encodeURIComponent(params.seriesId)}/pages/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ error: 'update failed' }, { status: 503 });
  }
}
