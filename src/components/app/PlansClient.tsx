"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLANS, type PlanKey } from "@/lib/constants";
import { PricingBlock } from "@/components/marketing/PricingBlock";
import type { PaidKey } from "@/lib/pricingMatrix";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
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
          ? `${PLANS[plan].name} is active — live publishing unlocked.`
          : `Switched to ${PLANS[plan].name}.`
      );
      router.refresh();
      setTimeout(() => router.push("/app/design"), d.unlockedLivePublishing ? 1200 : 500);
    } else {
      setMsg(d.error || "Could not change plan.");
    }
  }

  return (
    <div style={{ maxWidth: 1360 }}>
      {msg && <div style={{ ...box, background: "#EAF4EC", marginBottom: 22, fontWeight: 600 }}>{msg}</div>}

      <div style={{ ...box, background: "#EEF2F8", marginBottom: 8 }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#24457A" }}>
          {companyName} · current plan · {(PLANS[currentPlan as PlanKey]?.name || currentPlan).toLowerCase()}
        </div>
      </div>

      <PricingBlock
        showHeader
        kicker="plans & unlock"
        currentPlan={currentPlan}
        onSelectPlan={(key: PaidKey) => setConfirm(key)}
      />

      <div style={{ ...box, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", background: "#F1EFE9", marginTop: 28 }}>
        <div>
          <strong style={{ fontSize: 14 }}>start free</strong>
          <span style={{ fontSize: 13, color: "#64748B", marginLeft: 8 }}>
            demo mode — edit templates &amp; preview, watermarked. no live publishing.
          </span>
        </div>
        {currentPlan === "free" ? (
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: "#2F6B4F" }}>● current</span>
        ) : (
          <button type="button" onClick={() => activate("free")} style={{ border: "1px solid #E4E1DA", background: "#fff", padding: "9px 15px", fontWeight: 700, cursor: "pointer", fontSize: 12.5 }}>
            switch to free
          </button>
        )}
      </div>

      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(20,22,26,0.6)", display: "grid", placeItems: "center", zIndex: 300, padding: 24 }}>
          <div style={{ background: "#FAF9F6", padding: 28, maxWidth: 440, width: "100%", border: "1px solid #E4E1DA", boxShadow: "0 12px 28px rgba(20,22,26,0.10)" }}>
            <h3 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em" }}>unlock {PLANS[confirm].name.toLowerCase()}</h3>
            <p style={{ marginTop: 8, fontSize: 14, color: "#475569", lineHeight: 1.55 }}>
              <strong>₹{PLANS[confirm].price.toLocaleString("en-IN")}/yr</strong> + {PLANS[confirm].feePercent}% sales fee (ex GST).
              live publishing unlocks immediately for <strong>{companyName}</strong>.
            </p>
            <div style={{ marginTop: 12, padding: 10, background: "#F1EFE9", border: "1px solid #E4E1DA", fontSize: 12 }}>
              payment gateway integration point. this build activates the plan directly — no card is charged.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setConfirm(null)} style={{ flex: 1, border: "1px solid #E4E1DA", background: "#fff", padding: "11px 12px", fontWeight: 700, cursor: "pointer" }}>
                cancel
              </button>
              <button type="button" disabled={busy} onClick={() => activate(confirm)} style={{ flex: 1, border: "1px solid #24457A", background: "#24457A", color: "#fff", padding: "11px 12px", fontWeight: 800, cursor: "pointer" }}>
                {busy ? "activating…" : `unlock ₹${PLANS[confirm].price.toLocaleString("en-IN")} →`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
