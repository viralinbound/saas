import { notFound } from "next/navigation";
import { getStorefront, getStoreBySlug } from "@/lib/stores";
import { StorefrontClient } from "@/components/storefront/StorefrontClient";
import { V2Storefront } from "@/components/builder/V2Storefront";
import { coerceConfig, DEFAULT_TOKENS } from "@/lib/customization";
import { coerceSite, isV2 } from "@/lib/builder";
import { isStarterLayoutConfig } from "@/lib/layoutCommerce";
import { MerchantLayoutStorefront } from "@/components/storefront/MerchantLayoutStorefront";

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Published path: get_storefront() RPC returns only published data for live stores.
  const front = await getStorefront(slug);
  if (front) {
    if (isStarterLayoutConfig(front.rawConfig)) {
      return (
        <MerchantLayoutStorefront
          templateKey={front.store.theme || "fashion"}
          storeName={front.store.name}
          storeSlug={front.store.slug}
          config={front.config}
          tokens={front.tokens}
          products={front.store.products}
          demo={front.demo}
        />
      );
    }
    if (isV2(front.rawConfig)) {
      return (
        <V2Storefront
          store={front.store}
          site={coerceSite(front.rawConfig, front.store.name)}
          pagePath=""
          accent={front.store.accentColor}
          demo={front.demo}
        />
      );
    }
    return <StorefrontClient store={front.store} config={front.config} tokens={front.tokens} demo={front.demo} />;
  }

  // Not live yet — holding page, without leaking any other tenant's data.
  const store = await getStoreBySlug(slug, { includeProducts: true });
  if (!store) notFound();

  if (store.status !== "live") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <h1>{store.name}</h1>
          <p style={{ marginTop: 12 }}>This store is not published yet. The merchant needs to click Publish in their console.</p>
        </div>
      </div>
    );
  }

  return <StorefrontClient store={store} config={coerceConfig(undefined, store.name)} tokens={DEFAULT_TOKENS} />;
}
