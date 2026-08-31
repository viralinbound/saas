import Link from "next/link";
import { ConsultationWidget } from "@/components/marketing/ConsultationWidget";

export default function AboutPage() {
  return (
    <>
      <section className="section-padding">
        <div className="container text-center">
          <span className="hero-badge-pill">ABOUT SUPERSHOWROOM</span>
          <h1 className="hero-title" style={{ marginTop: 16 }}>
            studio-led ecommerce for <span className="highlight-lime">ambitious brands.</span>
          </h1>
          <p className="hero-subtitle" style={{ margin: "20px auto", maxWidth: 640 }}>
            SuperShowroom by Viral Inbound. Ecommerce websites designed, built &amp; run for you — across India, from Bengaluru.
          </p>
        </div>
      </section>

      <section id="contact" className="section-padding" style={{ background: "var(--slate-50)" }}>
        <div className="container">
          <div className="contact-cards-grid">
            <div style={{ background: "#fff", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-lg)", padding: 24 }}>
              <h3>Email</h3>
              <p style={{ marginTop: 8 }}><a href="mailto:hello@vilms.in" style={{ color: "var(--brand-blue)", fontWeight: 700 }}>hello@vilms.in</a></p>
            </div>
            <div style={{ background: "#fff", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-lg)", padding: 24 }}>
              <h3>Phone / WhatsApp</h3>
              <p style={{ marginTop: 8 }}><a href="https://wa.me/918431101466" style={{ color: "var(--brand-blue)", fontWeight: 700 }}>+91 84311 01466</a></p>
            </div>
            <div style={{ background: "#fff", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-lg)", padding: 24 }}>
              <h3>Location</h3>
              <p style={{ marginTop: 8 }}>Bengaluru, India</p>
            </div>
          </div>

          <div style={{ maxWidth: 640, margin: "32px auto 0" }}>
            <ConsultationWidget />
          </div>

          <div style={{ textAlign: "center", marginTop: 28 }}>
            <Link href="/signup" className="btn btn-primary btn-lg">Build Store →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
