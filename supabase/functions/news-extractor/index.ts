import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { fetchFromNaver } from "./lib/naver-api.ts";
import { sendNewsEmail } from "./lib/email-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { keyword, email, limit = 5 } = await req.json();

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`[News Extractor] Extracting news for keyword: ${keyword}`);

    // 1. 네이버 뉴스 API 등을 통한 데이터 수집
    const news = await fetchFromNaver(keyword, limit);

    // 2. 이메일 발송 (이메일 주소가 있는 경우)
    if (email) {
      await sendNewsEmail(email, keyword, news);
    }

    // 3. 결과 반환
    return new Response(JSON.stringify({ 
      success: true, 
      count: news.length,
      data: news 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error(`[Error] ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
