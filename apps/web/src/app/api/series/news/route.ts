import { NextResponse } from 'next/server';

const RSS_SOURCES = {
  economy: [
    'https://www.yna.co.kr/rss/economy.xml',
    'https://www.mk.co.kr/rss/30200030/',
  ],
  society: [
    'https://www.yna.co.kr/rss/society.xml',
    'https://www.mk.co.kr/rss/30200020/',
  ],
};

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

function parseRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = (/<title><!\[CDATA\[([\s\S]*?)\]\]>/.exec(block) ?? /<title>(.*?)<\/title>/.exec(block))?.[1]?.trim() ?? '';
    const link  = (/<link>(.*?)<\/link>/.exec(block) ?? /<guid[^>]*>(.*?)<\/guid>/.exec(block))?.[1]?.trim() ?? '';
    const pubDate = (/<pubDate>(.*?)<\/pubDate>/.exec(block))?.[1]?.trim() ?? '';
    const description = (/<description><!\[CDATA\[([\s\S]*?)\]\]>/.exec(block) ?? /<description>(.*?)<\/description>/.exec(block))?.[1]?.trim() ?? '';
    if (title) items.push({ title, link, pubDate, description });
  }
  return items;
}

async function fetchSectionItems(urls: string[]): Promise<NewsItem[]> {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkDrop/1.0)' },
        next: { revalidate: 300 },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = parseRSS(xml).slice(0, 10);
      if (items.length > 0) return items;
    } catch {
      // 다음 소스 시도
    }
  }
  return [];
}

export async function GET() {
  const [economy, society] = await Promise.all([
    fetchSectionItems(RSS_SOURCES.economy),
    fetchSectionItems(RSS_SOURCES.society),
  ]);

  return NextResponse.json({
    economy,
    society,
    fetched_at: new Date().toISOString(),
  });
}
