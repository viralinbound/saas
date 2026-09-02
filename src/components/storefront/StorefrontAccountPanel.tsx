"use client";

/*
 * Storefront customer sign-in / sign-up, scoped to one store. Talks to
 * POST /api/storefront/account (register | login | logout | me) which wraps
 * the storefront_* Supabase RPCs — passwords are bcrypt-hashed server-side,
 * sessions are opaque tokens in public.storefront_sessions.
 */

import { useEffect, useState } from "react";
import type { CustomerSession, StoreCustomer } from "@/lib/customerSession";

type PastOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total: number; // paise
  city: string | null;
  createdAt: string;
  items: { name: string; quantity: number; variant: string | null }[];
};

const MONO = "'JetBrains Mono', ui-monospace, monospace";

export function StorefrontAccountPanel({
  storeSlug,
  accent,
  fg,
  card,
  line,
  btnFg,
  session,
  onAuthed,
  onLogout,
  onClose,
}: {
  storeSlug: string;
  accent: string;
  fg: string;
  card: string;
  line: string;
  btnFg: string;
  session: CustomerSession | null;
  onAuthed: (s: CustomerSession) => void;
  onLogout: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [orders, setOrders] = useState<PastOrder[] | null>(null);
  useEffect(() => {
    if (!session?.token) { setOrders(null); return; }
    let live = true;
    fetch(`/api/storefront/order?slug=${encodeURIComponent(storeSlug)}&token=${encodeURIComponent(session.token)}`)
      .then((r) => r.json())
      .then((d) => { if (live) setOrders(Array.isArray(d.orders) ? d.orders : []); })
      .catch(() => { if (live) setOrders([]); });
    return () => { live = false; };
  }, [session?.token, storeSlug]);
  const inr = (paise: number) => "₹" + Math.round(paise / 100).toLocaleString("en-IN");

  const field: React.CSSProperties = {
    width: "100%", border: `1px solid ${line}`, background: card, color: fg,
    padding: "11px 12px", fontSize: 14, outline: "none", marginTop: 6,
  };
  const label: React.CSSProperties = { fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.7, color: fg };

  async function submit() {
    setErr("");
    if (!email.trim() || !password) { setErr("Enter your email and password."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/storefront/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode, storeSlug,
          email: email.trim(), password,
          name: name.trim() || undefined, phone: phone.trim() || undefined,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.token) { setErr(d.error || "Could not sign you in."); return; }
      onAuthed({ token: d.token as string, customer: d.customer as StoreCustomer });
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/storefront/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout", storeSlug, token: session?.token }),
      });
    } catch {}
    onLogout();
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(20,22,26,0.55)", zIndex: 200, display: "grid", placeItems: "center", padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(400px, 100%)", background: card, color: fg, border: `1px solid ${line}`, padding: 24, boxShadow: "0 24px 60px rgba(20,22,26,0.35)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: accent }}>
            {session ? "your account" : mode === "login" ? "sign in" : "create account"}
          </span>
          <button type="button" onClick={onClose} style={{ border: 0, background: "none", color: fg, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {session ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{session.customer.name || session.customer.email}</div>
            <div style={{ fontFamily: MONO, fontSize: 12, opacity: 0.7, marginTop: 4 }}>{session.customer.email}</div>
            {session.customer.phone && <div style={{ fontFamily: MONO, fontSize: 12, opacity: 0.7, marginTop: 2 }}>{session.customer.phone}</div>}
            <div style={{ ...label, marginTop: 18 }}>your orders</div>
            <div style={{ marginTop: 8, maxHeight: 260, overflowY: "auto", display: "grid", gap: 8 }}>
              {orders === null && <div style={{ fontSize: 13, opacity: 0.6 }}>loading…</div>}
              {orders?.length === 0 && <div style={{ fontSize: 13, opacity: 0.65 }}>No orders yet — your first order will show here.</div>}
              {orders?.map((o) => (
                <div key={o.id} style={{ border: `1px solid ${line}`, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>{o.orderNumber}</span>
                    <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>{inr(o.total)}</span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                    {o.items.map((it) => `${it.name}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`).join(", ")}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.6, marginTop: 6 }}>
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · {o.status} · {o.paymentMethod}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={logout} style={{ marginTop: 16, width: "100%", border: `1px solid ${line}`, background: "transparent", color: fg, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              log out
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setErr(""); }}
                  style={{
                    flex: 1, border: `1px solid ${mode === m ? accent : line}`,
                    background: mode === m ? accent : "transparent",
                    color: mode === m ? btnFg : fg,
                    padding: "8px 10px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em",
                    textTransform: "uppercase", fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {m === "login" ? "sign in" : "sign up"}
                </button>
              ))}
            </div>

            {mode === "register" && (
              <>
                <label style={label}>name<input value={name} onChange={(e) => setName(e.target.value)} style={field} /></label>
                <label style={{ ...label, display: "block", marginTop: 12 }}>phone<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" style={field} /></label>
              </>
            )}
            <label style={{ ...label, display: "block", marginTop: 12 }}>email
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" style={field} />
            </label>
            <label style={{ ...label, display: "block", marginTop: 12 }}>password
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} style={field} />
            </label>

            {err && <div style={{ marginTop: 12, fontSize: 13, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FECACA", padding: 10 }}>{err}</div>}

            <button type="button" onClick={submit} disabled={busy} style={{ marginTop: 16, width: "100%", background: accent, color: btnFg, border: 0, padding: 13, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              {busy ? "…" : mode === "login" ? "sign in" : "create account"}
            </button>
            <p style={{ fontFamily: MONO, fontSize: 10, opacity: 0.6, marginTop: 10, lineHeight: 1.6 }}>
              Your password is encrypted. This account works only on this store.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
