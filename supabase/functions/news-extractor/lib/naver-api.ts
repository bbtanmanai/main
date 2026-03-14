
export async function fetchFromNaver(keyword: string, count: number) {
  // @ts-ignore: Deno is a Deno global
  const CLIENT_ID = Deno.env.get('NAVER_CLIENT_ID');
  // @ts-ignore: Deno is a Deno global
  const CLIENT_SECRET = Deno.env.get('NAVER_CLIENT_SECRET');

  if (!CLIENT_ID || !CLIENT_SECRET) return [];

  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=${count * 2}&sort=date`;
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': CLIENT_ID,
      'X-Naver-Client-Secret': CLIENT_SECRET,
    }
  });

  if (!res.ok) return [];

  const data = await res.json();
  const items = data.items || [];

  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  const now = new Date();

  return items
    .filter((item: any) => (now.getTime() - new Date(item.pubDate).getTime()) <= FOUR_HOURS_MS)
    .map((item: any) => ({
      title: item.title.replace(/<\/?[^>]+(>|$)/g, ""),
      link: item.link,
      pubDate: item.pubDate,
      source: "네이버 뉴스"
    }))
    .slice(0, count);
}
