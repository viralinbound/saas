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
