"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function login(_: string | null, form: FormData): Promise<string | null> {
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!username || !password) return "Enter your username and password.";

  const { data } = await db
    .from("users")
    .select("id, username, display_name, role")
    .eq("username", username)
    .eq("password_hash", password)
    .maybeSingle();
  if (!data) return "Wrong username or password.";

  const session = await getSession();
  session.user = data;
  await session.save();
  redirect("/masses");
}

export async function logout() {
  (await getSession()).destroy();
  redirect("/login");
}
