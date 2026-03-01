
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Fetcher } from "./lib/fetcher.ts";
import { Refiner } from "./lib/refiner.ts";
import { Syncer } from "./lib/syncer.ts";
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

    // 1. 자동 정기 수집 (Cron)
    if (trigger === 'cron') {
      console.log("[Source-Collector] 정기 수집 프로세스 시작...");
      
      // 현재는 9번 주제(글로벌 AI 테크)만 우선 구현
      const techData = await fetcher.fetchGlobalAiTech();
      const refinedData = await refiner.refine(techData);
      
      if (refinedData.length > 0) {
        await syncer.syncToDrive(refinedData);
        return new Response(JSON.stringify({ 
          success: true, 
          message: `09번 주제에서 ${refinedData.length}개의 고품질 데이터를 확보하여 동기화했습니다.` 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response("No high-quality data to sync", {
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
