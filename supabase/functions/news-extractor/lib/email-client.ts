
// @ts-ignore: Deno is a Deno global
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
// @ts-ignore: Deno is a Deno global
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

export async function sendNewsEmail(email: string, keyword: string, news: any[]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[Email-Client] Supabase configuration missing");
    return;
  }
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
