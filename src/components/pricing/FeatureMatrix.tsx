"use client";

import { useState } from "react";
import { PLANS } from "@/lib/constants";
import { PAID_ORDER, PRICING_DISCLAIMER, PRICING_GROUPS, type PaidKey } from "@/lib/pricingMatrix";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const COLS = "1.4fr 1fr 1fr 1fr 1fr";

function cellColor(v: string) {
  if (v === "—") return "rgba(20,22,26,0.42)";
  if (v === "✓") return "#2F6B4F";
  return "#14161A";
}

export function FeatureMatrix({
  currentPlan,
  defaultOpen = 0,
}: {
  currentPlan?: string;
  defaultOpen?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
        <h3 style={{ fontSize: "clamp(24px, 2.8vw, 38px)", fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>
          compare the four, one thing at a time
        </h3>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", opacity: 0.7 }}>open a group ⟶</div>
      </div>

      <div style={{ border: "1px solid #E4E1DA", background: "#FFFFFF", overflowX: "auto" }}>
        <div style={{ minWidth: 860 }}>
          <div style={{ display: "grid", gridTemplateColumns: COLS, background: "#14161A", color: "#FAF9F6" }}>
            <div style={{ padding: "14px 16px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.7 }}>
              feature
            </div>
            {PAID_ORDER.map((k: PaidKey) => {
              const p = PLANS[k];
              const pro = k === "pro";
              const yours = k === currentPlan;
              return (
                <div
                  key={k}
                  style={{
                    padding: "14px 16px",
                    borderLeft: "1px solid rgba(250,249,246,0.2)",
                    background: pro ? "#24457A" : "#14161A",
                  }}
                >
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}>
                    {p.name.replace(" Showroom", "").toUpperCase()}
                    {yours ? " · yours" : ""}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 12, marginTop: 4, color: pro ? "#FFFFFF" : "#9FBBE0" }}>
                    ₹{k === "plus" ? `${p.price.toLocaleString("en-IN")}+` : p.price.toLocaleString("en-IN")}
                  </div>
                </div>
              );
            })}
          </div>

          {PRICING_GROUPS.map((grp, k) => {
            const isOpen = open === k;
            return (
              <div key={grp.group} style={{ borderTop: "1px solid #E4E1DA" }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : k)}
                  className="ssr-matrix-group"
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 14,
                    padding: "18px 16px",
                    cursor: "pointer",
                    background: isOpen ? "#F1EFE9" : "#FFFFFF",
                    border: 0,
                    color: "#14161A",
                    font: "inherit",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>
                      {String(k + 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>{grp.group}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.55 }}>
                      {grp.rows.length} lines
                    </span>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 18, color: "#24457A" }}>{isOpen ? "–" : "+"}</span>
                </button>

                {isOpen &&
                  grp.rows.map((row) => (
                    <div key={row.label} style={{ display: "grid", gridTemplateColumns: COLS, borderTop: "1px solid #E4E1DA" }}>
                      <div style={{ padding: "13px 16px", fontSize: 14, fontWeight: 700 }}>{row.label}</div>
                      {row.values.map((v, ci) => (
                        <div
                          key={ci}
                          style={{
                            padding: "13px 16px",
                            borderLeft: "1px solid #E4E1DA",
                            background: ci === 1 || PAID_ORDER[ci] === currentPlan ? "#EEF2F8" : "transparent",
                            fontFamily: MONO,
                            fontSize: 12,
                            color: cellColor(v),
                          }}
                        >
                          {v}
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 10, lineHeight: 1.8, letterSpacing: "0.06em", marginTop: 16, opacity: 0.62 }}>
        {PRICING_DISCLAIMER}
      </div>

      <style>{`.ssr-matrix-group:hover { background: #EEF2F8 !important; }`}</style>
    </div>
  );
}
