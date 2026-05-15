import { createClient } from "@supabase/supabase-js";
import LdBoard, { type BoardPost, type PostStatus } from "@/components/board/LdBoard";

export default async function CertBoard() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("v2_instructor_applications")
    .select("title, author_name, created_at, status, has_reply")
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const posts: BoardPost[] = rows.map((row, index) => ({
    id: rows.length - index,
    title: row.title,
    author: row.author_name,
    date: (row.created_at as string).slice(0, 10),
    status: row.status as PostStatus,
    hasReply: row.has_reply,
  }));

  return <LdBoard posts={posts} backHref="#ch1" />;
}
