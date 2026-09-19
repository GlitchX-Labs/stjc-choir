"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Sparkle } from "@phosphor-icons/react";
import { applySongs } from "@/app/actions/recommend";
import { fmtDate } from "@/lib/format";

type Pick = { title: string; reason: string };
type Output = { summary: string; result: Record<string, Pick[]>; saved: boolean };

export function Recommend({ masses, initialMass }: { masses: { id: string; occasion: string; date: string }[]; initialMass?: string }) {
  const [massId, setMassId] = useState(initialMass && masses.some((m) => m.id === initialMass) ? initialMass : masses[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [out, setOut] = useState<Output | null>(null);
  const [applied, setApplied] = useState<Record<string, string>>({}); // part -> applied title

  const run = async () => {
    if (!file) return;
    setBusy(true); setErr(""); setOut(null); setApplied({});
    try {
      const fd = new FormData();
      fd.set("mass_id", massId); fd.set("pdf", file); fd.set("prompt", prompt);
      const res = await fetch("/api/recommend", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({ error: "Unexpected reply from the server" }));
      if (!res.ok) throw new Error(body.error);
      setOut({ summary: body.summary, result: body.result, saved: !!body.id });
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  const apply = async (picks: { part: string; title: string }[]) => {
    setErr("");
    try {
      await applySongs(massId, picks);
      setApplied((a) => ({ ...a, ...Object.fromEntries(picks.map((p) => [p.part, p.title])) }));
    } catch (e) { setErr((e as Error).message); }
  };

  const parts = out ? Object.entries(out.result) : [];

  return (
    <>
      <h1 className="h-display mb-1 text-5xl">AI picks</h1>
      <p className="mb-6 text-dim">Upload the readings and get song suggestions from the choir library.</p>

      {!masses.length ? (
        <p className="py-10 text-center text-dim">Create a Mass first, then come back here.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="r-mass">Mass</label>
            <select id="r-mass" className="field" value={massId} onChange={(e) => setMassId(e.target.value)}>
              {masses.map((m) => <option key={m.id} value={m.id}>{fmtDate(m.date)}  {m.occasion}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="r-pdf">Readings PDF (max 4 MB)</label>
            <input id="r-pdf" type="file" accept="application/pdf" className="field file:mr-3 file:rounded file:border-0 file:bg-highest file:px-3 file:py-1 file:text-ink"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label className="label" htmlFor="r-prompt">Anything to focus on? (optional)</label>
            <textarea id="r-prompt" className="field" rows={2} placeholder="Songs of mercy and healing" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
          <button className="btn w-full" onClick={run} disabled={busy || !file || !massId}>
            <Sparkle size={18} weight="fill" /> {busy ? "Reading the readings" : "Get recommendations"}
          </button>
        </div>
      )}

      {err && <p role="alert" className="mt-4 text-sm text-red">{err}</p>}

      {out && (
        <section className="mt-8">
          {out.summary && <p className="mb-4 text-dim">{out.summary}</p>}
          {!out.saved && <p className="mb-4 text-sm text-gold">This session was not saved. Ask an admin to create the recommendations table.</p>}
          {!parts.length ? <p className="text-dim">No matching songs came back. Try a different prompt.</p> : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="h-display text-3xl">Suggestions</h2>
                <button className="btn" onClick={() => apply(parts.map(([part, picks]) => ({ part, title: picks[0].title })))}>Use all</button>
              </div>
              <div className="space-y-6">
                {parts.map(([part, picks]) => (
                  <div key={part}>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-faint">{part}</h3>
                    <ul className="divide-y divide-white/10 border-t border-white/10">
                      {picks.map((p) => {
                        const done = applied[part] === p.title;
                        return (
                          <li key={p.title} className="flex items-start justify-between gap-3 py-3">
                            <div className="min-w-0">
                              <p className="font-semibold">{p.title}</p>
                              <p className="text-sm text-dim">{p.reason}</p>
                            </div>
                            <button className={`btn shrink-0 px-3 py-1.5 text-xs ${done ? "bg-transparent text-lime ring-1 ring-lime" : ""}`}
                              onClick={() => apply([{ part, title: p.title }])} disabled={done}>
                              {done ? <><Check size={14} weight="bold" /> Applied</> : "Use this"}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
              {!!Object.keys(applied).length && (
                <Link href={`/masses/${massId}`} className="btn btn-ghost mt-6 w-full">Open this Mass</Link>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}
