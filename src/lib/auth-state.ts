import { createClient } from "./supabase/server";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export type AuthOrg = {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "admin" | "staff" | "viewer" | null;
  plan: string;
  isDemo: boolean;
};

export type AuthState = {
  user: AuthUser | null;
  store: { id: string; name: string; slug: string; status: string; plan: string } | null;
  org: AuthOrg | null;
};

export async function getAuthState(): Promise<AuthState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, store: null, org: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const authUser: AuthUser = {
    id: user.id,
    name: profile?.name || user.user_metadata?.name || user.email?.split("@")[0] || "Merchant",
    email: user.email || profile?.phone || user.phone || "",
    phone: profile?.phone ?? user.phone ?? null,
  };

  // Company + role (first org the user belongs to).
  let org: AuthOrg | null = null;
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (membership) {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, name, slug, plan, is_demo")
      .eq("id", membership.organization_id)
      .maybeSingle();
    if (orgRow) {
      org = {
        id: orgRow.id,
        name: orgRow.name,
        slug: orgRow.slug,
        role: membership.role as AuthOrg["role"],
        plan: orgRow.plan || "free",
        isDemo: !!orgRow.is_demo,
      };
    }
  }

  let storeQuery = supabase
    .from("stores")
    .select("id, name, slug, status, plan")
    .order("created_at", { ascending: false })
    .limit(1);
  storeQuery = org ? storeQuery.eq("organization_id", org.id) : storeQuery.eq("owner_id", user.id);
  const { data: store } = await storeQuery.maybeSingle();

  return { user: authUser, store: store || null, org };
}
