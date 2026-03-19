import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: {
    video_id?: string;
    srt?: string;
    title?: string;
    channel?: string;
    url?: string;
    views?: number;
    likes?: number;
    comments?: number;
    subscribers?: number;
    viral_score?: number;
    published_at?: string;
    created_at?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const videoId = (body.video_id || '').trim();
  const srt = (body.srt || '').trim();

  if (!videoId) {
    return new Response(JSON.stringify({ error: 'video_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!srt) {
    return new Response(JSON.stringify({ error: 'srt is required' }), {
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
    'benchmark_report.py',
  );

  const payload = JSON.stringify({
    video_id: videoId,
    srt,
    title: body.title,
    channel: body.channel,
    url: body.url,
    views: body.views,
    likes: body.likes,
    comments: body.comments,
    subscribers: body.subscribers,
    viral_score: body.viral_score,
    published_at: body.published_at,
    created_at: body.created_at,
  });

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

    child.on('close', () => {
      try {
        const data = JSON.parse(stdout.trim() || '{}');
        if (data?.error) {
          resolve(
            new Response(JSON.stringify({ error: data.error, code: data?.code }), {
              status: 500,
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
        const err = stderr.trim() || stdout.trim() || msg;
        resolve(
          new Response(JSON.stringify({ error: `보고서 응답 파싱 실패: ${err}` }), {
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
