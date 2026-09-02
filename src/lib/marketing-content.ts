import { PLANS, THEMES } from "@/lib/constants";

export const SOCIAL_PROOF_BRANDS = [
  "✦ THE CAFE CLUB",
  "✦ RAW ORGANICS",
  "✦ VELVET BOUTIQUE",
  "✦ SPARK ELECTRONICS",
  "✦ HERBAL ESSENCE",
];


export const PILLARS = [
  {
    num: "01",
    title: "YOUR WEBSITE",
    desc: "Custom brand styling, mobile-first design, high-speed hosting, custom domain & free SSL certificates.",
  },
  {
    num: "02",
    title: "YOUR STORE",
    desc: "Full product catalog, stock alerts, order notifications & multi-member team logins.",
  },
  {
    num: "03",
    title: "YOUR GROWTH",
    desc: "Sitewide SEO, Google Ads kit, WhatsApp CRM & automated repeat buyer recovery.",
  },
];

export const PAID_PLANS = [
  { key: "essential", ...PLANS.essential, cta: "Pick Essential Plan →" },
  { key: "pro", ...PLANS.pro, featured: true, cta: "Pick Pro Plan →" },
  { key: "elite", ...PLANS.elite, cta: "Pick Elite Plan →" },
  { key: "plus", ...PLANS.plus, cta: "Pick Plus Plan →" },
] as const;

export const FAQ_ITEMS = [
  {
    q: "How does the 2% fee on sales work?",
    a: "The 2% sales fee applies only to completed orders processed on your store (ex GST). It is billed monthly with transparent reporting.",
  },
  {
    q: "Is custom domain & SSL included for free?",
    a: "Yes! Every SuperShowroom plan includes a free custom domain (.com or .in), SSL certificate, and automated HTTPS security.",
  },
  {
    q: "How long does it take to launch my online store?",
    a: "Our standard setup takes 3 to 7 business days from catalog handover. We handle design, build, and delivery partner integration.",
  },
  {
    q: "Can I use my existing GST and bank account?",
    a: "Yes! We configure your automated GST invoices, razorpay/UPI payment gateways, and direct payout bank accounts during onboarding.",
  },
];

export const CONSULTATION_SLOTS = ["9:00am", "10:00am", "11:00am", "12:00pm", "2:00pm", "3:00pm", "4:00pm", "5:00pm"];

export const FEATURED_TEMPLATES = THEMES.slice(0, 3);

