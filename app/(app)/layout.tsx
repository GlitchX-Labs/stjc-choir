import { requireUser } from "@/lib/auth";
import { AI_ROLES } from "@/lib/constants";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <Header user={user} />
      <main className="mx-auto max-w-[680px] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5">{children}</main>
      <BottomNav showAi={AI_ROLES.includes(user.role)} />
    </>
  );
}
