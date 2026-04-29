import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BUYER_ROLES = new Set(['partner', 'gold_partner', 'instructor', 'admin']);

async function getIsBuyer(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return false;

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    return BUYER_ROLES.has(profile?.role ?? '');
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const isBuyer = await getIsBuyer();
  const cat = req.nextUrl.searchParams.get('cat');

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const select = isBuyer
    ? 'code,cat,title,description,body,is_premium'
    : 'code,cat,title,description,is_premium';

  let q = db.from('prompts').select(select).order('code');
  if (cat) q = q.eq('cat', cat);

  const { data, error } = await q;
  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
