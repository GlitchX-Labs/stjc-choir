import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { EDIT_ROLES } from "@/lib/constants";
import { MassDetail } from "@/components/MassDetail";
import type { Mass, MassSong } from "@/lib/types";

export default async function MassPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const [{ data: mass }, { data: songs }] = await Promise.all([
    db.from("mass_services").select("*").eq("id", params.id).maybeSingle(),
    db.from("mass_songs").select("*").eq("mass_id", params.id).order("sort_order", { nullsFirst: false }),
  ]);
  if (!mass) notFound();

  return <MassDetail mass={mass as Mass} songs={(songs ?? []) as MassSong[]} canEdit={EDIT_ROLES.includes(user.role)} />;
}
