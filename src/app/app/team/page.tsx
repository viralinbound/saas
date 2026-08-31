import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { TeamClient } from "@/components/app/TeamClient";

export default async function TeamPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  return (
    <AppShell store={store} crumb="company" title="team & access" activePath="/app/team">
      <TeamClient />
    </AppShell>
  );
}
