import { createAdminClient } from "@/lib/supabase/admin";
import metaJson from "@/data/homepages-meta.json";

const VALID_SLUGS = new Set((metaJson as { slug: string }[]).map((m) => m.slug));

export async function POST(request: Request) {
  let slug: string;
  try {
    ({ slug } = await request.json());
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  if (!slug || !VALID_SLUGS.has(slug)) {
    return Response.json({ error: "invalid slug" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("increment_homepage_view", { p_slug: slug });

  if (error) {
    // RPC 미존재 시 upsert 폴백
    const { error: upsertError } = await supabase
      .from("homepage_stats")
      .upsert({ slug, view_count: 1 }, { onConflict: "slug" });

    if (upsertError) {
      return Response.json({ error: upsertError.message }, { status: 500 });
    }
  }

  return Response.json({ ok: true });
}
