import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "./constants";
import { getSession, type SessionUser } from "./session";

export async function currentUser(): Promise<SessionUser | null> {
  return (await getSession()).user ?? null;
}

/** For pages: redirects to /login when signed out, /masses when the role is not allowed. */
export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/masses");
  return user;
}

/** For server actions: throws so the client sees a failure rather than a redirect. */
export async function assertRole(roles: Role[]): Promise<SessionUser> {
  const user = await currentUser();
  if (!user || !roles.includes(user.role)) throw new Error("Not allowed");
  return user;
}
