import Link from "next/link";
import { db } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { MASS_PARTS, WEDDING_PARTS } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { transposeKey } from "@/lib/transpose";

const ALL_PARTS = Array.from(new Set([...MASS_PARTS, ...WEDDING_PARTS]));

type Hit = {
  id: string; part: string; song: string; scale: string | null; tempo: number | null;
  mass_services: { id: string; date: string; occasion: string };
};

export default async function SearchPage({ searchParams }: { searchParams: { q?: string; part?: string } }) {
  await requireUser();
  const q = (searchParams.q ?? "").trim();
  const part = searchParams.part ?? "";
  const searched = !!(q || part);

  let hits: Hit[] = [];
  const lyricByTitle = new Map<string, string>();
  if (searched) {
    let query = db.from("mass_songs")
      .select("id, part, song, scale, tempo, mass_services!inner(id, date, occasion)")
      .neq("song", "").order("mass_services(date)", { ascending: false }).limit(500);
    if (q) query = query.ilike("song", `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
    if (part) query = query.eq("part", part);
    const [{ data }, { data: lyrics }] = await Promise.all([query, db.from("song_lyrics").select("id, title")]);
    hits = (data ?? []) as unknown as Hit[];
    (lyrics ?? []).forEach((l) => lyricByTitle.set(l.title.trim().toLowerCase(), l.id));
  }

  const groups = new Map<string, Hit[]>();
  for (const h of hits) {
    const k = h.song.trim().toLowerCase();
    groups.set(k, [...(groups.get(k) ?? []), h]);
  }

  const partHref = (p: string) => `/search?${new URLSearchParams({ ...(q && { q }), ...(p && { part: p }) })}`;

  return (
    <>
      <h1 className="h-display mb-4 text-5xl">Search</h1>
      <form className="mb-3 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Song name" aria-label="Song name" className="field" />
        {part && <input type="hidden" name="part" value={part} />}
        <button className="btn">Search</button>
      </form>
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={partHref("")} className="chip shrink-0" aria-pressed={!part}>Any part</Link>
        {ALL_PARTS.map((p) => <Link key={p} href={partHref(p)} className="chip shrink-0" aria-pressed={part === p}>{p}</Link>)}
      </div>

      {!searched ? (
        <p className="py-12 text-center text-dim">Type a song name or pick a part to see when it was last sung.</p>
      ) : !groups.size ? (
        <p className="py-12 text-center text-dim">Nothing found.</p>
      ) : (
        <ul className="space-y-6">
          {[...groups.values()].map((g) => {
            const lyricId = lyricByTitle.get(g[0].song.trim().toLowerCase());
            return (
              <li key={g[0].song.trim().toLowerCase()}>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold">{g[0].song}</h2>
                  <span className="tnum shrink-0 text-sm text-dim">{g.length}x</span>
                </div>
                {lyricId && <Link href={`/library?open=${lyricId}`} className="text-sm text-lime underline underline-offset-4">Lyrics available</Link>}
                <ol className="mt-2 divide-y divide-white/10 border-t border-white/10">
                  {g.map((h: Hit) => (
                    <li key={h.id}>
                      <Link href={`/masses/${h.mass_services.id}`} className="flex items-baseline justify-between gap-3 py-2.5 text-sm active:bg-white/5">
                        <span><span className="tnum text-dim">{fmtDate(h.mass_services.date)}</span>  {h.mass_services.occasion}, {h.part}</span>
                        {h.scale && <span className="h-display text-lg text-lime">{transposeKey(h.scale)}</span>}
                      </Link>
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
