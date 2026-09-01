import type { Product } from "./types";
import type { StoreConfig, ThemeTokens } from "./customization";
import { LAYOUTS, inr, type Layout } from "./layoutPreviews";
import { mediaCover } from "./media";

export const STARTER_TEMPLATE_KEYS = ["fashion", "bakery", "skincare", "kirana", "tech", "jewels"] as const;
export type StarterKey = (typeof STARTER_TEMPLATE_KEYS)[number];

export const LAYOUT_BLOCKS = [
  { id: "promo", label: "promo bar" },
  { id: "hero", label: "hero" },
  { id: "chips", label: "filters" },
  { id: "tiles", label: "category tiles" },
  { id: "products", label: "product grid" },
  { id: "lookbook", label: "lookbook banner" },
  { id: "reviews", label: "reviews" },
  { id: "trust", label: "trust bar" },
] as const;

export type LayoutBlockId = (typeof LAYOUT_BLOCKS)[number]["id"];
export type LayoutBlocks = Record<LayoutBlockId, boolean>;

export type LayoutPatch = {
  store?: string;
  domain?: string;
  promo?: string;
  headline?: string;
  sub?: string;
  cta?: string;
  cta2?: string;
  hero?: string;
  cats?: string[];
  chips?: string[];
  gridTitle?: string;
  gridMeta?: string;
  banner?: Partial<Layout["banner"]>;
  bg?: string;
  card?: string;
  fg?: string;
  accent?: string;
  font?: string;
};

export const DEFAULT_LAYOUT_BLOCKS: LayoutBlocks = {
  promo: true,
  hero: true,
  chips: true,
  tiles: true,
  products: true,
  lookbook: true,
  reviews: true,
  trust: true,
};

export function isStarterTemplate(key: string | null | undefined): key is StarterKey {
  return !!key && (STARTER_TEMPLATE_KEYS as readonly string[]).includes(key);
}

/** A saved config belongs to a .dc starter layout when it carries a `layout` patch. */
export function isStarterLayoutConfig(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const layout = (raw as StoreConfig).layout;
  return !!layout && typeof layout === "object" && Object.keys(layout).length > 0;
}

export function starterLayout(key: string | null | undefined): Layout {
  return LAYOUTS.find((d) => d.key === key) ?? LAYOUTS[0];
}

export function seedLayoutPatch(L: Layout, storeName: string): LayoutPatch {
  return {
    store: storeName || L.store,
    domain: L.domain,
    promo: L.promo,
    headline: L.headline,
    sub: L.sub,
    cta: L.cta,
    cta2: L.cta2,
    hero: L.hero,
    cats: [...L.cats],
    chips: [...L.chips],
    gridTitle: L.gridTitle,
    gridMeta: L.gridMeta,
    banner: { ...L.banner },
    bg: L.bg,
    card: L.card,
    fg: L.fg,
    accent: L.accent,
    font: L.font,
  };
}

export function tokensFromLayout(L: Layout): ThemeTokens {
  return {
    accent: L.accent,
    headingFont: L.font,
    bodyFont: "'Instrument Sans', system-ui, sans-serif",
    radius: "0px",
  };
}

function csv(list: string[] | undefined, fallback: string[]): string[] {
  if (!list?.length) return fallback;
  return list.map((s) => String(s).trim()).filter(Boolean);
}

function overlayFromSections(config: StoreConfig, base: Layout): Partial<Layout> {
  const sec = (type: string) => config.sections?.find((s) => s.type === type && s.visible);
  const str = (type: string, key: string) => {
    const s = sec(type);
    return s ? String(s.settings[key] ?? "") : "";
  };
  const heroImg = str("hero", "image");
  const heading = str("hero", "heading");
  const sub = str("hero", "subheading");
  const cta = str("hero", "ctaLabel");
  const promo = str("announcement", "text");
  const gridTitle = str("featured_products", "heading");
  const richH = str("rich_text", "heading");
  const richB = str("rich_text", "body");
  const trustRaw = str("trust_bar", "items");
  const out: Partial<Layout> = {};
  if (promo) out.promo = promo;
  if (heading) out.headline = heading;
  if (sub) out.sub = sub;
  if (cta) out.cta = cta;
  if (heroImg) out.hero = heroImg;
  if (gridTitle) out.gridTitle = gridTitle;
  if (richH || richB) {
    out.banner = {
      ...base.banner,
      headline: richH || base.banner.headline,
      sub: richB || base.banner.sub,
    };
  }
  if (trustRaw) {
    out.trust = trustRaw.split(",").map((t) => ({ title: t.trim(), sub: "" })).filter((t) => t.title);
  }
  return out;
}

export function mergeMerchantLayout(
  templateKey: string,
  storeName: string,
  config: StoreConfig,
  tokens?: ThemeTokens
): Layout {
  const base = starterLayout(templateKey);
  const fromSections = overlayFromSections(config, base);
  const p = (config.layout || {}) as LayoutPatch;
  const banner = { ...base.banner, ...fromSections.banner, ...p.banner };
  return {
    ...base,
    store: p.store || storeName || base.store,
    domain: p.domain || base.domain,
    promo: p.promo ?? fromSections.promo ?? base.promo,
    headline: p.headline ?? fromSections.headline ?? base.headline,
    sub: p.sub ?? fromSections.sub ?? base.sub,
    cta: p.cta ?? fromSections.cta ?? base.cta,
    cta2: p.cta2 || base.cta2,
    hero: p.hero ?? fromSections.hero ?? base.hero,
    cats: csv(p.cats, base.cats),
    chips: csv(p.chips, base.chips),
    gridTitle: p.gridTitle ?? fromSections.gridTitle ?? base.gridTitle,
    gridMeta: p.gridMeta || base.gridMeta,
    banner,
    trust: fromSections.trust?.length ? fromSections.trust : base.trust,
    bg: p.bg || base.bg,
    card: p.card || base.card,
    fg: p.fg || base.fg,
    accent: tokens?.accent || p.accent || base.accent,
    font: tokens?.headingFont || p.font || base.font,
  };
}

export function coerceBlocks(raw: StoreConfig["blocks"] | undefined): LayoutBlocks {
  return { ...DEFAULT_LAYOUT_BLOCKS, ...(raw || {}) };
}

export function catalogToLayoutProducts(products: Product[], fallback: Layout["products"]): Layout["products"] {
  if (!products.length) return fallback;
  return products.map((p, i) => {
    const fb = fallback[i % fallback.length];
    const variants = (p.variants || fb.variants.join(" / "))
      .split(/[,/|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      name: p.name,
      price: inr(Math.round((p.price || 0) / 100)),
      mrp: p.mrp ? inr(Math.round(p.mrp / 100)) : fb.mrp,
      rating: fb.rating,
      badge: p.category || fb.badge,
      variants: variants.length ? variants : fb.variants,
      img: mediaCover(p.image) || fb.img,
    };
  });
}
