import Link from "next/link";
import { DomainSearchWidget } from "@/components/marketing/DomainSearchWidget";

export const metadata = {
  title: "Domain Search — SuperShowroom",
  description: "Check your brand domain availability. Every yearly plan includes a free .com or .in domain with SSL.",
};

export default function DomainsPage() {
  return (
    <section className="section-padding" style={{ background: "var(--slate-50)" }}>
      <div className="container">
        <div className="section-header-center">
          <span className="section-tag-pill">BRAND IDENTITY &amp; DOMAINS</span>
          <h1 className="section-title">Claim Your Free Custom Domain</h1>
          <p className="section-sub">
            Search available brand domains. Every yearly SuperShowroom plan includes a free .com or .in
            domain with instant setup and SSL.
          </p>
        </div>

        <div className="feature-split-banner" style={{ marginTop: 32 }}>
          <div>
            <DomainSearchWidget />
            <div className="feature-dark-box" style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Domain Features Included:</div>
              <ul style={{ listStyle: "none", display: "grid", gap: 8, fontSize: "0.9rem", color: "#CBD5E1" }}>
                <li>✓ Automated SSL Certificate &amp; HTTPS Binding</li>
                <li>✓ Free DNS Record Management</li>
                <li>✓ 1-Click Connection to SuperShowroom Store</li>
                <li>✓ Zero Hidden Renewal Charges</li>
              </ul>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <Link href="/pricing" className="btn btn-outline">Explore Full Domain Matrix →</Link>
              <Link href="/signup" className="btn btn-primary">Start Your Store →</Link>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "4rem" }}>🌐</div>
            <p style={{ marginTop: 12, fontWeight: 700 }}>Free domain with every paid plan</p>
          </div>
        </div>
      </div>
    </section>
  );
}
