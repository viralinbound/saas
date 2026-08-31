import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ token: z.string().min(10) });

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { token } = schema.parse(await req.json());
    const { data, error } = await supabase.rpc("accept_org_invite", { p_token: token });
    if (error) {
      const msg = error.message.includes("INVITE_INVALID_OR_EXPIRED")
        ? "This invite link is invalid or has expired."
        : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
