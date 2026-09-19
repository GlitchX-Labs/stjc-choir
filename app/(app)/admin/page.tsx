import { db } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { AdminPanel } from "@/components/AdminPanel";

export default async function AdminPage() {
  await requireUser(["admin"]);
  const { data } = await db.from("users").select("id, username, display_name, role").neq("role", "admin").order("display_name");
  return <AdminPanel users={data ?? []} />;
}
