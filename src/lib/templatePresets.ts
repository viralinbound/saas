// Full, professionally-written presets for the 6 starter templates. Selecting a
// template in /app/design swaps in the matching section copy + theme tokens
// (accent, fonts, radius) so each store starts from a distinct, finished look.

import type { Section, StoreConfig, ThemeTokens } from "./customization";

type PresetSection = { type: Section["type"]; visible: boolean; settings: Record<string, string | boolean | number> };
export type TemplatePreset = { label: string; blurb: string; tokens: ThemeTokens; sections: PresetSection[] };

const IMG = (id: string) => `https://images.unsplash.com/${id}?w=1600&q=80&auto=format&fit=crop`;

export const TEMPLATE_PRESETS: Record<string, TemplatePreset> = {
  // ── 1. Luxe Apparel & Fashion ───────────────────────────────────────
  fashion: {
    label: "Luxe Apparel & Fashion",
    blurb: "Editorial, monochrome, made for a considered wardrobe.",
    tokens: { accent: "#101010", headingFont: "'Playfair Display', Georgia, serif", bodyFont: "'Instrument Sans', system-ui, sans-serif", radius: "2px" },
    sections: [
      { type: "announcement", visible: true, settings: { text: "COMPLIMENTARY SHIPPING OVER ₹2,499  ·  EASY 15-DAY RETURNS" } },
      { type: "hero", visible: true, settings: {
        heading: "Timeless pieces, made to be worn",
        subheading: "A considered wardrobe of elevated essentials — tailored silhouettes, natural fabrics, and colours that never date.",
        ctaLabel: "Shop the collection",
        image: IMG("photo-1610030469983-98e550d6193c"),
      } },
      { type: "trust_bar", visible: true, settings: { items: "Premium Fabrics, Ethically Made, Free Alterations, 15-Day Returns" } },
      { type: "featured_products", visible: true, settings: { heading: "New this season", showSearch: true } },
      { type: "rich_text", visible: true, settings: {
        heading: "Crafted with intention",
        body: "Every garment is cut in limited runs from mills we visit in person. We design for longevity — pieces you reach for season after season, not trends you discard.",
      } },
      { type: "newsletter", visible: true, settings: { heading: "Join the list", subheading: "Early access to new arrivals and members-only fittings." } },
      { type: "footer", visible: true, settings: { text: "© {year} {store}. All rights reserved." } },
    ],
  },

  // ── 2. Artisan Bakery & Café ────────────────────────────────────────
  bakery: {
    label: "Artisan Bakery & Café",
    blurb: "Warm, hand-made, baked-fresh-this-morning energy.",
    tokens: { accent: "#B4531E", headingFont: "'Fraunces', Georgia, serif", bodyFont: "'Plus Jakarta Sans', system-ui, sans-serif", radius: "16px" },
    sections: [
      { type: "announcement", visible: true, settings: { text: "🥐 FRESH BATCHES FROM 7 AM  ·  SAME-DAY DELIVERY BEFORE 2 PM" } },
      { type: "hero", visible: true, settings: {
        heading: "Baked fresh every morning",
        subheading: "Slow-fermented sourdough, buttery croissants, and celebration cakes made from scratch with stone-milled flour.",
        ctaLabel: "Order for today",
        image: IMG("photo-1509440159596-0249088772ff"),
      } },
      { type: "trust_bar", visible: true, settings: { items: "Baked Fresh Daily, Stone-Milled Flour, No Preservatives, Same-Day Delivery" } },
      { type: "featured_products", visible: true, settings: { heading: "Today's bake", showSearch: false } },
      { type: "rich_text", visible: true, settings: {
        heading: "Our little bakery",
        body: "We started in a home kitchen with one oven and a sourdough starter we still feed every day. Everything is mixed by hand, proofed overnight, and baked before sunrise.",
      } },
      { type: "newsletter", visible: true, settings: { heading: "Get the fresh sheet", subheading: "Our weekly menu and pre-order links, every Thursday." } },
      { type: "footer", visible: true, settings: { text: "© {year} {store} · Baked with love, delivered warm." } },
    ],
  },

  // ── 3. Glow Organic Skincare ───────────────────────────────────────
  skincare: {
    label: "Glow Organic Skincare",
    blurb: "Clean, clinical, ingredient-led minimalism.",
    tokens: { accent: "#2F7D5B", headingFont: "'Instrument Sans', system-ui, sans-serif", bodyFont: "'Instrument Sans', system-ui, sans-serif", radius: "12px" },
    sections: [
      { type: "announcement", visible: true, settings: { text: "DERMATOLOGIST-FORMULATED  ·  FRAGRANCE-FREE  ·  NEVER TESTED ON ANIMALS" } },
      { type: "hero", visible: true, settings: {
        heading: "Skin that looks after itself",
        subheading: "Minimalist routines built on clinically-backed actives and organic botanicals — nothing you don't need.",
        ctaLabel: "Build your routine",
        image: IMG("photo-1556228720-195a672e8a03"),
      } },
      { type: "trust_bar", visible: true, settings: { items: "Clinically Tested, Vegan & Cruelty-Free, Fragrance-Free, Recyclable Packaging" } },
      { type: "featured_products", visible: true, settings: { heading: "Bestselling essentials", showSearch: true } },
      { type: "rich_text", visible: true, settings: {
        heading: "Fewer, better ingredients",
        body: "Each formula lists every ingredient and why it's there. We cap actives at effective concentrations, skip the filler, and pack in glass wherever we can.",
      } },
      { type: "newsletter", visible: true, settings: { heading: "Skincare notes", subheading: "Routine guides and restock alerts — no spam, ever." } },
      { type: "footer", visible: true, settings: { text: "© {year} {store} · Formulated in small batches." } },
    ],
  },

  // ── 4. Fresh Mart & Kirana ─────────────────────────────────────────
  kirana: {
    label: "Fresh Mart & Kirana",
    blurb: "Bright, practical, your-neighbourhood-store-online.",
    tokens: { accent: "#1E8E3E", headingFont: "'Plus Jakarta Sans', system-ui, sans-serif", bodyFont: "'Plus Jakarta Sans', system-ui, sans-serif", radius: "12px" },
    sections: [
      { type: "announcement", visible: true, settings: { text: "🥦 FARM-FRESH PRODUCE  ·  3-HOUR DELIVERY  ·  CASH ON DELIVERY AVAILABLE" } },
      { type: "hero", visible: true, settings: {
        heading: "Your neighbourhood store, now online",
        subheading: "Daily staples, fresh fruit and vegetables, and household essentials — delivered to your door in hours.",
        ctaLabel: "Start shopping",
        image: IMG("photo-1542838132-92c53300491e"),
      } },
      { type: "trust_bar", visible: true, settings: { items: "3-Hour Delivery, Farm-Fresh Daily, Best-Price Guarantee, Easy Returns" } },
      { type: "featured_products", visible: true, settings: { heading: "Everyday essentials", showSearch: true } },
      { type: "rich_text", visible: true, settings: {
        heading: "Stocked for the whole family",
        body: "From atta and dal to fresh coriander and cold drinks, we carry the brands you already trust — at the same prices as the shop down the road.",
      } },
      { type: "newsletter", visible: true, settings: { heading: "This week's deals", subheading: "Offers and new arrivals in your inbox every week." } },
      { type: "footer", visible: true, settings: { text: "© {year} {store} · Fresh to your door." } },
    ],
  },

  // ── 5. Cyber Tech & Gadgets ────────────────────────────────────────
  tech: {
    label: "Cyber Tech & Gadgets",
    blurb: "Sharp, spec-forward, confident.",
    tokens: { accent: "#6D28D9", headingFont: "'Space Grotesk', system-ui, sans-serif", bodyFont: "'Instrument Sans', system-ui, sans-serif", radius: "8px" },
    sections: [
      { type: "announcement", visible: true, settings: { text: "⚡ OFFICIAL WARRANTY  ·  NO-COST EMI  ·  NEXT-DAY DISPATCH" } },
      { type: "hero", visible: true, settings: {
        heading: "Gear that keeps up with you",
        subheading: "Hand-picked laptops, audio, and accessories — genuine stock, transparent specs, and support that actually answers.",
        ctaLabel: "Shop gadgets",
        image: IMG("photo-1505740420928-5e560c06d30e"),
      } },
      { type: "trust_bar", visible: true, settings: { items: "Genuine Stock, Official Warranty, No-Cost EMI, 7-Day Replacement" } },
      { type: "featured_products", visible: true, settings: { heading: "Trending tech", showSearch: true } },
      { type: "rich_text", visible: true, settings: {
        heading: "No jargon, just specs",
        body: "Every listing shows the numbers that matter — panel type, battery Wh, the real port list — so you can compare in seconds and buy with confidence.",
      } },
      { type: "newsletter", visible: true, settings: { heading: "Drop alerts", subheading: "Restocks, price drops, and launch-day access." } },
      { type: "footer", visible: true, settings: { text: "© {year} {store} · Genuine gear, honest specs." } },
    ],
  },

  // ── 6. Royal Gold & Jewellery ─────────────────────────────────────
  jewels: {
    label: "Royal Gold & Jewellery",
    blurb: "Refined, hallmarked, heirloom-grade.",
    tokens: { accent: "#8A6D1D", headingFont: "'Playfair Display', Georgia, serif", bodyFont: "'Instrument Sans', system-ui, sans-serif", radius: "4px" },
    sections: [
      { type: "announcement", visible: true, settings: { text: "💎 BIS HALLMARKED  ·  CERTIFIED DIAMONDS  ·  FULLY INSURED SHIPPING" } },
      { type: "hero", visible: true, settings: {
        heading: "Heirlooms for every celebration",
        subheading: "Hallmarked gold, certified diamonds, and handcrafted temple jewellery — with lifetime exchange and transparent making charges.",
        ctaLabel: "View collections",
        image: IMG("photo-1515562141207-7a88fb7ce338"),
      } },
      { type: "trust_bar", visible: true, settings: { items: "BIS Hallmarked Gold, Certified Diamonds, Lifetime Exchange, Insured Delivery" } },
      { type: "featured_products", visible: true, settings: { heading: "Featured collections", showSearch: true } },
      { type: "rich_text", visible: true, settings: {
        heading: "Transparent by design",
        body: "Every price breaks down metal weight, purity, stone value and making charges — no hidden margins. Bring a piece back any time for a fair exchange.",
      } },
      { type: "newsletter", visible: true, settings: { heading: "Private viewings", subheading: "New collections and appointment invitations." } },
      { type: "footer", visible: true, settings: { text: "© {year} {store} · Hallmarked. Insured. Yours." } },
    ],
  },
};

let seq = 0;
const sid = () => `sec_${Date.now().toString(36)}_${(seq++).toString(36)}`;

/** Build a fresh, name-interpolated v1 config + tokens for a template key. */
export function buildTemplateConfig(
  key: string,
  storeName: string
): { config: StoreConfig; tokens: ThemeTokens } | null {
  const preset = TEMPLATE_PRESETS[key];
  if (!preset) return null;
  const year = String(new Date().getFullYear());
  const fill = (v: string | boolean | number) =>
    typeof v === "string" ? v.replace(/\{store\}/g, storeName).replace(/\{year\}/g, year) : v;

  const sections: Section[] = preset.sections.map((s) => ({
    id: sid(),
    type: s.type,
    visible: s.visible,
    settings: Object.fromEntries(Object.entries(s.settings).map(([k, v]) => [k, fill(v)])) as Section["settings"],
  }));

  return { config: { sections }, tokens: { ...preset.tokens } };
}
