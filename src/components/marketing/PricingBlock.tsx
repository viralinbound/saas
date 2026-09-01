"use client";

import { useRef, useState } from "react";
import { PLANS } from "@/lib/constants";
import { FeatureMatrix } from "@/components/pricing/FeatureMatrix";
import {
  PLAN_CARD_BULLETS,
  PLAN_CTA,
  PLAN_WHO,
  PRICING_HEADLINE,
  type PaidKey,
} from "@/lib/pricingMatrix";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const MIN = 25000;
const MAX = 500000;
const SPAN = MAX - MIN;
const STEP = 25000;
const PRO_YEAR = PLANS.pro.price;
const FEE_PCT = PLANS.pro.feePercent;

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const TIERS: {
  key: PaidKey;
  bg: string;
  fg: string;
  nameFg?: string;
  hover: boolean;
  featured?: boolean;
  plus?: boolean;
}[] = [
  { key: "essential", bg: "#F1EFE9", fg: "#14161A", hover: true },
  { key: "pro", bg: "#24457A", fg: "#FFFFFF", nameFg: "#C3D4EA", featured: true, hover: false },
  { key: "elite", bg: "#F1EFE9", fg: "#14161A", hover: true },
  { key: "plus", bg: "#2F6B4F", fg: "#FAF9F6", nameFg: "#FFFFFF", plus: true, hover: true },
];

export function PricingBlock({
  ctaHref = "/signup",
  plusHref = "mailto:kevin@viralinbound.com",
  showHeader = true,
  showRoi = true,
  showTiers = true,
  showMatrix = true,
  kicker,
  currentPlan,
  onSelectPlan,
}: {
  ctaHref?: string;
  plusHref?: string;
  showHeader?: boolean;
  showRoi?: boolean;
  showTiers?: boolean;
  showMatrix?: boolean;
  kicker?: string;
  currentPlan?: string;
  onSelectPlan?: (key: PaidKey) => void;
}) {
  const [sales, setSales] = useState(100000);
  const trackRef = useRef<HTMLDivElement>(null);

  const pct = ((sales - MIN) / SPAN) * 100;
  const fee = sales * (FEE_PCT / 100);
  const total = PRO_YEAR + fee * 12;

  function setFromEvent(e: React.PointerEvent | PointerEvent) {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const raw = MIN + p * SPAN;
    setSales(Math.round(raw / STEP) * STEP);
  }

  function onTrack(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    setFromEvent(e);
    const move = (ev: PointerEvent) => setFromEvent(ev);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif", color: "#14161A" }}>
      <style>{`
        .ssr-plan-hover { transition: transform .18s ease, box-shadow .18s ease; }
        .ssr-plan-hover:hover { transform: translate(-4px,-4px); box-shadow: 0 12px 28px rgba(20,22,26,0.10); }
        .ssr-plan-cta { transition: background .15s ease, color .15s ease; }
        .ssr-plan-cta.cream:hover { background: #14161A; color: #EEF2F8; }
        .ssr-plan-cta.pro:hover { background: #14161A; color: #FFFFFF; }
        .ssr-plan-cta.plus:hover { background: #FAF9F6; color: #14161A; }
      `}</style>

      {showHeader && (
        <>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A", marginBottom: 16 }}>
            {kicker || PRICING_HEADLINE.eyebrow}
          </div>
          <h2 style={{ fontSize: "clamp(40px, 5vw, 80px)", lineHeight: 0.88, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
            {PRICING_HEADLINE.title} <span style={{ fontWeight: 600, color: "#24457A" }}>{PRICING_HEADLINE.titleAccent}</span>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.55, maxWidth: 620, marginTop: 20 }}>{PRICING_HEADLINE.sub}</p>
        </>
      )}

      {showRoi && (
        <div style={{ marginTop: showHeader ? 44 : 0, border: "1px solid #E4E1DA", background: "#14161A", color: "#FAF9F6", boxShadow: "0 12px 28px rgba(20,22,26,0.10)", padding: 34 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9FBBE0" }}>your real cost · pro plan</div>
              <h3 style={{ fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-0.025em", marginTop: 6, marginBottom: 0 }}>
                what {FEE_PCT}% works out to at your volume
              </h3>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, opacity: 0.7 }}>drag ⟶</div>
          </div>

          <div style={{ marginTop: 30 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.75 }}>estimated monthly store sales</div>
              <div style={{ fontSize: "clamp(30px, 4vw, 52px)", fontWeight: 700, letterSpacing: "-0.025em", color: "#9FBBE0", fontFamily: MONO }}>{inr(sales)}</div>
            </div>
            <div
              ref={trackRef}
              onPointerDown={onTrack}
              role="slider"
              aria-valuemin={MIN}
              aria-valuemax={MAX}
              aria-valuenow={sales}
              aria-label="estimated monthly store sales"
              style={{ position: "relative", height: 46, marginTop: 14, display: "flex", alignItems: "center", touchAction: "none", cursor: "ew-resize" }}
            >
              <div style={{ position: "absolute", left: 0, right: 0, height: 8, background: "rgba(250,249,246,0.2)", border: "1px solid rgba(250,249,246,0.35)" }} />
              <div style={{ position: "absolute", left: 0, height: 8, background: "#24457A", width: `${pct}%` }} />
              <div style={{ position: "absolute", left: `${pct}%`, width: 30, height: 30, marginLeft: -15, background: "#EEF2F8", border: "2px solid #FAF9F6", transform: "rotate(45deg)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10, opacity: 0.6, letterSpacing: "0.1em" }}>
              <span>₹25,000</span>
              <span>₹5,00,000 / mo</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: 16, marginTop: 30 }}>
            <div style={{ border: "1px solid rgba(250,249,246,0.24)", padding: 20 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>monthly sales</div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 8, fontFamily: MONO }}>{inr(sales)}</div>
            </div>
            <div style={{ border: "1px solid rgba(250,249,246,0.24)", padding: 20 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>{FEE_PCT}% platform fee</div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 8, fontFamily: MONO, color: "#9FBBE0" }}>{inr(fee)} / mo</div>
            </div>
            <div style={{ border: "1px solid rgba(250,249,246,0.24)", padding: 20, background: "rgba(159,187,224,0.14)" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>total year one</div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 8, fontFamily: MONO, color: "#9FBBE0" }}>{inr(total)}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 6, opacity: 0.7 }}>
                (₹{Math.round(PRO_YEAR / 1000)}k plan + {inr(fee * 12)} sales fee)
              </div>
            </div>
            <div style={{ border: "1px solid rgba(250,249,246,0.24)", padding: 20 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>effective per month</div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 8, fontFamily: MONO }}>{inr(total / 12)}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 6, opacity: 0.7 }}>{((total / (sales * 12)) * 100).toFixed(1)}% of revenue</div>
            </div>
          </div>
        </div>
      )}

      {showTiers && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 258px), 1fr))", gap: 18, marginTop: 40 }}>
          {TIERS.map((t) => {
            const p = PLANS[t.key];
            const href = t.plus ? plusHref : `${ctaHref}${ctaHref.includes("?") ? "&" : "?"}plan=${t.key}`;
            const priceLabel = t.plus ? `${p.price.toLocaleString("en-IN")}+` : p.price.toLocaleString("en-IN");
            const isCurrent = currentPlan === t.key;
            const ctaText = isCurrent ? "current plan" : onSelectPlan ? (t.plus ? "unlock plus →" : `unlock ${t.key} →`) : PLAN_CTA[t.key];
            const ctaStyle: React.CSSProperties = {
              marginTop: 20,
              textAlign: "center",
              border: `1px solid ${t.featured ? "#FFFFFF" : "#E4E1DA"}`,
              background: t.featured ? "#FFFFFF" : t.plus ? "#EEF2F8" : "#FAF9F6",
              color: t.featured ? "#24457A" : "#14161A",
              fontSize: 15,
              fontWeight: t.featured ? 700 : 800,
              padding: 13,
              textDecoration: "none",
              width: "100%",
              cursor: isCurrent ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: isCurrent ? 0.7 : 1,
            };
            return (
              <div
                key={t.key}
                className={t.hover ? "ssr-plan-hover" : undefined}
                style={{
                  border: `1px solid ${t.featured ? "#24457A" : "#E4E1DA"}`,
                  background: t.bg,
                  color: t.fg,
                  padding: 26,
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: t.featured ? "0 16px 36px rgba(36,69,122,0.22)" : undefined,
                }}
              >
                {t.featured && (
                  <div style={{ position: "absolute", top: -13, right: 18, background: "#FFFFFF", color: "#24457A", border: "1px solid #24457A", fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 9px" }}>
                    most picked
                  </div>
                )}
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: t.nameFg }}>{p.name.toLowerCase()}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 14 }}>
                  <span style={{ fontSize: 22, fontWeight: 800 }}>₹</span>
                  <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: "-0.03em" }}>{priceLabel}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, opacity: t.featured || t.plus ? 1 : 0.7 }}>/yr</span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.5, marginTop: 10, opacity: t.featured || t.plus ? 1 : 0.82 }}>{PLAN_WHO[t.key]}</p>
                <ul style={{ display: "grid", gap: 8, fontSize: 14, marginTop: 18, flex: 1, listStyle: "none", padding: 0 }}>
                  {PLAN_CARD_BULLETS[t.key].map((b) => (
                    <li key={b}>✓ {b}</li>
                  ))}
                </ul>
                {onSelectPlan ? (
                  <button type="button" disabled={isCurrent} onClick={() => onSelectPlan(t.key)} className={`ssr-plan-cta ${t.featured ? "pro" : t.plus ? "plus" : "cream"}`} style={ctaStyle}>
                    {ctaText}
                  </button>
                ) : (
                  <a href={href} className={`ssr-plan-cta ${t.featured ? "pro" : t.plus ? "plus" : "cream"}`} style={ctaStyle}>
                    {ctaText}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showMatrix && (
        <div style={{ marginTop: 56 }}>
          <FeatureMatrix currentPlan={currentPlan} />
        </div>
      )}
    </div>
  );
}
