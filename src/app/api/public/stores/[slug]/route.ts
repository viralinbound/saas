import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapProduct, mapStore } from "@/lib/db-mapper";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: storeRow } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!storeRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (storeRow.status !== "live") {
    return NextResponse.json(
      {
        error: "Store not published",
        store: { name: storeRow.name, slug: storeRow.slug, status: storeRow.status },
      },
      { status: 403 }
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeRow.id)
    .eq("published", true)
    .gt("stock", 0)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    store: { ...mapStore(storeRow), products: (products || []).map(mapProduct) },
  });
}
