// Shared pricing content — marketing /pricing, homepage, and /app/plans.
// Copy matches SuperShowroom Site.dc.html#pricing.

export type PaidKey = "essential" | "pro" | "elite" | "plus";
export const PAID_ORDER: PaidKey[] = ["essential", "pro", "elite", "plus"];

export const PRICING_HEADLINE = {
  eyebrow: "05 / pricing",
  title: "pay once a year.",
  titleAccent: "then only when it sells.",
  sub: "no per-app charges, no markup on top of your payment gateway, no surprise at renewal. move up a plan any time and we migrate you without rebuilding the site.",
};

export const PRICING_DISCLAIMER =
  "prices exclude 18% GST. plans step up 10% each year on renewal — written down from day one. the 2% fee on sales never changes.";

export const PLAN_CARD_BULLETS: Record<PaidKey, string[]> = {
  essential: [
    "connect your own domain, free",
    "up to 100 products",
    "advance to start: ₹5,000",
    "2% sales fee (ex GST)",
  ],
  pro: [
    "connect your own domain, free",
    "unlimited products & video",
    "advance to start: ₹8,000",
    "2% sales fee (ex GST)",
  ],
  elite: [
    "remove supershowroom branding",
    "full sitewide seo & reviews",
    "advance to start: ₹12,000",
    "2% sales fee (ex GST)",
  ],
  plus: [
    "fully custom theme design",
    "reduced 1% sales fee",
    "advance to start: ₹20,000",
    "admin + 15 logins",
  ],
};

export const PLAN_CTA: Record<PaidKey, string> = {
  essential: "start essential →",
  pro: "start pro →",
  elite: "start elite →",
  plus: "talk to us →",
};

export const PLAN_WHO: Record<PaidKey, string> = {
  essential: "for small catalogs & first online stores",
  pro: "for growing brands ready to scale",
  elite: "for established high volume sellers",
  plus: "fully custom build & dedicated manager",
};

export type MatrixRow = { label: string; values: [string, string, string, string] };
export type MatrixGroup = { group: string; rows: MatrixRow[] };

export const PRICING_GROUPS: MatrixGroup[] = [
  {
    group: "the basics",
    rows: [
      { label: "who it's for", values: ["first store", "growing brand", "high volume", "fully custom"] },
      { label: "advance to start", values: ["₹5,000", "₹8,000", "₹12,000", "₹20,000"] },
      { label: "fee on sales", values: ["2%", "2%", "2%", "1%"] },
      { label: "team logins", values: ["1", "3", "8", "admin + 15"] },
    ],
  },
  {
    group: "your catalog",
    rows: [
      { label: "products", values: ["100", "unlimited", "unlimited", "unlimited"] },
      { label: "images per product", values: ["5", "10 + video", "unlimited", "unlimited"] },
      { label: "variants", values: ["size, colour", "+ weight", "all + bundles", "custom"] },
      { label: "reviews", values: ["—", "text", "text + photo", "text + photo"] },
    ],
  },
  {
    group: "running the store",
    rows: [
      { label: "order management", values: ["✓", "✓", "✓", "✓"] },
      { label: "low-stock alerts", values: ["—", "✓", "✓", "✓"] },
      { label: "reports & exports", values: ["basic", "full", "full + exports", "full + exports"] },
      { label: "supershowroom branding", values: ["shown", "shown", "removed", "removed"] },
    ],
  },
  {
    group: "getting customers",
    rows: [
      { label: "SEO setup", values: ["pages", "+ schema", "full sitewide", "full sitewide"] },
      { label: "shopping feed & social kit", values: ["—", "feed", "feed + kit", "feed + kit"] },
      { label: "whatsapp CRM", values: ["—", "✓", "✓", "✓"] },
      { label: "whatsapp credits / mo", values: ["—", "500", "2,000", "5,000"] },
    ],
  },
  {
    group: "support",
    rows: [
      { label: "whatsapp chat", values: ["✓", "✓", "priority", "priority"] },
      { label: "scheduled callback", values: ["—", "monthly", "fortnightly", "weekly"] },
      { label: "dedicated manager", values: ["—", "—", "—", "✓"] },
    ],
  },
];
