"use client";

import { useMemo, useState } from "react";

/* Shared pricing block — the exact design used in the homepage "05 / pricing"
   section, reused on the /pricing page and (optionally) the console. */

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SERIF = "'Instrument Serif', Georgia, serif";

const inr = (n: number) => {
  const v = Math.round(n);
  if (v >= 100000) return "₹" + (v / 100000).toFixed(v % 100000 === 0 ? 0 : 2).replace(/\.00$/, "") + "L";
  return "₹" + v.toLocaleString("en-IN");
};
const full = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const TIERS = [
  { name: "essential", price: "₹15,000/yr", who: "for small catalogs & first online stores", cta: "start essential →", badge: false,
    bg: "#FFFFFF", fg: "#14161A", border: "#E4E1DA", rule: "#E4E1DA", tick: "#2F6B4F", priceFg: "#2F6B4F", ctaBg: "#F1EFE9", ctaFg: "#14161A", badgeBg: "#EEF2F8", badgeFg: "#14161A",
    bullets: ["connect your own domain, free", "up to 100 products", "advance to start ₹5,000", "2% sales fee (ex GST)"] },
  { name: "pro showroom", price: "₹25,000/yr", who: "for growing brands ready to scale", cta: "start pro →", badge: true,
    bg: "#24457A", fg: "#FFFFFF", border: "#24457A", rule: "rgba(255,255,255,0.24)", tick: "#9FBBE0", priceFg: "#FFFFFF", ctaBg: "#FFFFFF", ctaFg: "#24457A", badgeBg: "#9FBBE0", badgeFg: "#14161A",
    bullets: ["unlimited products & video", "whatsapp CRM & shopping feed", "advance to start ₹8,000", "2% sales fee (ex GST)"] },
  { name: "elite", price: "₹35,000/yr", who: "for established high volume sellers", cta: "start elite →", badge: false,
    bg: "#FFFFFF", fg: "#14161A", border: "#E4E1DA", rule: "#E4E1DA", tick: "#2F6B4F", priceFg: "#2F6B4F", ctaBg: "#F1EFE9", ctaFg: "#14161A", badgeBg: "#EEF2F8", badgeFg: "#14161A",
    bullets: ["remove supershowroom branding", "full sitewide SEO & reviews", "advance to start ₹12,000", "2% sales fee (ex GST)"] },
  { name: "plus", price: "₹50,000+/yr", who: "fully custom build & dedicated manager", cta: "start plus →", badge: false,
    bg: "#F1EFE9", fg: "#14161A", border: "#E4E1DA", rule: "#E4E1DA", tick: "#2F6B4F", priceFg: "#2F6B4F", ctaBg: "#14161A", ctaFg: "#FFFFFF", badgeBg: "#EEF2F8", badgeFg: "#14161A",
    bullets: ["fully custom theme", "reduced 1% sales fee", "advance to start ₹20,000", "admin + 15 logins"] },
];

const PLAN_NAMES = ["essential", "pro showroom", "elite", "plus"];

const MATRIX_GROUPS: [string, [string, string[]][]][] = [
  ["your catalog", [
    ["products", ["100", "unlimited", "unlimited", "unlimited"]],
    ["images per product", ["5", "10 + video", "unlimited", "unlimited"]],
    ["variants", ["size, colour", "size, colour, weight", "all + bundles", "custom"]],
    ["collections & filters", ["basic", "advanced", "advanced", "custom"]],
    ["reviews", ["—", "text", "text + photo", "text + photo"]],
  ]],
  ["running the store", [
    ["order management", ["✓", "✓", "✓", "✓"]],
    ["low-stock alerts", ["—", "✓", "✓", "✓"]],
    ["cancellations & reports", ["basic", "full", "full + exports", "full + exports"]],
    ["team logins", ["1", "3", "8", "admin + 15"]],
  ]],
  ["getting customers", [
    ["SEO setup", ["pages", "pages + schema", "full sitewide", "full sitewide"]],
    ["ads, shopping & social kit", ["—", "shopping feed", "feed + social kit", "feed + social kit"]],
    ["whatsapp CRM", ["—", "✓", "✓", "✓"]],
    ["coupons", ["3", "unlimited", "unlimited", "unlimited"]],
    ["whatsapp credits / mo", ["—", "500", "2,000", "5,000"]],
  ]],
  ["support & onboarding", [
    ["whatsapp chat", ["✓", "✓", "✓", "priority"]],
    ["scheduled callback", ["—", "monthly", "fortnightly", "weekly"]],
    ["sales fee", ["2%", "2%", "2%", "1%"]],
  ]],
];

export function PricingBlock({
  ctaHref = "/signup",
  showHeader = true,
  showRoi = true,
  showTiers = true,
  showMatrix = true,
}: {
  ctaHref?: string;
  showHeader?: boolean;
  showRoi?: boolean;
  showTiers?: boolean;
  showMatrix?: boolean;
}) {
  const [sales, setSales] = useState(100000);
  const fee = sales * 0.02;
  const year = 25000 + fee * 12;
  const calcRows = [
    { label: "platform fee (2%)", value: full(fee) + "/mo", fg: "#FAF9F6" },
    { label: "total year one", value: inr(year), fg: "#9FBBE0" },
    { label: "effective per month", value: full(year / 12), fg: "#FAF9F6" },
    { label: "take rate of revenue", value: ((year / (Math.max(sales, 1) * 12)) * 100).toFixed(2) + "%", fg: "#9FBBE0" },
  ];

  const matrixRows = useMemo(() => {
    const rows: { group?: string; label?: string; cells?: string[] }[] = [];
    MATRIX_GROUPS.forEach(([title, items]) => {
      rows.push({ group: title });
      items.forEach(([label, vals]) => rows.push({ label, cells: vals }));
    });
    return rows;
  }, []);

  return (
    <div style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif", color: "#14161A" }}>
      {showHeader && (
        <>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A" }}>05 / pricing</div>
          <h2 style={{ fontFamily: SERIF, fontSize: "clamp(40px, 5.2vw, 80px)", lineHeight: 0.94, letterSpacing: "-0.02em", marginTop: 14, fontWeight: 400 }}>pay once a year. then only when it sells.</h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 640, marginTop: 22 }}>no per-app charges, no markup on top of your payment gateway, no surprise at renewal. move up a plan any time and we migrate you without rebuilding the site.</p>
        </>
      )}

      {/* ROI calculator */}
      {showRoi && (
      <div style={{ border: "1px solid #E4E1DA", borderRadius: 34, background: "#14161A", color: "#FAF9F6", padding: 34, marginTop: showHeader ? 42 : 0 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#9FBBE0" }}>estimated monthly store sales</div>
            <div style={{ fontFamily: MONO, fontSize: "clamp(40px, 5vw, 66px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, marginTop: 10 }}>{full(sales)} / mo</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9FBBE0" }}>drag to see the maths</div>
        </div>
        <input type="range" min={25000} max={500000} step={5000} value={sales} onChange={(e) => setSales(Number(e.target.value))} style={{ width: "100%", marginTop: 26, accentColor: "#9FBBE0" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 190px), 1fr))", borderTop: "1px solid rgba(250,249,246,0.24)", marginTop: 26 }}>
          {calcRows.map((r) => (
            <div key={r.label} style={{ padding: "22px 22px 22px 0", borderRight: "1px solid rgba(250,249,246,0.16)" }}>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9FBBE0" }}>{r.label}</div>
              <div style={{ fontFamily: MONO, fontSize: 27, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 9, color: r.fg }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* tier cards */}
      {showTiers && (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 18, marginTop: showRoi ? 34 : 0 }}>
        {TIERS.map((t) => (
          <div key={t.name} style={{ border: `1px solid ${t.border}`, borderRadius: 34, background: t.bg, color: t.fg, padding: "30px 26px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minHeight: 24 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}>{t.name}</span>
              {t.badge && <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", background: t.badgeBg, color: t.badgeFg, borderRadius: 999, padding: "4px 10px" }}>most picked</span>}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 16, color: t.priceFg }}>{t.price}</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 10, opacity: 0.78 }}>{t.who}</div>
            <div style={{ borderTop: `1px solid ${t.rule}`, marginTop: 20 }}>
              {t.bullets.map((b) => (
                <div key={b} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 9, alignItems: "baseline", padding: "10px 0", borderBottom: `1px solid ${t.rule}` }}>
                  <span style={{ color: t.tick, fontSize: 12 }}>✓</span>
                  <span style={{ fontSize: 14, lineHeight: 1.4 }}>{b}</span>
                </div>
              ))}
            </div>
            <a href={ctaHref} style={{ marginTop: "auto", marginBlockStart: 24, textAlign: "center", background: t.ctaBg, color: t.ctaFg, border: `1px solid ${t.ctaBg}`, borderRadius: 34, fontSize: 15, fontWeight: 700, padding: 14, textDecoration: "none" }}>{t.cta}</a>
          </div>
        ))}
      </div>
      )}

      {/* matrix */}
      {showMatrix && (
      <div style={{ marginTop: showRoi || showTiers ? 56 : 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#24457A" }}>line by line, all four plans</div>
        <div style={{ border: "1px solid #E4E1DA", borderRadius: 26, background: "#fff", overflow: "auto", marginTop: 16 }}>
          <table style={{ width: "100%", minWidth: 720, fontSize: 14, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "18px 20px", borderBottom: "1px solid #E4E1DA", fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, opacity: 0.6 }}>feature</th>
                {PLAN_NAMES.map((p) => (
                  <th key={p} style={{ textAlign: "left", padding: "18px 20px", borderBottom: "1px solid #E4E1DA", fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row, i) =>
                row.group ? (
                  <tr key={`g${i}`}>
                    <td colSpan={5} style={{ padding: "16px 20px", borderBottom: "1px solid #E4E1DA", background: "#F1EFE9", fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A", fontWeight: 500 }}>{row.group}</td>
                  </tr>
                ) : (
                  <tr key={`r${i}`}>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid #E4E1DA", fontSize: 14, fontWeight: 600, color: "#14161A" }}>{row.label}</td>
                    {row.cells!.map((c, ci) => (
                      <td key={ci} style={{ padding: "14px 20px", borderBottom: "1px solid #E4E1DA", fontFamily: MONO, fontSize: 12, color: c === "—" ? "rgba(20,22,26,0.4)" : c === "✓" ? "#2F6B4F" : "#14161A" }}>{c}</td>
                    ))}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, lineHeight: 1.8, letterSpacing: "0.06em", marginTop: 16, opacity: 0.62 }}>prices exclude 18% GST. plans step up 10% each year on renewal — written down from day one. the 2% fee on sales never changes.</div>
      </div>
      )}
    </div>
  );
}
