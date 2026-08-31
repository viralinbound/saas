import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { SettingsClient } from "@/components/app/SettingsClient";
import { storeUrl } from "@/lib/constants";

export default async function SettingsPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  return (
    <AppShell store={store} crumb="configuration" title="domain & settings" activePath="/app/settings">
      <SettingsClient store={{ id: store.id, name: store.name, slug: store.slug, status: store.status, customDomain: store.customDomain, theme: store.theme, currency: store.currency, url: storeUrl(store.slug) }} />
    </AppShell>
  );
}
