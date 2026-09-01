export const PLANS = {
  free: {
    name: "Start Free",
    price: 0,
    advance: 0,
    feePercent: 2,
    productLimit: 10,
    tagline: "Launch your store today — no card required",
    features: ["10 products", "Your store URL", "Cart & checkout", "Order dashboard", "All 6 themes"],
  },
  essential: {
    name: "Essential",
    price: 15000,
    advance: 5000,
    feePercent: 2,
    productLimit: 100,
    tagline: "For small catalogs & first online stores",
    features: ["100 products", "Free .in domain", "GST invoices", "WhatsApp support"],
  },
  pro: {
    name: "Pro Showroom",
    price: 25000,
    advance: 8000,
    feePercent: 2,
    productLimit: 9999,
    tagline: "For growing brands ready to scale",
    features: ["Unlimited products", "Free .com domain", "Abandoned cart", "Analytics"],
  },
  elite: {
    name: "Elite",
    price: 35000,
    advance: 12000,
    feePercent: 2,
    productLimit: 9999,
    tagline: "Own branding, SEO, reviews",
    features: ["Everything in Pro", "Custom branding", "SEO setup", "Review widgets"],
  },
  plus: {
    name: "Plus",
    price: 50000,
    advance: 20000,
    feePercent: 1,
    productLimit: 9999,
    tagline: "Custom build, dedicated manager",
    features: ["Dedicated manager", "Custom features", "1% sales fee", "Priority support"],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// Kept in lock-step with the six .dc layouts (src/lib/layoutPreviews.ts) and
// the public.templates rows (migration 20260901120000_dc_templates).
export const THEMES = [
  { key: "fashion", name: "apparel & fashion", industry: "apparel", hero: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop", accent: "#98502F", announcement: "festive drop · 30% off ethnic" },
  { key: "bakery", name: "bakery & café", industry: "bakery", hero: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop", accent: "#C2410C", announcement: "order by 9pm for morning delivery" },
  { key: "skincare", name: "organic skincare", industry: "skincare", hero: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&auto=format&fit=crop", accent: "#2F6B4F", announcement: "routine builder · save 15% on any 3" },
  { key: "kirana", name: "kirana & grocery", industry: "grocery", hero: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop", accent: "#3F8F29", announcement: "order before 2pm · same-day delivery" },
  { key: "tech", name: "tech & gadgets", industry: "electronics", hero: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop", accent: "#4F7BFF", announcement: "launch week · flat ₹500 off + no-cost emi" },
  { key: "jewels", name: "gold & jewellery", industry: "jewellery", hero: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop", accent: "#8A6A17", announcement: "bis hallmarked · insured delivery · try at home" },
] as const;

export type ThemeKey = (typeof THEMES)[number]["key"];

export function getTheme(key: string) {
  return THEMES.find((t) => t.key === key) || THEMES[0];
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function formatINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export const CURRENCIES = {
  INR: { symbol: "₹", locale: "en-IN" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "en-IE" },
  GBP: { symbol: "£", locale: "en-GB" },
  AED: { symbol: "AED ", locale: "en-AE" },
  AUD: { symbol: "A$", locale: "en-AU" },
  CAD: { symbol: "C$", locale: "en-CA" },
  SGD: { symbol: "S$", locale: "en-SG" },
  JPY: { symbol: "¥", locale: "ja-JP" },
  ZAR: { symbol: "R ", locale: "en-ZA" },
} as const;
export type CurrencyCode = keyof typeof CURRENCIES;

/** Amount is in the currency's minor unit (paise / cents). No FX — display only. */
export function formatMoney(minor: number, currency: string = "INR"): string {
  const c = CURRENCIES[(currency as CurrencyCode) in CURRENCIES ? (currency as CurrencyCode) : "INR"];
  const value = currency === "JPY" ? minor : minor / 100;
  return `${c.symbol}${value.toLocaleString(c.locale, { maximumFractionDigits: currency === "JPY" ? 0 : 0 })}`;
}

export function storeUrl(slug: string): string {
  // always the public domain — NEXT_PUBLIC_APP_URL is the console, which may differ
  return `https://www.supershowroom.in/s/${slug}`;
}

export function calcPlatformFee(amountPaise: number, plan: PlanKey): number {
  const pct = PLANS[plan]?.feePercent ?? 2;
  return Math.round(amountPaise * (pct / 100));
}

export function getPlanLimit(plan: string): number {
  const key = plan as PlanKey;
  return PLANS[key]?.productLimit ?? 10;
}
