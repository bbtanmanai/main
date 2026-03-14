/// <reference lib="deno.ns" />
/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore: Deno is a Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    const message = update.message;

    if (message && message.text) {
      const chatId = message.chat.id;
      const text = message.text;

      console.log(`[Telegram] Received: ${text} from ${chatId}`);

      // --- 대화형 AI 비서 로직 (LLM 연동) ---
      // @ts-ignore: Deno is a Deno global
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      
      const prompt = `
        당신은 'LinkDrop AI' 시스템의 총괄 매니저입니다. 
        사용자의 메시지를 분석하여 대화에 응답하고, 필요 시 시스템 명령을 수행하도록 안내하세요.
        
        [시스템 능력]
        1. 소스 수집 (/collect): 10대 주제의 최신 뉴스를 수집, AI 정제하여 구글 드라이브에 저장함.
        2. 상태 확인 (/status): 시스템 가동 현황 및 새벽 스케줄 확인.
        
        [현재 상황]
        사용자가 다음과 같이 말했습니다: "${text}"
        
        [응답 규칙]
        - 친절하고 전문적인 비즈니스 파트너 톤을 유지하세요.
        - 사용자가 수집이나 실행을 원하면 해당 작업을 시작하겠다고 말하고, 실제로 수행하세요.
        - 만약 단순한 대화라면 그에 맞는 유익한 답변을 제공하세요.
        
        [명령어 판별]
        메시지에 '수집', '가져와', '시작', '뉴스' 등의 키워드가 포함되면 수집 프로세스를 실행해야 합니다.
      `;

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const aiResult = await aiResponse.json();
      const responseText = aiResult.choices[0].message.content;

      // 특정 키워드 감지 시 실제 시스템 가동 (백그라운드)
      if (text.includes("수집") || text.includes("시작") || text === "/collect") {
        // @ts-ignore: EdgeRuntime is a Supabase global
        EdgeRuntime.waitUntil((async () => {
            const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/source-collector`;
            await fetch(url, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
              },
              body: JSON.stringify({ trigger: 'test_all' })
            });
        })());
      }

      // 2. 텔레그램으로 답장 보내기
      // @ts-ignore: Deno is a Deno global
      const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: responseText
        })
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error("[Telegram-Bot] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
