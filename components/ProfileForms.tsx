"use client";
import { useState, useTransition } from "react";
import { changePassword, changeUsername } from "@/app/actions/profile";

function Form({ title, onSubmit, children, submitLabel }: {
  title: string; submitLabel: string; children: React.ReactNode; onSubmit: () => Promise<string>;
}) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        try { setMsg({ ok: true, text: await onSubmit() }); } catch (err) { setMsg({ ok: false, text: (err as Error).message }); }
      });
    }}>
      <h2 className="h-display text-3xl">{title}</h2>
      {children}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-lime" : "text-red"}`}>{msg.text}</p>}
      <button className="btn w-full" disabled={pending}>{submitLabel}</button>
    </form>
  );
}

const Field = ({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div><label className="label">{label}<input className="field mt-1.5 font-normal normal-case tracking-normal" {...p} /></label></div>
);

export function ProfileForms({ username, displayName }: { username: string; displayName: string }) {
  const [u, setU] = useState(username);
  const [uPw, setUPw] = useState("");
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [conf, setConf] = useState("");
  return (
    <>
      <h1 className="h-display text-5xl">{displayName}</h1>
      <p className="mb-8 text-dim">Signed in as {username}</p>
      <div className="space-y-10">
        <Form title="Change username" submitLabel="Update username"
          onSubmit={async () => { const n = await changeUsername(uPw, u); setUPw(""); return `Username is now ${n}`; }}>
          <Field label="New username" value={u} onChange={(e) => setU(e.target.value)} autoCapitalize="none" />
          <Field label="Current password" type="password" value={uPw} onChange={(e) => setUPw(e.target.value)} autoComplete="current-password" />
        </Form>
        <Form title="Change password" submitLabel="Update password"
          onSubmit={async () => { await changePassword(cur, next, conf); setCur(""); setNext(""); setConf(""); return "Password updated"; }}>
          <Field label="Current password" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
          <Field label="New password" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          <Field label="Confirm new password" type="password" value={conf} onChange={(e) => setConf(e.target.value)} autoComplete="new-password" />
        </Form>
      </div>
    </>
  );
}
