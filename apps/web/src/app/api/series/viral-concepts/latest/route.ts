import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('series_viral_concepts')
    .select('rising_keywords, viral_videos, concepts, collected_at, source_status')
    .order('collected_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return Response.json({ rising_keywords: [], viral_videos: [], concepts: [], collected_at: null, age_hours: null });
  }

  const ageHours = Math.floor((Date.now() - new Date(data.collected_at).getTime()) / (1000 * 60 * 60));

  return Response.json({
    rising_keywords: data.rising_keywords ?? [],
    viral_videos:    data.viral_videos    ?? [],
    concepts:        data.concepts        ?? [],
    collected_at:    data.collected_at,
    source_status:   data.source_status   ?? {},
    age_hours:       ageHours,
  });
}
