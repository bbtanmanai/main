
import { CollectedData, RefinedData } from "../types.ts";

/**
 * AI 기반 데이터 정제기
 */
export class Refiner {
  /**
   * 수집된 로우 데이터 정제 및 점수화
   */
  async refine(data: CollectedData[]): Promise<RefinedData[]> {
    const refinedItems: RefinedData[] = [];

    for (const item of data) {
      try {
        const refined = await this.callAI(item);
        if (refined.score >= 8) { // 8점 이상의 고품질 데이터만 채택
          refinedItems.push({
            ...item,
            ...refined
          });
        }
      } catch (error) {
        console.error(`Error refining data for ${item.title}:`, error);
      }
    }

    return refinedItems;
  }

  /**
   * LLM을 호출하여 데이터 분석 및 요약
   */
  private async callAI(item: CollectedData): Promise<{ score: number; insight: string; summary: string; usage: { prompt_tokens: number; completion_tokens: number } }> {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const prompt = `
      다음 내용을 분석하여 '수익 창출' 및 '실무 활용' 관점에서 1~10점 사이의 점수를 부여하고 핵심 인사이트 3줄 요약을 작성하라.
      
      제목: ${item.title}
      내용 요약: ${item.content.slice(0, 500)}...
      
      형식:
      {
        "score": 8,
        "insight": "이 기술을 통해 소상공인이 마케팅 비용을 30% 절감할 수 있는 구체적인 방법 제안",
        "summary": "1. 최신 기술 동향 설명\n2. 실무 적용 시나리오 제시\n3. 기대 효과 분석"
      }
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    const result = await response.json();
    const parsedContent = JSON.parse(result.choices[0].message.content);
    
    return {
      ...parsedContent,
      usage: {
        prompt_tokens: result.usage.prompt_tokens,
        completion_tokens: result.usage.completion_tokens
      }
    };
  }

  /**
   * 정제 프로세스 실행 (사용량 정보 포함)
   */
  async refineWithUsage(data: CollectedData[]): Promise<{ refined: RefinedData[]; usage: { prompt_tokens: number; completion_tokens: number } }> {
    const refinedItems: RefinedData[] = [];
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    for (const item of data) {
      try {
        const result = await this.callAI(item);
        totalPromptTokens += result.usage.prompt_tokens;
        totalCompletionTokens += result.usage.completion_tokens;

        if (result.score >= 8) {
          refinedItems.push({
            ...item,
            score: result.score,
            insight: result.insight,
            summary: result.summary
          });
        }
      } catch (error) {
        console.error(`Error refining data for ${item.title}:`, error);
      }
    }

    return {
      refined: refinedItems,
      usage: {
        prompt_tokens: totalPromptTokens,
        completion_tokens: totalCompletionTokens
      }
    };
  }
}
