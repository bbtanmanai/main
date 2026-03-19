import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

type CharacterItem = {
  id: string;
  image: string;
  zipFile?: string;
  bodyGrid?: string;
  faceGrid?: string;
};

type CharacterCatalog = {
  generatedAt: string;
  total: number;
  items: CharacterItem[];
};

function toPosix(p: string) {
  return p.replace(/\\/g, '/');
}

function toPublicUrl(publicDir: string, fullPath: string) {
  const rel = toPosix(path.relative(publicDir, fullPath));
  return (
    '/' +
    rel
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/')
  );
}

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function pickImageFile(id: string, files: string[]) {
  const byName = (ext: string) => files.find((f) => f.toLowerCase() === `${id.toLowerCase()}${ext}`);
  const preferred =
    byName('.svg') || byName('.png') || byName('.webp') || byName('.jpg') || byName('.jpeg') || byName('.gif');
  if (preferred) return preferred;

  const candidates = files.filter((f) => {
    const lower = f.toLowerCase();
    const okExt =
      lower.endsWith('.svg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg');
    if (!okExt) return false;
    if (lower.includes('grid')) return false;
    return true;
  });
  return candidates[0] || '';
}

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const baseDir = path.join(publicDir, 'img', 'content', 'character');

    if (!(await exists(baseDir))) {
      return NextResponse.json({ generatedAt: new Date().toISOString(), total: 0, items: [] }, { status: 200 });
    }

    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    const items: CharacterItem[] = [];
    for (const id of dirs) {
      const dirPath = path.join(baseDir, id);
      const files = await fs.readdir(dirPath);

      const imageFile = pickImageFile(id, files);
      if (!imageFile) continue;

      const zip = files.find((f) => f.toLowerCase().endsWith('.zip')) || '';
      const bodyGrid = files.find((f) => f.toLowerCase().includes('body_grid') && f.toLowerCase().endsWith('.png')) || '';
      const faceGrid = files.find((f) => f.toLowerCase().includes('face_grid') && f.toLowerCase().endsWith('.png')) || '';

      items.push({
        id,
        image: toPublicUrl(publicDir, path.join(dirPath, imageFile)),
        zipFile: zip ? toPublicUrl(publicDir, path.join(dirPath, zip)) : undefined,
        bodyGrid: bodyGrid ? toPublicUrl(publicDir, path.join(dirPath, bodyGrid)) : undefined,
        faceGrid: faceGrid ? toPublicUrl(publicDir, path.join(dirPath, faceGrid)) : undefined,
      });
    }

    items.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));

    const data: CharacterCatalog = {
      generatedAt: new Date().toISOString(),
      total: items.length,
      items,
    };

    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '캐릭터 카탈로그 생성 실패' },
      { status: 500 },
    );
  }
}
