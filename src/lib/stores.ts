import { createClient } from "./supabase/server";
import { mapProduct, mapStore } from "./db-mapper";
import type { Product, Store } from "./types";
import { coerceConfig, coerceTokens, type StoreConfig, type ThemeTokens } from "./customization";

export type StorefrontData = {
  store: Store & { products: Product[] };
  config: StoreConfig;
  /** Untouched published_config JSON — lets callers detect a v2 { pages } site. */
  rawConfig: unknown;
  tokens: ThemeTokens;
  demo: boolean;
};

/**
 * Public storefront read. Uses the get_storefront() SECURITY DEFINER RPC so an
 * anonymous visitor gets ONLY the published config + published products of a
 * live store — never draft content or any other company's data.
 */
export async function getStorefront(hostOrSlug: string): Promise<StorefrontData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_storefront", { p_host: hostOrSlug });
  if (error || !data) return null;

  const s = data.store as Record<string, unknown>;
  const rows = (data.products as Record<string, unknown>[]) || [];
  const store: Store & { products: Product[] } = {
    id: s.id as string,
    name: s.name as string,
    slug: s.slug as string,
    industry: (s.industry as string) || "fashion",
    theme: (s.theme as string) || "fashion",
    plan: (s.plan as string) || "free",
    status: "live",
    accentColor: (s.accentColor as string) || "#0052FF",
    currency: (s.currency as string) || "INR",
    customDomain: null,
    ownerId: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    products: rows.map((r) => ({
      id: r.id as string,
      storeId: s.id as string,
      name: r.name as string,
      description: (r.description as string) ?? null,
      price: r.price as number,
      mrp: (r.mrp as number) ?? null,
      image: (r.image as string) ?? null,
      category: (r.category as string) || "all",
      stock: (r.stock as number) ?? 0,
      sku: (r.sku as string) ?? null,
      variants: (r.variants as string) ?? null,
      published: true,
      createdAt: r.created_at ? new Date(r.created_at as string) : new Date(),
    })),
  };

  return {
    store,
    config: coerceConfig(data.config, store.name),
    rawConfig: data.config ?? null,
    tokens: coerceTokens(data.themeTokens),
    demo: !!data.demo,
  };
}

export async function getStoreBySlug(
  slug: string,
  options: { includeProducts: true; liveOnly?: boolean }
): Promise<(Store & { products: Product[] }) | null>;
export async function getStoreBySlug(
  slug: string,
  options?: { liveOnly?: boolean; includeProducts?: false }
): Promise<Store | null>;
export async function getStoreBySlug(
  slug: string,
  options?: { liveOnly?: boolean; includeProducts?: boolean }
): Promise<Store | (Store & { products: Product[] }) | null> {
  const supabase = await createClient();

  let query = supabase.from("stores").select("*").eq("slug", slug);
  if (options?.liveOnly) query = query.eq("status", "live");

  const { data: storeRow } = await query.maybeSingle();
  if (!storeRow) return null;

  const store = mapStore(storeRow);
  if (!options?.includeProducts) return store;

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeRow.id)
    .eq("published", true)
    .gt("stock", 0)
    .order("created_at", { ascending: false });

  return { ...store, products: (products || []).map(mapProduct) };
}

export async function getStoreProduct(slug: string, productId: string) {
  const supabase = await createClient();

  const { data: storeRow } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (!storeRow) return null;

  const { data: productRow } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("store_id", storeRow.id)
    .eq("published", true)
    .maybeSingle();

  if (!productRow) return null;

  return { store: mapStore(storeRow), product: mapProduct(productRow) };
}
