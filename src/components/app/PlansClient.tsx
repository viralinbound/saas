"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLANS, type PlanKey } from "@/lib/constants";
import { FeatureMatrix } from "@/components/pricing/FeatureMatrix";
import { RoiCalculator } from "@/components/pricing/RoiCalculator";
import {
  PAID_ORDER,
  PLAN_CARD_BULLETS,
  PLAN_CTA,
  PRICING_HEADLINE,
  PRICING_DISCLAIMER,
  type PaidKey,
} from "@/lib/pricingMatrix";

const box: React.CSSProperties = { border: "1px solid #E4E1DA", background: "#fff", padding: 20 };
const MONO = "'JetBrains Mono', monospace";

export function PlansClient({ currentPlan, companyName }: { currentPlan: string; companyName: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<PlanKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function activate(plan: PlanKey) {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const d = await res.json();
    setBusy(false);
    setConfirm(null);
    if (res.ok) {
      setMsg(
        d.unlockedLivePublishing
          ? `${PLANS[plan].name} is active — live publishing unlocked. Taking you to your dashboard…`
          : `Switched to ${PLANS[plan].name}. Taking you to your dashboard…`
      );
      router.refresh();
      setTimeout(() => router.push("/app"), d.unlockedLivePublishing ? 1400 : 600);
    } else {
      setMsg(d.error || "Could not change plan.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 22, maxWidth: 1040 }}>
      <div style={{ ...box, background: "#EEF2F8" }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>
          {companyName} · current plan: {PLANS[currentPlan as PlanKey]?.name || currentPlan}
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 900, marginTop: 6, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
          {PRICING_HEADLINE.eyebrow}
        </h2>
        <p style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{PRICING_HEADLINE.title}</p>
        <p style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>{PRICING_HEADLINE.sub}</p>
        <p style={{ marginTop: 10, fontFamily: MONO, fontSize: 12, color: "#24457A", fontWeight: 700 }}>{PRICING_HEADLINE.note}</p>
      </div>

      {msg && <div style={{ ...box, background: "#F0FDF4", borderColor: "#86EFAC", fontWeight: 600 }}>{msg}</div>}

      {/* paid plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {PAID_ORDER.map((key) => {
          const p = PLANS[key];
          const isCurrent = key === currentPlan;
          const featured = key === "pro";
          return (
            <div
              key={key}
              style={{
                ...box,
                borderColor: isCurrent ? "#24457A" : featured ? "#24457A" : "#E4E1DA",
                borderWidth: isCurrent || featured ? 2 : 1,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 900, fontSize: 15, textTransform: "uppercase" }}>{p.name}</div>
                <div style={{ fontFamily: MONO, fontWeight: 900, fontSize: 18, marginTop: 4 }}>
                  ₹{p.price.toLocaleString("en-IN")}<span style={{ fontSize: 12, color: "#64748B" }}> /yr</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{p.tagline}</div>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 7, flex: 1 }}>
                {PLAN_CARD_BULLETS[key as PaidKey].map((b) => (
                  <li key={b} style={{ fontSize: 12.5, color: "#334155", fontWeight: 600 }}>
                    <span style={{ color: "#24457A", fontWeight: 900, marginRight: 6 }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <button type="button" disabled style={{ border: "1px solid #24457A", background: "#EEF2F8", color: "#24457A", padding: "10px 12px", fontWeight: 800, borderRadius: 8 }}>
                  Current plan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirm(key)}
                  style={{ border: 0, background: "#24457A", color: "#fff", padding: "11px 12px", fontWeight: 800, borderRadius: 8, cursor: "pointer" }}
                >
                  {PLAN_CTA[key as PaidKey]}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* free / demo tier */}
      <div style={{ ...box, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", background: "#FBFAF7" }}>
        <div>
          <strong style={{ fontSize: 14 }}>Start Free</strong>
          <span style={{ fontSize: 12.5, color: "#64748B", marginLeft: 8 }}>
            Demo mode — edit templates &amp; preview, watermarked. No live publishing.
          </span>
        </div>
        {currentPlan === "free" ? (
          <span style={{ fontSize: 12, fontWeight: 800, color: "#24457A" }}>● current</span>
        ) : (
          <button type="button" onClick={() => activate("free")} style={{ border: "1px solid #E4E1DA", background: "#fff", padding: "8px 14px", fontWeight: 800, borderRadius: 8, cursor: "pointer", fontSize: 12.5 }}>
            Switch to Free
          </button>
        )}
      </div>

      {/* full feature matrix */}
      <div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#24457A", marginBottom: 10 }}>
          Complete feature matrix
        </div>
        <FeatureMatrix currentPlan={currentPlan} />
      </div>

      <RoiCalculator />

      <p style={{ fontSize: 12, color: "#64748B" }}>{PRICING_DISCLAIMER}</p>

      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 300, padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, maxWidth: 440, width: "100%" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800 }}>Activate {PLANS[confirm].name}</h3>
            <p style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>
              <strong>₹{PLANS[confirm].price.toLocaleString("en-IN")}/yr</strong> + {PLANS[confirm].feePercent}% sales fee (ex GST).
              Live publishing unlocks immediately for <strong>{companyName}</strong>.
            </p>
            <div style={{ marginTop: 12, padding: 10, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, fontSize: 12, color: "#9A3412" }}>
              Payment gateway integration point (Razorpay / Stripe). This build activates the plan
              directly — no card is charged.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setConfirm(null)} style={{ flex: 1, border: "1px solid #E4E1DA", background: "#fff", padding: "10px 12px", fontWeight: 800, borderRadius: 8, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={() => activate(confirm)} style={{ flex: 1, border: 0, background: "#24457A", color: "#fff", padding: "10px 12px", fontWeight: 800, borderRadius: 8, cursor: "pointer" }}>
                {busy ? "Activating…" : `Pay ₹${PLANS[confirm].price.toLocaleString("en-IN")} & unlock`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
