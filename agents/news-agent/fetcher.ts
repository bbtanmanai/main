
/**
 * fetcher.ts — Naver 뉴스 검색 API 연동
 * 4시간 이내의 최신 뉴스만 추출하는 기능을 담당합니다.
 */

import { NewsItem } from "./types.ts";

export async function fetchLatestNews(keyword: string): Promise<NewsItem[]> {
  const NAVER_CLIENT_ID = Deno.env.get('NAVER_CLIENT_ID');
  const NAVER_CLIENT_SECRET = Deno.env.get('NAVER_CLIENT_SECRET');

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.error('Naver API credentials not found. Using mock data for testing.');
    return getMockNews(keyword);
  }

  try {
    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=20&sort=date`;
    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    });

    if (!response.ok) {
      throw new Error(`Naver API Error: ${response.status}`);
    }

    const data = await response.json();
    const items: NewsItem[] = data.items;

    // 4시간 이내 필터링 (4 hours = 4 * 60 * 60 * 1000 ms)
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    const now = new Date();

    const filteredItems = items.filter((item) => {
      const pubDate = new Date(item.pubDate);
      return now.getTime() - pubDate.getTime() <= FOUR_HOURS_MS;
    });

    // 상위 5개만 반환
    return filteredItems.slice(0, 5);
  } catch (err) {
    console.error('Fetch News Error:', err.message);
    return [];
  }
}

function getMockNews(keyword: string): NewsItem[] {
  return [
    {
      title: `[실시간] ${keyword} 업계 주요 동향 리포트`,
      originallink: 'https://example.com/1',
      link: 'https://example.com/1',
      description: '실시간으로 수집된 가상의 뉴스 데이터입니다.',
      pubDate: new Date().toUTCString(),
    },
    {
      title: `${keyword} 관련 최신 혁신 기술 발표`,
      originallink: 'https://example.com/2',
      link: 'https://example.com/2',
      description: '실시간으로 수집된 가상의 뉴스 데이터입니다.',
      pubDate: new Date().toUTCString(),
    },
    {
      title: `${keyword} 시장의 변화와 향후 전망`,
      originallink: 'https://example.com/3',
      link: 'https://example.com/3',
      description: '실시간으로 수집된 가상의 뉴스 데이터입니다.',
      pubDate: new Date().toUTCString(),
    },
  ];
}
