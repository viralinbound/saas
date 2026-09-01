import type { Metadata } from "next";
import { TemplatesShowcase } from "@/components/marketing/TemplatesShowcase";

export const metadata: Metadata = {
  title: "Layout previews — walk the whole store before you pick one",
  description:
    "The storefront, a product page and the checkout for all six SuperShowroom layouts, with every industry feature switched on. Included from ₹15,000/yr.",
};

export default function TemplatesPage() {
  return <TemplatesShowcase />;
}
