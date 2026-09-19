import { requireUser } from "@/lib/auth";
import { ProfileForms } from "@/components/ProfileForms";

export default async function ProfilePage() {
  const user = await requireUser();
  return <ProfileForms username={user.username} displayName={user.display_name} />;
}
