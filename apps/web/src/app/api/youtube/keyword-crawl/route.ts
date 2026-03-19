import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { keywords?: string[]; max_results?: number; regionCode?: string };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { keywords = [], max_results = 50, regionCode = '' } = body;
  const totalLimit = Math.min(50, Math.max(1, Number(max_results) || 50));

  if (!Array.isArray(keywords) || keywords.length === 0) {
    return new Response(JSON.stringify({ error: 'keywords must be a non-empty array' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const scriptPath = path.resolve(
    process.cwd(),
    '..', '..', 'packages', 'tools', 'skill-0-youtube-fetcher', 'keyword_crawl.py',
  );

  const enc = new TextEncoder();
  const inputPayload = JSON.stringify({ keywords, max_results: totalLimit, regionCode });
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const stream = new ReadableStream({
    start(controller) {
      const child = spawn('python', ['-X', 'utf8', scriptPath], {
        env: { ...process.env },
        cwd: path.dirname(scriptPath),
      });

      child.stdin.write(inputPayload + '\n');
      child.stdin.end();

      let buf = '';
      let lastTotalSaved: number | null = null;

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
            const ev = JSON.parse(jsonStr);
            if (ev?.type === 'done' && typeof ev?.total_saved === 'number') {
              lastTotalSaved = ev.total_saved;
            }
            send(ev);
          } catch { /* ignore non-JSON */ }
        }
      });

      let stderrBuf = '';
      child.stderr.on('data', (chunk: Buffer) => {
        const txt = chunk.toString().trim();
        console.error('[youtube/keyword-crawl]', txt);
        stderrBuf += txt + '\n';
      });

      child.on('close', (code) => {
        (async () => {
          if (buf.trim()) {
            const jsonStr = buf.trim().startsWith('data: ') ? buf.trim().slice(6) : buf.trim();
            try {
              const ev = JSON.parse(jsonStr);
              if (ev?.type === 'done' && typeof ev?.total_saved === 'number') {
                lastTotalSaved = ev.total_saved;
              }
              send(ev);
            } catch {
              // ignore
            }
          }

          if (code !== 0) {
            const stderrLines = stderrBuf.trim().split('\n').filter(Boolean);
            const tail = stderrLines.slice(-20).join('\n');
            send({
              type: 'error',
              message: `수집기 오류(종료코드 ${code}): ${stderrLines.slice(-3).join(' | ') || '알 수 없는 오류'}`,
              exit_code: code,
              stderr_tail: tail,
            });
            controller.close();
            return;
          }

          if (supabaseUrl && supabaseKey && Array.isArray(keywords) && keywords.length > 0) {
            try {
              const supa = createClient(supabaseUrl, supabaseKey);
              const host = (() => {
                try { return new URL(supabaseUrl).host; } catch { return ''; }
              })();

              for (const kw of keywords) {
                const { count, error } = await supa
                  .from('crawl_videos')
                  .select('video_id', { count: 'exact', head: true })
                  .eq('keyword', kw);
                send({
                  type: 'verify',
                  keyword: kw,
                  count: count ?? 0,
                  host,
                  total_saved: lastTotalSaved ?? 0,
                  error: error?.message || null,
                });
              }
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'verify failed';
              send({ type: 'verify', keyword: keywords[0], count: 0, host: '', total_saved: lastTotalSaved ?? 0, error: msg });
            }
          }

          controller.close();
        })();
      });

      child.on('error', (err) => {
        send({
          type: 'error',
          message: `프로세스 실행 오류: ${err.message}`,
          stderr_tail: stderrBuf.trim(),
        });
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
