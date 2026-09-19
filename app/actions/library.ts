"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { assertRole } from "@/lib/auth";

export async function tagSong(id: string, categories: string[]) {
  await assertRole(["admin"]);
  const { error } = await db.from("song_lyrics").update({ categories }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/library");
}

export async function addLyric(input: { title: string; lyrics: string; categories: string[] }) {
  await assertRole(["admin"]);
  const title = input.title.trim();
  if (!title || !input.lyrics.trim()) throw new Error("Title and lyrics are required");
  const { error } = await db.from("song_lyrics").insert({ title, lyrics: input.lyrics, categories: input.categories });
  if (error) throw new Error(error.message);
  revalidatePath("/library");
}
