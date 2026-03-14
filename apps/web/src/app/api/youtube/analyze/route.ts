import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  let body: { video_ids?: string[]; analyze_all?: boolean; batch_size?: number };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { video_ids, analyze_all = false, batch_size = 5 } = body;

  let targetIds: string[] = [];

  if (analyze_all) {
    // Fetch all unanalyzed video_ids from Supabase
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Supabase env vars not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const supa = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supa
      .from('crawl_videos')
      .select('video_id')
      .eq('is_analyzed', false);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    targetIds = (data || []).map((row: { video_id: string }) => row.video_id).filter(Boolean);
  } else if (Array.isArray(video_ids) && video_ids.length > 0) {
    targetIds = video_ids.filter((id) => typeof id === 'string' && id.trim() !== '');
  }

  if (targetIds.length === 0) {
    // Nothing to analyze — return a completed SSE stream immediately
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: 'done', analyzed: 0, failed: 0 })}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  const scriptPath = path.resolve(
    process.cwd(),
    '..',
    '..',
    'packages',
    'tools',
    'skill-0-youtube-fetcher',
    'video_analyzer.py',
  );

  const enc = new TextEncoder();
  const inputPayload = JSON.stringify({ video_ids: targetIds, batch_size });

  const stream = new ReadableStream({
    start(controller) {
      const child = spawn('python', ['-X', 'utf8', scriptPath], {
        env: { ...process.env },
        cwd: path.dirname(scriptPath),
      });

      child.stdin.write(inputPayload + '\n');
      child.stdin.end();

      let buf = '';

      const send = (event: object) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      child.stdout.on('data', (chunk: Buffer) => {
        buf += chunk.toString('utf-8');
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const raw of lines) {
          const line = raw.trim();
          if (!line) continue;

          const jsonStr = line.startsWith('data: ') ? line.slice(6) : line;
          try {
            const event = JSON.parse(jsonStr);
            send(event);
          } catch {
            // Non-JSON debug output — ignore
          }
        }
      });

      let stderrBuf = '';
      child.stderr.on('data', (chunk: Buffer) => {
        const txt = chunk.toString().trim();
        console.error('[youtube/analyze]', txt);
        stderrBuf += txt + '\n';
      });

      child.on('close', (code) => {
        if (buf.trim()) {
          const jsonStr = buf.trim().startsWith('data: ') ? buf.trim().slice(6) : buf.trim();
          try {
            const event = JSON.parse(jsonStr);
            send(event);
          } catch { /* ignore */ }
        }
        if (code !== 0) {
          const errLines = stderrBuf.trim().split('\n').filter(Boolean).slice(-3).join(' | ');
          send({ type: 'error', message: `분석기 오류: ${errLines || '알 수 없는 오류'}` });
        }
        controller.close();
      });

      child.on('error', (err) => {
        send({ type: 'error', message: `프로세스 실행 오류: ${err.message}` });
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
