import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LayoutStorefront } from "@/components/marketing/LayoutStorefront";
import { LAYOUTS } from "@/lib/layoutPreviews";
import { starterTemplateName } from "@/lib/layoutCommerce";

export function generateStaticParams() {
  return LAYOUTS.map((l) => ({ key: l.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const l = LAYOUTS.find((x) => x.key === key);
  return { title: l ? `${starterTemplateName(key)} — template preview` : "Template preview" };
}

// Full-page, working preview of a starter layout — shoppable, no account, no real orders.
export default async function TemplatePreviewPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!LAYOUTS.some((l) => l.key === key)) notFound();
  return <LayoutStorefront layoutKey={key} />;
}
