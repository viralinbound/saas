// New stores start with an EMPTY catalogue — merchants add their own products.
// Template previews still look full: they use src/lib/demoProducts.ts, and the
// draft preview falls back to that sample catalogue when a store has 0 products.
//
// Kept as a named export so existing call-sites keep working; it no longer
// inserts anything. Pass `withSamples: true` to opt in (used by a future
// "load sample products" button).
import { createClient } from "./supabase/server";
import { getSampleProducts } from "./theme-data";

export async function seedStoreDefaults(
  storeId: string,
  themeKey: string,
  opts: { withSamples?: boolean } = {}
): Promise<void> {
  if (!opts.withSamples) return;

  const supabase = await createClient();
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", storeId);
  if (count && count > 0) return;

  const samples = getSampleProducts(themeKey);
  const rows = samples.map((sample) => ({
    store_id: storeId,
    name: sample.name,
    description: sample.description,
    price: sample.price,
    mrp: sample.mrp,
    image: sample.image,
    category: sample.category,
    variants: sample.variants,
    stock: 100,
    published: true,
  }));
  await supabase.from("products").insert(rows);
}
