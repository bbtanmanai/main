import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
const API = process.env.API_URL ?? 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${API}/api/v1/wiki/sources/ingest-chapter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ error: 'ingest-chapter failed' }, { status: 503 });
  }
}
