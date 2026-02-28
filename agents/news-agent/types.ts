
/**
 * types.ts — 뉴스 에이전트 공통 타입 정의
 */

export interface NewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
  source?: string;
}

export interface AgentResponse {
  success: boolean;
  count: number;
  message?: string;
}
