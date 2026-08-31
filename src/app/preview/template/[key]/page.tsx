import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StorefrontClient } from "@/components/storefront/StorefrontClient";
import { buildTemplateConfig, TEMPLATE_PRESETS } from "@/lib/templatePresets";
import { demoProductsFor } from "@/lib/demoProducts";
import { getTheme } from "@/lib/constants";
import type { Product, Store } from "@/lib/types";

export function generateStaticParams() {
  return Object.keys(TEMPLATE_PRESETS).map((key) => ({ key }));
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const p = TEMPLATE_PRESETS[key];
  return { title: p ? `${p.label} — template preview` : "Template preview" };
}

// Full, shoppable preview of a starter template — no account, no real orders.
export default async function TemplatePreviewPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const built = buildTemplateConfig(key, getTheme(key).name);
  if (!built) notFound();

  const products = demoProductsFor(key);
  const store: Store & { products: Product[] } = {
    id: `demo-${key}`,
    name: getTheme(key).name,
    slug: `demo-${key}`,
    industry: getTheme(key).industry,
    theme: key,
    plan: "free",
    status: "live",
    accentColor: built.tokens.accent,
    currency: "INR",
    customDomain: null,
    ownerId: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    products,
  };

  return (
    <StorefrontClient store={store} config={built.config} tokens={built.tokens} demo previewOnly />
  );
}
