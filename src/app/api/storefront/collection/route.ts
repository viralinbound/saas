import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ERR: Record<string, string> = {
  STORE_NOT_FOUND: "Store not found.",
  COLLECTION_NOT_FOUND: "That collection does not exist.",
  SUBMIT_DISABLED: "This form is not accepting submissions.",
  LOGIN_REQUIRED: "Please sign in before submitting.",
};

export async function GET(req: Request) {
  const supabase = await createClient();
  const url = new URL(req.url);
  const store = url.searchParams.get("store");
  const key = url.searchParams.get("key");
  if (!store || !key) return NextResponse.json({ error: "Missing store or key" }, { status: 400 });

  const { data, error } = await supabase.rpc("collection_view", { p_slug: store, p_key: key });
  if (error) {
    const k = Object.keys(ERR).find((x) => error.message.includes(x));
    return NextResponse.json({ error: k ? ERR[k] : "Could not load collection." }, { status: 400 });
  }
  return NextResponse.json(data);
}

const postSchema = z.object({
  storeSlug: z.string().min(1),
  key: z.string().min(1),
  data: z.record(z.any()),
  token: z.string().optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("collection_submit", {
    p_slug: body.storeSlug,
    p_key: body.key,
    p_data: body.data,
    p_token: body.token ?? null,
  });
  if (error) {
    const k = Object.keys(ERR).find((x) => error.message.includes(x));
    return NextResponse.json({ error: k ? ERR[k] : "Could not submit." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, ...data });
}
