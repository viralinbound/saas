import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/stores";
import { V2Storefront } from "@/components/builder/V2Storefront";
import { coerceSite, isV2 } from "@/lib/builder";

// Secondary pages of a v2 drag-and-drop site: /s/<slug>/<pagePath>
export default async function StoreSubPage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;

  const front = await getStorefront(slug);
  if (!front || !isV2(front.rawConfig)) notFound();

  const site = coerceSite(front.rawConfig, front.store.name);
  const target = site.pages.find((p) => p.path === page);
  if (!target) notFound();

  return (
    <V2Storefront
      store={front.store}
      site={site}
      pagePath={target.path}
      accent={front.store.accentColor}
      demo={front.demo}
    />
  );
}
