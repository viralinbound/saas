import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/auth";
import { getCurrentOrg } from "@/lib/org";
import { AppShell } from "@/components/app/AppShell";
import { PlansClient } from "@/components/app/PlansClient";

export default async function PlansPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");
  const org = await getCurrentOrg();

  return (
    <AppShell store={store} crumb="upgrade" title="plans & unlock" activePath="/app/plans">
      <PlansClient currentPlan={org?.plan || store.plan || "free"} companyName={org?.name || store.name} />
    </AppShell>
  );
}
