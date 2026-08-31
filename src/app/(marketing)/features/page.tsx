import Link from "next/link";
import { PILLARS } from "@/lib/marketing-content";

export default function FeaturesPage() {
  const ops = [
    "Product catalog & inventory management",
    "Order notifications & fulfillment tracking",
    "GST-ready invoicing & Razorpay/UPI setup",
    "WhatsApp CRM & buyer recovery flows",
    "Google Ads kit & sitewide SEO",
    "Multi-member team logins & permissions",
  ];

  return (
    <section className="section-padding">
      <div className="container">
        <div className="section-header-center">
          <span className="section-tag-pill">03 / WHAT YOU GET</span>
          <h2 className="section-title">Complete 3-Pillar E-Commerce System</h2>
          <p className="section-sub">Website design, catalog management, GST invoicing & automated growth suite.</p>
        </div>

        <div className="pillars-grid-3" style={{ marginBottom: 32 }}>
          {PILLARS.map((p) => (
            <div key={p.num} style={{ background: "var(--slate-50)", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-lg)", padding: 28 }}>
              <div className="font-mono" style={{ color: "var(--brand-blue)", fontWeight: 800 }}>{p.num}.</div>
              <h2 style={{ marginTop: 8 }}>{p.title}</h2>
              <p style={{ marginTop: 12 }}>{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="operational-scope-grid">
          {ops.map((item) => (
            <div key={item} style={{ background: "#fff", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-md)", padding: 20, fontWeight: 700 }}>
              ✓ {item}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 36 }}>
          <Link href="/onboarding" className="btn btn-primary btn-lg">Start Your Store Setup →</Link>
        </div>
      </div>
    </section>
  );
}
