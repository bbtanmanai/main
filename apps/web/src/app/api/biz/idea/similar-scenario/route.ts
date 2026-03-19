import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

type ScenarioRow = {
  id: string;
  template_id: string;
  style: string;
  topic: string;
  script: string;
  created_at?: string;
};

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,./:;<=>?@[\\\]^`{|}~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .filter((t) => !/^\d+$/.test(t))
    .slice(0, 2000);
}

function jaccard(a: string[], b: string[]): number {
  const B = new Set(b);
  if (a.length === 0 || B.size === 0) return 0;
  let inter = 0;
  const seen = new Set<string>();
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    if (seen.has(x)) continue;
    seen.add(x);
    if (B.has(x)) inter += 1;
  }
  const union = seen.size + B.size - inter;
  return union > 0 ? inter / union : 0;
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Supabase env vars not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { text?: string; template_id?: string; limit?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const text = (body.text || '').trim();
  const templateId = (body.template_id || '').trim();
  const limit = Math.min(200, Math.max(20, Number(body.limit) || 80));

  if (!text) {
    return new Response(JSON.stringify({ error: 'text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let query = supabase
    .from('scenarios')
    .select('id, template_id, style, topic, script, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (templateId) query = query.eq('template_id', templateId);

  const { data, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rows = (data || []) as ScenarioRow[];

  const baseTokens = tokenize(text);
  let best: { row: ScenarioRow; score: number } | null = null;

  for (const r of rows) {
    const candidate = `${r.topic || ''}\n${(r.script || '').slice(0, 1200)}`;
    const score = jaccard(baseTokens, tokenize(candidate));
    if (!best || score > best.score) best = { row: r, score };
  }

  if (!best) {
    return new Response(JSON.stringify({ scenario: null, score: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const snippet = (best.row.script || '').slice(0, 900);
  return new Response(
    JSON.stringify({
      score: best.score,
      scenario: {
        id: best.row.id,
        template_id: best.row.template_id,
        style: best.row.style,
        topic: best.row.topic,
        created_at: best.row.created_at,
        script: best.row.script || '',
        script_snippet: snippet,
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
