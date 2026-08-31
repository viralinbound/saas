import Link from "next/link";
import { BookDemoButton } from "@/components/marketing/demo/DemoContext";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

const COLUMNS = [
  {
    title: "platform",
    links: [
      { name: "layout previews", href: "/templates" },
      { name: "what's included", href: "/features" },
      { name: "plans & pricing", href: "/pricing" },
      { name: "domain search", href: "/domains" },
      { name: "merchant console", href: "/app" },
    ],
  },
  {
    title: "company",
    links: [
      { name: "the studio", href: "/about" },
      { name: "book a demo", href: "#demo" },
      { name: "viralinbound.com", href: "https://viralinbound.com" },
    ],
  },
  {
    title: "reach us",
    links: [
      { name: "hello@vilms.in", href: "mailto:hello@vilms.in" },
      { name: "+91 84311 01466", href: "https://wa.me/918431101466" },
      { name: "bengaluru, india", href: "/" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer style={{ background: "#14161A", color: "#FAF9F6", borderTop: "1px solid rgba(250,249,246,0.16)", padding: "60px 28px 30px" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 44 }}>
        <div>
          <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: "-0.03em" }}>
            supershowroom<span style={{ color: "#9FBBE0", marginLeft: 3 }}>✦</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "#9FBBE0", marginTop: 4 }}>by viral inbound</div>
          <p style={{ fontSize: 15, lineHeight: 1.6, marginTop: 16, maxWidth: 320, opacity: 0.76 }}>
            online stores built and operated for indian sellers. 350+ shipped from bengaluru.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9FBBE0" }}>{col.title}</div>
            <ul style={{ display: "grid", gap: 10, marginTop: 16, fontSize: 15, listStyle: "none", padding: 0 }}>
              {col.links.map((l) => (
                <li key={l.name}>
                  {l.href === "#demo" ? (
                    <BookDemoButton className="ssr-foot-link" style={{ background: "none", border: 0, padding: 0, fontSize: 15 }}>
                      {l.name}
                    </BookDemoButton>
                  ) : l.href.startsWith("/") ? (
                    <Link href={l.href} className="ssr-foot-link">{l.name}</Link>
                  ) : (
                    <a href={l.href} className="ssr-foot-link">{l.name}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1360, margin: "44px auto 0", paddingTop: 20, borderTop: "1px solid rgba(250,249,246,0.16)", fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.66 }}>
        © 2026 supershowroom by viral inbound · bengaluru, india
      </div>
    </footer>
  );
}
