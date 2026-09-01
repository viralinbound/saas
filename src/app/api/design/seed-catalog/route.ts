import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveActiveStore } from "@/lib/activeStore";
import { layoutSampleProductRows } from "@/lib/layoutCommerce";

/**
 * Fill the active store's catalogue with its template's products, saved to
 * Supabase. Body: { key?: string, replace?: boolean }.
 *   - default            → only seed when the catalogue is empty
 *   - replace: true      → delete every product first, then seed the template's
 * `key` overrides the store's template_key (used when switching templates).
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const store = await resolveActiveStore<{ id: string; template_key: string | null; theme: string | null }>(
    "id, template_key, theme"
  );
  if (!store) return NextResponse.json({ error: "No store" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { key?: string; replace?: boolean };
  const key = body.key || store.template_key || store.theme || "fashion";

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id);

  if (count && count > 0) {
    if (!body.replace) {
      return NextResponse.json({ ok: true, added: 0, note: "catalogue already has products" });
    }
    await supabase.from("products").delete().eq("store_id", store.id);
  }

  const rows = layoutSampleProductRows(key, store.id);
  const { error } = await supabase.from("products").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, added: rows.length, replaced: !!(count && body.replace) });
}
