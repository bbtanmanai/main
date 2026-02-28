
/**
 * sender.ts — Resend 이메일 발송 연동
 * 뉴스 목록을 깔끔한 HTML 형식으로 변환하여 발송합니다.
 */

import { NewsItem } from "./types.ts";

export async function sendNewsEmail(email: string, keyword: string, news: NewsItem[]) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

  if (!RESEND_API_KEY) {
    console.warn('Resend API key not found. Skipping email sending.');
    return;
  }

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #1e293b;">[LinkDrop] 오늘의 '${keyword}' 뉴스 브리핑</h2>
      <p style="color: #64748b; margin-bottom: 24px;">최근 4시간 이내의 따끈따끈한 소식 ${news.length}가지를 골라보았습니다.</p>
      
      <div style="display: grid; gap: 12px;">
        ${news.map((n) => `
          <div style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <a href="${n.originallink || n.link}" target="_blank" style="text-decoration: none; color: #6366f1; font-weight: bold; font-size: 16px; display: block; margin-bottom: 4px;">
              ${n.title.replace(/<\/?[^>]+(>|$)/g, "")}
            </a>
            <span style="font-size: 12px; color: #94a3b8;">출처: ${n.source || '최신 뉴스'} • ${new Date(n.pubDate).toLocaleTimeString('ko-KR')}</span>
          </div>
        `).join('')}
      </div>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">본 메일은 LinkDrop 뉴스 비서에 의해 자동 발송되었습니다.</p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'LinkDrop News <news@linkdrop.site>',
        to: [email],
        subject: `[LinkDrop] 오늘의 '${keyword}' 최신 뉴스 알림`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      throw new Error(`Resend API Error: ${res.status}`);
    }

    console.log(`Email successfully sent to ${email}`);
  } catch (err) {
    console.error('Send Email Error:', err.message);
  }
}
