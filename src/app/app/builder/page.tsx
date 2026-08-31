import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/auth";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/AppShell";
import { BuilderClient, type CollectionMeta } from "@/components/app/BuilderClient";
import { coerceSite } from "@/lib/builder";
import { planFeatures } from "@/lib/plan";
import { brandedHost } from "@/lib/domains";

export default async function BuilderPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const org = await getCurrentOrg();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("stores")
    .select("subdomain, host_path")
    .eq("id", store.id)
    .maybeSingle();
  const { data: cust } = await supabase
    .from("store_customizations")
    .select("draft_config, published_at")
    .eq("store_id", store.id)
    .maybeSingle();
  const { data: cols } = await supabase
    .from("store_collections")
    .select("id, key, name, fields, allow_public_submit, is_public, require_login")
    .eq("store_id", store.id)
    .order("created_at", { ascending: true });

  const collections: CollectionMeta[] = (cols || []).map((c) => ({
    id: c.id,
    key: c.key,
    name: c.name,
    fields: (c.fields as CollectionMeta["fields"]) ?? [],
    allow_public_submit: c.allow_public_submit,
    is_public: c.is_public,
    require_login: c.require_login,
  }));

  const brand = row?.subdomain || store.slug;
  const companyPath = row?.host_path && row.host_path.includes("/") ? row.host_path : `${org?.slug ?? "store"}/${store.slug}`;
  const gate = planFeatures(org?.plan ?? store.plan);

  return (
    <AppShell store={store} crumb="storefront" title="website builder" activePath="/app/builder">
      <BuilderClient
        store={{
          id: store.id,
          name: store.name,
          slug: store.slug,
          status: store.status,
          accentColor: store.accentColor || "#0052FF",
          brand,
          brandedHost: brandedHost(brand),
          hostedPath: `/${companyPath}`,
        }}
        initialSite={coerceSite(cust?.draft_config, store.name)}
        products={store.products}
        publishedAt={cust?.published_at ?? null}
        gate={gate}
        initialCollections={collections}
      />
    </AppShell>
  );
}
