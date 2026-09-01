import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LayoutStorefront } from "@/components/marketing/LayoutStorefront";
import { TEMPLATE_PRESETS } from "@/lib/templatePresets";
import { LAYOUTS } from "@/lib/layoutPreviews";

export function generateStaticParams() {
  return Object.keys(TEMPLATE_PRESETS).map((key) => ({ key }));
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const p = TEMPLATE_PRESETS[key];
  return { title: p ? `${p.label} — template preview` : "Template preview" };
}

// Full-page, working preview of a starter layout — shoppable, no account, no real orders.
export default async function TemplatePreviewPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!LAYOUTS.some((l) => l.key === key)) notFound();
  return <LayoutStorefront layoutKey={key} />;
}
