// Shopify-style storefront customization model.
// A store's look = an ordered list of sections + theme tokens. The editor writes
// `draft_config`; Publish snapshots it to `published_config` (what the storefront renders).

export type SectionType =
  | "announcement"
  | "hero"
  | "featured_products"
  | "rich_text"
  | "trust_bar"
  | "newsletter"
  | "footer";

export type Section = {
  id: string;
  type: SectionType;
  visible: boolean;
  settings: Record<string, string | boolean | number>;
};

export type ThemeTokens = {
  accent: string;
  headingFont: string;
  bodyFont: string;
  radius: string;
};

export type StoreConfig = {
  sections: Section[];
  layout?: Record<string, unknown>;
  blocks?: Record<string, boolean>;
};

export const DEFAULT_TOKENS: ThemeTokens = {
  accent: "#0052FF",
  headingFont: "'Plus Jakarta Sans', sans-serif",
  bodyFont: "'Plus Jakarta Sans', sans-serif",
  radius: "10px",
};

export const SECTION_LIBRARY: {
  type: SectionType;
  label: string;
  removable: boolean;
  fields: { key: string; label: string; kind: "text" | "textarea" | "color" | "toggle" }[];
}[] = [
  {
    type: "announcement",
    label: "Announcement bar",
    removable: true,
    fields: [{ key: "text", label: "Message", kind: "text" }],
  },
  {
    type: "hero",
    label: "Hero banner",
    removable: false,
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      { key: "subheading", label: "Sub-text", kind: "textarea" },
      { key: "ctaLabel", label: "Button label", kind: "text" },
      { key: "image", label: "Background image URL", kind: "text" },
    ],
  },
  {
    type: "featured_products",
    label: "Product grid",
    removable: false,
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      { key: "showSearch", label: "Show search box", kind: "toggle" },
    ],
  },
  {
    type: "rich_text",
    label: "Text block",
    removable: true,
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      { key: "body", label: "Body", kind: "textarea" },
    ],
  },
  {
    type: "trust_bar",
    label: "Trust badges",
    removable: true,
    fields: [{ key: "items", label: "Badges (comma separated)", kind: "text" }],
  },
  {
    type: "newsletter",
    label: "Newsletter signup",
    removable: true,
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      { key: "subheading", label: "Sub-text", kind: "text" },
    ],
  },
  {
    type: "footer",
    label: "Footer",
    removable: false,
    fields: [{ key: "text", label: "Footer note", kind: "text" }],
  },
];

let seq = 0;
const sid = () => `sec_${Date.now().toString(36)}_${(seq++).toString(36)}`;

export function defaultConfigFor(storeName: string, announcement = "", heroImage = ""): StoreConfig {
  return {
    sections: [
      { id: sid(), type: "announcement", visible: !!announcement, settings: { text: announcement || "Free shipping on orders over ₹999" } },
      {
        id: sid(),
        type: "hero",
        visible: true,
        settings: {
          heading: `Welcome to ${storeName}`,
          subheading: "Shop premium products with secure checkout, fast delivery, and easy returns.",
          ctaLabel: "Shop Now",
          image: heroImage,
        },
      },
      { id: sid(), type: "trust_bar", visible: true, settings: { items: "Secure Checkout, COD Available, Easy Returns, Fast Dispatch" } },
      { id: sid(), type: "featured_products", visible: true, settings: { heading: "Our Products", showSearch: true } },
      { id: sid(), type: "footer", visible: true, settings: { text: `© ${new Date().getFullYear()} ${storeName}. Powered by SuperShowroom.` } },
    ],
  };
}

export function newSection(type: SectionType): Section {
  const lib = SECTION_LIBRARY.find((s) => s.type === type);
  const settings: Section["settings"] = {};
  lib?.fields.forEach((f) => {
    settings[f.key] = f.kind === "toggle" ? true : "";
  });
  return { id: sid(), type, visible: true, settings };
}

export function coerceConfig(raw: unknown, storeName: string): StoreConfig {
  if (raw && typeof raw === "object") {
    const r = raw as StoreConfig;
    const extras = { layout: r.layout, blocks: r.blocks };
    if (Array.isArray(r.sections) && r.sections.length) return { sections: r.sections, ...extras };
    if (r.layout) return { ...defaultConfigFor(storeName), ...extras };
  }
  return defaultConfigFor(storeName);
}

export function coerceTokens(raw: unknown): ThemeTokens {
  if (raw && typeof raw === "object") return { ...DEFAULT_TOKENS, ...(raw as Partial<ThemeTokens>) };
  return DEFAULT_TOKENS;
}
