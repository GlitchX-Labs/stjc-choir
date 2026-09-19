"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { assertRole } from "@/lib/auth";
import { DEFAULT_PASSWORD } from "@/lib/constants";

const ROLES = ["choir_master", "senior_member", "member"];

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function createUser(username: string, displayName: string) {
  await assertRole(["admin"]);
  const u = username.trim();
  if (!u || !displayName.trim()) throw new Error("Username and name are required");
  const { data: taken } = await db.from("users").select("id").eq("username", u).maybeSingle();
  if (taken) throw new Error("That username is taken");
  fail((await db.from("users").insert({ username: u, display_name: displayName.trim(), password_hash: DEFAULT_PASSWORD, role: "member" })).error);
  revalidatePath("/admin");
}

export async function setRole(id: string, role: string) {
  await assertRole(["admin"]);
  if (!ROLES.includes(role)) throw new Error("Invalid role");
  fail((await db.from("users").update({ role }).eq("id", id).neq("role", "admin")).error);
  revalidatePath("/admin");
}

export async function resetPassword(id: string) {
  await assertRole(["admin"]);
  fail((await db.from("users").update({ password_hash: DEFAULT_PASSWORD }).eq("id", id).neq("role", "admin")).error);
}

export async function deleteUser(id: string) {
  await assertRole(["admin"]);
  const { data: u } = await db.from("users").select("role").eq("id", id).maybeSingle();
  if (!u || u.role === "admin") throw new Error("Cannot delete this account");
  fail((await db.from("users").delete().eq("id", id)).error);
  revalidatePath("/admin");
}
