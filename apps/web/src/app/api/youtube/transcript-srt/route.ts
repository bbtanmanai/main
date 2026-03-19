import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = (searchParams.get('video_id') || '').trim();

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
    'transcript_srt_fetch.py',
  );

  const payload = JSON.stringify({ video_id: videoId });

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
      try {
        const data = JSON.parse(stdout.trim() || '{}');
        if (data?.error) {
          const status =
            data?.code === 'no_transcript' || data?.code === 'transcripts_disabled' ? 422 : 500;
          resolve(
            new Response(JSON.stringify({ error: data.error, code: data?.code }), {
              status,
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
          new Response(JSON.stringify({ error: `자막 응답 파싱 실패: ${err}` }), {
            status: code === 0 ? 500 : 500,
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

