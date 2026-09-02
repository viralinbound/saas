import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/constants";
import { resolveActiveStore } from "@/lib/activeStore";
import { storefrontTag } from "@/lib/stores";

/** Drop every cached copy of a store's public storefront so a publish /
 *  unpublish shows up on the live site within a second, across all the
 *  addresses a visitor can arrive on (slug, subdomain, clean host path). */
function revalidateStorefront(keys: (string | null | undefined)[], hostPath?: string | null) {
  for (const k of new Set(keys.filter(Boolean) as string[])) revalidateTag(storefrontTag(k));
  const slug = keys.find(Boolean);
  if (slug) revalidatePath(`/s/${slug}`);
  if (hostPath) {
    revalidateTag(storefrontTag(hostPath));
    revalidatePath(`/h/${hostPath}`);
    revalidatePath(`/${hostPath}`);
  }
}

async function currentStore(_supabase: Awaited<ReturnType<typeof createClient>>) {
  return resolveActiveStore<{ id: string; slug: string; subdomain: string | null; status: string }>(
    "id, slug, subdomain, status"
  );
}

const schema = z.object({ subdomain: z.string().min(3).max(48).optional(), label: z.string().optional() });

export async function POST(req: Request) {
  const supabase = await createClient();
  const store = await currentStore(supabase);
  if (!store) return NextResponse.json({ error: "No store" }, { status: 404 });

  let body: z.infer<typeof schema> = {};
  try {
    body = schema.parse(await req.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sub = slugify(body.subdomain || store.subdomain || store.slug);

  const { data, error } = await supabase.rpc("publish_store", {
    p_store_id: store.id,
    p_subdomain: sub,
    p_label: body.label ?? null,
  });

  if (error) {
    const map: Record<string, string> = {
      FORBIDDEN: "You don't have access to this store.",
      SUBDOMAIN_TAKEN: "That address is already in use — pick another.",
      INVALID_SUBDOMAIN: "That address is invalid.",
    };
    const key = Object.keys(map).find((k) => error.message.includes(k));
    return NextResponse.json({ error: key ? map[key] : error.message }, { status: key === "FORBIDDEN" ? 403 : 409 });
  }

  revalidateStorefront([store.slug, store.subdomain, sub], (data as { hostPath?: string })?.hostPath);

  return NextResponse.json({ ok: true, ...data });
}

export async function DELETE() {
  const supabase = await createClient();
  const store = await currentStore(supabase);
  if (!store) return NextResponse.json({ error: "No store" }, { status: 404 });

  const { data, error } = await supabase.rpc("unpublish_store", { p_store_id: store.id });
  if (error) {
    const msg = error.message.includes("FORBIDDEN") ? "You don't have access to this store." : error.message;
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  revalidateStorefront([store.slug, store.subdomain], (data as { hostPath?: string })?.hostPath);

  return NextResponse.json({ ok: true, ...data });
}
