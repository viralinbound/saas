import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/stores";
import { StorefrontClient } from "@/components/storefront/StorefrontClient";
import { V2Storefront } from "@/components/builder/V2Storefront";
import { coerceSite, isV2 } from "@/lib/builder";
import { isStarterLayoutConfig, isStarterTemplate, seedStarterConfig } from "@/lib/layoutCommerce";
import { MerchantLayoutStorefront } from "@/components/storefront/MerchantLayoutStorefront";

/**
 * Hosted URL. Accepts both shapes:
 *   /h/<company>/<project>   (current)
 *   /h/<brand>               (legacy — brand slug / subdomain)
 * get_storefront() resolves by slug OR subdomain OR the "company/project" host_path.
 */
export default async function HostedPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = (slug || []).join("/");
  if (!key) notFound();

  const front = await getStorefront(key);
  if (!front) notFound();

  // A store on one of the six .dc template keys renders the .dc layout —
  // its saved edits if it has them, otherwise a fresh copy of the template.
  const starterKey = front.store.theme || "fashion";
  if (isStarterLayoutConfig(front.rawConfig) || isStarterTemplate(starterKey)) {
    const useSaved = isStarterLayoutConfig(front.rawConfig);
    const seeded = seedStarterConfig(starterKey, front.store.name);
    return (
      <MerchantLayoutStorefront
        templateKey={starterKey}
        storeName={front.store.name}
        storeSlug={front.store.slug}
        config={useSaved ? front.config : seeded.config}
        tokens={useSaved ? front.tokens : seeded.tokens}
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
