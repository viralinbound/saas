"use client";

import Link from "next/link";
import { storeUrl } from "@/lib/constants";

type Props = {
  storeName: string;
  storeSlug: string;
  status: string;
  productCount: number;
  orderCount: number;
  plan: string;
  liveUrl?: string;
};

export function SetupChecklist({ storeName, storeSlug, status, productCount, orderCount, plan, liveUrl }: Props) {
  const publicUrl = liveUrl || storeUrl(storeSlug);
  const steps = [
    { done: true, label: "Create your account", href: null },
    { done: true, label: "Set up your store", href: null },
    { done: productCount > 0, label: "Add products to catalog", href: "/app/catalog" },
    { done: status === "live", label: "Publish your store", href: "/app/settings" },
    { done: orderCount > 0, label: "Get your first order", href: `/s/${storeSlug}` },
  ];

  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 24, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>
            setup guide · {plan === "free" ? "free plan" : plan}
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>Get {storeName} ready to sell</h3>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700 }}>{pct}%</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>complete</div>
        </div>
      </div>
      <div style={{ height: 6, background: "#E4E1DA", marginTop: 16, borderRadius: 3 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#24457A", borderRadius: 3 }} />
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {steps.map((step) => (
          <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: step.done ? "#EEF2F8" : "#fff", border: "1px solid #E4E1DA" }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: step.done ? "#24457A" : "#E4E1DA", color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 900 }}>
              {step.done ? "✓" : ""}
            </span>
            {step.href && !step.done ? (
              <Link href={step.href} style={{ fontWeight: 700, color: "#24457A" }}>{step.label} →</Link>
            ) : (
              <span style={{ fontWeight: step.done ? 600 : 700, opacity: step.done ? 0.7 : 1 }}>{step.label}</span>
            )}
          </div>
        ))}
      </div>
      {status === "live" && (
        <div style={{ marginTop: 16, padding: 12, background: "#EEF2F8", fontSize: 14 }}>
          Your store is live at <a href={publicUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 800, color: "#24457A", wordBreak: "break-all" }}>{publicUrl}</a>
        </div>
      )}
    </div>
  );
}
