import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { DemoProvider } from "@/components/marketing/demo/DemoContext";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <div style={{ background: "#FAF9F6" }}>
        <div className="ssr-progress" aria-hidden />
        <div style={{ background: "#14161A", color: "#FAF9F6", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em" }}>
          <span style={{ background: "#EEF2F8", color: "#14161A", padding: "3px 9px", borderRadius: 999, fontWeight: 700 }}>✦ 2026 edition</span>
          <span style={{ minWidth: 0 }}>self-serve setup is live — ₹15,000/yr + 2% of sales, most stores ship inside a week</span>
          <a href="/pricing" style={{ color: "#9FBBE0", borderBottom: "1px solid #9FBBE0" }}>see plans →</a>
        </div>
        <MarketingNav />
        {children}
        <MarketingFooter />
      </div>
    </DemoProvider>
  );
}
