"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthDivider, AuthInput, AuthMessage, authStyles } from "@/components/auth/auth-ui";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { createClient } from "@/lib/supabase/client";
import { formatPhoneDisplay, normalizePhone } from "@/lib/phone";

type Mode = "login" | "signup";
type Method = "password" | "otp";
type Step = "form" | "otp" | "forgot" | "new-password" | "confirm";

// Must match Supabase → Authentication → Sign In / Providers → Email → "Email OTP Length"
const OTP_LENGTH = 8;

export function AuthClient({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app/design";
  const recovery = params.get("recovery") === "1";
  const supabase = createClient();

  const isSignup = mode === "signup";
  const justReset = params.get("reset") === "1";

  const [method, setMethod] = useState<Method>("password");
  const [step, setStep] = useState<Step>(recovery ? "new-password" : "form");
  const [phoneEnabled, setPhoneEnabled] = useState(false);
  const [otpChannel, setOtpChannel] = useState<"email" | "phone">("email");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState(params.get("error") || "");
  const [success, setSuccess] = useState(
    justReset ? "Password changed. Sign in with your new password." : ""
  );
  const [loading, setLoading] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((cfg) => setPhoneEnabled(!!cfg.phone))
      .catch(() => setPhoneEnabled(false));
  }, []);

  // On the "confirm your email" screen, detect when the link has been used
  // (session appears) — but DON'T redirect on our own. Show a Continue button.
  useEffect(() => {
    if (step !== "confirm") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (pollRef.current) clearInterval(pollRef.current);
        setConfirmed(true);
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function afterAuth() {
    // Confirm the session actually landed client-side.
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setError("Signed in, but the session didn't stick. Please try again.");
      return;
    }
    // Hard navigation so the server re-reads the fresh auth cookie.
    // Onboarded users land on the dashboard; new users finish onboarding.
    const me = await fetch("/api/auth/me").then((r) => r.json()).catch(() => ({}));
    window.location.assign(me?.store ? "/app" : "/onboarding");
  }

  async function resendConfirmation() {
    setError("");
    setResendIn(30);
    const { error: e } = await supabase.auth.resend({
      type: "signup",
      email: form.email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    if (e) setError(e.message);
    else setSuccess("Confirmation link re-sent.");
  }

  async function checkConfirmedNow() {
    setLoading(true);
    setError("");
    // Is there already a session (link used in this browser)?
    const existing = await supabase.auth.getSession();
    if (existing.data.session) {
      setLoading(false);
      setConfirmed(true);
      return;
    }
    // Otherwise verify by signing in with the credentials just entered.
    const { data, error: e } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
    setLoading(false);
    if (e || !data.session) {
      setError("Not confirmed yet — click the link in your email first.");
      return;
    }
    setConfirmed(true);
  }

  async function updateProfile(userId: string) {
    try {
      await supabase
        .from("profiles")
        .update({
          name: form.name.trim() || undefined,
          phone: normalizePhone(form.phone) || undefined,
        })
        .eq("id", userId);
    } catch {
      /* optional */
    }
  }

  // ── Password sign in ──────────────────────────────────────────────────
  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const email = form.email.trim().toLowerCase();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: form.password,
    });

    setLoading(false);
    if (signInError) {
      const m = signInError.message.toLowerCase();
      if (m.includes("not confirmed") || m.includes("email not confirmed")) {
        // Take them to the confirm screen so they can resend the link.
        setError("");
        setStep("confirm");
        setResendIn(0);
        return;
      }
      setError(m.includes("invalid login credentials") ? "Invalid email or password" : signInError.message);
      return;
    }
    await afterAuth();
  }

  // ── Sign up with email + password (no OTP, no link when confirm-email is off) ──
  async function signUpWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your name");
      setLoading(false);
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const email = form.email.trim().toLowerCase();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: { data: { name: form.name.trim(), phone: normalizePhone(form.phone) || null } },
    });

    if (signUpError && !/already registered/i.test(signUpError.message)) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    // Confirm-email OFF → session is returned straight away.
    if (data?.session) {
      if (data.user) await updateProfile(data.user.id);
      setLoading(false);
      await afterAuth();
      return;
    }

    // No session → force-confirm the email (server, if a service key is set),
    // then sign in. No verification screen.
    await fetch("/api/auth/confirm-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});

    const { data: si } = await supabase.auth.signInWithPassword({ email, password: form.password });
    setLoading(false);
    if (si?.session) {
      if (si.user) await updateProfile(si.user.id);
      await afterAuth();
      return;
    }
    setError(
      "Account created. If you can't get in, turn off “Confirm email” in Supabase, or sign in from the Log in page."
    );
  }

  // ── OTP send ──────────────────────────────────────────────────────────
  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (isSignup && !form.name.trim()) {
      setError("Please enter your name");
      setLoading(false);
      return;
    }

    if (otpChannel === "email") {
      const email = form.email.trim().toLowerCase();
      if (!email) {
        setError("Please enter your email");
        setLoading(false);
        return;
      }
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // only create a new account from the Sign-up screen
          shouldCreateUser: isSignup,
          data: isSignup ? { name: form.name.trim(), phone: normalizePhone(form.phone) } : undefined,
        },
      });
      setLoading(false);
      if (otpError) {
        setError(otpError.message);
        return;
      }
    } else {
      const phone = normalizePhone(form.phone);
      if (!phone) {
        setError("Enter a valid 10-digit mobile number");
        setLoading(false);
        return;
      }
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: isSignup,
          data: isSignup ? { name: form.name.trim(), email: form.email.trim().toLowerCase() || null } : undefined,
        },
      });
      setLoading(false);
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setVerifiedPhone(phone);
    }

    setStep("otp");
  }

  // ── OTP verify ──────────────────────────────────────────────────────
  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    let result;
    if (otpChannel === "email") {
      result = await supabase.auth.verifyOtp({
        email: form.email.trim().toLowerCase(),
        token: otp.trim(),
        type: "email",
      });
    } else {
      const phone = verifiedPhone || normalizePhone(form.phone);
      if (!phone) {
        setError("Invalid phone number");
        setLoading(false);
        return;
      }
      result = await supabase.auth.verifyOtp({ phone, token: otp.trim(), type: "sms" });
    }

    if (result.error) {
      setLoading(false);
      setError(result.error.message);
      return;
    }

    // New signup: attach the password they chose + save their profile.
    if (result.data.user && isSignup) {
      if (form.password.length >= 8) {
        await supabase.auth.updateUser({ password: form.password }).catch(() => {});
      }
      await updateProfile(result.data.user.id);
    }
    setLoading(false);
    await afterAuth();
  }

  // ── Forgot password: email a reset LINK ──────────────────────────────
  async function sendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const email = form.email.trim().toLowerCase();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSuccess("Reset link sent. Check your email, then open it in this browser.");
  }

  // ── Set new password (recovery) ─────────────────────────────────────
  async function handleSetNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Need a live recovery session (from the email link) to change the password.
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      setLoading(false);
      setError("This reset link has expired or was opened in another browser. Request a new link.");
      setTimeout(() => { setStep("forgot"); setError(""); }, 2200);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setLoading(false);
      setSuccess("");
      setError(
        /session|missing/i.test(updateError.message)
          ? "This reset link has expired. Request a new link and try again."
          : updateError.message
      );
      setTimeout(() => { setStep("forgot"); setError(""); }, 2200);
      return;
    }
    // Clear the recovery session and send the user to the login page.
    setSuccess("Password updated. Redirecting to sign in…");
    await supabase.auth.signOut();
    setLoading(false);
    setTimeout(() => window.location.assign("/login?reset=1"), 900);
  }

  const title = isSignup ? "Start your store for free" : "Log in to SuperShowroom";
  const subtitle = isSignup
    ? "Create your account, then we'll personalize your store setup — domains, themes, and plans from ₹15,000/yr + 2% sales."
    : "Manage your products, orders, and storefront. Sign in with password or email code.";

  const otpDestination =
    otpChannel === "email"
      ? form.email.trim().toLowerCase()
      : formatPhoneDisplay(verifiedPhone || normalizePhone(form.phone) || form.phone);

  return (
    <AuthLayout title={title} subtitle={subtitle} mode={mode}>
      {/* Confirm your email (post-signup) */}
      {step === "confirm" && (
        <div style={{ display: "grid", gap: 14 }}>
          <style>{`@keyframes ssr-spin{to{transform:rotate(360deg)}}`}</style>
          {confirmed ? (
            <>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#DCFCE7", display: "grid", placeItems: "center", fontSize: 24 }}>✓</div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>Email confirmed</h2>
              <p style={{ margin: 0, color: "#475569", fontSize: "0.92rem", lineHeight: 1.6 }}>
                Your account is ready. Continue to set up your store.
              </p>
              <button type="button" onClick={afterAuth} style={authStyles.btnPrimary}>
                Continue to store setup →
              </button>
            </>
          ) : (
            <>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#EEF2F8", display: "grid", placeItems: "center", fontSize: 24 }}>📧</div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>Confirm your email</h2>
              <p style={{ margin: 0, color: "#475569", fontSize: "0.92rem", lineHeight: 1.6 }}>
                We sent a confirmation link to <strong>{form.email.trim().toLowerCase()}</strong>.
                Open it in <strong>this browser</strong>, then come back here and press Continue.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#94A3B8" }}>
                <span style={{ width: 14, height: 14, border: "2px solid #CBD5E1", borderTopColor: "#24457A", borderRadius: "50%", animation: "ssr-spin 0.8s linear infinite" }} />
                Waiting for confirmation…
              </div>
              {error && <AuthMessage message={error} />}
              {success && <AuthMessage message={success} type="success" />}
              <button type="button" onClick={checkConfirmedNow} disabled={loading} style={authStyles.btnPrimary}>
                {loading ? "Checking…" : "I've confirmed — continue →"}
              </button>
              <button
                type="button"
                onClick={resendConfirmation}
                disabled={resendIn > 0}
                style={{ ...authStyles.btnSecondary, opacity: resendIn > 0 ? 0.55 : 1 }}
              >
                {resendIn > 0 ? `Resend link in ${resendIn}s` : "Resend confirmation link"}
              </button>
              <button type="button" onClick={() => { setStep("form"); setError(""); setSuccess(""); }} style={{ background: "none", border: 0, color: "#24457A", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>
                ← Use a different email
              </button>
            </>
          )}
        </div>
      )}

      {/* Recovery: set new password */}
      {step === "new-password" && (
        <form onSubmit={handleSetNewPassword} style={{ display: "grid", gap: 14 }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>Set a new password</h2>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.9rem" }}>Choose a strong password for your account.</p>
          <div>
            <label style={authStyles.label}>New password</label>
            <AuthInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            <PasswordStrength value={newPassword} />
          </div>
          <div>
            <label style={authStyles.label}>Confirm password</label>
            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required style={authStyles.input} autoComplete="new-password" />
          </div>
          {error && <AuthMessage message={error} />}
          {success && <AuthMessage message={success} type="success" />}
          <button type="submit" disabled={loading} style={authStyles.btnPrimary}>
            {loading ? "Saving..." : "Update password →"}
          </button>
        </form>
      )}

      {/* Forgot password */}
      {step === "forgot" && (
        <form onSubmit={sendResetEmail} style={{ display: "grid", gap: 14 }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>Reset your password</h2>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.9rem" }}>We&apos;ll email you a link to reset your password.</p>
          <div>
            <label style={authStyles.label}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={authStyles.input} autoComplete="email" placeholder="you@yourbrand.com" />
          </div>
          {error && <AuthMessage message={error} />}
          {success && <AuthMessage message={success} type="success" />}
          <button type="submit" disabled={loading} style={authStyles.btnPrimary}>
            {loading ? "Sending..." : "Send reset link →"}
          </button>
          <button type="button" onClick={() => { setStep("form"); setError(""); setSuccess(""); }} style={authStyles.btnSecondary}>
            ← Back to log in
          </button>
        </form>
      )}

      {/* OTP verify step */}
      {step === "otp" && (
        <form onSubmit={verifyOtp} style={{ display: "grid", gap: 14 }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
            {isSignup ? "Verify your email" : "Enter verification code"}
          </h2>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.9rem" }}>
            We emailed an {OTP_LENGTH}-digit code to <strong>{otpDestination}</strong>. Enter it below — no link to click.
          </p>
          <div>
            <label style={authStyles.label}>{OTP_LENGTH}-digit code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              placeholder={"0".repeat(OTP_LENGTH)}
              style={{ ...authStyles.input, fontSize: "1.4rem", letterSpacing: "0.3em", textAlign: "center" }}
            />
          </div>
          {error && <AuthMessage message={error} />}
          <button type="submit" disabled={loading || otp.length < OTP_LENGTH} style={authStyles.btnPrimary}>
            {loading ? "Verifying..." : isSignup ? "Verify & continue →" : "Log in →"}
          </button>
          <button type="button" onClick={() => { setStep("form"); setOtp(""); setError(""); }} style={authStyles.btnSecondary}>
            ← Back
          </button>
          <button type="button" onClick={() => sendOtp()} disabled={loading} style={{ background: "none", border: 0, color: "#24457A", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem" }}>
            Resend code
          </button>
        </form>
      )}

      {/* Main form */}
      {step === "form" && (
        <>
          <div style={authStyles.tabRow}>
            <button type="button" onClick={() => { setMethod("password"); setError(""); }} style={authStyles.tab(method === "password")}>
              {isSignup ? "Email & password" : "Password"}
            </button>
            <button type="button" onClick={() => { setMethod("otp"); setError(""); }} style={authStyles.tab(method === "otp")}>
              Email code
            </button>
          </div>

          {method === "password" ? (
            <form onSubmit={isSignup ? signUpWithPassword : signInWithPassword} style={{ display: "grid", gap: 14 }}>
              {isSignup && (
                <div>
                  <label style={authStyles.label}>Your name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Neha Raghavan" style={authStyles.input} />
                </div>
              )}
              <div>
                <label style={authStyles.label}>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" placeholder="you@yourbrand.com" style={authStyles.input} />
              </div>
              {isSignup && (
                <div>
                  <label style={authStyles.label}>WhatsApp <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional)</span></label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98765 43210" style={authStyles.input} />
                </div>
              )}
              <div>
                <label style={authStyles.label}>Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} autoComplete={isSignup ? "new-password" : "current-password"} placeholder={isSignup ? "Min. 8 characters" : "••••••••"} style={authStyles.input} />
                {isSignup && <PasswordStrength value={form.password} />}
              </div>
              {isSignup && (
                <div>
                  <label style={authStyles.label}>Confirm password</label>
                  <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required style={authStyles.input} autoComplete="new-password" />
                </div>
              )}
              {!isSignup && (
                <div style={{ textAlign: "right", marginTop: -6 }}>
                  <button type="button" onClick={() => { setStep("forgot"); setError(""); }} style={{ background: "none", border: 0, color: "#24457A", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>
                    Forgot password?
                  </button>
                </div>
              )}
              {error && <AuthMessage message={error} />}
              {success && <AuthMessage message={success} type="success" />}
              <button type="submit" disabled={loading} style={authStyles.btnPrimary}>
                {loading ? "Please wait..." : isSignup ? "Create account →" : "Log in →"}
              </button>
            </form>
          ) : (
            <form onSubmit={sendOtp} style={{ display: "grid", gap: 14 }}>
              {phoneEnabled && (
                <div style={{ ...authStyles.tabRow, marginBottom: 0 }}>
                  <button type="button" onClick={() => setOtpChannel("email")} style={authStyles.tab(otpChannel === "email")}>Email</button>
                  <button type="button" onClick={() => setOtpChannel("phone")} style={authStyles.tab(otpChannel === "phone")}>SMS</button>
                </div>
              )}
              {isSignup && (
                <div>
                  <label style={authStyles.label}>Your name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={authStyles.input} />
                </div>
              )}
              {otpChannel === "email" ? (
                <div>
                  <label style={authStyles.label}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" placeholder="you@yourbrand.com" style={authStyles.input} />
                </div>
              ) : (
                <div>
                  <label style={authStyles.label}>Mobile number</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ ...authStyles.input, width: 72, flexShrink: 0, textAlign: "center", fontWeight: 700, background: "#F1F5F9" }}>+91</div>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required inputMode="numeric" placeholder="98765 43210" style={{ ...authStyles.input, flex: 1 }} />
                  </div>
                </div>
              )}
              {error && <AuthMessage message={error} />}
              <button type="submit" disabled={loading} style={authStyles.btnPrimary}>
                {loading ? "Sending code..." : "Send verification code →"}
              </button>
            </form>
          )}

          {method === "password" && (
            <>
              <AuthDivider />
              <button type="button" onClick={() => setMethod("otp")} style={authStyles.btnSecondary}>
                Sign {isSignup ? "up" : "in"} with email code instead
              </button>
            </>
          )}
        </>
      )}

      <p style={{ marginTop: 24, fontSize: "0.9rem", color: "#64748B", textAlign: "center" }}>
        {isSignup ? (
          <>Already have an account? <Link href="/login" style={{ color: "#24457A", fontWeight: 700 }}>Log in</Link></>
        ) : (
          <>New to SuperShowroom? <Link href="/signup" style={{ color: "#24457A", fontWeight: 700 }}>Start for free</Link></>
        )}
      </p>

      {isSignup && (
        <p style={{ marginTop: 10, fontSize: "0.78rem", color: "#94A3B8", textAlign: "center", lineHeight: 1.5 }}>
          By creating an account you agree to our Terms of Service. Free plan includes 10 products, hosted URL, and checkout.
        </p>
      )}
    </AuthLayout>
  );
}
