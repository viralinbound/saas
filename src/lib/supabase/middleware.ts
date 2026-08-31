import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasStore = false;
  if (user) {
    // A store this user owns…
    const { data: owned } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();
    hasStore = !!owned;

    // …or a store in a company they belong to (team members, or created via RPC).
    if (!hasStore) {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (membership) {
        const { data: orgStore } = await supabase
          .from("stores")
          .select("id")
          .eq("organization_id", membership.organization_id)
          .limit(1)
          .maybeSingle();
        hasStore = !!orgStore;
      }
    }
  }

  return { supabaseResponse, user, hasStore };
}
