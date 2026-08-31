import Link from "next/link";
import { PAID_PLANS } from "@/lib/marketing-content";
import { PLAN_CARD_BULLETS, type PaidKey } from "@/lib/pricingMatrix";

export function PaidPlansGrid({ showCompareLink = true }: { showCompareLink?: boolean }) {
  return (
    <>
      <div className="pricing-cards-grid">
        {PAID_PLANS.map((tier) => {
          const featured = "featured" in tier && tier.featured;
          return (
            <div
              key={tier.key}
              className={`pricing-card-modern${featured ? " featured" : ""}`}
              style={featured ? { border: "2px solid var(--brand-blue)", boxShadow: "var(--shadow-glow-blue)" } : {}}
            >
              <h3 className="plan-title">{tier.name.toUpperCase()}</h3>
              <p className="plan-desc">{tier.tagline}</p>
              <div className="plan-price-wrap">
                <span className="price-currency">₹</span>
                <span className="price-amount">{tier.price.toLocaleString("en-IN")}</span>
                <span className="price-period">/yr</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px", display: "grid", gap: 8 }}>
                {PLAN_CARD_BULLETS[tier.key as PaidKey].map((b) => (
                  <li key={b} style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>
                    <span style={{ color: "var(--brand-blue, #0052FF)", fontWeight: 900, marginRight: 6 }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link href={`/onboarding?plan=${tier.key}`} className={`btn ${featured ? "btn-primary" : "btn-outline"} btn-full`}>
                {tier.cta}
              </Link>
            </div>
          );
        })}
      </div>
      {showCompareLink && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/pricing" className="btn btn-outline">
            Compare All Plans & Calculate ROI →
          </Link>
        </div>
      )}
    </>
  );
}
