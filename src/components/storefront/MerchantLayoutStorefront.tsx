"use client";

/*
 * Renders a merchant's storefront when their template is one of the six
 * redesigned .dc layouts. Their saved customisation (config.layout patch +
 * config.blocks toggles + theme tokens) is merged onto the base layout, and
 * their real published catalogue fills the product grid.
 */

import { useMemo } from "react";
import type { Product } from "@/lib/types";
import type { StoreConfig, ThemeTokens } from "@/lib/customization";
import { starterLayout, mergeMerchantLayout, coerceBlocks, catalogToLayoutProducts, resolveTemplateKey } from "@/lib/layoutCommerce";
import { ShoppableLayout } from "@/components/storefront/ShoppableLayout";

export function MerchantLayoutStorefront({
  templateKey,
  storeName,
  storeSlug,
  config,
  tokens,
  products,
  demo,
}: {
  templateKey: string;
  storeName: string;
  storeSlug: string;
  config: StoreConfig;
  tokens?: ThemeTokens;
  products: Product[];
  demo: boolean;
}) {
  const layout = useMemo(() => {
    const key = resolveTemplateKey(config, templateKey);
    const base = starterLayout(key);
    const merged = mergeMerchantLayout(key, storeName, config, tokens);
    return { ...merged, products: catalogToLayoutProducts(products, base.products) };
  }, [templateKey, storeName, config, tokens, products]);

  const blocks = useMemo(() => coerceBlocks(config.blocks), [config.blocks]);
  const wa = ((config.layout as { whatsapp?: string } | undefined)?.whatsapp || "918431101466").replace(/[^0-9]/g, "");

  return (
    <ShoppableLayout
      layout={layout}
      blocks={blocks}
      showBranding={demo}
      orderSlug={storeSlug}
      whatsappNumber={wa}
    />
  );
}
