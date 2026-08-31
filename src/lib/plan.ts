import { PLANS, type PlanKey } from "./constants";

export const PLAN_RANK: Record<string, number> = { free: 0, essential: 1, pro: 2, elite: 3, plus: 4 };
export const UPGRADE_PLAN_KEYS: PlanKey[] = ["essential", "pro", "elite", "plus"];

/** What each plan unlocks. This is the single source of truth for gating. */
export type PlanFeatures = {
  plan: PlanKey;
  label: string;
  priceYearly: number; // ₹/yr (0 = free)
  isDemo: boolean; // free plan = demo/preview only
  canPublishLive: boolean; // publish a real (non-watermarked) storefront
  watermark: boolean; // "Powered by SuperShowroom" bar on the storefront
  productLimit: number;
  teamSeats: number; // members allowed in the company (incl. owner)
  templateTier: PlanKey; // highest template min_plan this plan can apply
  customDomain: boolean; // connect shop.yourbrand.in
  sectionStyleEditor: boolean; // per-section colours / spacing / alignment
  addSections: boolean; // add extra sections beyond the template default
  analyticsDays: number; // history window on /app/analytics
  abandonedCart: boolean;
  removeBranding: boolean; // hide "Powered by SuperShowroom" in the footer
  prioritySupport: boolean;
  builderBlocks: boolean; // add / reorder / delete blocks in the drag-and-drop builder (else: edit text only)
  multiPage: boolean; // more than one page in the builder
  customerAccounts: boolean; // storefront visitors can register / sign in
  dataCollections: boolean; // custom "database" collections + records
};

const F = (
  plan: PlanKey,
  o: Partial<PlanFeatures>
): PlanFeatures => ({
  plan,
  label: PLANS[plan].name,
  priceYearly: PLANS[plan].price,
  isDemo: plan === "free",
  canPublishLive: plan !== "free",
  watermark: plan === "free",
  productLimit: PLANS[plan].productLimit,
  teamSeats: 1,
  templateTier: "free",
  customDomain: false,
  sectionStyleEditor: false,
  addSections: false,
  analyticsDays: 14,
  abandonedCart: false,
  removeBranding: false,
  prioritySupport: false,
  builderBlocks: false,
  multiPage: false,
  customerAccounts: false,
  dataCollections: false,
  ...o,
});

export const PLAN_FEATURES: Record<PlanKey, PlanFeatures> = {
  free: F("free", { teamSeats: 1, analyticsDays: 7 }),
  essential: F("essential", {
    teamSeats: 3,
    templateTier: "essential",
    addSections: true,
    analyticsDays: 30,
    builderBlocks: true,
    multiPage: true,
    customerAccounts: true,
  }),
  pro: F("pro", {
    teamSeats: 8,
    templateTier: "pro",
    customDomain: true,
    sectionStyleEditor: true,
    addSections: true,
    analyticsDays: 90,
    abandonedCart: true,
    builderBlocks: true,
    multiPage: true,
    customerAccounts: true,
    dataCollections: true,
  }),
  elite: F("elite", {
    teamSeats: 20,
    templateTier: "elite",
    customDomain: true,
    sectionStyleEditor: true,
    addSections: true,
    analyticsDays: 180,
    abandonedCart: true,
    removeBranding: true,
    builderBlocks: true,
    multiPage: true,
    customerAccounts: true,
    dataCollections: true,
  }),
  plus: F("plus", {
    teamSeats: 100,
    templateTier: "plus",
    customDomain: true,
    sectionStyleEditor: true,
    addSections: true,
    analyticsDays: 365,
    abandonedCart: true,
    removeBranding: true,
    prioritySupport: true,
    builderBlocks: true,
    multiPage: true,
    customerAccounts: true,
    dataCollections: true,
  }),
};

export function planFeatures(plan: string | null | undefined): PlanFeatures {
  const key = (plan && plan in PLAN_FEATURES ? plan : "free") as PlanKey;
  return PLAN_FEATURES[key];
}

// Back-compat alias used across the app.
export type PlanGate = PlanFeatures;
export const planGate = planFeatures;

/** Can a company on `plan` apply a template that needs `minPlan`? */
export function canUseTemplate(plan: string | null | undefined, minPlan: string | null | undefined): boolean {
  return (PLAN_RANK[plan ?? "free"] ?? 0) >= (PLAN_RANK[minPlan ?? "free"] ?? 0);
}
