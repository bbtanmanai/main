import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = (searchParams.get('video_id') || '').trim();
  const maxResultsRaw = searchParams.get('max_results') || '20';
  const maxResults = Math.min(50, Math.max(1, Number(maxResultsRaw) || 20));

  if (!videoId) {
    return new Response(JSON.stringify({ error: 'video_id is required' }), {
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
    'comments_fetch.py',
  );

  const payload = JSON.stringify({ video_id: videoId, max_results: maxResults });

  return await new Promise<Response>((resolve) => {
    const child = spawn('python', ['-X', 'utf8', scriptPath], {
      env: { ...process.env },
      cwd: path.dirname(scriptPath),
    });

    child.stdin.write(payload + '\n');
    child.stdin.end();

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf-8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf-8');
    });

    child.on('close', (code) => {
      if (code !== 0) {
        try {
          const data = JSON.parse(stdout.trim() || '{}');
          const msg = data?.error || '댓글 수집기 실행 실패';
          resolve(
            new Response(JSON.stringify({ error: msg, code: data?.code || 'comments_fetch_failed' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
          return;
        } catch {
          // ignore
        }
        const msg = '댓글 수집기 실행 실패';
        resolve(
          new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
        return;
      }

      try {
        const data = JSON.parse(stdout.trim() || '{}');
        if (data?.error) {
          resolve(
            new Response(JSON.stringify({ error: data.error, code: data?.code, status: data?.status }), {
              status: data?.code === 'comments_disabled' ? 422 : 500,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
          return;
        }
        resolve(
          new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'parse failed';
        resolve(
          new Response(JSON.stringify({ error: `댓글 응답 파싱 실패: ${msg}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
    });

    child.on('error', (err) => {
      resolve(
        new Response(JSON.stringify({ error: `프로세스 실행 오류: ${err.message}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
  });
}
