import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // 개발 환경에서는 인증 건너뜀
  if (process.env.NODE_ENV !== 'development') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return Response.json({ error: 'CRON_SECRET 환경변수가 설정되지 않았습니다' }, { status: 401 });
    }
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // 모드 선택: TRENDS_COLLECTOR_URL 설정 시 FastAPI 호출, 미설정 시 로컬 Python spawn
  const collectorUrl = process.env.TRENDS_COLLECTOR_URL;

  let parsed: { keywords: object[]; collected_at: string; source_status: object; world_data?: object };

  if (collectorUrl) {
    // ── 프로덕션: FastAPI /trends/collect 호출 ──────────────────────────────
    const res = await fetch(`${collectorUrl}/trends/collect`, { method: 'GET' });
    if (!res.ok) {
      const body = await res.text();
      return Response.json({ error: `FastAPI 호출 실패: ${body.slice(0, 200)}` }, { status: 500 });
    }
    parsed = await res.json();
  } else {
    // ── 로컬 개발: Python subprocess spawn ─────────────────────────────────
    const scriptPath = path.resolve(
      process.cwd(),
      '..', '..',
      'packages', 'tools', 'skill-0-youtube-trend-fetcher',
      'collect_trends.py'
    );

    const result = await new Promise<{ stdout: string; stderr: string; code: number | null }>(
      (resolve) => {
        const child = spawn('python', ['-X', 'utf8', scriptPath], {
          env: { ...process.env },
          cwd: path.dirname(scriptPath),
        });

        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf-8'); });
        child.stderr.on('data', (chunk: Buffer) => {
          const txt = chunk.toString().trim();
          console.error('[cron-trends]', txt);
          stderr += txt + '\n';
        });

        const timer = setTimeout(() => {
          child.kill();
          resolve({ stdout: '', stderr: '타임아웃 (30초 초과)', code: -1 });
        }, 30000);

        child.on('close', (code) => { clearTimeout(timer); resolve({ stdout, stderr, code }); });
        child.on('error', (err) => { clearTimeout(timer); resolve({ stdout: '', stderr: err.message, code: -1 }); });
      }
    );

    if (result.code !== 0 || !result.stdout.trim()) {
      const errMsg = result.stderr.trim().split('\n').slice(-2).join(' | ');
      return Response.json({ error: `수집 실패: ${errMsg}` }, { status: 500 });
    }

    try {
      parsed = JSON.parse(result.stdout.trim());
    } catch {
      return Response.json({ error: 'JSON 파싱 실패', raw: result.stdout.slice(0, 200) }, { status: 500 });
    }
  }

  // ── Supabase 저장 ─────────────────────────────────────────────────────────
  if (!parsed?.keywords || !parsed?.collected_at) {
    return Response.json({ error: '수집 결과 필드 누락 (keywords 또는 collected_at)' }, { status: 500 });
  }

  const { error: dbError } = await supabase
    .from('series_trends')
    .insert({
      keywords:      parsed.keywords,
      collected_at:  parsed.collected_at,
      source_status: parsed.source_status ?? {},
      world_data:    parsed.world_data ?? {},
    });

  if (dbError) {
    console.error('[cron-trends] DB 저장 실패:', dbError.message);
    return Response.json({ error: `DB 저장 실패: ${dbError.message}` }, { status: 500 });
  }

  return Response.json(parsed);
}
