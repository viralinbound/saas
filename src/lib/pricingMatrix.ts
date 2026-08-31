// Shared pricing content — used by the marketing /pricing page and the
// in-app /app/plans page so both stay identical. Mirrors the published
// SuperShowroom pricing brochure.

export type PaidKey = "essential" | "pro" | "elite" | "plus";
export const PAID_ORDER: PaidKey[] = ["essential", "pro", "elite", "plus"];

export const PRICING_HEADLINE = {
  eyebrow: "Compare the plans",
  title: "pick the one that fits today.",
  sub: "upgrade any time — we move you up without rebuilding your site.",
  note: "from ₹15,000 a year plus 2% of what you sell",
};

export const PRICING_DISCLAIMER =
  "Prices exclude 18% GST. Plans step up 10% each year on renewal — written down from day one. The 2% fee on sales never changes.";

// The 4 headline bullets shown on each plan card (verbatim from the brochure).
export const PLAN_CARD_BULLETS: Record<PaidKey, string[]> = {
  essential: [
    "Free Custom Domain (.in)",
    "Up to 100 Products",
    "Advance to start: ₹5,000",
    "2% Sales Fee (ex GST)",
  ],
  pro: [
    "Free Domain (.com / .in)",
    "Unlimited Products & Video",
    "Advance to start: ₹8,000",
    "2% Sales Fee (ex GST)",
  ],
  elite: [
    "Remove SuperShowroom Branding",
    "Full Sitewide SEO & Reviews",
    "Advance to start: ₹12,000",
    "2% Sales Fee (ex GST)",
  ],
  plus: [
    "Fully Custom Theme Design",
    "Reduced 1% Sales Fee",
    "Advance to start: ₹20,000",
    "Admin + 15 Logins",
  ],
};

export const PLAN_CTA: Record<PaidKey, string> = {
  essential: "Pick Essential Plan →",
  pro: "Pick Pro Plan →",
  elite: "Pick Elite Plan →",
  plus: "Pick Plus Plan →",
};

// COMPLETE FEATURE MATRIX — order is [essential, pro, elite, plus]
export type MatrixRow = { label: string; values: [string, string, string, string] };
export type MatrixGroup = { group: string; rows: MatrixRow[] };

export const PRICING_GROUPS: MatrixGroup[] = [
  {
    group: "Website & hosting",
    rows: [
      { label: "Domain, hosting & SSL", values: ["Free", "Free", "Free", "Free"] },
      { label: "Design layouts", values: ["Premium", "Premium", "Premium", "Fully custom"] },
      { label: "Extra pages", values: ["—", "Yes", "Yes", "Yes"] },
      { label: "Remove SuperShowroom branding", values: ["—", "—", "Yes", "Yes"] },
    ],
  },
  {
    group: "Your catalog",
    rows: [
      { label: "Products", values: ["100", "Unlimited", "Unlimited", "Unlimited"] },
      { label: "Images per product", values: ["4 + 1/variant", "4 + 4/variant + video", "4 + 8/variant + video", "4 + 8/variant + video"] },
      { label: "Variants", values: ["Basic", "Advanced", "Advanced", "Advanced"] },
      { label: "Collections, filters & tags", values: ["—", "—", "Yes", "Yes"] },
      { label: "Customer reviews", values: ["—", "—", "Yes", "Yes"] },
    ],
  },
  {
    group: "Running the store",
    rows: [
      { label: "Order management", values: ["Yes", "Yes", "Yes", "Yes"] },
      { label: "Stock alerts", values: ["Manual", "Automatic", "Automatic", "Automatic"] },
      { label: "Order cancellation", values: ["—", "Yes", "Yes", "Yes"] },
      { label: "Team logins", values: ["Admin only", "Admin + 3", "Admin + 15", "Admin + 15"] },
    ],
  },
  {
    group: "Getting customers & marketing",
    rows: [
      { label: "SEO setup", values: ["Homepage", "Homepage", "Full sitewide", "Full sitewide"] },
      { label: "Google Ads / Shopping", values: ["Yes", "Yes", "Yes", "Yes"] },
      { label: "CRM", values: ["—", "Yes", "Yes", "Yes"] },
      { label: "Coupons", values: ["Store / cart", "+ categories", "+ products", "+ products"] },
      { label: "WhatsApp credits", values: ["Add-on", "Free credits", "Free credits", "Free credits"] },
    ],
  },
  {
    group: "Support & onboarding",
    rows: [
      { label: "WhatsApp support", values: ["Yes", "Yes", "Yes", "Yes"] },
    ],
  },
];
