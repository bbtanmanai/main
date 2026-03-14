import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL      || '';
const supabaseKey      = process.env.SUPABASE_SERVICE_ROLE_KEY     || '';

function formatKorean(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000)      return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000)       return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function toCollectedAt(ts: string | null | undefined): string {
  if (!ts) return '';
  try {
    return new Date(ts).toISOString().split('T')[0];
  } catch {
    return ts.slice(0, 10);
  }
}

export async function GET(req: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Supabase env vars not configured' },
      { status: 500 },
    );
  }

  const supa = createClient(supabaseUrl, supabaseKey);

  const { searchParams } = new URL(req.url);
  const page       = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
  const limit      = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));
  const genreParam = searchParams.get('genre') || '';

  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let query = supa.from('crawl_videos').select('*', { count: 'exact' });
  if (genreParam) {
    query = query.eq('template_id', genreParam);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('[youtube/videos]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total      = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const videos = (data || []).map((row: Record<string, unknown>, idx: number) => ({
    id:           from + idx + 1,
    channelName:  (row.channel as string) || '',
    videoTitle:   (row.title   as string) || '',
    description:  '',
    thumbnail:    `https://img.youtube.com/vi/${row.video_id}/mqdefault.jpg`,
    url:          (row.url as string) || `https://www.youtube.com/watch?v=${row.video_id}`,
    subscribers:  formatKorean(Number(row.subscribers) || 0),
    views:        formatKorean(Number(row.views)       || 0),
    likes:        formatKorean(Number(row.likes)       || 0),
    comments:     formatKorean(Number(row.comments)    || 0),
    status:       'active' as const,
    collectedAt:  toCollectedAt((row.created_at as string) || (row.published_at as string)),
    viral_score:  Number(row.viral_score) || 0,
    genre:        (row.template_id as string) || 'general',
    is_analyzed:  Boolean(row.is_analyzed),
    quality_score: row.quality_score != null ? Number(row.quality_score) : undefined,
    content_type:  (row.content_type as string) || undefined,
    summary:       (row.summary as string) || undefined,
  }));

  return NextResponse.json({ videos, total, page, totalPages });
}
