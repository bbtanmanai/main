import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

const SCENARIO_COUNT = 3;

function runScenarioGen(
  scriptPath: string,
  app_id: string,
  topic: string,
  style: string,
  voice: string,
  art_prompt: string,
  tone_desc?: string | null,
  emotion_desc?: string | null,
): Promise<{ script: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const args = [scriptPath, '--app', app_id, '--topic', topic, '--style', style, '--voice', voice];
    if (art_prompt)    args.push('--art_prompt',    art_prompt);
    if (tone_desc)     args.push('--tone_desc',     tone_desc);
    if (emotion_desc)  args.push('--emotion_desc',  emotion_desc);
    const child = spawn('python', args, { cwd: path.dirname(scriptPath) });

    let out = '';
    child.stdout.on('data', (d: Buffer) => { out += d.toString('utf-8'); });
    child.stderr.on('data', (d: Buffer) => {
      console.error('[scenario-gen]', d.toString().trim());
    });

    child.on('close', () => {
      try {
        const lines = out.trim().split('\n').filter(l => l.trim().startsWith('{'));
        const result = JSON.parse(lines[lines.length - 1]);
        if (result.error) { reject(new Error(result.error)); return; }

        // [씬N] 태그 첫 2줄 추출 → 카드 미리보기용
        const previews = (result.script as string)
          .split('\n')
          .filter(l => /^\[씬\d+\]/.test(l.trim()))
          .slice(0, 2)
          .map(l => l.replace(/^\[씬\d+\]\s*/, '').trim());

        resolve({ script: result.script, preview: previews.join(' / ') });
      } catch {
        reject(new Error('시나리오 파싱 실패'));
      }
    });

    child.on('error', (err) => reject(err));
  });
}

export async function POST(req: NextRequest) {
  const { app_id, topic, style, voice, art_prompt, tone_id, tone_desc, emotion_id, emotion_desc } = await req.json();

  if (!topic?.trim()) {
    return Response.json({ error: '주제를 입력해주세요.' }, { status: 400 });
  }

  const scriptPath = path.resolve(
    process.cwd(), '..', '..', 'packages', 'tools',
    'skill-2-video-longform1', 'opal-manager', 'scenario_gen.py',
  );

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));

      // 3개 동시 생성 — 완료되는 순서대로 스트리밍
      const tasks = Array.from({ length: SCENARIO_COUNT }, (_, i) =>
        runScenarioGen(
          scriptPath,
          app_id     || 'health-senior',
          topic.trim(),
          style      || 'ranking',
          voice      || 'ko-KR-Wavenet-D',
          art_prompt || '',
          tone_desc    || null,
          emotion_desc || null,
        ).then(result => {
          send({ type: 'scenario', index: i, ...result });
        }).catch(err => {
          send({ type: 'scenario_error', index: i, message: err.message });
        })
      );

      Promise.all(tasks).then(() => {
        send({ type: 'done' });
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
