// A new store's catalogue is seeded from its chosen .dc layout's products
// (src/lib/layoutPreviews.ts → LAYOUTS[key].products), written to Supabase so
// the storefront and dashboard have real rows from day one. Pass
// `withSamples: false` to skip.
import { createClient } from "./supabase/server";
import { layoutSampleProductRows } from "./layoutCommerce";

export async function seedStoreDefaults(
  storeId: string,
  themeKey: string,
  opts: { withSamples?: boolean } = {}
): Promise<void> {
  if (opts.withSamples === false) return;

  const supabase = await createClient();
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", storeId);
  if (count && count > 0) return;

  const rows = layoutSampleProductRows(themeKey, storeId);
  if (rows.length) await supabase.from("products").insert(rows);
}
