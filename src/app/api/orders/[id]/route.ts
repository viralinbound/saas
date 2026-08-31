import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapOrder } from "@/lib/db-mapper";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!store) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("store_id", store.id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { status } = await req.json();
  const { data: updated, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("*, order_items(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ order: mapOrder(updated) });
}
