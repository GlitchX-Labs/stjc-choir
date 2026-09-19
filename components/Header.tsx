import Link from "next/link";
import { logout } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/session";

const ROLE_COLOR: Record<string, string> = {
  admin: "text-red", choir_master: "text-lime", senior_member: "text-blue", member: "text-faint",
};

export function Header({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-void/95 backdrop-blur">
      <div className="mx-auto flex max-w-[680px] items-center justify-between px-4 py-2.5">
        <span className="h-display text-2xl text-lime">STJC</span>
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-sm marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="font-semibold">{user.display_name}</span>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${ROLE_COLOR[user.role]}`}>
              {user.role.replace("_", " ")}
            </span>
          </summary>
          <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-white/15 bg-surface shadow-xl shadow-black/60">
            <Link href="/profile" className="block px-4 py-3 text-sm hover:bg-white/5">Profile</Link>
            {user.role === "admin" && <Link href="/admin" className="block px-4 py-3 text-sm hover:bg-white/5">Admin</Link>}
            <form action={logout}>
              <button className="w-full px-4 py-3 text-left text-sm text-red hover:bg-white/5">Sign out</button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}
