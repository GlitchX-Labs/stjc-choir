"use client";
import { useFormState, useFormStatus } from "react-dom";
import { login } from "../actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn w-full" disabled={pending}>{pending ? "Signing in" : "Sign in"}</button>;
}

export default function LoginPage() {
  const [error, action] = useFormState(login, null);
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="h-display text-7xl leading-[0.9] text-lime">STJC<br />Song Tracker</h1>
      <p className="mb-8 mt-3 text-dim">Saint Teresa&apos;s Junior Choir, Nungambakkam</p>
      <form action={action} className="space-y-4">
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" name="username" className="field" autoComplete="username" autoCapitalize="none" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="field" autoComplete="current-password" required />
        </div>
        {error && <p role="alert" className="text-sm text-red">{error}</p>}
        <Submit />
      </form>
    </main>
  );
}
