"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLANS, type PlanKey } from "@/lib/constants";
import { PricingBlock } from "@/components/marketing/PricingBlock";
import { PAID_ORDER, PLAN_CARD_BULLETS, PLAN_CTA, type PaidKey } from "@/lib/pricingMatrix";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SERIF = "'Instrument Serif', Georgia, serif";
const box: React.CSSProperties = { border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 22 };

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
    <div style={{ display: "grid", gap: 22, maxWidth: 1160 }}>
      <div style={{ ...box, background: "#EEF2F8" }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#24457A" }}>
          {companyName} · current plan: {PLANS[currentPlan as PlanKey]?.name || currentPlan}
        </div>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 400, lineHeight: 0.98, letterSpacing: "-0.02em", marginTop: 8 }}>
          pay once a year. then only when it sells.
        </h2>
        <p style={{ fontSize: 14, color: "#475569", marginTop: 8, maxWidth: 620, lineHeight: 1.55 }}>
          move up a plan any time — we migrate you without rebuilding the site. the 2% fee on completed sales never changes.
        </p>
      </div>

      {msg && <div style={{ ...box, background: "#EAF4EC", borderColor: "#E4E1DA", fontWeight: 600 }}>{msg}</div>}

      {/* paid plan cards — interactive activate */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 18 }}>
        {PAID_ORDER.map((key) => {
          const p = PLANS[key];
          const isCurrent = key === currentPlan;
          const featured = key === "pro";
          return (
            <div
              key={key}
              style={{
                border: `1px solid ${featured ? "#24457A" : "#E4E1DA"}`,
                background: featured ? "#24457A" : "#FFFFFF",
                color: featured ? "#FFFFFF" : "#14161A",
                borderRadius: 34,
                padding: "30px 26px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minHeight: 24 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}>{p.name}</span>
                {featured && (
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", background: "#9FBBE0", color: "#14161A", borderRadius: 999, padding: "4px 10px" }}>most picked</span>
                )}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 16, color: featured ? "#FFFFFF" : "#2F6B4F" }}>
                ₹{p.price.toLocaleString("en-IN")}<span style={{ fontSize: 13, opacity: 0.7 }}>/yr</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 10, opacity: 0.78 }}>{p.tagline}</div>
              <div style={{ borderTop: `1px solid ${featured ? "rgba(255,255,255,0.24)" : "#E4E1DA"}`, marginTop: 20 }}>
                {PLAN_CARD_BULLETS[key as PaidKey].map((b) => (
                  <div key={b} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 9, alignItems: "baseline", padding: "10px 0", borderBottom: `1px solid ${featured ? "rgba(255,255,255,0.24)" : "#E4E1DA"}` }}>
                    <span style={{ color: featured ? "#9FBBE0" : "#2F6B4F", fontSize: 12 }}>✓</span>
                    <span style={{ fontSize: 14, lineHeight: 1.4 }}>{b}</span>
                  </div>
                ))}
              </div>
              {isCurrent ? (
                <button type="button" disabled style={{ marginTop: 24, textAlign: "center", background: featured ? "rgba(255,255,255,0.14)" : "#EEF2F8", color: featured ? "#FFFFFF" : "#24457A", border: 0, borderRadius: 34, fontSize: 15, fontWeight: 700, padding: 14 }}>
                  current plan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirm(key)}
                  style={{ marginTop: 24, textAlign: "center", background: featured ? "#FFFFFF" : "#24457A", color: featured ? "#24457A" : "#FFFFFF", border: 0, borderRadius: 34, fontSize: 15, fontWeight: 700, padding: 14, cursor: "pointer" }}
                >
                  {PLAN_CTA[key as PaidKey]}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* free / demo tier */}
      <div style={{ ...box, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", background: "#F1EFE9" }}>
        <div>
          <strong style={{ fontSize: 14 }}>Start Free</strong>
          <span style={{ fontSize: 12.5, color: "#64748B", marginLeft: 8 }}>
            Demo mode — edit templates &amp; preview, watermarked. No live publishing.
          </span>
        </div>
        {currentPlan === "free" ? (
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: "#2F6B4F" }}>● current</span>
        ) : (
          <button type="button" onClick={() => activate("free")} style={{ border: "1px solid #E4E1DA", background: "#fff", padding: "9px 15px", fontWeight: 700, cursor: "pointer", fontSize: 12.5 }}>
            Switch to Free
          </button>
        )}
      </div>

      {/* shared ROI + full feature matrix — same block as the marketing pricing page */}
      <PricingBlock showHeader={false} showTiers={false} />

      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(20,22,26,0.6)", display: "grid", placeItems: "center", zIndex: 300, padding: 24 }}>
          <div style={{ background: "#fff", padding: 28, maxWidth: 440, width: "100%", border: "1px solid #E4E1DA" }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 400 }}>Activate {PLANS[confirm].name}</h3>
            <p style={{ marginTop: 8, fontSize: 14, color: "#475569", lineHeight: 1.55 }}>
              <strong>₹{PLANS[confirm].price.toLocaleString("en-IN")}/yr</strong> + {PLANS[confirm].feePercent}% sales fee (ex GST).
              Live publishing unlocks immediately for <strong>{companyName}</strong>.
            </p>
            <div style={{ marginTop: 12, padding: 10, background: "#F1EFE9", border: "1px solid #E4E1DA", fontSize: 12, color: "#98502F" }}>
              Payment gateway integration point (Razorpay / Stripe). This build activates the plan directly — no card is charged.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setConfirm(null)} style={{ flex: 1, border: "1px solid #E4E1DA", background: "#fff", padding: "11px 12px", fontWeight: 700, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={() => activate(confirm)} style={{ flex: 1, border: "1px solid #24457A", background: "#24457A", color: "#fff", padding: "11px 12px", fontWeight: 700, cursor: "pointer" }}>
                {busy ? "Activating…" : `Pay ₹${PLANS[confirm].price.toLocaleString("en-IN")} & unlock`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
