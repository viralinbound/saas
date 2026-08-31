import Link from "next/link";
import { PaidPlansGrid } from "@/components/marketing/PaidPlansGrid";
import { FeatureMatrix } from "@/components/pricing/FeatureMatrix";
import { RoiCalculator } from "@/components/pricing/RoiCalculator";
import { PRICING_HEADLINE, PRICING_DISCLAIMER } from "@/lib/pricingMatrix";

export const metadata = { title: "Plans & Pricing — SuperShowroom" };

export default function PricingPage() {
  return (
    <section className="hero-section" style={{ padding: "64px 0 80px" }}>
      <div className="container">
        <div className="text-center" style={{ marginBottom: 40 }}>
          <span className="hero-badge-pill">04 / PLANS &amp; PRICING</span>
          <h1 className="hero-title" style={{ textTransform: "uppercase" }}>{PRICING_HEADLINE.eyebrow}</h1>
          <p className="hero-subtitle" style={{ margin: "10px auto 0", fontWeight: 700 }}>{PRICING_HEADLINE.title}</p>
          <p className="hero-subtitle" style={{ margin: "6px auto 0" }}>{PRICING_HEADLINE.sub}</p>
          <p style={{ marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#0052FF", fontWeight: 700 }}>
            {PRICING_HEADLINE.note}
          </p>
        </div>

        <PaidPlansGrid showCompareLink={false} />

        <div style={{ marginTop: 56 }}>
          <div className="text-center" style={{ marginBottom: 20 }}>
            <h2 className="section-title" style={{ textTransform: "uppercase" }}>Complete feature matrix</h2>
            <p className="section-sub">Full detailed feature breakdown across all four SuperShowroom plans.</p>
          </div>
          <FeatureMatrix />
        </div>

        <div style={{ marginTop: 48, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
          <RoiCalculator />
        </div>

        <p style={{ marginTop: 28, textAlign: "center", fontSize: 13, color: "#64748B", maxWidth: 720, marginInline: "auto" }}>
          {PRICING_DISCLAIMER}
        </p>

        <div className="text-center" style={{ marginTop: 32 }}>
          <Link href="/onboarding" className="btn btn-primary" style={{ display: "inline-block" }}>
            Start Your Store Setup →
          </Link>
        </div>
      </div>
    </section>
  );
}
