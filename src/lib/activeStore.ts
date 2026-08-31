import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import { getCurrentOrg } from "./org";
import { getSessionUser } from "./session";

export const ACTIVE_STORE_COOKIE = "ssr_project";

/**
 * The caller's *active* store — the one the dashboard is currently pointed at.
 * Honours the `ssr_project` cookie (set by the project switcher); falls back to
 * the most recently created store in the company. `null` when the user has none.
 *
 * `select` is passed straight to PostgREST so callers ask for exactly the
 * columns they need.
 */
// Cached per `select` string, deduped for the whole request.
const resolveActiveStoreRaw = cache(async (select: string): Promise<Record<string, unknown> | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();

  const org = await getCurrentOrg();
  let q = supabase.from("stores").select(select).order("created_at", { ascending: false });
  q = org ? q.eq("organization_id", org.id) : q.eq("owner_id", user.id);

  const { data: stores } = await q;
  const list = (stores ?? []) as unknown as Array<{ id: string } & Record<string, unknown>>;
  if (!list.length) return null;

  const jar = await cookies();
  const pinned = jar.get(ACTIVE_STORE_COOKIE)?.value;
  if (pinned) {
    const hit = list.find((s) => s.id === pinned);
    if (hit) return hit;
  }
  return list[0];
});

export async function resolveActiveStore<T = Record<string, unknown>>(
  select = "*"
): Promise<T | null> {
  return (await resolveActiveStoreRaw(select)) as T | null;
}

/** Just the id — convenience for the many resolvers that only need it. */
export async function resolveActiveStoreId(): Promise<string | null> {
  const row = await resolveActiveStore<{ id: string }>("id");
  return row?.id ?? null;
}
