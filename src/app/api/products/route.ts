import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getPlanLimit } from "@/lib/constants";
import { mapProduct, toProductInsert } from "@/lib/db-mapper";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().nullish(),
  price: z.number().int().positive(),
  mrp: z.number().int().nullish(),
  image: z.string().nullish(),
  category: z.string().nullish(),
  stock: z.number().int().nullish(),
  sku: z.string().nullish(),
  variants: z.string().nullish(),
  published: z.boolean().optional(),
});

async function getOwnedStore(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await getOwnedStore(supabase, user.id);
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id);

  const limit = getPlanLimit(store.plan);
  if ((count || 0) >= limit) {
    return NextResponse.json(
      { error: `Product limit reached (${limit}). Upgrade your plan to add more.` },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const { data: product, error } = await supabase
      .from("products")
      .insert(
        toProductInsert({
          storeId: store.id,
          name: data.name,
          description: data.description,
          price: data.price,
          mrp: data.mrp,
          image: data.image,
          category: data.category,
          stock: data.stock,
          sku: data.sku,
          variants: data.variants,
          published: data.published,
        })
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ product: mapProduct(product) });
  } catch (e) {
    const msg =
      e instanceof z.ZodError
        ? e.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")
        : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await getOwnedStore(supabase, user.id);
  if (!store) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ products: (products || []).map(mapProduct) });
}
