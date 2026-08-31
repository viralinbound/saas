import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { CatalogClient } from "@/components/app/CatalogClient";

export default async function CatalogPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  return (
    <AppShell store={store} crumb="products" title="catalog" activePath="/app/catalog">
      <CatalogClient initialProducts={store.products} />
    </AppShell>
  );
}
