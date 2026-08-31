import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, getRoleInOrg } from "@/lib/org";
import { planGate } from "@/lib/plan";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, phone, created_at, onboarding_data")
    .eq("id", user.id)
    .maybeSingle();

  const org = await getCurrentOrg();
  const role = org ? await getRoleInOrg(org.id) : null;

  let stores: { id: string; name: string; slug: string; status: string }[] = [];
  let memberCount = 0;
  if (org) {
    const { data: s } = await supabase
      .from("stores")
      .select("id, name, slug, status")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: true });
    stores = s || [];
    const { count } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id);
    memberCount = count || 0;
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.name || user.email?.split("@")[0] || "Merchant",
      phone: profile?.phone ?? user.phone ?? "",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      emailConfirmed: !!user.email_confirmed_at,
      provider: user.app_metadata?.provider ?? "email",
    },
    org: org
      ? {
          id: org.id,
          name: org.name,
          slug: org.slug,
          legalName: org.legalName,
          gstin: org.gstin,
          phone: org.phone,
          email: org.email,
          city: org.city,
          state: org.state,
          pincode: org.pincode,
          plan: org.plan,
          planStatus: org.planStatus,
          role,
          memberCount,
          createdAt: org.createdAt,
        }
      : null,
    gate: planGate(org?.plan),
    stores,
  });
}

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  phone: z.string().max(20).optional(),
});

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = patchSchema.parse(await req.json());
    const patch: Record<string, string | null> = {};
    if (body.name !== undefined) patch.name = body.name.trim();
    if (body.phone !== undefined) patch.phone = body.phone.trim() || null;

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select("id, name, phone")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // keep auth metadata in sync (best effort)
    await supabase.auth.updateUser({ data: { name: patch.name ?? undefined, phone: patch.phone ?? undefined } }).catch(() => {});

    return NextResponse.json({ ok: true, profile: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
