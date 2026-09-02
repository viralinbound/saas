import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-less Supabase client for PUBLIC, anonymous reads (published storefronts).
 *
 * The storefront read goes through the `get_storefront` SECURITY DEFINER RPC and
 * never depends on the visitor's session — so it must not touch `cookies()`.
 * Avoiding `cookies()` is also what lets the storefront routes be statically
 * cached / ISR'd instead of dynamically rendered on every visit.
 */
export function publicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}
