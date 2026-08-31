import { Fragment } from "react";
import { PRICING_GROUPS, PAID_ORDER, type PaidKey } from "@/lib/pricingMatrix";
import { PLANS } from "@/lib/constants";

const cell = (v: string): React.CSSProperties => ({
  padding: "10px 12px",
  textAlign: "center" as const,
  fontSize: 13,
  color: v === "—" ? "#94A3B8" : "#0F172A",
  fontWeight: v === "Yes" || v === "Free" ? 800 : 600,
});

export function FeatureMatrix({ currentPlan }: { currentPlan?: string }) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid #E2E8F0", borderRadius: 16, background: "#fff", boxShadow: "0 4px 16px -2px rgba(15,23,42,0.06)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
        <thead>
          <tr style={{ background: "#0F172A", color: "#fff" }}>
            <th style={{ textAlign: "left", padding: "14px 12px", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Complete feature matrix
            </th>
            {PAID_ORDER.map((k: PaidKey) => (
              <th key={k} style={{ padding: "14px 12px", minWidth: 120 }}>
                <div style={{ fontWeight: 900, fontSize: 13, textTransform: "uppercase" }}>{PLANS[k].name}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>₹{PLANS[k].price.toLocaleString("en-IN")}/yr</div>
                {k === currentPlan && <div style={{ fontSize: 10, color: "#CCFF00", fontWeight: 800 }}>YOUR PLAN</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PRICING_GROUPS.map((grp) => (
            <Fragment key={grp.group}>
              <tr>
                <td
                  colSpan={5}
                  style={{ padding: "12px", background: "#F1F5F9", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#334155" }}
                >
                  {grp.group}
                </td>
              </tr>
              {grp.rows.map((row, i) => (
                <tr key={`${grp.group}-${row.label}`} style={{ background: i % 2 ? "#F8FAFC" : "#fff" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, fontSize: 13, color: "#334155" }}>{row.label}</td>
                  {row.values.map((v, ci) => (
                    <td
                      key={ci}
                      style={{ ...cell(v), background: PAID_ORDER[ci] === currentPlan ? "#EFF6FF" : undefined }}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
