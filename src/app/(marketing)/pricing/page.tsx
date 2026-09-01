import { PricingBlock } from "@/components/marketing/PricingBlock";

export const metadata = { title: "Plans & Pricing — SuperShowroom" };

export default function PricingPage() {
  return (
    <section id="pricing" style={{ background: "#FAF9F6", borderBottom: "1px solid #E4E1DA", fontFamily: "'Instrument Sans', system-ui, sans-serif", color: "#14161A" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 28px" }}>
        <PricingBlock ctaHref="/signup" />
      </div>
    </section>
  );
}
