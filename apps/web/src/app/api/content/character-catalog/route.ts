import { NextResponse } from 'next/server';
import characterData from '@/data/content_characterimage.json';

// 파일시스템 스캔 제거 → JSON 직접 import
// (Vercel 함수 번들에 이미지 파일이 포함되어 300MB 초과하는 문제 해결)
export const dynamic = 'force-static';

export async function GET() {
  try {
    const characters = (characterData as any).characters ?? [];

    const items = characters.map((c: any) => ({
      id: c.id,
      image: c.image,
      zipFile: c.zipFile,
      bodyGrid: c.bodyGrid,
      faceGrid: c.faceGrid,
    }));

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      total: items.length,
      items,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '캐릭터 카탈로그 생성 실패' },
      { status: 500 },
    );
  }
}
