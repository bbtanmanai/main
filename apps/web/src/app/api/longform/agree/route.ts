import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { session_key, disclosure_version } = await req.json();
    if (!session_key) {
      return NextResponse.json({ ok: false, error: 'session_key required' }, { status: 400 });
    }

    const user_agent = req.headers.get('user-agent') || '';
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const { error } = await supabase
      .from('longform_agreements')
      .upsert(
        {
          session_key,
          user_agent,
          ip_address: ip,
          disclosure_version: disclosure_version || '1.0',
          agreed_at: new Date().toISOString(),
        },
        { onConflict: 'session_key' }
      );

    if (error) {
      console.error('[longform/agree] supabase error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[longform/agree] unexpected error:', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
