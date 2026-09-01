import { inr, numOf, type Layout } from "./layoutPreviews";
import type { LayoutView } from "@/components/marketing/LayoutStorefrontView";

/**
 * Derive the presentational `v` object a LayoutStorefrontView needs
 * (hero slides, gallery, discount label, cart preview rows + totals) from a
 * resolved Layout. Shared by the marketing live-preview and the real
 * merchant storefront so the two never drift.
 */
export function buildLayoutView(L: Layout, slide: number): LayoutView {
  const p0 = L.products[0];
  const lines = L.products.slice(0, 3).map((p) => ({
    name: p.name,
    variant: p.variants[0] + " · in stock",
    qty: "1",
    price: p.price,
    img: p.img,
  }));
  const subtotalN = L.products.slice(0, 3).reduce((a, p) => a + numOf(p.price), 0);
  const discountN = numOf(L.cart.discount);
  const gstN = Math.round((subtotalN - discountN) * 0.05);

  const slides = [
    { kicker: "now on the storefront", img: L.hero, headline: L.headline, sub: L.sub, cta: L.cta },
    { kicker: L.banner.kicker, img: L.banner.img, headline: L.banner.headline, sub: L.banner.sub, cta: L.banner.cta },
    { kicker: L.signature.title, img: L.products[1] ? L.products[1].img : L.hero, headline: L.gridTitle, sub: L.options[0].name + " — " + L.options[0].detail + ".", cta: L.cta2 },
  ];
  const si = ((slide % slides.length) + slides.length) % slides.length;
  const gallery = (L.extra || []).slice(0, 6).map((src, k) => ({ img: src, alt: L.store + " shot " + (k + 1) }));
  const off = L.pdp.badge.indexOf("off") >= 0
    ? Math.round((1 - numOf(p0.price) / numOf(p0.mrp)) * 100) + "% off"
    : "save " + inr(numOf(p0.mrp) - numOf(p0.price));

  return {
    p0, si, slides, gallery, off, lines,
    subtotal: inr(subtotalN),
    gst: inr(gstN),
    total: inr(subtotalN - discountN + gstN),
    galleryTitle: "from the " + (L.name.indexOf("bakery") >= 0 ? "kitchen" : L.name.indexOf("kirana") >= 0 ? "farm" : "studio"),
    handle: "@" + L.domain.split(".")[0],
  };
}
