import Link from "next/link";
import { db } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { EDIT_ROLES, OCCASIONS } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { CreateMass } from "@/components/CreateMass";

export default async function MassesPage({ searchParams }: { searchParams: { occasion?: string } }) {
  const user = await requireUser();
  const filter = searchParams.occasion;
  let q = db.from("mass_services").select("id, name, date, occasion").order("date", { ascending: false });
  if (filter) q = q.eq("occasion", filter);
  const { data: masses = [] } = await q;

  return (
    <>
      <div className="mb-4 flex items-end justify-between">
        <h1 className="h-display text-5xl">Masses</h1>
        {EDIT_ROLES.includes(user.role) && <CreateMass />}
      </div>

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {[undefined, ...OCCASIONS.filter((o) => o !== "Custom")].map((o) => (
          <Link key={o ?? "all"} href={o ? `/masses?occasion=${encodeURIComponent(o)}` : "/masses"}
            className="chip shrink-0" aria-pressed={filter === o}>{o ?? "All"}</Link>
        ))}
      </div>

      {!masses?.length ? (
        <p className="py-16 text-center text-dim">No Masses{filter ? ` for ${filter}` : " yet"}.</p>
      ) : (
        <ul className="divide-y divide-white/10">
          {masses.map((m) => (
            <li key={m.id}>
              <Link href={`/masses/${m.id}`} className="flex items-baseline justify-between gap-3 py-4 active:bg-white/5">
                <span className="font-semibold">{m.occasion}</span>
                <span className="tnum text-sm text-dim">{fmtDate(m.date)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
