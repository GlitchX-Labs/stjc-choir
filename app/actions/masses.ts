"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { assertRole, currentUser } from "@/lib/auth";
import { EDIT_ROLES, partsFor } from "@/lib/constants";
import type { MassSong } from "@/lib/types";

function must<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as NonNullable<T>; // writes without .select() return null data; callers ignore it
}

export async function createMass(input: { date: string; occasion: string; notes: string }): Promise<string> {
  await assertRole(EDIT_ROLES);
  const occasion = input.occasion.trim();
  if (!input.date || !occasion) throw new Error("Date and occasion are required");
  const mass = must(
    await db.from("mass_services")
      .insert({ name: occasion, date: input.date, occasion, notes: input.notes.trim() })
      .select("id").single(),
  );
  const parts = partsFor(occasion);
  must(await db.from("mass_songs").insert(
    parts.map((part, i) => ({ mass_id: mass.id, part, song: "", beat_folder: "", page: "", scale: "", notes: "", practiced: false, sort_order: i })),
  ));
  revalidatePath("/masses");
  return mass.id;
}

export async function updateMassInfo(id: string, input: { date: string; occasion: string; notes: string }) {
  await assertRole(EDIT_ROLES);
  const occasion = input.occasion.trim();
  must(await db.from("mass_services").update({ name: occasion, date: input.date, occasion, notes: input.notes.trim() }).eq("id", id));

  // Lenten -> other: Glory comes back, at its natural place in sort_order
  if (occasion !== "Lenten Sunday") {
    const rows = must(await db.from("mass_songs").select("id, part, sort_order").eq("mass_id", id).order("sort_order"));
    if (!rows.some((r) => r.part === "Glory") && rows.some((r) => r.part === "Lord Have Mercy")) {
      const at = rows.findIndex((r) => r.part === "Lord Have Mercy") + 1;
      await insertPartAt(id, "Glory", at);
    }
  }
  revalidatePath(`/masses/${id}`);
  revalidatePath("/masses");
}

type SongPatch = Pick<MassSong, "id" | "song" | "beat_folder" | "page" | "slot" | "tempo" | "scale" | "notes" | "practiced">;

export async function saveSongs(massId: string, rows: SongPatch[]) {
  await assertRole(EDIT_ROLES);
  await Promise.all(rows.map(({ id, ...patch }) =>
    db.from("mass_songs").update(patch).eq("id", id).eq("mass_id", massId).then((r) => must(r)),
  ));
  revalidatePath(`/masses/${massId}`);
}

/** Rewrites sort_order as 0..n with the new row at `index`, so nulls and gaps heal too. */
async function insertPartAt(massId: string, part: string, index: number) {
  const existing = must(await db.from("mass_songs").select("id").eq("mass_id", massId).order("sort_order", { nullsFirst: false }));
  const created = must(
    await db.from("mass_songs")
      .insert({ mass_id: massId, part, song: "", beat_folder: "", page: "", scale: "", notes: "", practiced: false, sort_order: index })
      .select("id").single(),
  );
  const ids = existing.map((r) => r.id);
  ids.splice(index, 0, created.id);
  await Promise.all(ids.map((id, i) => db.from("mass_songs").update({ sort_order: i }).eq("id", id).then((r) => must(r))));
}

export async function addPart(massId: string, name: string, relativeToSongId: string, where: "before" | "after") {
  await assertRole(EDIT_ROLES);
  const part = name.trim();
  if (!part) throw new Error("Give the part a name");
  const rows = must(await db.from("mass_songs").select("id").eq("mass_id", massId).order("sort_order", { nullsFirst: false }));
  const i = rows.findIndex((r) => r.id === relativeToSongId);
  if (i === -1) throw new Error("Part not found");
  await insertPartAt(massId, part, where === "before" ? i : i + 1);
  revalidatePath(`/masses/${massId}`);
}

export async function removePart(massId: string, songId: string) {
  await assertRole(EDIT_ROLES);
  must(await db.from("mass_songs").delete().eq("id", songId).eq("mass_id", massId));
  revalidatePath(`/masses/${massId}`);
}

export async function duplicateMass(id: string, date: string): Promise<string> {
  await assertRole(EDIT_ROLES);
  const src = must(await db.from("mass_services").select("name, occasion, notes").eq("id", id).single());
  const copy = must(await db.from("mass_services").insert({ ...src, date }).select("id").single());
  const songs = must(await db.from("mass_songs").select("*").eq("mass_id", id));
  if (songs.length) {
    must(await db.from("mass_songs").insert(
      songs.map((s) => ({
        mass_id: copy.id, part: s.part, song: s.song, beat_folder: s.beat_folder, page: s.page, slot: s.slot,
        tempo: s.tempo, scale: s.scale, notes: s.notes, practiced: false, sort_order: s.sort_order,
      })),
    ));
  }
  revalidatePath("/masses");
  return copy.id;
}

export async function deleteMass(id: string) {
  await assertRole(EDIT_ROLES);
  must(await db.from("mass_services").delete().eq("id", id));
  revalidatePath("/masses");
}

export type Previous = Pick<MassSong, "song" | "beat_folder" | "page" | "slot" | "tempo" | "scale"> & { date: string; occasion: string };

/** Most recent past use of a song whose name contains `q`, for the autofill banner. */
export async function findPrevious(q: string, massId: string): Promise<Previous | null> {
  if (!(await currentUser())) throw new Error("Not allowed");
  const term = q.trim().replace(/[%_\\]/g, (c) => `\\${c}`);
  if (term.length < 2) return null;
  const { data } = await db.from("mass_songs")
    .select("song, beat_folder, page, slot, tempo, scale, mass_services!inner(date, occasion)")
    .ilike("song", `%${term}%`).neq("mass_id", massId)
    .order("mass_services(date)", { ascending: false }).limit(1);
  const r = data?.[0] as unknown as (Omit<Previous, "date" | "occasion"> & { mass_services: { date: string; occasion: string } }) | undefined;
  if (!r || !(r.beat_folder || r.tempo || r.scale || r.page)) return null;
  const { mass_services: ms, ...rest } = r;
  return { ...rest, date: ms.date, occasion: ms.occasion };
}
