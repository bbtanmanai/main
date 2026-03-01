
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchFromNaver } from "./lib/naver-api.ts";
import { sendNewsEmail } from "./lib/email-client.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { trigger, current_time, email, keyword } = await req.json();

    // 1. 자동 정시 발송 (Cron)
    if (trigger === 'cron') {
      const hour = new Date(current_time || new Date()).getHours();
      const timeStr = `${hour.toString().padStart(2, '0')}:00:00`;

      const { data: users, error } = await supabase
        .from('news_subscriptions')
        .select('email, keyword')
        .filter('send_time', 'eq', timeStr);

      if (error) throw error;
      if (!users || users.length === 0) return new Response("No users to process");

      for (const user of users) {
        EdgeRuntime.waitUntil(processNewsAgent(user.email, user.keyword));
      }
      
      return new Response(`Cron extraction started for ${users.length} users`, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. 수동/미리보기 트리거
    if (keyword) {
      const news = await fetchFromNaver(keyword, 10);
      
      if (email && email !== 'preview@linkdrop.site') {
        EdgeRuntime.waitUntil(sendNewsEmail(email, keyword, news.slice(0, 5)));
      }

      return new Response(JSON.stringify({ success: true, news }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: "Invalid trigger" }), { 
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

async function processNewsAgent(email: string, keyword: string) {
  try {
    const news = await fetchFromNaver(keyword, 5);
    if (news.length > 0) {
      await sendNewsEmail(email, keyword, news);
    }
  } catch (err) {
    console.error(`Error processing news for ${email}:`, err);
  }
}
