import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") || "") as EmailOtpType | "recovery" | "";
  const next = searchParams.get("next") || "";

  const supabase = await createClient();

  let exchangeError: string | null = null;

  if (tokenHash && type) {
    // New Supabase email templates: verify the OTP token hash.
    const { error } = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash });
    exchangeError = error?.message ?? null;
  } else if (code) {
    // PKCE flow.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error?.message ?? null;
  } else {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("This link is invalid or has expired")}`);
  }

  if (exchangeError) {
    // The PKCE "code verifier not found" case: the link was opened in a
    // different browser/device than the one that started the flow.
    const friendly = /code verifier|verifier not found/i.test(exchangeError)
      ? "That link must be opened in the same browser you started from. Request a new link below."
      : exchangeError;
    const url = new URL(`${origin}/login`);
    url.searchParams.set("error", friendly);
    return NextResponse.redirect(url);
  }

  // Password recovery → send to the change-password screen on /login.
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/login?recovery=1`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // Fresh sign-up confirmation (or any user without a store) → onboarding.
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  let hasStore = false;
  if (membership) {
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("organization_id", membership.organization_id)
      .limit(1)
      .maybeSingle();
    hasStore = !!store;
  }

  const dest = hasStore ? (next || "/app/design") : "/onboarding";
  return NextResponse.redirect(`${origin}${dest}`);
}
