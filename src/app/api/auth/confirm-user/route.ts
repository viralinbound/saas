import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

// Instantly marks a just-signed-up user's email as confirmed, so there is no
// verification step. No-op (ok:false) unless SUPABASE_SECRET_KEY is set — in
// that case just turn OFF "Confirm email" in the Supabase dashboard instead.
const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ ok: false, reason: "no_service_key" });
  }

  try {
    const { email } = schema.parse(await req.json());
    const lower = email.trim().toLowerCase();

    // find the user by email
    let userId: string | null = null;
    for (let page = 1; page <= 10 && !userId; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      const u = data.users.find((x) => x.email?.toLowerCase() === lower);
      if (u) userId = u.id;
      if (data.users.length < 200) break;
    }
    if (!userId) return NextResponse.json({ ok: false, reason: "not_found" });

    const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (error) return NextResponse.json({ ok: false, reason: error.message });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" });
  }
}
