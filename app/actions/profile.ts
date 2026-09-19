"use server";
import { db } from "@/lib/supabase";
import { currentUser } from "@/lib/auth";
import { getSession } from "@/lib/session";

async function verified(current: string) {
  const user = await currentUser();
  if (!user) throw new Error("Not signed in");
  const { data } = await db.from("users").select("id").eq("id", user.id).eq("password_hash", current).maybeSingle();
  if (!data) throw new Error("Current password is wrong");
  return user;
}

export async function changeUsername(current: string, username: string): Promise<string> {
  const user = await verified(current);
  const next = username.trim();
  if (!next) throw new Error("Enter a username");
  const { data: taken } = await db.from("users").select("id").eq("username", next).neq("id", user.id).maybeSingle();
  if (taken) throw new Error("That username is taken");
  const { error } = await db.from("users").update({ username: next }).eq("id", user.id);
  if (error) throw new Error(error.message);
  const session = await getSession();
  session.user = { ...user, username: next };
  await session.save();
  return next;
}

export async function changePassword(current: string, next: string, confirm: string) {
  const user = await verified(current);
  if (next.length < 6) throw new Error("Use at least 6 characters");
  if (next !== confirm) throw new Error("New passwords do not match");
  const { error } = await db.from("users").update({ password_hash: next }).eq("id", user.id);
  if (error) throw new Error(error.message);
}
