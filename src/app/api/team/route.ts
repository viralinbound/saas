import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, getRoleInOrg } from "@/lib/org";
import { planFeatures } from "@/lib/plan";

export async function GET() {
  const supabase = await createClient();
  const org = await getCurrentOrg();
  if (!org) return NextResponse.json({ members: [], invites: [], org: null });

  const { data: members } = await supabase
    .from("organization_members")
    .select("id, user_id, role, status, title, created_at")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: true });

  const { data: invites } = await supabase
    .from("organization_invites")
    .select("id, email, role, created_at, expires_at, accepted_at")
    .eq("organization_id", org.id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  const myRole = await getRoleInOrg(org.id);
  const feat = planFeatures(org.plan);
  const used = (members?.length || 0) + (invites?.length || 0);

  return NextResponse.json({
    org: { id: org.id, name: org.name, slug: org.slug, plan: org.plan },
    myRole,
    members: members || [],
    invites: invites || [],
    seats: { limit: feat.teamSeats, used, canInvite: used < feat.teamSeats },
  });
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "staff", "viewer"]).default("staff"),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const org = await getCurrentOrg();
  if (!org) return NextResponse.json({ error: "No company" }, { status: 404 });

  const role = await getRoleInOrg(org.id);
  if (role !== "owner" && role !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can invite teammates." }, { status: 403 });
  }

  // Seat limit per plan
  const feat = planFeatures(org.plan);
  const [{ count: memberCount }, { count: inviteCount }] = await Promise.all([
    supabase.from("organization_members").select("*", { count: "exact", head: true }).eq("organization_id", org.id),
    supabase.from("organization_invites").select("*", { count: "exact", head: true }).eq("organization_id", org.id).is("accepted_at", null),
  ]);
  if ((memberCount || 0) + (inviteCount || 0) >= feat.teamSeats) {
    return NextResponse.json(
      { error: `Your ${feat.label} plan includes ${feat.teamSeats} seat${feat.teamSeats > 1 ? "s" : ""}. Upgrade to add more teammates.` },
      { status: 403 }
    );
  }

  try {
    const body = inviteSchema.parse(await req.json());
    const { data, error } = await supabase
      .from("organization_invites")
      .upsert(
        { organization_id: org.id, email: body.email.toLowerCase(), role: body.role },
        { onConflict: "organization_id,email" }
      )
      .select("id, email, role, token, expires_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.supershowroom.in";
    return NextResponse.json({
      invite: data,
      inviteUrl: `${base}/join?token=${data.token}`,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
