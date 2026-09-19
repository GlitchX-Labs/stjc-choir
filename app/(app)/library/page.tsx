import { db } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { Library } from "@/components/Library";
import type { Lyric } from "@/lib/types";

export default async function LibraryPage({ searchParams }: { searchParams: { open?: string } }) {
  const user = await requireUser();
  const { data } = await db.from("song_lyrics").select("id, title, lyrics, categories").order("title");
  return <Library songs={(data ?? []) as Lyric[]} isAdmin={user.role === "admin"} openId={searchParams.open} />;
}
