import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { app_id, topic, voice, tts_speed, script, art_prompt } = await req.json();
  // 해상도: 1차 16:9(재사용) → 2차 9:16(최종) 자동 2단계 — aspect 파라미터 제거됨

  if (!topic?.trim()) {
    return new Response(JSON.stringify({ error: '주제를 입력해주세요.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // pipeline_server.py 경로 (apps/web 기준 ../../packages/...)
  const scriptPath = path.resolve(
    process.cwd(),
    '..',
    '..',
    'packages',
    'tools',
    'skill-2-video-longform1',
    'opal-manager',
    'pipeline_server.py',
  );

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const args = [
        scriptPath,
        '--app',   app_id  || 'health-senior',
        '--topic', topic.trim(),
        '--voice', voice   || 'ko-KR-Wavenet-D',
      ];
      if (script?.trim())     args.push('--script',     script.trim());
      if (art_prompt?.trim()) args.push('--art_prompt', art_prompt.trim());
      if (tts_speed != null)  args.push('--tts_speed',  String(tts_speed));

      const child = spawn('python', args,
        {
          env: { ...process.env },
          // pipeline_server.py 디렉토리를 cwd로 설정 (relative imports 해결)
          cwd: path.dirname(scriptPath),
        },
      );

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
          try {
            const event = JSON.parse(line);
            controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch {
            // JSON 아닌 출력(print 디버그 등)은 무시
          }
        }
      });

      let stderrBuf = '';
      child.stderr.on('data', (chunk: Buffer) => {
        const txt = chunk.toString().trim();
        console.error('[longform-pipeline]', txt);
        stderrBuf += txt + '\n';
      });

      child.on('close', (code) => {
        if (buf.trim()) {
          try {
            const event = JSON.parse(buf.trim());
            controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch { /* ignore */ }
        }
        if (code !== 0) {
          // 마지막 stderr 3줄을 메시지에 포함
          const errLines = stderrBuf.trim().split('\n').filter(Boolean).slice(-3).join(' | ');
          send({ type: 'error', message: `파이프라인 오류: ${errLines || '알 수 없는 오류'}` });
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
