import { cache } from "react";
import { createClient } from "./supabase/server";
import { mapStoreWithRelations } from "./db-mapper";
import { resolveActiveStore } from "./activeStore";
import { getSessionUser } from "./session";
import type { OnboardingData } from "./onboarding";
import type { StoreWithRelations, User } from "./types";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    name: profile?.name || user.user_metadata?.name || user.email?.split("@")[0] || "Merchant",
    email: user.email || profile?.phone || user.phone || "",
    phone: profile?.phone ?? user.phone ?? null,
  };
});

export const getCurrentStore = cache(async (): Promise<StoreWithRelations | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();

  const email = user.email || user.phone || "";

  // The active project (ssr_project cookie), or the newest store in the company.
  const storeRow = await resolveActiveStore<Parameters<typeof mapStoreWithRelations>[0] & { id: string }>("*");
  if (!storeRow) return null;

  // Independent — fetch in parallel instead of one after another.
  const [{ data: profile }, { data: products }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("products")
      .select("*")
      .eq("store_id", storeRow.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("store_id", storeRow.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return mapStoreWithRelations(storeRow, profile, email, products || [], orders || []);
});

/**
 * Lightweight active-store header for the dashboard shell — just the fields
 * `<AppShell>` needs (name, plan, owner, product/order counts), fetched with
 * `head:true` COUNT queries instead of pulling every row. Lets `/app` paint the
 * shell + skeletons immediately while `getCurrentStore()` (orders + products +
 * panels) streams in behind a <Suspense>.
 */
export const getDashboardShell = cache(async () => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();

  const storeRow = await resolveActiveStore<{
    id: string;
    name: string;
    slug: string;
    plan: string | null;
    currency: string | null;
    status: string | null;
    subdomain: string | null;
  }>("id, name, slug, plan, currency, status, subdomain");
  if (!storeRow) return null;

  const [{ data: profile }, { count: productCount }, { count: orderCount }] = await Promise.all([
    supabase.from("profiles").select("name, phone").eq("id", user.id).maybeSingle(),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", storeRow.id),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_id", storeRow.id),
  ]);

  return {
    id: storeRow.id,
    name: storeRow.name,
    slug: storeRow.slug,
    plan: storeRow.plan || "free",
    currency: storeRow.currency || "INR",
    status: storeRow.status || "draft",
    subdomain: storeRow.subdomain,
    owner: {
      name: profile?.name || user.email?.split("@")[0] || "there",
      email: user.email || profile?.phone || user.phone || "",
    },
    productCount: productCount ?? 0,
    orderCount: orderCount ?? 0,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireStore() {
  const store = await getCurrentStore();
  if (!store) throw new Error("NO_STORE");
  return store;
}

export const getOnboardingIntent = cache(async (): Promise<Partial<OnboardingData>> => {
  const user = await getSessionUser();
  if (!user) return {};

  const meta = user.user_metadata?.onboarding as Partial<OnboardingData> | undefined;
  if (meta?.goal) return meta;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_data")
    .eq("id", user.id)
    .maybeSingle();

  return (profile?.onboarding_data as Partial<OnboardingData>) || {};
});
