import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { AnalyticsClient } from "@/components/app/AnalyticsClient";

export default async function AnalyticsPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  return (
    <AppShell store={store} crumb="business" title="analytics" activePath="/app/analytics">
      <AnalyticsClient />
    </AppShell>
  );
}
