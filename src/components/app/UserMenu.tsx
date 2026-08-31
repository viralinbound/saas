"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Me = {
  user: { name: string; email: string } | null;
  org: { name: string; role: string | null; plan: string; isDemo: boolean } | null;
  store: { status: string } | null;
};

const PLAN_LABEL: Record<string, string> = {
  free: "Start Free", essential: "Essential", pro: "Pro Showroom", elite: "Elite", plus: "Plus",
};

export function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const initial = name.charAt(0).toUpperCase();

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const plan = me?.org?.plan || "free";
  const isDemo = me?.org?.isDemo ?? true;

  return (
    <div ref={ref} style={{ marginLeft: "auto", position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: 0, cursor: "pointer", padding: 4 }}
      >
        <div style={{ textAlign: "right" }} className="user-menu-name">
          <div style={{ fontSize: 13, fontWeight: 800 }}>{name}</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>{me?.org?.name || email}</div>
        </div>
        <div style={{ width: 38, height: 38, background: "#24457A", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15, borderRadius: "50%" }}>
          {initial}
        </div>
        <span style={{ fontSize: 10, color: "#94A3B8" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)", width: 280, background: "#fff",
            border: "1px solid #E4E1DA", borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.12)", zIndex: 100, overflow: "hidden",
          }}
        >
          <div style={{ padding: 14, borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{name}</div>
            <div style={{ fontSize: 12, color: "#64748B", wordBreak: "break-all" }}>{email}</div>
          </div>

          {me?.org && (
            <div style={{ padding: 14, borderBottom: "1px solid #F1F5F9", background: "#FAFAF8" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.16em", textTransform: "uppercase", color: "#94A3B8" }}>company</div>
              <div style={{ fontWeight: 800, fontSize: 13, marginTop: 3 }}>{me.org.name}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {me.org.role && (
                  <span style={{ fontSize: 10, fontWeight: 800, background: "#DBEAFE", color: "#1E40AF", padding: "2px 7px", borderRadius: 999, textTransform: "uppercase" }}>{me.org.role}</span>
                )}
                <span style={{ fontSize: 10, fontWeight: 800, background: isDemo ? "#FEF3C7" : "#DCFCE7", color: isDemo ? "#92400E" : "#166534", padding: "2px 7px", borderRadius: 999 }}>
                  {PLAN_LABEL[plan] || plan}{isDemo ? " · demo" : ""}
                </span>
              </div>
            </div>
          )}

          <nav style={{ padding: 6 }}>
            {[
              { href: "/app/account", label: "Account & security" },
              { href: "/app/team", label: "Team & access" },
              { href: "/app/plans", label: isDemo ? "🔓 Choose a plan" : "Plans & billing" },
              { href: "/app/settings", label: "Domain & settings" },
            ].map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setOpen(false)}
                style={{ display: "block", padding: "9px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#14161A", textDecoration: "none" }}
              >
                {i.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={logout}
            style={{ width: "100%", textAlign: "left", padding: "12px 16px", border: 0, borderTop: "1px solid #F1F5F9", background: "#fff", color: "#B91C1C", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
