import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ERR: Record<string, string> = {
  WEAK_PASSWORD: "Password must be at least 6 characters.",
  EMAIL_TAKEN: "An account with that email already exists on this store.",
  INVALID_CREDENTIALS: "Wrong email or password.",
  STORE_NOT_FOUND: "Store not found.",
};

const schema = z.object({
  action: z.enum(["register", "login", "logout", "me"]),
  storeSlug: z.string().min(1),
  email: z.string().email().optional(),
  password: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  token: z.string().optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.action === "logout") {
    if (body.token) await supabase.rpc("storefront_logout", { p_token: body.token });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "me") {
    if (!body.token) return NextResponse.json({ customer: null });
    const { data } = await supabase.rpc("storefront_session", { p_token: body.token });
    return NextResponse.json({ customer: data ?? null });
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const rpc =
    body.action === "register"
      ? supabase.rpc("storefront_register", {
          p_slug: body.storeSlug,
          p_email: body.email,
          p_password: body.password,
          p_name: body.name ?? null,
          p_phone: body.phone ?? null,
        })
      : supabase.rpc("storefront_authenticate", {
          p_slug: body.storeSlug,
          p_email: body.email,
          p_password: body.password,
        });

  const { data, error } = await rpc;
  if (error) {
    const key = Object.keys(ERR).find((k) => error.message.includes(k));
    return NextResponse.json({ error: key ? ERR[key] : "Could not complete that." }, { status: 400 });
  }
  return NextResponse.json(data);
}
