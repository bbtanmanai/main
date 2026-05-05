import { NextRequest, NextResponse } from 'next/server';

const V3_API = process.env.V3_API_BASE_URL ?? process.env.V3_INTERNAL_URL ?? 'http://localhost:8001';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ master_no: string }> }
) {
  const { master_no } = await params;
  try {
    const res = await fetch(`${V3_API}/api/v1/img-prompts/${master_no}/download`);
    if (!res.ok) return NextResponse.json({ error: 'not found' }, { status: res.status });
    const blob = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${master_no}.${ext}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'upstream error' }, { status: 502 });
  }
}
