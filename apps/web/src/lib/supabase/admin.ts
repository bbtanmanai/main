// ============================================================
// supabase/admin.ts — 서비스 롤 Supabase 클라이언트 (서버 전용)
// RLS를 우회하는 관리자 권한 — API Route에서만 사용, 브라우저 노출 금지
// ============================================================

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
