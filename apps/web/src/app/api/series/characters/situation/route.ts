import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_PATH = join(process.cwd(), 'src', 'data', 'series_characters.json');

interface RawMember {
  id: string;
  situations: string[];
  [key: string]: unknown;
}

interface Family {
  members: RawMember[];
  [key: string]: unknown;
}

interface SupportGroup {
  members: RawMember[];
  [key: string]: unknown;
}

interface CharactersData {
  families: Family[];
  supporting: SupportGroup[];
}

export async function POST(req: NextRequest) {
  try {
    const { characterId, situation } = await req.json() as { characterId: string; situation: string };

    if (!characterId || !situation?.trim()) {
      return NextResponse.json({ error: 'characterId, situation 필수' }, { status: 400 });
    }

    const raw = readFileSync(DATA_PATH, 'utf-8');
    const data: CharactersData = JSON.parse(raw);

    let found = false;

    // families에서 탐색
    for (const family of data.families) {
      for (const member of family.members) {
        if (member.id === characterId) {
          if (!Array.isArray(member.situations)) member.situations = [];
          member.situations.push(situation.trim());
          found = true;
          break;
        }
      }
      if (found) break;
    }

    // supporting에서 탐색
    if (!found) {
      for (const group of data.supporting) {
        for (const member of group.members) {
          if (member.id === characterId) {
            if (!Array.isArray(member.situations)) member.situations = [];
            member.situations.push(situation.trim());
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    if (!found) {
      return NextResponse.json({ error: '캐릭터를 찾을 수 없습니다' }, { status: 404 });
    }

    writeFileSync(DATA_PATH, Buffer.from(JSON.stringify(data, null, 2), 'utf8'));

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
