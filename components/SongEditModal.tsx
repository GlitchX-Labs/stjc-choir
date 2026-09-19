"use client";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { findPrevious, type Previous } from "@/app/actions/masses";
import { BEAT_FOLDERS, PAGES, SLOTS } from "@/lib/constants";
import { transposeKey } from "@/lib/transpose";
import { fmtDate } from "@/lib/format";
import type { MassSong } from "@/lib/types";

type Fields = Pick<MassSong, "song" | "beat_folder" | "page" | "slot" | "tempo" | "scale" | "notes">;
const EMPTY: Fields = { song: "", beat_folder: "", page: "", slot: null, tempo: null, scale: "", notes: "" };

export function SongEditModal({ song, massId, onClose, onApply, onRemove }: {
  song: MassSong | null; massId: string; onClose: () => void;
  onApply: (id: string, f: Fields) => void; onRemove: (id: string) => Promise<void>;
}) {
  const [f, setF] = useState<Fields>(EMPTY);
  const [prev, setPrev] = useState<Previous | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (song) setF({ song: song.song, beat_folder: song.beat_folder, page: song.page, slot: song.slot, tempo: song.tempo, scale: song.scale, notes: song.notes });
    setPrev(null);
    setConfirmRemove(false);
  }, [song]);

  // Debounced lookup of the same song in past Masses
  useEffect(() => {
    if (!song || (f.song ?? "").trim().length < 2) { setPrev(null); return; }
    const t = setTimeout(() => findPrevious(f.song!, massId).then(setPrev).catch(() => setPrev(null)), 500);
    return () => clearTimeout(t);
  }, [f.song, song, massId]);

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((x) => ({ ...x, [k]: v }));
  const pick = <K extends keyof Fields>(k: K, v: Fields[K]) => set(k, f[k] === v ? (EMPTY[k] as Fields[K]) : v);
  const key = transposeKey(f.scale);

  const autofill = () => {
    if (!prev) return;
    setF((x) => ({ ...x, song: prev.song, beat_folder: prev.beat_folder, page: prev.page, slot: prev.slot, tempo: prev.tempo, scale: prev.scale }));
    setPrev(null);
  };

  return (
    <Modal open={!!song} onClose={onClose} title={song?.part ?? ""}>
      {song && (
        <div className="space-y-5">
          <div>
            <label className="label" htmlFor="s-name">Song</label>
            <input id="s-name" className="field" value={f.song ?? ""} onChange={(e) => set("song", e.target.value)} autoComplete="off" />
            {prev && (
              <div className="mt-2 rounded-lg border border-lime/40 bg-lime/10 p-3 text-sm">
                <p className="text-dim">
                  Used before ({fmtDate(prev.date)}, {prev.occasion}):{" "}
                  {[prev.beat_folder, prev.page, prev.slot && `slot ${prev.slot}`, prev.tempo && `${prev.tempo} BPM`, prev.scale].filter(Boolean).join(", ")}
                </p>
                <div className="mt-2 flex gap-2">
                  <button className="btn px-3 py-1.5 text-xs" onClick={autofill}>Use these settings</button>
                  <button className="btn btn-ghost px-3 py-1.5 text-xs" onClick={() => setPrev(null)}>Dismiss</button>
                </div>
              </div>
            )}
          </div>

          <div>
            <span className="label">Beat folder</span>
            <div className="flex flex-wrap gap-2">
              {BEAT_FOLDERS.map((b) => <button key={b} className="chip" aria-pressed={f.beat_folder === b} onClick={() => pick("beat_folder", b)}>{b}</button>)}
            </div>
          </div>
          <div>
            <span className="label">Page</span>
            <div className="flex flex-wrap gap-2">
              {PAGES.map((p) => <button key={p} className="chip" aria-pressed={f.page === p} onClick={() => pick("page", p)}>{p}</button>)}
            </div>
          </div>
          <div>
            <span className="label">Slot</span>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((s) => <button key={s} className="chip" aria-pressed={f.slot === s} onClick={() => pick("slot", s)}>{s}</button>)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="s-tempo">Tempo (BPM)</label>
              <input id="s-tempo" type="number" inputMode="numeric" className="field" value={f.tempo ?? ""} onChange={(e) => set("tempo", e.target.value ? parseInt(e.target.value, 10) : null)} />
            </div>
            <div>
              <label className="label" htmlFor="s-scale">Scale</label>
              <div className="flex items-center gap-2">
                <input id="s-scale" className="field" placeholder="G+2" autoCapitalize="none" value={f.scale ?? ""} onChange={(e) => set("scale", e.target.value)} />
                {key && <span className="h-display rounded-lg bg-lime px-3 py-1.5 text-2xl text-lime-on" aria-label={`Transposed key ${key}`}>{key}</span>}
              </div>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="s-notes">Notes</label>
            <textarea id="s-notes" className="field" rows={2} value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
          </div>

          <div className="flex gap-3">
            <button className="btn flex-1" onClick={() => { onApply(song.id, f); onClose(); }}>Done</button>
            <button className="btn btn-ghost" onClick={() => setF({ ...EMPTY })}>Clear all</button>
          </div>

          {confirmRemove ? (
            <div className="rounded-lg border border-red/50 p-3">
              <p className="mb-3 text-sm">Remove <b>{song.part}</b> from this Mass?</p>
              <div className="flex gap-2">
                <button className="btn btn-danger flex-1" disabled={busy} onClick={async () => { setBusy(true); await onRemove(song.id); setBusy(false); onClose(); }}>Remove</button>
                <button className="btn btn-ghost flex-1" onClick={() => setConfirmRemove(false)}>Keep</button>
              </div>
            </div>
          ) : (
            <button className="w-full py-2 text-sm font-semibold uppercase tracking-wider text-red" onClick={() => setConfirmRemove(true)}>Remove this part</button>
          )}
        </div>
      )}
    </Modal>
  );
}
