import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapStore } from "@/lib/db-mapper";

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

  const { id } = await params;
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!store) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { data: updated, error } = await supabase
    .from("stores")
    .update({
      status: body.status ?? store.status,
      theme: body.theme ?? store.theme,
      accent_color: body.accentColor ?? store.accent_color,
      name: body.name ?? store.name,
      currency: body.currency ?? store.currency ?? "INR",
      custom_domain: body.customDomain ?? store.custom_domain,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ store: mapStore(updated) });
}
