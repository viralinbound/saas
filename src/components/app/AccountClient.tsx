"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordStrength } from "@/components/auth/PasswordStrength";

type Account = {
  user: { id: string; email: string; name: string; phone: string; createdAt: string; lastSignInAt: string | null; emailConfirmed: boolean; provider: string };
  org: null | {
    id: string; name: string; slug: string; legalName: string | null; gstin: string | null; phone: string | null; email: string | null;
    city: string | null; state: string | null; pincode: string | null; plan: string; planStatus: string; role: string | null; memberCount: number; createdAt: string;
  };
  gate: { label: string; isDemo: boolean; canPublishLive: boolean; customDomain: boolean };
  stores: { id: string; name: string; slug: string; status: string }[];
};

const card: React.CSSProperties = { border: "1px solid #E4E1DA", background: "#fff", padding: 22, borderRadius: 4 };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#475569", display: "block", marginBottom: 6 };
const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14 };
const kicker: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" };

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export function AccountClient() {
  const router = useRouter();
  const supabase = createClient();
  const [a, setA] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((d: Account) => {
        setA(d);
        setName(d.user?.name || "");
        setPhone(d.user?.phone || "");
      });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    setSavingProfile(false);
    setProfileMsg(res.ok ? "Saved." : "Could not save.");
    if (res.ok) router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    if (pw.length < 8) return setPwMsg("Password must be at least 8 characters.");
    if (pw !== pw2) return setPwMsg("Passwords do not match.");
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSavingPw(false);
    if (error) return setPwMsg(error.message);
    setPw("");
    setPw2("");
    setPwMsg("Password updated.");
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!a) return <p style={{ opacity: 0.6 }}>Loading your account…</p>;

  const initial = (a.user.name || "M").charAt(0).toUpperCase();

  return (
    <div style={{ display: "grid", gap: 20, maxWidth: 860 }}>
      {/* identity header */}
      <div style={{ ...card, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#24457A", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 22 }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{a.user.name}</div>
          <div style={{ fontSize: 14, color: "#64748B" }}>{a.user.email}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Badge tone={a.user.emailConfirmed ? "green" : "amber"}>{a.user.emailConfirmed ? "email verified" : "email unverified"}</Badge>
            {a.org?.role && <Badge tone="blue">{a.org.role}</Badge>}
            <Badge tone={a.gate.isDemo ? "amber" : "green"}>{a.gate.label}{a.gate.isDemo ? " · demo" : ""}</Badge>
          </div>
        </div>
        <button type="button" onClick={signOut} style={{ border: "1px solid #E4E1DA", background: "#14161A", color: "#fff", padding: "9px 14px", fontWeight: 800, borderRadius: 8, cursor: "pointer" }}>
          Sign out
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {/* profile */}
        <form onSubmit={saveProfile} style={{ ...card, display: "grid", gap: 12 }}>
          <div style={kicker}>profile</div>
          <div>
            <label style={lbl}>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Phone / WhatsApp</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" style={inp} />
          </div>
          <div>
            <label style={lbl}>Email</label>
            <input value={a.user.email} disabled style={{ ...inp, background: "#F8FAFC", color: "#94A3B8" }} />
          </div>
          <button type="submit" disabled={savingProfile} style={{ border: 0, background: "#24457A", color: "#fff", padding: "10px 14px", fontWeight: 800, borderRadius: 8, cursor: "pointer" }}>
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
          {profileMsg && <span style={{ fontSize: 13, color: "#15803D", fontWeight: 600 }}>{profileMsg}</span>}
        </form>

        {/* password */}
        <form onSubmit={changePassword} style={{ ...card, display: "grid", gap: 12 }}>
          <div style={kicker}>password &amp; security</div>
          <div>
            <label style={lbl}>New password</label>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" style={inp} />
            <PasswordStrength value={pw} />
          </div>
          <div>
            <label style={lbl}>Confirm new password</label>
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" style={inp} />
          </div>
          <button type="submit" disabled={savingPw || !pw} style={{ border: 0, background: "#24457A", color: "#fff", padding: "10px 14px", fontWeight: 800, borderRadius: 8, cursor: pw ? "pointer" : "default", opacity: pw ? 1 : 0.5 }}>
            {savingPw ? "Updating…" : "Update password"}
          </button>
          {pwMsg && <span style={{ fontSize: 13, color: pwMsg.includes("updated") ? "#15803D" : "#B91C1C", fontWeight: 600 }}>{pwMsg}</span>}
        </form>
      </div>

      {/* account facts */}
      <div style={card}>
        <div style={kicker}>account</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 10 }}>
          <Fact label="Member since" value={fmt(a.user.createdAt)} />
          <Fact label="Last sign-in" value={fmt(a.user.lastSignInAt)} />
          <Fact label="Sign-in method" value={a.user.provider} />
          <Fact label="User ID" value={a.user.id.slice(0, 8) + "…"} mono />
        </div>
      </div>

      {/* company */}
      {a.org && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={kicker}>company</div>
            <Link href="/app/team" style={{ fontSize: 12, fontWeight: 700, color: "#24457A" }}>Manage team →</Link>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>{a.org.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 12 }}>
            <Fact label="Your role" value={a.org.role || "—"} />
            <Fact label="Members" value={String(a.org.memberCount)} />
            <Fact label="Plan" value={`${a.gate.label}${a.org.planStatus !== "active" ? " · " + a.org.planStatus : ""}`} />
            <Fact label="GSTIN" value={a.org.gstin || "—"} />
            <Fact label="Phone" value={a.org.phone || "—"} />
            <Fact label="Company since" value={fmt(a.org.createdAt)} />
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/app/plans" style={{ display: "inline-block", background: a.gate.isDemo ? "#16A34A" : "#EEF2F8", color: a.gate.isDemo ? "#fff" : "#24457A", padding: "9px 14px", fontWeight: 800, borderRadius: 8, textDecoration: "none" }}>
              {a.gate.isDemo ? "🔓 Choose a plan" : "Change plan"}
            </Link>
          </div>
        </div>
      )}

      {/* stores */}
      <div style={card}>
        <div style={kicker}>stores in this company ({a.stores.length})</div>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {a.stores.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #E4E1DA", padding: "10px 12px", borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>/s/{s.slug} · {s.status === "preview" ? "demo preview" : s.status}</div>
              </div>
              <Link href="/app/design" style={{ fontSize: 12, fontWeight: 700, color: "#24457A" }}>Edit →</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontWeight: 700, marginTop: 3, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined, fontSize: mono ? 12 : 14 }}>{value}</div>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "amber" | "blue" }) {
  const map = {
    green: { bg: "#DCFCE7", fg: "#166534" },
    amber: { bg: "#FEF3C7", fg: "#92400E" },
    blue: { bg: "#DBEAFE", fg: "#1E40AF" },
  }[tone];
  return (
    <span style={{ fontSize: 10, fontWeight: 800, background: map.bg, color: map.fg, padding: "3px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {children}
    </span>
  );
}
