import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/db-mapper";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().int().nonnegative().optional(),
  mrp: z.number().int().nonnegative().nullable().optional(),
  image: z.string().nullable().optional(),
  category: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
  sku: z.string().nullable().optional(),
  variants: z.string().nullable().optional(),
  published: z.boolean().optional(),
});

async function ownedStoreIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string[]> {
  const { data } = await supabase.from("stores").select("id").eq("owner_id", userId);
  return (data ?? []).map((r) => r.id as string);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeIds = await ownedStoreIds(supabase, user.id);
  if (storeIds.length === 0) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  let body: unknown;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (v !== undefined) patch[k] = v;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data: product, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .in("store_id", storeIds)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: mapProduct(product) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeIds = await ownedStoreIds(supabase, user.id);
  if (storeIds.length === 0) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .in("store_id", storeIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
