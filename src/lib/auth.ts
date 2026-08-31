import { createClient } from "./supabase/server";
import { mapStoreWithRelations } from "./db-mapper";
import { resolveActiveStore } from "./activeStore";
import type { OnboardingData } from "./onboarding";
import type { StoreWithRelations, User } from "./types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

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
}

export async function getCurrentStore(): Promise<StoreWithRelations | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const email = user.email || user.phone || "";

  // The active project (ssr_project cookie), or the newest store in the company.
  const storeRow = await resolveActiveStore<Parameters<typeof mapStoreWithRelations>[0] & { id: string }>("*");
  if (!storeRow) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeRow.id)
    .order("created_at", { ascending: false });

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("store_id", storeRow.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return mapStoreWithRelations(
    storeRow,
    profile,
    email,
    products || [],
    orders || []
  );
}

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

export async function getOnboardingIntent(): Promise<Partial<OnboardingData>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const meta = user.user_metadata?.onboarding as Partial<OnboardingData> | undefined;
  if (meta?.goal) return meta;

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_data")
    .eq("id", user.id)
    .maybeSingle();

  return (profile?.onboarding_data as Partial<OnboardingData>) || {};
}
