import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const template = searchParams.get('template') || '';
  const style    = searchParams.get('style') || '';
  const used     = searchParams.get('used') || '';
  const page     = parseInt(searchParams.get('page') || '1', 10);
  const offset   = (page - 1) * PAGE_SIZE;

  // 재고 통계 (template × style 합계)
  if (searchParams.get('stats') === '1') {
    const rows: { template_id: string; style: string; used: boolean }[] = [];
    let start = 0;
    while (true) {
      const { data } = await supabase
        .from('scenarios')
        .select('template_id, style, used')
        .range(start, start + 999);
      if (!data || data.length === 0) break;
      rows.push(...data);
      if (data.length < 1000) break;
      start += 1000;
    }
    const stats: Record<string, Record<string, { total: number; available: number }>> = {};
    for (const r of rows) {
      if (!stats[r.template_id]) stats[r.template_id] = {};
      if (!stats[r.template_id][r.style]) stats[r.template_id][r.style] = { total: 0, available: 0 };
      stats[r.template_id][r.style].total++;
      if (!r.used) stats[r.template_id][r.style].available++;
    }
    return NextResponse.json({ stats, total: rows.length });
  }

  // 목록 조회
  let query = supabase
    .from('scenarios')
    .select('id, template_id, style, topic, hook, scene_count, estimated_sec, viral_seed, used, used_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (template) query = query.eq('template_id', template);
  if (style)    query = query.eq('style', style);
  if (used === 'true')  query = query.eq('used', true);
  if (used === 'false') query = query.eq('used', false);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count, page, pageSize: PAGE_SIZE });
}
