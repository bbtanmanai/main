
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

export async function sendViaResend(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    throw new Error("Resend API key not configured");
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'LinkDrop News <news@linkdrop.site>',
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  return await res.json();
}
