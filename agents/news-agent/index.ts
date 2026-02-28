
/**
 * index.ts — 뉴스 에이전트 통합 제어기
 * fetcher와 sender를 조율하여 뉴스 구독 워크플로우를 완성합니다.
 */

import { fetchLatestNews } from "./fetcher.ts";
import { sendNewsEmail } from "./sender.ts";

export async function processNewsAgent(email: string, keyword: string) {
  try {
    console.log(`[NewsAgent] Processing news for keyword: ${keyword} to email: ${email}`);

    // 1. 뉴스 추출 (4시간 이내 필터링 포함)
    const latestNews = await fetchLatestNews(keyword);
    
    if (latestNews.length === 0) {
      console.log(`[NewsAgent] No fresh news found for ${keyword} within the last 4 hours. Skipping email.`);
      return;
    }

    // 2. 이메일 발송
    await sendNewsEmail(email, keyword, latestNews);

    console.log(`[NewsAgent] Successfully processed news for ${email}`);
  } catch (err) {
    console.error('[NewsAgent] Workflow Error:', err.message);
  }
}

// 직접 실행할 경우 예시:
// if (import.meta.main) {
//   await processNewsAgent('user@example.com', '인공지능');
// }
