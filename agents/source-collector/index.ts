
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Fetcher } from "./lib/fetcher.ts";
import { Refiner } from "./lib/refiner.ts";
import { Syncer } from "./lib/syncer.ts";
import { UsageLogger } from "./lib/usage-logger.ts";
import { CORE_THEMES } from "./types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { trigger, theme } = await req.json();

    const fetcher = new Fetcher();
    const refiner = new Refiner();
    const syncer = new Syncer();
    const logger = new UsageLogger();

    // 1. 자동 정기 수집 (Cron) - 매일 새벽 1회 실행 가정
    if (trigger === 'cron') {
      console.log("[Source-Collector] 일일 정기 수집 프로세스 시작 (새벽 3시)...");
      
      const themeKeys = Object.keys(CORE_THEMES) as (keyof typeof CORE_THEMES)[];
      let summaryResults = [];

      for (const key of themeKeys) {
        // 현재는 GLOBAL_AI_TECH만 구체적 Fetcher가 구현됨 (나머지는 확장 예정)
        if (key === 'GLOBAL_AI_TECH') {
          const rawData = await fetcher.fetchGlobalAiTech();
          const { refined, usage } = await refiner.refineWithUsage(rawData);
          
          if (refined.length > 0) {
            await syncer.syncToDrive(refined);
          }

          // 사용량 로깅
          const cost = logger.calculateCost(usage.prompt_tokens, usage.completion_tokens);
          logger.logUsage({
            date: new Date().toISOString(),
            theme: key,
            totalItems: rawData.length,
            refinedItems: refined.length,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            estimatedCost: cost
          });

          summaryResults.push(`${key}: ${refined.length} items refined (Cost: $${cost.toFixed(4)})`);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "일일 수집 완료",
        details: summaryResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. 수동 트리거 (테스트용)
    if (theme === 'GLOBAL_AI_TECH') {
      const data = await fetcher.fetchGlobalAiTech();
      const refined = await refiner.refine(data);
      
      return new Response(JSON.stringify({ success: true, count: refined.length, data: refined }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: "Invalid trigger or theme" }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
