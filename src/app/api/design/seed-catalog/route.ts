import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveActiveStore } from "@/lib/activeStore";
import { layoutSampleProductRows } from "@/lib/layoutCommerce";

/**
 * Fill the active store's catalogue with its template's sample products,
 * saved to Supabase. No-op if the store already has products.
 */
export async function POST() {
  const supabase = await createClient();
  const store = await resolveActiveStore<{ id: string; template_key: string | null; theme: string | null }>(
    "id, template_key, theme"
  );
  if (!store) return NextResponse.json({ error: "No store" }, { status: 404 });

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id);
  if (count && count > 0) {
    return NextResponse.json({ ok: true, added: 0, note: "catalogue already has products" });
  }

  const rows = layoutSampleProductRows(store.template_key || store.theme || "fashion", store.id);
  const { error } = await supabase.from("products").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, added: rows.length });
}
