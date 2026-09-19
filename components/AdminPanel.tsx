"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { createUser, deleteUser, resetPassword, setRole } from "@/app/actions/admin";
import { DEFAULT_PASSWORD } from "@/lib/constants";

type U = { id: string; username: string; display_name: string; role: string };
const ROLES = ["choir_master", "senior_member", "member"];

export function AdminPanel({ users }: { users: U[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [target, setTarget] = useState<{ kind: "reset" | "delete"; user: U } | null>(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<unknown>, ok: string) => start(async () => {
    try { await fn(); setMsg(ok); router.refresh(); } catch (e) { setMsg((e as Error).message); }
  });

  return (
    <>
      <div className="mb-4 flex items-end justify-between">
        <h1 className="h-display text-5xl">Members</h1>
        <button className="btn" onClick={() => setAdding(true)}>Add member</button>
      </div>
      {msg && <p role="status" className="mb-3 text-sm text-dim">{msg}</p>}

      {!users.length ? <p className="py-12 text-center text-dim">No members yet.</p> : (
        <ul className="divide-y divide-white/10">
          {users.map((u) => (
            <li key={u.id} className="py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{u.display_name}</span>
                <span className="text-sm text-faint">{u.username}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select aria-label={`Role for ${u.display_name}`} className="field w-auto py-1.5 text-sm" value={u.role} disabled={pending}
                  onChange={(e) => run(() => setRole(u.id, e.target.value), "Role updated")}>
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                </select>
                <button className="btn btn-ghost px-3 py-1.5 text-xs" onClick={() => setTarget({ kind: "reset", user: u })}>Reset password</button>
                <button className="btn btn-ghost px-3 py-1.5 text-xs text-red" onClick={() => setTarget({ kind: "delete", user: u })}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add member">
        <div className="space-y-4">
          <div><label className="label" htmlFor="a-name">Display name</label><input id="a-name" className="field" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label" htmlFor="a-user">Username</label><input id="a-user" className="field" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
          <p className="text-sm text-dim">Starts with the password <b className="text-ink">{DEFAULT_PASSWORD}</b>.</p>
          <button className="btn w-full" disabled={pending || !name.trim() || !username.trim()}
            onClick={() => run(async () => { await createUser(username, name); setUsername(""); setName(""); setAdding(false); }, "Member added")}>Create account</button>
        </div>
      </Modal>

      <ConfirmDialog open={target?.kind === "reset"} title="Reset password?" confirmLabel="Reset" busy={pending}
        body={`${target?.user.display_name ?? ""} will need to sign in with ${DEFAULT_PASSWORD}.`}
        onCancel={() => setTarget(null)}
        onConfirm={() => { const u = target!.user; setTarget(null); run(() => resetPassword(u.id), "Password reset"); }} />
      <ConfirmDialog open={target?.kind === "delete"} title="Delete account?" busy={pending}
        body={`${target?.user.display_name ?? ""} is removed for good.`}
        onCancel={() => setTarget(null)}
        onConfirm={() => { const u = target!.user; setTarget(null); run(() => deleteUser(u.id), "Account deleted"); }} />
    </>
  );
}
