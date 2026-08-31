import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  storeSlug: z.string().min(1),
  eventType: z.enum(["page_view", "product_view", "add_to_cart", "begin_checkout"]),
  sessionId: z.string().max(80).optional(),
  path: z.string().max(300).optional(),
  productId: z.string().uuid().optional(),
  referrer: z.string().max(300).optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const body = schema.parse(JSON.parse(raw || "{}"));
    const supabase = await createClient();

    await supabase.rpc("track_event", {
      p_store_slug: body.storeSlug,
      p_session_id: body.sessionId ?? null,
      p_event_type: body.eventType,
      p_path: body.path ?? null,
      p_product_id: body.productId ?? null,
      p_referrer: body.referrer ?? null,
      p_user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // tracking must never surface an error to the storefront
    return NextResponse.json({ ok: false });
  }
}
