import Link from "next/link";
import { THEMES } from "@/lib/constants";

const TEMPLATE_COPY: Record<string, string> = {
  fashion: "Color/size variants (S/M/L/XL), lookbook showcase & instant slide-out cart drawer.",
  bakery: "Daily fresh menu, eggless tags, delivery slot selector & gourmet cake booking.",
  skincare: "Ingredient tags, routine bundles, subscription refills & dermatologist badges.",
  kirana: "High-density catalog, weight selector (500g, 1kg, 5kg) & 1-click fast cart add.",
  tech: "Spec comparison tables, warranty badges, EMI tags & tech support chat.",
  jewels: "BIS hallmark tags, insured shipping, custom engraving & gift packaging.",
};

export default function TemplatesPage() {
  return (
    <section className="section-padding">
      <div className="container">
        <div className="section-header-center">
          <span className="section-tag-pill">02 / STORE TEMPLATES & THEMES</span>
          <h2 className="section-title">Ready-to-Launch Store Layouts</h2>
          <p className="section-sub">Choose from 6+ mobile-first industry themes styled with custom color palettes, live search, cart drawers, and product photography.</p>
        </div>
        <div className="templates-grid">
          {THEMES.map((theme) => (
            <div key={theme.key} id={theme.key} className="template-card">
              <div className="template-img-wrap">
                <img src={theme.hero} alt={theme.name} />
              </div>
              <div className="template-content-body">
                <div>
                  <h3>{theme.name}</h3>
                  <span className="section-tag-pill" style={{ marginTop: 8 }}>{theme.industry.toUpperCase()}</span>
                  <p style={{ marginTop: 10, fontSize: "0.88rem" }}>{TEMPLATE_COPY[theme.key]}</p>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <a href={`/preview/template/${theme.key}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">👁️ Live preview ↗</a>
                  <Link href={`/onboarding?theme=${theme.key}`} className="btn btn-primary btn-sm">Select Theme →</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
