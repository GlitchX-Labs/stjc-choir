"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { assertRole } from "@/lib/auth";
import { AI_ROLES } from "@/lib/constants";

/** Writes each suggested title into the `song` column of the Mass's row for that part. Nothing else is touched. */
export async function applySongs(massId: string, picks: { part: string; title: string }[]) {
  await assertRole(AI_ROLES);
  const { data: rows, error } = await db.from("mass_songs").select("id, part").eq("mass_id", massId);
  if (error) throw new Error(error.message);
  const results = await Promise.all(picks.map(({ part, title }) => {
    const row = rows?.find((r) => r.part === part);
    if (!row) throw new Error(`This Mass has no "${part}" part`);
    return db.from("mass_songs").update({ song: title }).eq("id", row.id);
  }));
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  revalidatePath(`/masses/${massId}`);
}
