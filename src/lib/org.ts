import { createClient } from "./supabase/server";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  gstin: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
  plan: string;
  planStatus: string;
  createdAt: string;
};

export type Membership = {
  organizationId: string;
  userId: string;
  role: "owner" | "admin" | "staff" | "viewer";
  status: string;
  title: string | null;
};

type DbOrg = Record<string, unknown>;

export function mapOrg(row: DbOrg): Organization {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    legalName: (row.legal_name as string) ?? null,
    gstin: (row.gstin as string) ?? null,
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
    website: (row.website as string) ?? null,
    logoUrl: (row.logo_url as string) ?? null,
    addressLine1: (row.address_line1 as string) ?? null,
    addressLine2: (row.address_line2 as string) ?? null,
    city: (row.city as string) ?? null,
    state: (row.state as string) ?? null,
    pincode: (row.pincode as string) ?? null,
    country: (row.country as string) ?? "IN",
    plan: (row.plan as string) ?? "free",
    planStatus: (row.plan_status as string) ?? "active",
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

/** The caller's memberships, newest org first. Empty array if the org layer isn't provisioned. */
export async function getMemberships(): Promise<Membership[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, user_id, role, status, title, organizations(created_at)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error || !data) return [];
  return data.map((m) => ({
    organizationId: m.organization_id as string,
    userId: m.user_id as string,
    role: m.role as Membership["role"],
    status: m.status as string,
    title: (m.title as string) ?? null,
  }));
}

/** The caller's current (primary) organization, or null if none / not provisioned. */
export async function getCurrentOrg(): Promise<Organization | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships, error: mErr } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (mErr || !memberships || memberships.length === 0) return null;

  const ids = memberships.map((m) => m.organization_id);
  const { data: orgs } = await supabase
    .from("organizations")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: true })
    .limit(1);

  return orgs && orgs[0] ? mapOrg(orgs[0]) : null;
}

export async function getRoleInOrg(orgId: string): Promise<Membership["role"] | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .eq("status", "active")
    .maybeSingle();
  return (data?.role as Membership["role"]) ?? null;
}
