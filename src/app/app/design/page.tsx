import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { DesignClient } from "@/components/app/DesignClient";

export default async function DesignPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  return (
    <AppShell store={store} crumb="storefront" title="design & publish" activePath="/app/design">
      <DesignClient storeSlug={store.slug} />
    </AppShell>
  );
}
