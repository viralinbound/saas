import { cache } from "react";
import { createClient } from "./supabase/server";

/**
 * The verified auth user for the CURRENT request.
 *
 * `supabase.auth.getUser()` is a network round-trip to Supabase Auth. It used to
 * be called 5–6× per page (getCurrentUser, getCurrentStore, getCurrentOrg,
 * resolveActiveStore, getOnboardingIntent, …). `cache()` dedupes it to one call
 * per request-render, which is the single biggest dashboard speed-up.
 */
export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
