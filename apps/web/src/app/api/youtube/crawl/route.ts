import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { urls?: string[]; genre?: string; max_results?: number };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { urls, genre = 'general', max_results = 50 } = body;
  const totalLimit = Math.min(50, Math.max(1, Number(max_results) || 50));

  if (!Array.isArray(urls) || urls.length === 0) {
    return new Response(JSON.stringify({ error: 'urls must be a non-empty array' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const validUrls = urls.filter((u) => typeof u === 'string' && u.trim() !== '');
  if (validUrls.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid URLs provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const scriptPath = path.resolve(
    process.cwd(),
    '..',
    '..',
    'packages',
    'tools',
    'skill-0-youtube-fetcher',
    'channel_crawl.py',
  );

  const enc = new TextEncoder();
  const inputPayload = JSON.stringify({ urls: validUrls, genre, max_results: totalLimit });

  const stream = new ReadableStream({
    start(controller) {
      const child = spawn('python', ['-X', 'utf8', scriptPath], {
        env: { ...process.env },
        cwd: path.dirname(scriptPath),
      });

      // Write input payload to stdin then close it
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

          // Strip leading "data: " prefix if present (script already emits it)
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
        console.error('[youtube/crawl]', txt);
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
          send({ type: 'error', message: `크롤러 오류: ${errLines || '알 수 없는 오류'}` });
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
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
