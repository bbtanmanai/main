
import { UsageLog } from "../types.ts";

/**
 * API 사용량 측정 및 로깅 매니저
 */
export class UsageLogger {
  private logs: UsageLog[] = [];

  /**
   * 사용량 기록 추가
   */
  logUsage(log: UsageLog) {
    console.log(`[Usage Report] Theme: ${log.theme} | Items: ${log.refinedItems}/${log.totalItems} | Tokens: ${log.promptTokens + log.completionTokens} | Est.Cost: $${log.estimatedCost.toFixed(4)}`);
    this.logs.push(log);
    
    // TODO: Supabase DB의 'usage_logs' 테이블에 저장하는 로직 추가 가능
  }

  /**
   * OpenAI gpt-4o 비용 계산 (2024년 상반기 기준 대략적 가격)
   * Input: $5.00 / 1M tokens
   * Output: $15.00 / 1M tokens
   */
  calculateCost(promptTokens: number, completionTokens: number): number {
    const inputCost = (promptTokens / 1000000) * 5.0;
    const outputCost = (completionTokens / 1000000) * 15.0;
    return inputCost + outputCost;
  }
}
