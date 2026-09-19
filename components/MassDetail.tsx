"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, PencilSimple, Plus, ShareNetwork, Trash } from "@phosphor-icons/react";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { SongEditModal } from "./SongEditModal";
import { addPart, deleteMass, duplicateMass, removePart, saveSongs, updateMassInfo } from "@/app/actions/masses";
import { OCCASIONS } from "@/lib/constants";
import { fmtDate, todayISO } from "@/lib/format";
import { shareText } from "@/lib/share";
import { transposeKey } from "@/lib/transpose";
import type { Mass, MassSong } from "@/lib/types";

type Sheet = null | "info" | "dup" | "delete" | "add";

export function MassDetail({ mass, songs: serverSongs, canEdit }: { mass: Mass; songs: MassSong[]; canEdit: boolean }) {
  const router = useRouter();
  const [songs, setSongs] = useState(serverSongs);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<MassSong | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toast, setToast] = useState("");
  const [pending, start] = useTransition();

  // Follow the server's row set and order, but keep unsaved edits to rows that still exist
  useEffect(() => {
    setSongs((prev) => serverSongs.map((s) => (dirty ? prev.find((p) => p.id === s.id) ?? s : s)));
  }, [serverSongs]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };
  const patch = (id: string, f: Partial<MassSong>) => { setSongs((ss) => ss.map((s) => (s.id === id ? { ...s, ...f } : s))); setDirty(true); };

  const save = () => start(async () => {
    try {
      await saveSongs(mass.id, songs.map(({ id, song, beat_folder, page, slot, tempo, scale, notes, practiced }) => ({ id, song, beat_folder, page, slot, tempo, scale, notes, practiced })));
      setDirty(false); flash("Saved");
    } catch { flash("Could not save"); }
  });

  const share = async () => {
    const lines = songs.filter((s) => s.song?.trim()).map((s) => {
      const k = transposeKey(s.scale);
      return `${s.part}: ${s.song}${k ? ` (${k})` : ""}`;
    });
    const r = await shareText(`${mass.occasion}, ${fmtDate(mass.date)}\n\n${lines.join("\n")}`, mass.occasion);
    flash(r === "copied" ? "Copied" : r === "failed" ? "Could not copy" : "Shared");
  };

  return (
    <>
      <section className="mb-5 rounded-xl border border-white/10 bg-low p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="h-display text-4xl leading-none">{mass.occasion}</h1>
            <p className="tnum mt-1 text-dim">{fmtDate(mass.date)}</p>
            {mass.notes && <p className="mt-2 text-sm text-dim">{mass.notes}</p>}
          </div>
          {canEdit && (
            <div className="flex gap-1">
              <IconBtn label="Edit details" onClick={() => setSheet("info")}><PencilSimple size={20} /></IconBtn>
              <IconBtn label="Duplicate to a new date" onClick={() => setSheet("dup")}><Copy size={20} /></IconBtn>
              <IconBtn label="Delete Mass" onClick={() => setSheet("delete")}><Trash size={20} className="text-red" /></IconBtn>
            </div>
          )}
        </div>
      </section>

      <ul className="divide-y divide-white/10">
        {songs.map((s) => {
          const key = transposeKey(s.scale);
          const meta = [s.beat_folder, s.page, s.slot && `Slot ${s.slot}`, s.tempo && `${s.tempo} BPM`].filter(Boolean).join("  ·  ");
          const Row = canEdit ? "button" : "div";
          return (
            <li key={s.id} className="flex items-center gap-3">
              {canEdit && (
                <input type="checkbox" aria-label={`${s.part} practiced`} checked={s.practiced}
                  onChange={(e) => patch(s.id, { practiced: e.target.checked })} className="size-5 accent-[#2EFC5D]" />
              )}
              <Row className="min-w-0 flex-1 py-3.5 text-left" {...(canEdit ? { onClick: () => setEditing(s) } : {})}>
                <span className="block text-xs font-semibold uppercase tracking-wider text-faint">{s.part}</span>
                <span className={`block truncate text-base ${s.song ? "" : "text-faint"}`}>{s.song || "Empty"}</span>
                {meta && <span className="block truncate text-xs text-dim">{meta}</span>}
              </Row>
              {key && <span className="h-display shrink-0 text-2xl text-lime">{key}</span>}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="btn btn-ghost" onClick={share}><ShareNetwork size={18} /> Copy song list</button>
        {canEdit && <button className="btn btn-ghost" onClick={() => setSheet("add")}><Plus size={18} /> Add part</button>}
      </div>

      {canEdit && dirty && (
        <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 px-4">
          <button className="btn mx-auto flex w-full max-w-[648px] shadow-lg shadow-black/60" onClick={save} disabled={pending}>
            <Check size={18} weight="bold" /> {pending ? "Saving" : "Save changes"}
          </button>
        </div>
      )}

      {toast && <div role="status" className="fixed inset-x-0 top-16 z-50 mx-auto w-fit rounded-full bg-highest px-4 py-2 text-sm shadow-lg shadow-black/60">{toast}</div>}

      <SongEditModal
        song={editing} massId={mass.id} onClose={() => setEditing(null)}
        onApply={(id, f) => patch(id, f)}
        onRemove={async (id) => { await removePart(mass.id, id); setSongs((ss) => ss.filter((s) => s.id !== id)); router.refresh(); }}
      />

      <InfoModal open={sheet === "info"} mass={mass} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); router.refresh(); }} />
      <DuplicateModal open={sheet === "dup"} id={mass.id} onClose={() => setSheet(null)} onDone={(id) => router.push(`/masses/${id}`)} />
      <AddPartModal open={sheet === "add"} massId={mass.id} songs={songs} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); router.refresh(); }} />
      <ConfirmDialog open={sheet === "delete"} title="Delete this Mass?" busy={pending}
        body="The Mass and its songs are removed for good."
        onCancel={() => setSheet(null)}
        onConfirm={() => start(async () => { await deleteMass(mass.id); router.push("/masses"); })} />
    </>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button aria-label={label} title={label} onClick={onClick} className="rounded-lg p-2 text-dim hover:bg-white/5">{children}</button>;
}

function InfoModal({ open, mass, onClose, onSaved }: { open: boolean; mass: Mass; onClose: () => void; onSaved: () => void }) {
  const isKnown = OCCASIONS.includes(mass.occasion) && mass.occasion !== "Custom";
  const [date, setDate] = useState(mass.date);
  const [occ, setOcc] = useState(isKnown ? mass.occasion : "Custom");
  const [custom, setCustom] = useState(isKnown ? "" : mass.occasion);
  const [notes, setNotes] = useState(mass.notes ?? "");
  const [pending, start] = useTransition();
  return (
    <Modal open={open} onClose={onClose} title="Mass details">
      <div className="space-y-4">
        <div><label className="label" htmlFor="i-date">Date</label><input id="i-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div>
          <span className="label">Occasion</span>
          <div className="flex flex-wrap gap-2">{OCCASIONS.map((o) => <button key={o} className="chip" aria-pressed={occ === o} onClick={() => setOcc(o)}>{o}</button>)}</div>
          {occ === "Custom" && <input className="field mt-2" aria-label="Custom occasion name" value={custom} onChange={(e) => setCustom(e.target.value)} />}
        </div>
        <div><label className="label" htmlFor="i-notes">Notes</label><textarea id="i-notes" className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <button className="btn w-full" disabled={pending || (occ === "Custom" && !custom.trim())}
          onClick={() => start(async () => { await updateMassInfo(mass.id, { date, occasion: occ === "Custom" ? custom : occ, notes }); onSaved(); })}>
          Save details
        </button>
      </div>
    </Modal>
  );
}

function DuplicateModal({ open, id, onClose, onDone }: { open: boolean; id: string; onClose: () => void; onDone: (id: string) => void }) {
  const [date, setDate] = useState(todayISO());
  const [pending, start] = useTransition();
  return (
    <Modal open={open} onClose={onClose} title="Duplicate Mass">
      <p className="mb-4 text-sm text-dim">Copies every song and its settings. Practiced ticks are cleared.</p>
      <label className="label" htmlFor="d-date">New date</label>
      <input id="d-date" type="date" className="field mb-4" value={date} onChange={(e) => setDate(e.target.value)} />
      <button className="btn w-full" disabled={pending || !date} onClick={() => start(async () => onDone(await duplicateMass(id, date)))}>Duplicate</button>
    </Modal>
  );
}

function AddPartModal({ open, massId, songs, onClose, onSaved }: { open: boolean; massId: string; songs: MassSong[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [where, setWhere] = useState<"before" | "after">("after");
  const [rel, setRel] = useState("");
  const [pending, start] = useTransition();
  const target = rel || songs[songs.length - 1]?.id;
  return (
    <Modal open={open} onClose={onClose} title="Add a part">
      <div className="space-y-4">
        <div><label className="label" htmlFor="p-name">Part name</label><input id="p-name" className="field" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="flex gap-2">
          {(["before", "after"] as const).map((w) => <button key={w} className="chip flex-1" aria-pressed={where === w} onClick={() => setWhere(w)}>{w === "before" ? "Before" : "After"}</button>)}
        </div>
        <div>
          <label className="label" htmlFor="p-rel">This part</label>
          <select id="p-rel" className="field" value={target} onChange={(e) => setRel(e.target.value)}>
            {songs.map((s) => <option key={s.id} value={s.id}>{s.part}</option>)}
          </select>
        </div>
        <button className="btn w-full" disabled={pending || !name.trim() || !target}
          onClick={() => start(async () => { await addPart(massId, name, target!, where); setName(""); onSaved(); })}>Add part</button>
      </div>
    </Modal>
  );
}
