import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Request headers the middleware sets from the VERIFIED session so server
 *  components / route handlers can skip a second `supabase.auth.getUser()`
 *  network round-trip. Never trusted from the client — always stripped and
 *  re-set here. See `getSessionUser()`. */
const HINT_HEADERS = ["x-ssr-uid", "x-ssr-email", "x-ssr-phone"] as const;

export async function updateSession(
  request: NextRequest,
  opts: { wantStore?: boolean } = {}
) {
  // Start from the incoming headers, minus any client-supplied auth hints.
  const requestHeaders = new Headers(request.headers);
  for (const h of HINT_HEADERS) requestHeaders.delete(h);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

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
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
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

  // Forward the verified identity to the downstream render so getSessionUser()
  // doesn't have to call the Auth server a second time.
  if (user) {
    requestHeaders.set("x-ssr-uid", user.id);
    if (user.email) requestHeaders.set("x-ssr-email", user.email);
    if (user.phone) requestHeaders.set("x-ssr-phone", user.phone);
    const withHints = NextResponse.next({ request: { headers: requestHeaders } });
    supabaseResponse.cookies.getAll().forEach((c) => withHints.cookies.set(c));
    supabaseResponse = withHints;
  }

  // `hasStore` costs up to 3 queries and is only read by the auth-page /
  // onboarding / app redirects — skip it for every other request.
  let hasStore = false;
  if (user && opts.wantStore) {
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
