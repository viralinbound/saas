import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, mapOrg } from "@/lib/org";
import { slugify } from "@/lib/constants";

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).max(48).optional(),
  legalName: z.string().optional(),
  gstin: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  onboarding: z.record(z.any()).optional(),
});

const patchSchema = createSchema.partial().omit({ slug: true });

export async function GET() {
  const org = await getCurrentOrg();
  return NextResponse.json({ org });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Idempotent: if the caller already has an org, return it.
  const existing = await getCurrentOrg();
  if (existing) return NextResponse.json({ org: existing, existed: true });

  try {
    const body = createSchema.parse(await req.json());
    const slug = slugify(body.slug || body.name);

    const { data, error } = await supabase.rpc("create_organization", {
      p_name: body.name,
      p_slug: slug,
      p_details: {
        legalName: body.legalName ?? null,
        gstin: body.gstin ?? null,
        email: body.email || user.email || null,
        phone: body.phone ?? null,
        website: body.website ?? null,
        addressLine1: body.addressLine1 ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        pincode: body.pincode ?? null,
        country: "IN",
        onboarding: body.onboarding ?? {},
      },
    });

    if (error) {
      const msg = error.message.includes("ORG_SLUG_TAKEN")
        ? "That company URL is taken — try another."
        : error.message.includes("INVALID_SLUG")
          ? "Company URL is invalid."
          : error.message;
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    return NextResponse.json({ org: mapOrg(data) });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const org = await getCurrentOrg();
  if (!org) return NextResponse.json({ error: "No company" }, { status: 404 });

  try {
    const body = patchSchema.parse(await req.json());
    const patch: Record<string, string | null> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.legalName !== undefined) patch.legal_name = body.legalName || null;
    if (body.gstin !== undefined) patch.gstin = body.gstin || null;
    if (body.email !== undefined) patch.email = body.email || null;
    if (body.phone !== undefined) patch.phone = body.phone || null;
    if (body.website !== undefined) patch.website = body.website || null;
    if (body.addressLine1 !== undefined) patch.address_line1 = body.addressLine1 || null;
    if (body.city !== undefined) patch.city = body.city || null;
    if (body.state !== undefined) patch.state = body.state || null;
    if (body.pincode !== undefined) patch.pincode = body.pincode || null;

    const { data, error } = await supabase
      .from("organizations")
      .update(patch)
      .eq("id", org.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ org: mapOrg(data) });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
