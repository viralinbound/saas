import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { resolveActiveStoreId } from "@/lib/activeStore";
import { planFeatures } from "@/lib/plan";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getCurrentOrg();
  const maxDays = planFeatures(org?.plan).analyticsDays;

  const asked = Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 14);
  const days = Math.min(asked, maxDays);

  const storeId = await resolveActiveStoreId();
  const { data, error } = await supabase.rpc("store_analytics", { p_days: days, p_store_id: storeId });
  if (error) {
    const msg = error.message.includes("NO_STORE") ? "No store yet" : error.message;
    return NextResponse.json({ error: msg }, { status: 404 });
  }
  return NextResponse.json({ ...data, maxDays });
}
