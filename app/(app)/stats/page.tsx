import { db, fetchAll } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

type Row = { part: string; song: string | null };

function topByPart(songs: Row[]) {
  const byPart = new Map<string, Map<string, { name: string; n: number }>>();
  for (const s of songs) {
    const name = s.song?.trim();
    if (!name || s.part === "Proclamation") continue;
    const counts = byPart.get(s.part) ?? new Map();
    const k = name.toLowerCase();
    counts.set(k, { name: counts.get(k)?.name ?? name, n: (counts.get(k)?.n ?? 0) + 1 });
    byPart.set(s.part, counts);
  }
  return [...byPart].map(([part, c]) => ({ part, top: [...c.values()].sort((a, b) => b.n - a.n).slice(0, 3) }));
}

export default async function StatsPage() {
  await requireUser();

  const [{ count: masses }, songs] = await Promise.all([
    db.from("mass_services").select("id", { count: "exact", head: true }),
    fetchAll<Row>("mass_songs", "part, song"),
  ]);
  const filled = songs.filter((s) => s.song?.trim()).length;
  const top = topByPart(songs);

  return (
    <>
      <h1 className="h-display mb-5 text-5xl">Stats</h1>
      <dl className="mb-8 grid grid-cols-2 gap-3">
        <Stat label="Masses" value={masses ?? 0} />
        <Stat label="Songs filled" value={filled} />
      </dl>

      <h2 className="h-display mb-2 text-3xl">Most used</h2>
      {!top.length ? <p className="text-dim">No songs entered yet.</p> : (
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {top.map(({ part, top }) => (
            <section key={part}>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-faint">{part}</h3>
              <ol className="divide-y divide-white/10 border-t border-white/10">
                {top.map((t) => (
                  <li key={t.name} className="flex justify-between gap-3 py-2 text-sm"><span className="truncate">{t.name}</span><span className="tnum text-dim">{t.n}</span></li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-low p-4">
      <dd className="h-display text-6xl leading-none text-lime tnum">{value}</dd>
      <dt className="mt-1 text-xs font-semibold uppercase tracking-wider text-dim">{label}</dt>
    </div>
  );
}
