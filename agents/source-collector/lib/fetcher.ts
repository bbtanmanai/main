
import { CollectedData, CORE_THEMES } from "../types.ts";

/**
 * 주제별 데이터 수집기
 */
export class Fetcher {
  /**
   * 글로벌 AI 테크 뉴스 수집 (09번 주제)
   */
  async fetchGlobalAiTech(): Promise<CollectedData[]> {
    const sources = [
      { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
      { name: "OpenAI Blog", url: "https://openai.com/news/rss.xml" },
      { name: "The Verge AI", url: "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml" }
    ];

    const allData: CollectedData[] = [];

    for (const source of sources) {
      try {
        const response = await fetch(source.url);
        const xml = await response.text();
        
        // 간단한 XML 파싱 (정규식 활용 - Edge Runtime 환경 고려)
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
        
        for (const item of items.slice(0, 5)) { // 최신 5개씩만
          const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] || 
                        item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
          const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
          const description = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] || 
                             item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";
          const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";

          allData.push({
            source: source.name,
            title: this.cleanHtml(title),
            link,
            content: this.cleanHtml(description),
            pubDate,
            theme: "GLOBAL_AI_TECH"
          });
        }
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
      }
    }

    return allData;
  }

  private cleanHtml(text: string): string {
    return text.replace(/<\/?[^>]+(>|$)/g, "").trim();
  }
}
