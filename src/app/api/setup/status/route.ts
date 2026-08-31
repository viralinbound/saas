import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const checks: Record<string, boolean | string> = {
    connected: false,
    profiles: false,
    stores: false,
    products: false,
    orders: false,
    order_items: false,
    is_slug_available: false,
    place_order: false,
  };

  try {
    const { error: profilesErr } = await supabase.from("profiles").select("id").limit(1);
    checks.profiles = !profilesErr;
    checks.connected = true;

    const { error: storesErr } = await supabase.from("stores").select("id").limit(1);
    checks.stores = !storesErr;

    const { error: productsErr } = await supabase.from("products").select("id").limit(1);
    checks.products = !productsErr;

    const { error: ordersErr } = await supabase.from("orders").select("id").limit(1);
    checks.orders = !ordersErr;

    const { error: itemsErr } = await supabase.from("order_items").select("id").limit(1);
    checks.order_items = !itemsErr;

    const { error: slugErr } = await supabase.rpc("is_slug_available", { p_slug: "__test__" });
    checks.is_slug_available = !slugErr;

    checks.place_order = checks.stores && checks.products && checks.orders;
  } catch (e) {
    checks.error = e instanceof Error ? e.message : "Unknown error";
  }

  const ready = Object.entries(checks)
    .filter(([k]) => !["connected", "error", "place_order"].includes(k))
    .every(([, v]) => v === true);

  return NextResponse.json({ ready, checks });
}
