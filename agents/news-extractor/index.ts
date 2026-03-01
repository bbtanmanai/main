
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // 1. 자동 정시 발송 (Cron) - 정확히 5개 발송
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

    // 2. 수동/미리보기 트리거 - UI용 10개 추출, 이메일은 5개 발송
    if (keyword) {
      const news = await fetchFromNaver(keyword, 10);
      
      if (email && email !== 'preview@linkdrop.site') {
        // 이메일 발송 시에는 상위 5개만 전송
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
    // 자동 발송 시에는 정확히 5개만 추출
    const news = await fetchFromNaver(keyword, 5);
    if (news.length > 0) {
      await sendNewsEmail(email, keyword, news);
    }
  } catch (err) {
    console.error(`Error processing news for ${email}:`, err);
  }
}

async function fetchFromNaver(keyword: string, count: number) {
  const CLIENT_ID = Deno.env.get('NAVER_CLIENT_ID');
  const CLIENT_SECRET = Deno.env.get('NAVER_CLIENT_SECRET');

  if (!CLIENT_ID || !CLIENT_SECRET) return [];

  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=${count * 2}&sort=date`;
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': CLIENT_ID,
      'X-Naver-Client-Secret': CLIENT_SECRET,
    }
  });

  if (!res.ok) return [];

  const data = await res.json();
  const items = data.items || [];

  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  const now = new Date();

  return items
    .filter((item: any) => (now.getTime() - new Date(item.pubDate).getTime()) <= FOUR_HOURS_MS)
    .map((item: any) => ({
      title: item.title.replace(/<\/?[^>]+(>|$)/g, ""),
      link: item.link,
      pubDate: item.pubDate,
      source: "네이버 뉴스"
    }))
    .slice(0, count);
}

async function sendNewsEmail(email: string, keyword: string, news: any[]) {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #1e293b;">[LinkDrop] 오늘의 '${keyword}' 뉴스 브리핑</h2>
      <p style="color: #64748b; margin-bottom: 24px;">최근 4시간 이내의 가장 중요한 뉴스 ${news.length}가지를 골라보았습니다.</p>
      <div style="display: grid; gap: 12px;">
        ${news.map((n: any) => `
          <div style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <a href="${n.link}" target="_blank" style="text-decoration: none; color: #6366f1; font-weight: bold; font-size: 16px; display: block; margin-bottom: 4px;">
              ${n.title}
            </a>
            <span style="font-size: 12px; color: #94a3b8;">${new Date(n.pubDate).toLocaleString('ko-KR')}</span>
          </div>
        `).join('')}
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">본 메일은 LinkDrop 뉴스 비서에 의해 자동 발송되었습니다.</p>
    </div>
  `;

  await fetch(`${SUPABASE_URL}/functions/v1/email-sender`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      to: email,
      subject: `[LinkDrop] '${keyword}' 최신 뉴스 알림 (총 ${news.length}건)`,
      html: htmlContent
    })
  });
}
