import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { resolveActiveStoreId } from "@/lib/activeStore";
import { planFeatures } from "@/lib/plan";

async function ctx() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const org = await getCurrentOrg();
  if (!org) return null;
  const storeId = await resolveActiveStoreId();
  if (!storeId) return null;
  return { supabase, org, storeId };
}

const fieldSchema = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(80),
  type: z.enum(["text", "textarea", "number", "email", "phone", "date", "checkbox"]),
});
const bodySchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1).max(40).regex(/^[a-z0-9-]+$/, "lowercase, digits, dashes"),
  name: z.string().min(1).max(80),
  fields: z.array(fieldSchema).max(24),
  allowPublicSubmit: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  requireLogin: z.boolean().optional(),
});

export async function GET() {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "No store" }, { status: 404 });

  const enabled = planFeatures(c.org.plan).dataCollections;
  const { data: collections } = await c.supabase
    .from("store_collections")
    .select("id, key, name, fields, allow_public_submit, is_public, require_login, created_at")
    .eq("store_id", c.storeId)
    .order("created_at", { ascending: true });

  // record counts
  const withCounts = await Promise.all(
    (collections || []).map(async (col) => {
      const { count } = await c.supabase
        .from("store_collection_records")
        .select("id", { count: "exact", head: true })
        .eq("collection_id", col.id);
      return { ...col, recordCount: count ?? 0 };
    })
  );

  return NextResponse.json({ enabled, plan: c.org.plan, collections: withCounts });
}

export async function POST(req: Request) {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "No store" }, { status: 404 });
  if (!planFeatures(c.org.plan).dataCollections) {
    return NextResponse.json({ error: "Upgrade to Pro to create data collections." }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  const row = {
    store_id: c.storeId,
    organization_id: c.org.id,
    key: body.key,
    name: body.name,
    fields: body.fields,
    allow_public_submit: body.allowPublicSubmit ?? true,
    is_public: body.isPublic ?? true,
    require_login: body.requireLogin ?? false,
    updated_at: new Date().toISOString(),
  };

  const q = body.id
    ? c.supabase.from("store_collections").update(row).eq("id", body.id).eq("store_id", c.storeId).select().maybeSingle()
    : c.supabase.from("store_collections").insert(row).select().maybeSingle();

  const { data, error } = await q;
  if (error) {
    const msg = error.code === "23505" ? "A collection with that key already exists." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true, collection: data });
}

export async function DELETE(req: Request) {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "No store" }, { status: 404 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await c.supabase
    .from("store_collections")
    .delete()
    .eq("id", id)
    .eq("store_id", c.storeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
