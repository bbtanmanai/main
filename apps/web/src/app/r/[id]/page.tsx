import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReferralRedirectPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("profiles")
    .select("selected_landing")
    .eq("id", id)
    .single();

  const slug = data?.selected_landing || "senior-online-business";
  redirect(`/landing/${slug}?ref=${id}`);
}
