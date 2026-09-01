import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StorefrontClient } from "@/components/storefront/StorefrontClient";
import { V2Storefront } from "@/components/builder/V2Storefront";
import { mapProduct } from "@/lib/db-mapper";
import { coerceConfig, coerceTokens } from "@/lib/customization";
import { coerceSite, isV2 } from "@/lib/builder";
import { isStarterLayoutConfig, isStarterTemplate, seedStarterConfig } from "@/lib/layoutCommerce";
import { MerchantLayoutStorefront } from "@/components/storefront/MerchantLayoutStorefront";
import { demoProductsFor } from "@/lib/demoProducts";
import type { Product, Store } from "@/lib/types";

// Live DRAFT preview — only the store's own company members can see it.
export default async function DraftPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { slug } = await params;
  const { edit } = await searchParams;
  const editable = edit === "1";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // RLS: a member can only select their own company's store.
  const { data: storeRow } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!storeRow) notFound();

  const { data: cust } = await supabase
    .from("store_customizations")
    .select("draft_config, theme_tokens")
    .eq("store_id", storeRow.id)
    .maybeSingle();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeRow.id)
    .eq("published", true)
    .order("created_at", { ascending: false });

  // Match the standalone template preview: if the merchant hasn't added
  // products yet, fill the draft preview with the same sample catalogue so the
  // template shows exactly as it does on /preview/template/<key>.
  const real = (products || []).map(mapProduct);
  const shownProducts = real.length ? real : demoProductsFor(storeRow.template_key || storeRow.theme || "fashion");

  const store: Store & { products: Product[] } = {
    id: storeRow.id,
    name: storeRow.name,
    slug: storeRow.slug,
    industry: storeRow.industry,
    theme: storeRow.theme,
    plan: storeRow.plan,
    status: "live",
    accentColor: storeRow.accent_color,
    currency: storeRow.currency || "INR",
    customDomain: storeRow.custom_domain,
    ownerId: storeRow.owner_id,
    createdAt: new Date(storeRow.created_at),
    updatedAt: new Date(storeRow.updated_at),
    products: shownProducts,
  };

  // Every store on one of the six .dc template keys renders the .dc layout:
  // its own saved edits if it has them, otherwise a fresh copy of the template
  // (so a store still carrying a pre-redesign config shows the new design too).
  const starterKey = storeRow.template_key || storeRow.theme || "fashion";
  if (isStarterLayoutConfig(cust?.draft_config) || isStarterTemplate(starterKey)) {
    const useSaved = isStarterLayoutConfig(cust?.draft_config);
    const seeded = seedStarterConfig(starterKey, store.name);
    return (
      <MerchantLayoutStorefront
        templateKey={starterKey}
        storeName={store.name}
        storeSlug={store.slug}
        config={useSaved ? coerceConfig(cust?.draft_config, store.name) : seeded.config}
        tokens={useSaved ? coerceTokens(cust?.theme_tokens) : seeded.tokens}
        products={real}
        demo={storeRow.plan === "free"}
        editable={editable}
      />
    );
  }

  if (isV2(cust?.draft_config)) {
    return (
      <V2Storefront
        store={store}
        site={coerceSite(cust?.draft_config, store.name)}
        pagePath=""
        accent={store.accentColor}
        demo={storeRow.plan === "free"}
      />
    );
  }

  return (
    <StorefrontClient
      store={store}
      config={coerceConfig(cust?.draft_config, store.name)}
      tokens={coerceTokens(cust?.theme_tokens)}
      demo={storeRow.plan === "free"}
    />
  );
}
