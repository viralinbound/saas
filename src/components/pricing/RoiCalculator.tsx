"use client";

import { useState } from "react";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const PRO_PLAN = 25000;
const FEE = 0.02;

export function RoiCalculator() {
  const [monthly, setMonthly] = useState(100000);
  const feeMonth = monthly * FEE;
  const feeYear = feeMonth * 12;
  const yearOne = PRO_PLAN + feeYear;

  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: 16, background: "#0F172A", color: "#fff", padding: 24, boxShadow: "0 8px 24px -4px rgba(0,82,255,0.35)" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#00D2FF", fontWeight: 700 }}>
        Interactive 2% sales ROI calculator · Pro plan
      </div>
      <label style={{ display: "block", marginTop: 16, fontSize: 13, fontWeight: 700 }}>
        Estimated monthly store sales
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 900 }}>₹</span>
          <input
            type="number"
            min={0}
            step={5000}
            value={monthly}
            onChange={(e) => setMonthly(Math.max(0, Number(e.target.value) || 0))}
            style={{ flex: 1, background: "#1E293B", color: "#fff", border: "1px solid #334155", borderRadius: 10, padding: "10px 12px", fontSize: 18, fontWeight: 800 }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={1000000}
          step={5000}
          value={monthly}
          onChange={(e) => setMonthly(Number(e.target.value))}
          style={{ width: "100%", marginTop: 12, accentColor: "#0052FF" }}
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
        <div style={{ background: "#1E293B", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8" }}>2% platform fee</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{inr(feeMonth)} <span style={{ fontSize: 13, color: "#94A3B8" }}>/ mo</span></div>
        </div>
        <div style={{ background: "#1E293B", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8" }}>Total year-one cost</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{inr(yearOne)}</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
            ₹{(PRO_PLAN / 1000).toFixed(0)}k plan + {inr(feeYear)} sales fee
          </div>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 14 }}>
        Prices exclude 18% GST. The 2% fee applies only to completed orders.
      </p>
    </div>
  );
}
