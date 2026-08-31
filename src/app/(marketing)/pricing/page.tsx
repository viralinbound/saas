import { PricingBlock } from "@/components/marketing/PricingBlock";

export const metadata = { title: "Plans & Pricing — SuperShowroom" };

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SERIF = "'Instrument Serif', Georgia, serif";

export default function PricingPage() {
  return (
    <section style={{ background: "#F1EFE9", borderBottom: "1px solid #E4E1DA", fontFamily: "'Instrument Sans', system-ui, sans-serif", color: "#14161A" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 28px 96px" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A" }}>
          05 / plans &amp; pricing
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: "clamp(40px, 5.6vw, 84px)", lineHeight: 0.94, letterSpacing: "-0.02em", fontWeight: 400, marginTop: 14 }}>
          pay once a year. then only when it sells.
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 640, marginTop: 22 }}>
          no per-app charges, no markup on top of your payment gateway, no surprise at renewal. move up a plan any time and we
          migrate you without rebuilding the site.
        </p>

        <div style={{ marginTop: 42 }}>
          <PricingBlock showHeader={false} ctaHref="/onboarding" />
        </div>
      </div>
    </section>
  );
}
