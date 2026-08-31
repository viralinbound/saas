import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { slugify } from "@/lib/constants";

async function orgStore(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const org = await getCurrentOrg();
  if (!org) return null;
  const { data } = await supabase
    .from("stores")
    .select("id, slug, subdomain, status")
    .eq("id", id)
    .eq("organization_id", org.id)
    .maybeSingle();
  return data ? { supabase, store: data } : null;
}

const ERR: Record<string, string> = {
  FORBIDDEN: "You don't have access to this project.",
  SUBDOMAIN_TAKEN: "That address is already in use — pick another.",
  INVALID_SUBDOMAIN: "That address is invalid.",
};

const schema = z.object({ id: z.string().uuid(), subdomain: z.string().min(3).max(48).optional() });

export async function POST(req: Request) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const ctx = await orgStore(body.id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sub = slugify(body.subdomain || ctx.store.subdomain || ctx.store.slug);
  const { data, error } = await ctx.supabase.rpc("publish_store", {
    p_store_id: ctx.store.id,
    p_subdomain: sub,
    p_label: null,
  });
  if (error) {
    const k = Object.keys(ERR).find((x) => error.message.includes(x));
    return NextResponse.json({ error: k ? ERR[k] : error.message }, { status: k === "FORBIDDEN" ? 403 : 409 });
  }
  return NextResponse.json({ ok: true, ...data });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const ctx = await orgStore(id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await ctx.supabase.rpc("unpublish_store", { p_store_id: ctx.store.id });
  if (error) {
    const msg = error.message.includes("FORBIDDEN") ? ERR.FORBIDDEN : error.message;
    return NextResponse.json({ error: msg }, { status: 403 });
  }
  return NextResponse.json({ ok: true, ...data });
}
