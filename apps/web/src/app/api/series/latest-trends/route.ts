import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('series_trends')
    .select('keywords, collected_at, source_status, world_data')
    .order('collected_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return Response.json({ keywords: [], collected_at: null, age_hours: null });
  }

  // 수집 후 경과 시간 계산
  const collectedAt = new Date(data.collected_at);
  const ageHours = Math.floor((Date.now() - collectedAt.getTime()) / (1000 * 60 * 60));

  return Response.json({
    keywords:      data.keywords,
    collected_at:  data.collected_at,
    source_status: data.source_status,
    world_data:    data.world_data ?? {},
    age_hours:     ageHours,
  });
}
