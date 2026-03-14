import { CORE_THEMES, CollectedData } from "./types.ts";

/**
 * [Common Component] Fetcher
 * 역할: RSS 및 키워드 기반 원석 소재 수집
 * 유실된 source-collector/lib/fetcher.ts를 대체합니다.
 */
export class Fetcher {
    /**
     * 특정 주제(Theme)의 RSS에서 데이터 수집
     */
    async fetchTheme(theme: keyof typeof CORE_THEMES): Promise<CollectedData[]> {
        const themeConfig = CORE_THEMES[theme];
        if (!themeConfig || !themeConfig.rss) {
            console.warn(`[Fetcher] 주제 ${String(theme)}에 대한 RSS 설정이 없습니다.`);
            return [];
        }

        console.log(`[Fetcher] RSS 수집 시작: ${themeConfig.name}`);
        return await this.fetchRSS(themeConfig.rss, theme);
    }

    /**
     * 특정 키워드로 검색 데이터 수집 (Google News RSS 활용)
     */
    async fetchByKeyword(keyword: string): Promise<CollectedData[]> {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ko&gl=KR&ceid=KR:ko`;
        console.log(`[Fetcher] 키워드 검색 시작: ${keyword}`);
        // 키워드 검색 시 기본 테마를 미분류(SHORT_FORM 등 적절한 기본값)로 설정하거나 타입을 조정해야 함
        // 여기서는 편의상 SHORT_FORM으로 설정
        return await this.fetchRSS(rssUrl, "SHORT_FORM");
    }

    /**
     * RSS 데이터 가져오기 및 파싱
     */
    private async fetchRSS(url: string, theme: keyof typeof CORE_THEMES): Promise<CollectedData[]> {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const xml = await response.text();

            // 간단한 RSS XML 파서 (Regex 기반)
            const items: CollectedData[] = [];
            const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

            for (const match of itemMatches) {
                const itemContent = match[1];
                const title = itemContent.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "No Title";
                const link = itemContent.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
                const pubDate = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || new Date().toISOString();
                const description = itemContent.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";

                items.push({
                    source: "Google News RSS",
                    title: this.decodeHTML(title),
                    link,
                    content: this.decodeHTML(description),
                    pubDate,
                    theme
                });
            }

            console.log(`[Fetcher] 수집 완료: ${items.length}개 아이템`);
            return items;
        } catch (error) {
            console.error(`[Fetcher] RSS 수집 도중 오류 발생:`, error);
            return [];
        }
    }

    private decodeHTML(html: string): string {
        return html
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1");
    }
}
