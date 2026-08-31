export const ONBOARDING_GOALS = [
  {
    id: "launch",
    title: "Launch a new online store",
    description: "I'm starting fresh and want to sell online",
    icon: "🚀",
  },
  {
    id: "migrate",
    title: "Move my business online",
    description: "I sell on WhatsApp, Instagram, or offline today",
    icon: "📱",
  },
  {
    id: "grow",
    title: "Grow my existing store",
    description: "I already sell online and want better tools",
    icon: "📈",
  },
  {
    id: "explore",
    title: "Just exploring",
    description: "I want to see how SuperShowroom works first",
    icon: "✨",
  },
] as const;

export const SELLING_CATEGORIES = [
  { id: "apparel", label: "Fashion & Apparel", icon: "👗", theme: "fashion", industry: "apparel" },
  { id: "food", label: "Food, Bakery & Café", icon: "🥐", theme: "bakery", industry: "bakery" },
  { id: "beauty", label: "Beauty & Skincare", icon: "✨", theme: "skincare", industry: "skincare" },
  { id: "grocery", label: "Grocery & Kirana", icon: "🛒", theme: "kirana", industry: "grocery" },
  { id: "electronics", label: "Electronics & Gadgets", icon: "📱", theme: "tech", industry: "electronics" },
  { id: "jewellery", label: "Jewellery & Accessories", icon: "💎", theme: "jewels", industry: "jewellery" },
  { id: "home", label: "Home & Lifestyle", icon: "🏠", theme: "fashion", industry: "home" },
  { id: "other", label: "Something else", icon: "📦", theme: "fashion", industry: "other" },
] as const;

export const BUSINESS_STAGES = [
  {
    id: "new",
    title: "Just getting started",
    description: "This is my first time selling online",
  },
  {
    id: "side",
    title: "Side business",
    description: "I sell part-time alongside another job",
  },
  {
    id: "existing",
    title: "Established business",
    description: "I have customers and want to scale online",
  },
] as const;

export const SALES_CHANNELS = [
  { id: "online", label: "Online only", icon: "🌐" },
  { id: "whatsapp", label: "WhatsApp / Instagram", icon: "💬" },
  { id: "retail", label: "Physical store + online", icon: "🏪" },
  { id: "marketplace", label: "Marketplaces + own store", icon: "🛍️" },
] as const;

export const REVENUE_RANGES = [
  { id: "none", label: "No sales yet" },
  { id: "under-50k", label: "Under ₹50,000 / month" },
  { id: "50k-2l", label: "₹50,000 – ₹2 lakh / month" },
  { id: "2l-plus", label: "₹2 lakh+ / month" },
] as const;

export const TEAM_SIZES = [
  { id: "solo", label: "Just me" },
  { id: "2-5", label: "2–5 people" },
  { id: "6-20", label: "6–20 people" },
  { id: "20-plus", label: "20+ people" },
] as const;

export const MONTHLY_ORDERS = [
  { id: "lt-50", label: "Under 50 / month" },
  { id: "50-500", label: "50–500 / month" },
  { id: "500-5k", label: "500–5,000 / month" },
  { id: "5k-plus", label: "5,000+ / month" },
] as const;

export const BUSINESS_TYPES = [
  { id: "individual", label: "Individual / Sole proprietor" },
  { id: "partnership", label: "Partnership / LLP" },
  { id: "pvt-ltd", label: "Private Limited" },
  { id: "other", label: "Other" },
] as const;

export const HEARD_FROM = [
  { id: "search", label: "Google / search" },
  { id: "social", label: "Instagram / social" },
  { id: "friend", label: "Friend / colleague" },
  { id: "ad", label: "An ad" },
  { id: "other", label: "Somewhere else" },
] as const;

export type OnboardingData = {
  goal: string;
  category: string;
  businessStage: string;
  salesChannels: string[];
  revenueRange: string;
  teamSize?: string;
  monthlyOrders?: string;
  businessType?: string;
  heardFrom?: string;
};

export const ONBOARDING_STEPS = [
  { id: 1, label: "Your goal" },
  { id: 2, label: "What you sell" },
  { id: 3, label: "Your business" },
  { id: 4, label: "Company" },
  { id: 5, label: "Store URL" },
  { id: 6, label: "Theme" },
  { id: 7, label: "Plan" },
] as const;

export function getDashboardTip(goal?: string, category?: string): { title: string; body: string; cta: string; href: string } {
  const cat = SELLING_CATEGORIES.find((c) => c.id === category);

  switch (goal) {
    case "launch":
      return {
        title: "Your launch checklist",
        body: cat
          ? `You're set up for ${cat.label.toLowerCase()}. Add your first real products and publish when you're ready.`
          : "Add your first products and publish your store when you're ready to go live.",
        cta: "Add products →",
        href: "/app/catalog",
      };
    case "migrate":
      return {
        title: "Move your customers online",
        body: "Share your new store URL on WhatsApp and Instagram so existing buyers can order directly.",
        cta: "Copy store link →",
        href: "/app/settings",
      };
    case "grow":
      return {
        title: "Grow faster with insights",
        body: "Track orders, upgrade your plan for more products, and optimize your catalog from the dashboard.",
        cta: "View orders →",
        href: "/app/orders",
      };
    default:
      return {
        title: "Explore your new store",
        body: "Preview your storefront, tweak your theme in settings, and add products at your own pace.",
        cta: "Open catalog →",
        href: "/app/catalog",
      };
  }
}
