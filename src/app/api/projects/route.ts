import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { slugify, getTheme } from "@/lib/constants";
import { seedStoreDefaults } from "@/lib/store-setup";
import { toStoreInsert } from "@/lib/db-mapper";
import { buildTemplateConfig } from "@/lib/templatePresets";
import { ACTIVE_STORE_COOKIE } from "@/lib/activeStore";
import { brandedHost } from "@/lib/domains";

async function base() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const org = await getCurrentOrg();
  if (!org) return null;
  return { supabase, user, org };
}

function shape(s: Record<string, unknown>, orgSlug: string) {
  const brand = (s.subdomain as string) || (s.slug as string);
  const hp = s.host_path as string | null;
  const companyPath = hp && hp.includes("/") ? hp : `${orgSlug || "store"}/${s.slug}`;
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    status: s.status,
    plan: s.plan,
    theme: s.theme,
    templateKey: s.template_key ?? s.theme,
    brand,
    hostPath: companyPath,
    hostedPath: `/${companyPath}`,
    brandedHost: brandedHost(brand),
    customDomain: s.custom_domain ?? null,
    createdAt: s.created_at,
  };
}

export async function GET() {
  const c = await base();
  if (!c) return NextResponse.json({ error: "No company" }, { status: 404 });

  const { data: stores } = await c.supabase
    .from("stores")
    .select("id, name, slug, status, plan, theme, template_key, subdomain, host_path, custom_domain, created_at")
    .eq("organization_id", c.org.id)
    .order("created_at", { ascending: true });

  const jar = await cookies();
  const pinned = jar.get(ACTIVE_STORE_COOKIE)?.value;
  const list = (stores ?? []).map((s) => shape(s, c.org.slug));
  const activeId = list.find((p) => p.id === pinned)?.id ?? list[list.length - 1]?.id ?? null;

  // per-project stats
  const withStats = await Promise.all(
    list.map(async (p) => {
      const [ord, rev, prod, views] = await Promise.all([
        c.supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_id", p.id),
        c.supabase.from("orders").select("total").eq("store_id", p.id),
        c.supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", p.id).eq("published", true),
        c.supabase.from("storefront_events").select("id", { count: "exact", head: true }).eq("store_id", p.id).eq("event_type", "page_view"),
      ]);
      const revenue = ((rev.data as { total: number }[] | null) ?? []).reduce((s, r) => s + (r.total || 0), 0);
      return { ...p, stats: { orders: ord.count ?? 0, revenue, products: prod.count ?? 0, views: views.count ?? 0 } };
    })
  );

  return NextResponse.json({ projects: withStats, activeId });
}

const createSchema = z.object({
  name: z.string().min(2).max(60),
  theme: z.enum(["fashion", "bakery", "skincare", "kirana", "tech", "jewels"]).default("fashion"),
});

export async function POST(req: Request) {
  const c = await base();
  if (!c) return NextResponse.json({ error: "No company" }, { status: 404 });

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // unique slug within the whole app
  let slug = slugify(body.name);
  for (let i = 0; i < 6; i++) {
    const { data: ok } = await c.supabase.rpc("is_slug_available", { p_slug: slug });
    if (ok) break;
    slug = `${slugify(body.name)}-${Math.random().toString(36).slice(2, 5)}`;
  }

  const theme = getTheme(body.theme);
  const { data: storeRow, error } = await c.supabase
    .from("stores")
    .insert(
      toStoreInsert({
        ownerId: c.user.id,
        organizationId: c.org.id,
        name: body.name,
        slug,
        industry: body.theme,
        theme: body.theme,
        plan: c.org.plan ?? "free",
        templateKey: body.theme,
        customDomain: null,
        status: "draft",
        accentColor: theme.accent,
      })
    )
    .select()
    .single();

  if (error || !storeRow) {
    return NextResponse.json({ error: error?.message || "Could not create project" }, { status: 400 });
  }

  await seedStoreDefaults(storeRow.id, body.theme);
  const built = buildTemplateConfig(body.theme, body.name);
  await c.supabase.rpc("save_store_draft", {
    p_store_id: storeRow.id,
    p_draft_config: built?.config ?? { sections: [] },
    p_theme_tokens: built?.tokens ?? { accent: theme.accent },
    p_template_key: body.theme,
  });

  const jar = await cookies();
  jar.set(ACTIVE_STORE_COOKIE, storeRow.id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  return NextResponse.json({ ok: true, project: shape(storeRow, c.org.slug), activeId: storeRow.id });
}

// switch the active project
const switchSchema = z.object({ id: z.string().uuid() });
export async function PUT(req: Request) {
  const c = await base();
  if (!c) return NextResponse.json({ error: "No company" }, { status: 404 });

  let body: z.infer<typeof switchSchema>;
  try {
    body = switchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: hit } = await c.supabase
    .from("stores")
    .select("id")
    .eq("id", body.id)
    .eq("organization_id", c.org.id)
    .maybeSingle();
  if (!hit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const jar = await cookies();
  jar.set(ACTIVE_STORE_COOKIE, hit.id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return NextResponse.json({ ok: true, activeId: hit.id });
}

// rename / set custom domain on a project
const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(60).optional(),
  customDomain: z.string().max(120).optional(),
});
export async function PATCH(req: Request) {
  const c = await base();
  if (!c) return NextResponse.json({ error: "No company" }, { status: 404 });

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.customDomain !== undefined) {
    patch.custom_domain = body.customDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || null;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data, error } = await c.supabase
    .from("stores")
    .update(patch)
    .eq("id", body.id)
    .eq("organization_id", c.org.id)
    .select("id, name, slug, status, plan, theme, template_key, subdomain, host_path, custom_domain, created_at")
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: error?.message || "Not found" }, { status: 400 });
  return NextResponse.json({ ok: true, project: shape(data, c.org.slug) });
}
