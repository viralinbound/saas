import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { resolveActiveStore } from "@/lib/activeStore";
import { mapProduct } from "@/lib/db-mapper";
import { brandedHost } from "@/lib/domains";
import { coerceSite } from "@/lib/builder";
import { planGate } from "@/lib/plan";

type StoreRow = {
  id: string; name: string; slug: string; subdomain: string | null;
  host_path: string | null; status: string; plan: string; accent_color: string;
};

async function currentStore(_supabase: Awaited<ReturnType<typeof createClient>>) {
  return resolveActiveStore<StoreRow>("id, name, slug, subdomain, host_path, status, plan, accent_color");
}

export async function GET() {
  const supabase = await createClient();
  const store = await currentStore(supabase);
  if (!store) return NextResponse.json({ error: "No store" }, { status: 404 });

  const { data: cust } = await supabase
    .from("store_customizations")
    .select("draft_config, published_at")
    .eq("store_id", store.id)
    .maybeSingle();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const org = await getCurrentOrg();
  const brand = store.subdomain || store.host_path || store.slug;

  return NextResponse.json({
    store: {
      id: store.id,
      name: store.name,
      slug: store.slug,
      status: store.status,
      accentColor: store.accent_color,
      brand,
      brandedHost: brandedHost(brand),
    },
    site: coerceSite(cust?.draft_config, store.name),
    products: (products || []).map(mapProduct),
    publishedAt: cust?.published_at ?? null,
    gate: planGate(org?.plan ?? store.plan),
  });
}

const putSchema = z.object({
  site: z.object({
    version: z.literal(2),
    pages: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        path: z.string(),
        blocks: z.array(z.any()),
      })
    ),
  }),
});

export async function PUT(req: Request) {
  const supabase = await createClient();
  const store = await currentStore(supabase);
  if (!store) return NextResponse.json({ error: "No store" }, { status: 404 });

  let body: z.infer<typeof putSchema>;
  try {
    body = putSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid site payload" }, { status: 400 });
  }

  const { error } = await supabase.rpc("save_store_draft", {
    p_store_id: store.id,
    p_draft_config: body.site,
    p_theme_tokens: null,
    p_template_key: null,
  });
  if (error) {
    const msg = error.message.includes("FORBIDDEN") ? "You don't have access to this store." : error.message;
    return NextResponse.json({ error: msg }, { status: 403 });
  }
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
