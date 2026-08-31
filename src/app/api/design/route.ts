import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { coerceConfig, coerceTokens } from "@/lib/customization";
import { getCurrentOrg } from "@/lib/org";
import { resolveActiveStore } from "@/lib/activeStore";
import { brandedHost } from "@/lib/domains";
import { planGate, canUseTemplate } from "@/lib/plan";

type StoreRow = {
  id: string; name: string; slug: string; subdomain: string | null; host_path: string | null;
  status: string; template_key: string | null; theme: string; plan: string; custom_domain: string | null;
};

/** The caller's *active* project (ssr_project cookie, else newest store). */
async function currentStore(_supabase: Awaited<ReturnType<typeof createClient>>) {
  return resolveActiveStore<StoreRow>(
    "id, name, slug, subdomain, host_path, status, template_key, theme, plan, custom_domain"
  );
}

export async function GET() {
  const supabase = await createClient();
  const store = await currentStore(supabase);
  if (!store) return NextResponse.json({ error: "No store" }, { status: 404 });

  const { data: cust } = await supabase
    .from("store_customizations")
    .select("*")
    .eq("store_id", store.id)
    .maybeSingle();

  const { data: templatesRaw } = await supabase
    .from("templates")
    .select("key, name, category, thumbnail_url, accent_color, announcement, min_plan, tier_label, is_premium")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const org = await getCurrentOrg();
  const activePlan = org?.plan ?? store.plan;
  const gate = planGate(activePlan);

  const templates = (templatesRaw || []).map((t) => ({
    key: t.key,
    name: t.name,
    category: t.category,
    thumbnail_url: t.thumbnail_url,
    accent_color: t.accent_color,
    announcement: t.announcement,
    minPlan: t.min_plan as string,
    tierLabel: (t.tier_label as string) ?? null,
    isPremium: !!t.is_premium,
    locked: !canUseTemplate(activePlan, t.min_plan as string),
  }));

  const s = store as { host_path?: string; subdomain?: string; custom_domain?: string; slug: string };
  // hosted path = company-slug / project-slug
  const companyPath = s.host_path && s.host_path.includes("/") ? s.host_path : `${org?.slug ?? "store"}/${s.slug}`;
  const brand = s.subdomain || s.slug;

  return NextResponse.json({
    store: {
      ...store,
      customDomain: s.custom_domain ?? null,
      hostPath: companyPath,
      hostedPath: `/${companyPath}`,
      brandedHost: brandedHost(brand),
    },
    draftConfig: coerceConfig(cust?.draft_config, store.name),
    publishedConfig: cust?.published_config ?? null,
    tokens: coerceTokens(cust?.theme_tokens),
    templateKey: cust?.template_key ?? store.template_key ?? store.theme ?? "fashion",
    publishedAt: cust?.published_at ?? null,
    templates,
    gate,
  });
}

const putSchema = z.object({
  draftConfig: z.object({ sections: z.array(z.any()) }),
  tokens: z.record(z.any()).optional(),
  templateKey: z.string().optional(),
});

export async function PUT(req: Request) {
  const supabase = await createClient();
  const store = await currentStore(supabase);
  if (!store) return NextResponse.json({ error: "No store" }, { status: 404 });

  try {
    const body = putSchema.parse(await req.json());
    const { data, error } = await supabase.rpc("save_store_draft", {
      p_store_id: store.id,
      p_draft_config: body.draftConfig,
      p_theme_tokens: body.tokens ?? null,
      p_template_key: body.templateKey ?? null,
    });
    if (error) {
      const msg = error.message.includes("FORBIDDEN") ? "You don't have access to this store." : error.message;
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ ok: true, saved: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
