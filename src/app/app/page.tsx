import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { SetupChecklist } from "@/components/app/SetupChecklist";
import { DashboardPanels } from "@/components/app/DashboardPanels";
import { formatMoney } from "@/lib/constants";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

/*
 * Dashboard — the "overview" screen from SuperShowroom App.dc.html#dashboard:
 * four stat cards, a revenue/orders chart beside a dark "needs you today"
 * panel, and the live order feed. Everything is driven by the store's real
 * Supabase data. (The setup checklist only shows while setup is unfinished.)
 */
export default async function DashboardPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const currency = store.currency;
  const dayKey = (d: Date) => d.toDateString();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayOrders = store.orders.filter((o) => dayKey(new Date(o.createdAt)) === dayKey(today));
  const yestOrders = store.orders.filter((o) => dayKey(new Date(o.createdAt)) === dayKey(yesterday));
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const yestRevenue = yestOrders.reduce((s, o) => s + o.total, 0);
  const revDelta =
    yestRevenue > 0
      ? `${todayRevenue >= yestRevenue ? "▲" : "▼"} ${Math.abs(Math.round(((todayRevenue - yestRevenue) / yestRevenue) * 100))}% vs yesterday`
      : todayRevenue > 0
      ? "first sales of the day"
      : "no sales yet today";

  const awaitingDispatch = store.orders.filter((o) =>
    ["placed", "pending", "processing", "confirmed", "cod_pending"].includes(o.status)
  ).length;
  const published = store.products.filter((p) => p.published).length;
  const totalRevenue = store.orders.reduce((s, o) => s + o.total, 0);
  const aov = store.orders.length ? Math.round(totalRevenue / store.orders.length) : 0;

  const istHour = new Date(Date.now() + 5.5 * 3600 * 1000).getUTCHours();
  const greeting = istHour < 12 ? "Good morning" : istHour < 17 ? "Good afternoon" : istHour < 21 ? "Good evening" : "Good night";
  const fullName = (store.owner.name || "there")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const setupDone = store.products.length > 0 && (store.status === "live" || store.status === "preview") && store.plan !== "free";

  return (
    <AppShell store={store} crumb={`overview · ${today.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`} title={`${greeting}, ${fullName}`}>
      <div style={{ display: "grid", gap: 20 }}>
        {!setupDone && (
          <SetupChecklist
            storeName={store.name}
            storeSlug={store.slug}
            status={store.status}
            productCount={store.products.length}
            orderCount={store.orders.length}
            plan={store.plan}
            liveUrl=""
          />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
          <Stat label="today's revenue" value={formatMoney(todayRevenue, currency)} sub={revDelta} tone={yestRevenue > 0 && todayRevenue < yestRevenue ? "muted" : "accent"} lead />
          <Stat label="orders today" value={String(todayOrders.length)} sub={`${awaitingDispatch} awaiting dispatch`} />
          <Stat label="products live" value={String(published)} sub={`${store.products.length} in catalog`} tone="accent" />
          <Stat label="average order" value={formatMoney(aov, currency)} sub={`across ${store.orders.length} order${store.orders.length === 1 ? "" : "s"}`} highlight />
        </div>

        <DashboardPanels store={store} />
      </div>
    </AppShell>
  );
}

function Stat({
  label, value, sub, lead, highlight, tone = "muted",
}: {
  label: string;
  value: string;
  sub?: string;
  lead?: boolean;
  highlight?: boolean;
  tone?: "accent" | "muted";
}) {
  return (
    <div style={{
      border: "1px solid #E4E1DA",
      background: highlight ? "#EEF2F8" : "#FAF9F6",
      padding: 20,
      boxShadow: lead ? "0 12px 28px rgba(20,22,26,0.10)" : "none",
    }}>
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 8, fontFamily: MONO }}>{value}</div>
      {sub && (
        <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 6, color: tone === "accent" ? "#24457A" : undefined, opacity: tone === "accent" ? 1 : 0.7 }}>{sub}</div>
      )}
    </div>
  );
}
