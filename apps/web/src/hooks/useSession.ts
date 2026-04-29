// ============================================================
// useSession — Supabase 세션 + 역할(role) 구독 훅
// onAuthStateChange로 실시간 세션 변경 감지
// profiles 테이블에서 role 조회 (guest / partner / gold_partner / instructor / admin) — LD-011
// ============================================================

"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export type UserRole = "guest" | "partner" | "gold_partner" | "instructor" | "admin" | null;

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id, supabase);
      } else {
        setLoading(false);
      }
    });

    // 실시간 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id, supabase);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchRole(
    userId: string,
    supabase: ReturnType<typeof createClient>
  ) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      setRole((data?.role as UserRole) ?? "guest");
    } catch {
      setRole("guest");
    } finally {
      setLoading(false);
    }
  }

  return { user, role, loading };
}
