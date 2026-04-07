import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 90; // seconds

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return Response.json({ error: 'CRON_SECRET 미설정' }, { status: 401 });
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scriptPath = path.resolve(
    process.cwd(), '..', '..',
    'packages', 'tools', 'skill-0-youtube-trend-fetcher',
    'collect_viral.py'
  );

  const result = await new Promise<{ stdout: string; stderr: string; code: number | null }>(resolve => {
    const child = spawn('python', ['-X', 'utf8', scriptPath], {
      env: { ...process.env },
      cwd: path.dirname(scriptPath),
    });

    let stdout = '', stderr = '';
    child.stdout.on('data', (c: Buffer) => { stdout += c.toString('utf-8'); });
    child.stderr.on('data', (c: Buffer) => { stderr += c.toString(); });

    const timer = setTimeout(() => {
      child.kill();
      resolve({ stdout: '', stderr: '타임아웃 (80초 초과)', code: -1 });
    }, 80000);

    child.on('close', code => { clearTimeout(timer); resolve({ stdout, stderr, code }); });
    child.on('error', err => { clearTimeout(timer); resolve({ stdout: '', stderr: err.message, code: -1 }); });
  });

  if (result.code !== 0 || !result.stdout.trim()) {
    return Response.json({ error: `수집 실패: ${result.stderr.trim().slice(0, 300)}` }, { status: 500 });
  }

  let parsed: {
    rising_keywords: object[];
    viral_videos: object[];
    concepts: object[];
    collected_at: string;
    source_status: object;
  };

  try {
    parsed = JSON.parse(result.stdout.trim());
  } catch {
    return Response.json({ error: 'JSON 파싱 실패' }, { status: 500 });
  }

  const { error: dbError } = await supabase
    .from('series_viral_concepts')
    .insert({
      rising_keywords: parsed.rising_keywords,
      viral_videos:    parsed.viral_videos,
      concepts:        parsed.concepts,
      collected_at:    parsed.collected_at,
      source_status:   parsed.source_status ?? {},
    });

  if (dbError) {
    console.error('[viral-concepts] DB 저장 실패:', dbError.message);
    return Response.json({ error: `DB 저장 실패: ${dbError.message}` }, { status: 500 });
  }

  return Response.json(parsed);
}
