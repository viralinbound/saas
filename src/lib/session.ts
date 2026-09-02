import { cache } from "react";
import { headers } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

/** The fields of the auth user that server code actually reads. */
export type SessionUser = Pick<User, "id" | "email" | "phone" | "user_metadata">;

/**
 * The verified auth user for the CURRENT request.
 *
 * `supabase.auth.getUser()` is a network round-trip to Supabase Auth. The
 * middleware has already made that call and, on success, forwarded the verified
 * id / email / phone as `x-ssr-*` request headers (which it also strips from
 * client input). When those are present we trust them and skip the round-trip
 * entirely; otherwise we fall back to calling Auth directly.
 *
 * `cache()` still dedupes to one resolution per request-render.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const h = await headers();
    const uid = h.get("x-ssr-uid");
    if (uid) {
      return {
        id: uid,
        email: h.get("x-ssr-email") || undefined,
        phone: h.get("x-ssr-phone") || undefined,
        user_metadata: {},
      };
    }
  } catch {
    // headers() unavailable (e.g. outside a request scope) — fall through.
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
