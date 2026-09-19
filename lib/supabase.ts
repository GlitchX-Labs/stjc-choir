import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only: the anon key never reaches the browser bundle.
export const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
  auth: { persistSession: false },
});

/** PostgREST caps a response at 1000 rows; page through so aggregates stay correct. */
export async function fetchAll<T = Record<string, unknown>>(table: string, columns: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(columns).order("id").range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as T[]));
    if ((data?.length ?? 0) < 1000) return out;
  }
}
