import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PUBLIC_CHARS_DIR = path.resolve(process.cwd(), 'public', 'characters');
const SCRIPT_PATH      = path.resolve(process.cwd(), '..', '..', 'scripts', 'remove_bg.py');

function runRemoveBg(inputPath: string, outputPath: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn('python', [SCRIPT_PATH, '--input', inputPath, '--output', outputPath]);
    let out = '';
    child.stdout.on('data', (d: Buffer) => { out += d.toString('utf-8'); });
    child.stderr.on('data', (d: Buffer) => { console.error('[rembg]', d.toString().trim()); });
    child.on('close', () => {
      try {
        const lines = out.trim().split('\n').filter(l => l.trim().startsWith('{'));
        const result = JSON.parse(lines[lines.length - 1]);
        if (result.error) return reject(new Error(result.error));
        resolve({ width: result.width, height: result.height });
      } catch {
        reject(new Error('rembg 결과 파싱 실패'));
      }
    });
    child.on('error', reject);
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData  = await req.formData();
    const file      = formData.get('file') as File | null;
    const name      = (formData.get('name') as string | null) || '이름없음';
    const tags      = (formData.get('tags') as string | null) || '';

    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type))
      return NextResponse.json({ error: 'JPG / PNG / WEBP 파일만 허용됩니다.' }, { status: 400 });

    // 임시 파일 저장
    const id       = crypto.randomUUID();
    const ext      = file.name.split('.').pop() ?? 'jpg';
    const tmpInput  = path.join(PUBLIC_CHARS_DIR, `tmp_${id}.${ext}`);
    const outFile   = path.join(PUBLIC_CHARS_DIR, `${id}.png`);

    fs.mkdirSync(PUBLIC_CHARS_DIR, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tmpInput, buf);

    // rembg 실행
    const { width, height } = await runRemoveBg(tmpInput, outFile);

    // 임시 원본 삭제
    fs.unlinkSync(tmpInput);

    return NextResponse.json({
      id,
      name,
      tags:      tags.split(',').map(t => t.trim()).filter(Boolean),
      url:       `/characters/${id}.png`,
      width,
      height,
      liked:     false,
      createdAt: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
