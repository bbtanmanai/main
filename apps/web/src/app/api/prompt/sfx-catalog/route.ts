import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

type SfxItem = {
  id: string;
  name: string;
  path: string;
  mainCategory: string;
  subCategory: string;
};

type SfxCatalog = {
  generatedAt: string;
  total: number;
  mainCategories: Array<{
    name: string;
    count: number;
    subcategories: Array<{ name: string; count: number }>;
  }>;
  items: SfxItem[];
};

let cache:
  | {
      ts: number;
      data: SfxCatalog;
    }
  | null = null;

async function walkFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkFiles(full)));
      continue;
    }
    if (!e.isFile()) continue;
    const ext = path.extname(e.name).toLowerCase();
    if (ext === '.wav' || ext === '.mp3' || ext === '.ogg') out.push(full);
  }
  return out;
}

function toPosix(p: string) {
  return p.replace(/\\/g, '/');
}

function safeIdFromPath(relPath: string) {
  return relPath.replace(/[^a-zA-Z0-9/_\-\.]/g, '_');
}

async function buildCatalog(): Promise<SfxCatalog> {
  const publicDir = path.join(process.cwd(), 'public');
  const sfxDir = path.join(publicDir, 'assets', 'sfx');

  const files = await walkFiles(sfxDir);
  const items: SfxItem[] = [];

  for (const full of files) {
    const rel = toPosix(path.relative(publicDir, full));
    const urlPath = '/' + rel.split('/').map((seg) => encodeURIComponent(seg)).join('/');
    const segs = rel.split('/');
    const mainCategory = segs[2] || '기타';
    const subCategory = segs[3] || '기타';
    const base = path.basename(full);
    const name = base.replace(path.extname(base), '');
    items.push({
      id: safeIdFromPath(rel),
      name,
      path: urlPath,
      mainCategory,
      subCategory,
    });
  }

  items.sort((a, b) => {
    const aKey = `${a.mainCategory}/${a.subCategory}/${a.name}`;
    const bKey = `${b.mainCategory}/${b.subCategory}/${b.name}`;
    return aKey.localeCompare(bKey, 'ko');
  });

  const mainObj: Record<string, Record<string, number>> = {};
  for (const it of items) {
    if (!mainObj[it.mainCategory]) mainObj[it.mainCategory] = {};
    mainObj[it.mainCategory][it.subCategory] = (mainObj[it.mainCategory][it.subCategory] ?? 0) + 1;
  }

  const mainCategories = Object.entries(mainObj)
    .map(([name, subObj]) => {
      const subcategories = Object.entries(subObj)
        .map(([subName, count]) => ({ name: subName, count }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      const count = subcategories.reduce((acc, s) => acc + s.count, 0);
      return { name, count, subcategories };
    })
    .sort((a, b) => b.count - a.count);

  return {
    generatedAt: new Date().toISOString(),
    total: items.length,
    mainCategories,
    items,
  };
}

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.ts < 5 * 60 * 1000) {
      return NextResponse.json(cache.data, { status: 200 });
    }

    const data = await buildCatalog();
    cache = { ts: now, data };
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'SFX 카탈로그 생성 실패' },
      { status: 500 },
    );
  }
}
