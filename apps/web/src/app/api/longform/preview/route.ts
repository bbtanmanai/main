import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get('path');
  if (!filePath) return new Response('missing path', { status: 400 });

  // 보안: temp 디렉터리 내 linkdrop_ 작업 폴더만 허용
  const tmpDir  = os.tmpdir();
  const resolved = path.resolve(filePath);
  const allowed  = path.join(tmpDir, path.sep === '\\' ? 'linkdrop_' : 'linkdrop_');

  if (!resolved.startsWith(tmpDir) || !path.basename(path.dirname(resolved)).startsWith('linkdrop_')) {
    return new Response('forbidden', { status: 403 });
  }

  if (!fs.existsSync(resolved)) return new Response('not found', { status: 404 });

  const ext = path.extname(resolved).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.jpg' ? 'image/jpeg' : 'application/octet-stream';

  const buf = fs.readFileSync(resolved);
  return new Response(buf, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
