import { redirect } from "next/navigation";
import { getCurrentStore, getOnboardingIntent } from "@/lib/auth";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/AppShell";
import { SetupChecklist } from "@/components/app/SetupChecklist";
import { ActivityFeed } from "@/components/app/ActivityFeed";
import { ProjectGrid } from "@/components/app/ProjectGrid";
import { DashboardPanels } from "@/components/app/DashboardPanels";
import { formatMoney, storeUrl, PLANS } from "@/lib/constants";
import { hostedUrl } from "@/lib/domains";
import { getDashboardTip } from "@/lib/onboarding";

export default async function DashboardPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const intent = await getOnboardingIntent();
  const tip = getDashboardTip(intent.goal, intent.category);

  // Public hosted URL:  https://www.supershowroom.in/<company>/<project>
  const org = await getCurrentOrg();
  const { data: row } = await (await createClient())
    .from("stores").select("host_path").eq("id", store.id).maybeSingle();
  const companyPath =
    row?.host_path && row.host_path.includes("/")
      ? row.host_path
      : `${org?.slug ?? "store"}/${store.slug}`;
  const liveUrl = hostedUrl(companyPath);
  const isPublished = store.status === "live" || store.status === "preview";

  const todayOrders = store.orders.filter((o) => {
    const d = new Date(o.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const plan = PLANS[store.plan as keyof typeof PLANS] || PLANS.free;

  // Greeting by India time (IST = UTC+5:30), name in Title Case.
  const istHour = new Date(Date.now() + 5.5 * 3600 * 1000).getUTCHours();
  const greeting = istHour < 12 ? "Good morning" : istHour < 17 ? "Good afternoon" : istHour < 21 ? "Good evening" : "Good night";
  const fullName = (store.owner.name || "there")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <AppShell store={store} crumb="overview" title={`${greeting}, ${fullName}`}>
      <div style={{ display: "grid", gap: 20 }}>
        <div style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#24457A" }}>
              personalized for you
            </div>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontSize: 24, letterSpacing: "-0.01em", marginTop: 8 }}>{tip.title}</div>
            <p style={{ fontSize: "0.9rem", marginTop: 6, color: "#64748B", maxWidth: 520, lineHeight: 1.55 }}>{tip.body}</p>
          </div>
          <a href={tip.href} style={{ border: "1px solid #24457A", background: "#24457A", color: "#fff", padding: "11px 18px", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
            {tip.cta}
          </a>
        </div>

        <SetupChecklist
          storeName={store.name}
          storeSlug={store.slug}
          status={store.status}
          productCount={store.products.length}
          orderCount={store.orders.length}
          plan={store.plan}
          liveUrl={liveUrl}
        />

        {store.plan === "free" && (
          <div style={{ border: "1px solid #E4E1DA", background: "#F1EFE9", padding: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#98502F" }}>demo mode · free</div>
              <div style={{ fontWeight: 800, marginTop: 6 }}>Explore all 6 templates free — customise &amp; preview your storefront</div>
              <p style={{ fontSize: "0.9rem", marginTop: 4, color: "#78716C" }}>
                {store.products.length}/{plan.productLimit} products · your demo preview is watermarked. Choose a plan to launch a real, watermark-free store on your own address.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href="/app/design" style={{ border: "1px solid #24457A", color: "#24457A", padding: "11px 18px", fontWeight: 700, textDecoration: "none" }}>Open editor →</a>
              <a href="/app/plans" style={{ background: "#24457A", color: "#fff", border: "1px solid #24457A", padding: "11px 18px", fontWeight: 700, textDecoration: "none" }}>Choose a plan →</a>
            </div>
          </div>
        )}

        <div style={{ border: "1px solid #E4E1DA", background: store.status === "live" ? "#EEF2F8" : "#F1EFE9", padding: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#24457A" }}>
              store status · {store.status === "preview" ? "demo preview" : store.status}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, marginTop: 8, wordBreak: "break-all" }}>
              {isPublished ? liveUrl : `not published — preview at ${storeUrl(store.slug)}`}
            </div>
          </div>
          <a href={isPublished ? liveUrl : "/app/design"} target={isPublished ? "_blank" : undefined} rel="noreferrer" style={{ border: "1px solid #24457A", padding: "10px 14px", fontWeight: 700, color: "#24457A", textDecoration: "none", whiteSpace: "nowrap" }}>
            {store.status === "live" ? "view live store ↗" : store.status === "preview" ? "view demo ↗" : "open editor →"}
          </a>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>
            your projects
          </div>
          <a href="/app/projects" style={{ fontSize: 12, fontWeight: 800, color: "#24457A", textDecoration: "none" }}>
            Manage projects →
          </a>
        </div>
        <ProjectGrid compact />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>
            at a glance
          </div>
          <a href="/app/analytics" style={{ fontSize: 12, fontWeight: 800, color: "#24457A", textDecoration: "none" }}>
            View full analytics →
          </a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
          <Stat label="today's revenue" value={formatMoney(todayRevenue, store.currency)} lead />
          <Stat label="orders today" value={String(todayOrders.length)} />
          <Stat label="products live" value={String(store.products.length)} />
          <Stat label="total orders" value={String(store.orders.length)} highlight />
        </div>

        <DashboardPanels store={store} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <ActivityFeed />
          <div style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 20 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#24457A" }}>quick actions</div>
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {[
                { href: "/app/design", label: "Edit & publish storefront" },
                { href: "/app/catalog", label: "Add a product" },
                { href: "/app/team", label: "Invite a teammate" },
                { href: "/app/plans", label: store.plan === "free" ? "Choose a plan to go live" : "Manage plan" },
              ].map((a) => (
                <a key={a.href} href={a.href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, border: "1px solid #E4E1DA", background: "#fff", padding: "12px 14px", fontWeight: 700, fontSize: 13.5, color: "#14161A", textDecoration: "none" }}>
                  {a.label}<span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#24457A" }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, lead, highlight }: { label: string; value: string; lead?: boolean; highlight?: boolean }) {
  return (
    <div style={{
      border: "1px solid #E4E1DA",
      background: highlight ? "#EEF2F8" : "#FAF9F6",
      padding: 20,
      boxShadow: lead ? "0 12px 28px rgba(20,22,26,0.10)" : "none",
    }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 8, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    </div>
  );
}
