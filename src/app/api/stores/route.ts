import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify, getTheme } from "@/lib/constants";
import { seedStoreDefaults } from "@/lib/store-setup";
import { mapStore, toStoreInsert } from "@/lib/db-mapper";
import { getCurrentOrg, mapOrg } from "@/lib/org";
import { defaultConfigFor } from "@/lib/customization";
import { buildTemplateConfig } from "@/lib/templatePresets";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(3).max(48),
  industry: z.string().default("fashion"),
  theme: z.string().default("fashion"),
  plan: z.enum(["free", "essential", "pro", "elite", "plus"]).default("free"),
  customDomain: z.string().optional(),
  // optional: caller can name the company here; otherwise the store name is reused
  companyName: z.string().optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const slug = slugify(data.slug);

    const { data: available } = await supabase.rpc("is_slug_available", { p_slug: slug });
    if (!available) {
      return NextResponse.json({ error: "Store URL already taken" }, { status: 409 });
    }

    // ── Ensure the caller has a company (tenant). Create one if missing. ──
    let org = await getCurrentOrg();
    if (!org) {
      const companyName = data.companyName || data.name;
      let orgSlug = slugify(companyName);
      let attempt = 0;
      // create_organization raises ORG_SLUG_TAKEN — retry with a suffix
      while (attempt < 5) {
        const { data: created, error: orgErr } = await supabase.rpc("create_organization", {
          p_name: companyName,
          p_slug: attempt === 0 ? orgSlug : `${orgSlug}-${Math.random().toString(36).slice(2, 6)}`,
          p_details: { email: user.email ?? null, country: "IN" },
        });
        if (!orgErr && created) {
          org = mapOrg(created);
          break;
        }
        if (orgErr && !orgErr.message.includes("ORG_SLUG_TAKEN")) {
          return NextResponse.json({ error: orgErr.message }, { status: 400 });
        }
        attempt++;
      }
      if (!org) return NextResponse.json({ error: "Could not create company" }, { status: 400 });
      void orgSlug;
    }

    const { data: storeRow, error } = await supabase
      .from("stores")
      .insert(
        toStoreInsert({
          ownerId: user.id,
          organizationId: org.id,
          name: data.name,
          slug,
          industry: data.industry,
          theme: data.theme,
          plan: data.plan,
          templateKey: data.theme,
          customDomain: data.customDomain || null,
          // Free = demo mode: edit + preview only. A live storefront needs a paid plan.
          status: "draft",
          accentColor: getTheme(data.theme).accent,
        })
      )
      .select()
      .single();

    if (error || !storeRow) {
      return NextResponse.json({ error: error?.message || "Could not create store" }, { status: 400 });
    }

    await seedStoreDefaults(storeRow.id, data.theme);

    // Seed the storefront draft from the chosen template's full preset — copy,
    // palette and fonts — so /app/design opens with that template already
    // applied (same as clicking it in the picker).
    const theme = getTheme(data.theme);
    const preset = buildTemplateConfig(data.theme, data.name);
    await supabase.rpc("save_store_draft", {
      p_store_id: storeRow.id,
      p_draft_config: preset?.config ?? defaultConfigFor(data.name, theme.announcement, theme.hero),
      p_theme_tokens: preset?.tokens ?? { accent: theme.accent },
      p_template_key: data.theme,
    });

    return NextResponse.json({ ok: true, store: mapStore(storeRow), org: { id: org.id, slug: org.slug } });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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

  // Scope to the caller's company explicitly — the stores SELECT policy also
  // exposes any status='live' store for public storefronts.
  const org = await getCurrentOrg();
  let q = supabase.from("stores").select("*").order("created_at", { ascending: false });
  q = org ? q.eq("organization_id", org.id) : q.eq("owner_id", user.id);
  const { data: stores } = await q;

  return NextResponse.json({ stores: (stores || []).map(mapStore) });
}
