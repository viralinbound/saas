// v2 site model — a multi-page tree of blocks. Each block has a stable id,
// typed props, and a style object. Stored in store_customizations.draft_config
// as { version: 2, pages: [...] }. v1 { sections: [...] } configs are migrated
// on load by coerceSite().

export type BlockType =
  | "heading"
  | "text"
  | "image"
  | "button"
  | "spacer"
  | "divider"
  | "hero"
  | "products"
  | "richtext"
  | "newsletter"
  | "trust"
  | "embed"
  | "account"
  | "collection"
  | "video"
  | "columns";

export type BlockStyle = {
  bg?: string;
  color?: string;
  padY?: number; // vertical padding, px
  align?: "left" | "center" | "right";
  maxWidth?: number; // content max width, px (0 = full)
  // typography
  fontSize?: number; // px
  fontWeight?: number; // 300..900
  letterSpacing?: number; // px
  lineHeight?: number; // unitless
  // box
  bgImage?: string; // background image URL
  radius?: number; // corner radius, px (999 = pill)
  mt?: number; // margin-top, px
  mb?: number; // margin-bottom, px
  // free-drag positioning (absolute inside the page)
  free?: boolean;
  x?: number;
  y?: number;
  w?: number; // explicit width, px
  h?: number; // explicit height, px
  // visibility
  hidden?: boolean;
};

/** Corner-radius presets used by the shape picker. */
export const SHAPE_PRESETS: { label: string; radius: number }[] = [
  { label: "Square", radius: 0 },
  { label: "Rounded", radius: 14 },
  { label: "Pill", radius: 999 },
  { label: "Circle", radius: 9999 },
];

/** One-tap colour swatches for the inspector. */
export const THEME_SWATCHES = [
  "#7A0C12", "#E8A317", "#F6C544", "#4A0E10", "#F5EBD8", "#12233F", "#FFFFFF", "#111111",
  "#C9B27C", "#1F2937", "#166534", "#65A30D", "#ECFCCB", "#0E7490", "#38BDF8", "#E0F2FE",
  "#DB2777", "#F472B6", "#FCE7F3", "#0F172A", "#EA580C", "#FAFAFA", "#991B1B", "#F97316",
];

export type Block = {
  id: string;
  type: BlockType;
  props: Record<string, string | number | boolean>;
  style: BlockStyle;
  children?: Block[][]; // only for "columns" — one Block[] per column
};

export type Page = {
  id: string;
  name: string;
  path: string; // "" = home, "about", "contact", …
  blocks: Block[];
};

export type SiteConfig = {
  version: 2;
  pages: Page[];
};

type FieldKind = "text" | "textarea" | "color" | "toggle" | "number" | "select";
export type BlockField = { key: string; label: string; kind: FieldKind; options?: string[] };

export const BLOCK_LIBRARY: {
  type: BlockType;
  label: string;
  icon: string;
  fields: BlockField[];
  defaults: Record<string, string | number | boolean>;
}[] = [
  { type: "heading", label: "Heading", icon: "H", fields: [
      { key: "text", label: "Text", kind: "text" },
      { key: "level", label: "Size", kind: "select", options: ["h1", "h2", "h3"] },
    ], defaults: { text: "New heading", level: "h2" } },
  { type: "text", label: "Text", icon: "¶", fields: [
      { key: "text", label: "Text", kind: "textarea" },
    ], defaults: { text: "Write something here." } },
  { type: "image", label: "Image", icon: "🖼", fields: [
      { key: "src", label: "Image URL", kind: "text" },
      { key: "alt", label: "Alt text", kind: "text" },
      { key: "radius", label: "Corner radius", kind: "number" },
    ], defaults: { src: "", alt: "", radius: 12 } },
  { type: "button", label: "Button", icon: "▭", fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "href", label: "Link", kind: "text" },
      { key: "variant", label: "Style", kind: "select", options: ["solid", "outline"] },
    ], defaults: { label: "Shop now", href: "#products", variant: "solid" } },
  { type: "spacer", label: "Spacer", icon: "↕", fields: [
      { key: "height", label: "Height (px)", kind: "number" },
    ], defaults: { height: 40 } },
  { type: "divider", label: "Divider", icon: "—", fields: [], defaults: {} },
  { type: "hero", label: "Hero banner", icon: "★", fields: [
      { key: "heading", label: "Heading", kind: "text" },
      { key: "subheading", label: "Sub-text", kind: "textarea" },
      { key: "ctaLabel", label: "Button label", kind: "text" },
      { key: "ctaHref", label: "Button link", kind: "text" },
      { key: "image", label: "Background image URL", kind: "text" },
    ], defaults: { heading: "Welcome", subheading: "Shop premium products with fast delivery.", ctaLabel: "Shop now", ctaHref: "#products", image: "" } },
  { type: "products", label: "Product grid", icon: "▦", fields: [
      { key: "heading", label: "Heading", kind: "text" },
      { key: "showSearch", label: "Show search", kind: "toggle" },
      { key: "columns", label: "Columns", kind: "select", options: ["2", "3", "4"] },
    ], defaults: { heading: "Our products", showSearch: true, columns: "3" } },
  { type: "richtext", label: "Rich text", icon: "≣", fields: [
      { key: "heading", label: "Heading", kind: "text" },
      { key: "body", label: "Body", kind: "textarea" },
    ], defaults: { heading: "", body: "" } },
  { type: "newsletter", label: "Newsletter", icon: "✉", fields: [
      { key: "heading", label: "Heading", kind: "text" },
      { key: "subheading", label: "Sub-text", kind: "text" },
    ], defaults: { heading: "Join our newsletter", subheading: "Offers and new arrivals in your inbox." } },
  { type: "trust", label: "Trust badges", icon: "✓", fields: [
      { key: "items", label: "Badges (comma separated)", kind: "text" },
    ], defaults: { items: "Secure Checkout, COD Available, Easy Returns, Fast Dispatch" } },
  { type: "embed", label: "HTML embed", icon: "</>", fields: [
      { key: "html", label: "HTML", kind: "textarea" },
    ], defaults: { html: "<!-- paste embed code -->" } },
  { type: "account", label: "Customer account", icon: "👤", fields: [
      { key: "heading", label: "Heading", kind: "text" },
      { key: "note", label: "Note", kind: "text" },
    ], defaults: { heading: "Your account", note: "Sign in to track orders and save addresses." } },
  { type: "video", label: "Video", icon: "▶", fields: [
      { key: "src", label: "Video URL", kind: "text" },
      { key: "poster", label: "Poster image URL", kind: "text" },
      { key: "controls", label: "Show controls", kind: "toggle" },
      { key: "autoplay", label: "Autoplay (muted)", kind: "toggle" },
      { key: "loop", label: "Loop", kind: "toggle" },
      { key: "radius", label: "Corner radius", kind: "number" },
    ], defaults: { src: "", poster: "", controls: true, autoplay: false, loop: false, radius: 12 } },
  { type: "collection", label: "Data collection", icon: "🗄", fields: [
      { key: "collectionKey", label: "Collection key", kind: "text" },
      { key: "mode", label: "Show as", kind: "select", options: ["list", "form"] },
      { key: "heading", label: "Heading", kind: "text" },
      { key: "submitLabel", label: "Form button label", kind: "text" },
    ], defaults: { collectionKey: "", mode: "list", heading: "", submitLabel: "Submit" } },
  { type: "columns", label: "Columns", icon: "▥", fields: [
      { key: "count", label: "Columns", kind: "select", options: ["2", "3"] },
    ], defaults: { count: "2" } },
];

export const DEFAULT_STYLE: BlockStyle = { padY: 40, align: "left", maxWidth: 1120 };

let seq = 0;
export const bid = () => `blk_${Date.now().toString(36)}_${(seq++).toString(36)}`;
export const pid = () => `pg_${Date.now().toString(36)}_${(seq++).toString(36)}`;

export function newBlock(type: BlockType): Block {
  const lib = BLOCK_LIBRARY.find((b) => b.type === type)!;
  const b: Block = { id: bid(), type, props: { ...lib.defaults }, style: { ...DEFAULT_STYLE } };
  if (type === "columns") {
    const n = Number(lib.defaults.count) || 2;
    b.children = Array.from({ length: n }, () => []);
  }
  if (type === "hero") b.style = { ...DEFAULT_STYLE, padY: 0, align: "left" };
  if (type === "divider") b.style = { ...DEFAULT_STYLE, padY: 12 };
  return b;
}

export function defaultSite(storeName: string, heroImage = "", announcement = ""): SiteConfig {
  const home: Page = {
    id: pid(),
    name: "Home",
    path: "",
    blocks: [
      { id: bid(), type: "hero", style: { padY: 0, align: "left", maxWidth: 1120 }, props: {
        heading: `Welcome to ${storeName}`,
        subheading: "Shop premium products with secure checkout, fast delivery, and easy returns.",
        ctaLabel: "Shop now", ctaHref: "#products", image: heroImage,
      } },
      { id: bid(), type: "trust", style: { ...DEFAULT_STYLE, padY: 20, align: "center" }, props: {
        items: announcement ? announcement : "Secure Checkout, COD Available, Easy Returns, Fast Dispatch",
      } },
      { id: bid(), type: "products", style: { ...DEFAULT_STYLE }, props: { heading: "Our products", showSearch: true, columns: "3" } },
      { id: bid(), type: "newsletter", style: { ...DEFAULT_STYLE, align: "center", bg: "#F8FAFC" }, props: {
        heading: "Join our newsletter", subheading: "Offers and new arrivals in your inbox.",
      } },
    ],
  };
  const about: Page = {
    id: pid(),
    name: "About",
    path: "about",
    blocks: [
      { id: bid(), type: "heading", style: { ...DEFAULT_STYLE, padY: 48 }, props: { text: `About ${storeName}`, level: "h1" } },
      { id: bid(), type: "text", style: { ...DEFAULT_STYLE }, props: { text: "Tell your brand story here." } },
    ],
  };
  return { version: 2, pages: [home, about] };
}

/** Accepts a v2 { version:2, pages } config, a v1 { sections } config, or nothing. */
export function coerceSite(raw: unknown, storeName: string): SiteConfig {
  const r = raw as { version?: number; pages?: Page[]; sections?: { type: string; visible?: boolean; settings?: Record<string, unknown> }[] } | null;

  if (r && Array.isArray(r.pages) && r.pages.length) {
    return { version: 2, pages: r.pages.map((p) => ({ ...p, blocks: (p.blocks || []).map(normalizeBlock) })) };
  }

  // migrate v1 sections → a single Home page of blocks
  if (r && Array.isArray(r.sections) && r.sections.length) {
    const blocks: Block[] = [];
    for (const s of r.sections) {
      if (s.visible === false) continue;
      const g = (k: string, d = "") => String((s.settings?.[k] as string) ?? d);
      switch (s.type) {
        case "announcement":
          blocks.push({ id: bid(), type: "trust", style: { padY: 10, align: "center", bg: "#111827", color: "#fff" }, props: { items: g("text") } });
          break;
        case "hero":
          blocks.push({ id: bid(), type: "hero", style: { padY: 0, align: "left", maxWidth: 1120 }, props: {
            heading: g("heading", `Welcome to ${storeName}`), subheading: g("subheading"),
            ctaLabel: g("ctaLabel", "Shop now"), ctaHref: "#products", image: g("image"),
          } });
          break;
        case "trust_bar":
          blocks.push({ id: bid(), type: "trust", style: { padY: 20, align: "center" }, props: { items: g("items", "Secure Checkout, COD Available, Easy Returns, Fast Dispatch") } });
          break;
        case "featured_products":
          blocks.push({ id: bid(), type: "products", style: { padY: 40, align: "left", maxWidth: 1120 }, props: { heading: g("heading", "Our products"), showSearch: (s.settings?.showSearch ?? true) !== false, columns: "3" } });
          break;
        case "rich_text":
          blocks.push({ id: bid(), type: "richtext", style: { padY: 40, align: "center", maxWidth: 900 }, props: { heading: g("heading"), body: g("body") } });
          break;
        case "newsletter":
          blocks.push({ id: bid(), type: "newsletter", style: { padY: 48, align: "center", bg: "#F8FAFC" }, props: { heading: g("heading", "Join our newsletter"), subheading: g("subheading") } });
          break;
        case "footer":
          blocks.push({ id: bid(), type: "text", style: { padY: 32, align: "center", bg: "#0F172A", color: "#94A3B8" }, props: { text: g("text", `© ${new Date().getFullYear()} ${storeName}`) } });
          break;
      }
    }
    return { version: 2, pages: [{ id: pid(), name: "Home", path: "", blocks }] };
  }

  return defaultSite(storeName);
}

function normalizeBlock(b: Block): Block {
  return {
    id: b.id || bid(),
    type: b.type,
    props: b.props || {},
    style: { ...DEFAULT_STYLE, ...(b.style || {}) },
    ...(b.children ? { children: b.children.map((col) => (col || []).map(normalizeBlock)) } : {}),
  };
}

export function isV2(raw: unknown): boolean {
  const r = raw as { pages?: unknown[] } | null;
  return !!(r && Array.isArray(r.pages) && r.pages.length);
}
