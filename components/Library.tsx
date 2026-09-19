"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShareNetwork } from "@phosphor-icons/react";
import { Modal } from "./Modal";
import { addLyric, tagSong } from "@/app/actions/library";
import { WEDDING_PARTS, MASS_PARTS } from "@/lib/constants";
import { shareText } from "@/lib/share";
import type { Lyric } from "@/lib/types";

const KNOWN_PARTS = Array.from(new Set([...MASS_PARTS, ...WEDDING_PARTS]));

export function Library({ songs, isAdmin, openId }: { songs: Lyric[]; isAdmin: boolean; openId?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [part, setPart] = useState("");
  const [openSong, setOpenSong] = useState<string | null>(openId && songs.some((s) => s.id === openId) ? openId : null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const [pending, start] = useTransition();

  // Include tags already in the data (e.g. the old single "Communion") so nothing is unfilterable
  const parts = useMemo(() => Array.from(new Set([...KNOWN_PARTS, ...songs.flatMap((s) => s.categories ?? [])])), [songs]);
  const list = songs.filter((s) => s.title.toLowerCase().includes(q.trim().toLowerCase()) && (!part || s.categories?.includes(part)));
  const current = songs.find((s) => s.id === openSong) ?? null;

  const toggleTag = (s: Lyric, p: string) => {
    const next = s.categories?.includes(p) ? s.categories.filter((c) => c !== p) : [...(s.categories ?? []), p];
    start(async () => { await tagSong(s.id, next); router.refresh(); });
  };

  const share = async (s: Lyric) => {
    const r = await shareText(`${s.title}\n\n${s.lyrics}`, s.title);
    setToast(r === "copied" ? "Copied" : r === "failed" ? "Could not copy" : "Shared");
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <>
      <div className="mb-4 flex items-end justify-between">
        <h1 className="h-display text-5xl">Library</h1>
        {isAdmin && <button className="btn" onClick={() => setAdding(true)}><Plus size={18} weight="bold" /> Add song</button>}
      </div>
      <input className="field mb-3" placeholder="Search lyrics by title" aria-label="Search by title" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button className="chip shrink-0" aria-pressed={!part} onClick={() => setPart("")}>All</button>
        {parts.map((p) => <button key={p} className="chip shrink-0" aria-pressed={part === p} onClick={() => setPart(part === p ? "" : p)}>{p}</button>)}
      </div>

      {!list.length ? <p className="py-12 text-center text-dim">No songs match.</p> : (
        <ul className="divide-y divide-white/10">
          {list.map((s) => (
            <li key={s.id}>
              <button className="w-full py-3.5 text-left active:bg-white/5" onClick={() => setOpenSong(s.id)}>
                <span className="block font-semibold">{s.title}</span>
                {!!s.categories?.length && <span className="block truncate text-xs text-dim">{s.categories.join(", ")}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!current} onClose={() => setOpenSong(null)} title={current?.title ?? ""}>
        {current && (
          <>
            <pre className="mb-5 whitespace-pre-wrap font-body text-base leading-relaxed">{current.lyrics}</pre>
            <button className="btn btn-ghost mb-5 w-full" onClick={() => share(current)}><ShareNetwork size={18} /> Copy or share lyrics</button>
            {isAdmin && (
              <div>
                <span className="label">Tagged parts</span>
                <div className="flex flex-wrap gap-2">
                  {parts.map((p) => <button key={p} disabled={pending} className="chip" aria-pressed={!!current.categories?.includes(p)} onClick={() => toggleTag(current, p)}>{p}</button>)}
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      <AddSong open={adding} parts={parts} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); router.refresh(); }} />
      {toast && <div role="status" className="fixed inset-x-0 top-16 z-50 mx-auto w-fit rounded-full bg-highest px-4 py-2 text-sm shadow-lg shadow-black/60">{toast}</div>}
    </>
  );
}

function AddSong({ open, parts, onClose, onSaved }: { open: boolean; parts: string[]; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <Modal open={open} onClose={onClose} title="Add a song">
      <div className="space-y-4">
        <div><label className="label" htmlFor="l-title">Title</label><input id="l-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className="label" htmlFor="l-lyrics">Lyrics</label><textarea id="l-lyrics" className="field" rows={8} value={lyrics} onChange={(e) => setLyrics(e.target.value)} /></div>
        <div>
          <span className="label">Parts (optional)</span>
          <div className="flex flex-wrap gap-2">
            {parts.map((p) => <button key={p} className="chip" aria-pressed={cats.includes(p)} onClick={() => setCats((c) => c.includes(p) ? c.filter((x) => x !== p) : [...c, p])}>{p}</button>)}
          </div>
        </div>
        {err && <p role="alert" className="text-sm text-red">{err}</p>}
        <button className="btn w-full" disabled={pending || !title.trim() || !lyrics.trim()}
          onClick={() => start(async () => {
            try { await addLyric({ title, lyrics, categories: cats }); setTitle(""); setLyrics(""); setCats([]); onSaved(); }
            catch (e) { setErr((e as Error).message); }
          })}>Save song</button>
      </div>
    </Modal>
  );
}
