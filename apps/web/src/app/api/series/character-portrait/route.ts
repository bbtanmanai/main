import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const PORTRAIT_DIR = path.join(process.cwd(), 'public', 'img', 'series', 'characters');
const VALID_ID = /^[a-z0-9_]+$/;
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const id = formData.get('id') as string | null;

  if (!file || !id) {
    return NextResponse.json({ error: 'Missing file or id' }, { status: 400 });
  }
  if (!VALID_ID.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  if (!VALID_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  const ext = file.type === 'image/png' ? 'png'
    : file.type === 'image/webp' ? 'webp'
    : file.type === 'image/gif' ? 'gif'
    : 'jpg';

  // Remove any existing portrait files for this id
  for (const e of ['jpg', 'jpeg', 'png', 'webp', 'gif']) {
    const old = path.join(PORTRAIT_DIR, `${id}.${e}`);
    if (existsSync(old)) await unlink(old).catch(() => {});
  }

  const filename = `${id}.${ext}`;
  const bytes = await file.arrayBuffer();
  await writeFile(path.join(PORTRAIT_DIR, filename), Buffer.from(bytes));

  return NextResponse.json({ url: `/img/series/characters/${filename}` });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id || !VALID_ID.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  for (const e of ['jpg', 'jpeg', 'png', 'webp', 'gif']) {
    const f = path.join(PORTRAIT_DIR, `${id}.${e}`);
    if (existsSync(f)) await unlink(f).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
