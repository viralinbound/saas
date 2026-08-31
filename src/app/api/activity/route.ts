import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

type Item = { id: string; kind: string; title: string; detail?: string; at: string };

export async function GET() {
  const supabase = await createClient();
  const org = await getCurrentOrg();
  if (!org) return NextResponse.json({ items: [] });

  const items: Item[] = [];

  const { data: pubs } = await supabase
    .from("store_publications")
    .select("id, status, host_type, url, published_at")
    .eq("organization_id", org.id)
    .order("published_at", { ascending: false })
    .limit(6);
  (pubs || []).forEach((p) =>
    items.push({
      id: `pub_${p.id}`,
      kind: p.status === "preview" ? "preview" : p.status === "unpublished" ? "unpublish" : "publish",
      title:
        p.status === "preview"
          ? "Demo preview published"
          : p.status === "unpublished"
            ? "Store unpublished"
            : "Store published live",
      detail: p.url || undefined,
      at: p.published_at as string,
    })
  );

  const { data: plans } = await supabase
    .from("plan_events")
    .select("id, from_plan, to_plan, amount_paise, created_at")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(6);
  (plans || []).forEach((p) =>
    items.push({
      id: `plan_${p.id}`,
      kind: "plan",
      title: `Plan changed: ${p.from_plan ?? "—"} → ${p.to_plan}`,
      detail: p.amount_paise ? `₹${(p.amount_paise / 100).toLocaleString("en-IN")}` : undefined,
      at: p.created_at as string,
    })
  );

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, total, created_at")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(6);
  (orders || []).forEach((o) =>
    items.push({
      id: `ord_${o.id}`,
      kind: "order",
      title: `New order ${o.order_number}`,
      detail: `${o.customer_name} · ₹${((o.total as number) / 100).toLocaleString("en-IN")}`,
      at: o.created_at as string,
    })
  );

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return NextResponse.json({ items: items.slice(0, 12) });
}
