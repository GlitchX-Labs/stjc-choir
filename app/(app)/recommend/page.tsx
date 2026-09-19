import { db } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { AI_ROLES } from "@/lib/constants";
import { Recommend } from "@/components/Recommend";

export default async function RecommendPage({ searchParams }: { searchParams: { mass?: string } }) {
  await requireUser(AI_ROLES);
  const { data } = await db.from("mass_services").select("id, occasion, date").order("date", { ascending: false }).limit(30);
  return <Recommend masses={data ?? []} initialMass={searchParams.mass} />;
}
