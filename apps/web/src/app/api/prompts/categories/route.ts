import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  const { data, error } = await getSupabase()
    .from('prompt_categories')
    .select('id,icon,label')
    .order('sort_order');

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
