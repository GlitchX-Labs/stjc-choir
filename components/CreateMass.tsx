"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react";
import { Modal } from "./Modal";
import { createMass } from "@/app/actions/masses";
import { OCCASIONS } from "@/lib/constants";
import { todayISO } from "@/lib/format";

export function CreateMass() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [occasion, setOccasion] = useState("Ordinary Sunday");
  const [custom, setCustom] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const submit = () => start(async () => {
    try {
      const id = await createMass({ date, occasion: occasion === "Custom" ? custom : occasion, notes });
      router.push(`/masses/${id}`);
    } catch (e) { setErr((e as Error).message); }
  });

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><Plus size={18} weight="bold" /> New Mass</button>
      <Modal open={open} onClose={() => setOpen(false)} title="New Mass">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="m-date">Date</label>
            <input id="m-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <span className="label">Occasion</span>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <button key={o} className="chip" aria-pressed={occasion === o} onClick={() => setOccasion(o)}>{o}</button>
              ))}
            </div>
            {occasion === "Custom" && (
              <input className="field mt-2" placeholder="Name this Mass" aria-label="Custom occasion name" value={custom} onChange={(e) => setCustom(e.target.value)} />
            )}
          </div>
          <div>
            <label className="label" htmlFor="m-notes">Notes</label>
            <textarea id="m-notes" className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {err && <p role="alert" className="text-sm text-red">{err}</p>}
          <button className="btn w-full" onClick={submit} disabled={pending || !date || (occasion === "Custom" && !custom.trim())}>
            {pending ? "Creating" : "Create Mass"}
          </button>
        </div>
      </Modal>
    </>
  );
}
