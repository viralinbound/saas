import { getCurrentStore } from "@/lib/auth";
import { formatMoney } from "@/lib/constants";
import { SetupChecklist } from "./SetupChecklist";
import { DashboardPanels } from "./DashboardPanels";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

/*
 * The data-heavy half of the dashboard — 4 stat cards, the setup checklist and
 * the 14-day chart / order feed. Rendered inside a <Suspense> so /app can paint
 * the shell + skeletons instantly while this awaits the full store load
 * (orders + products). Same numbers, same logic as before — just streamed.
 */
export async function DashboardBody() {
  const store = await getCurrentStore();
  if (!store) return null;

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

  const setupDone =
    store.products.length > 0 && (store.status === "live" || store.status === "preview") && store.plan !== "free";

  return (
    <>
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

      <div className="ssr-dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        <Stat label="today's revenue" value={formatMoney(todayRevenue, currency)} sub={revDelta} tone={yestRevenue > 0 && todayRevenue < yestRevenue ? "muted" : "accent"} lead />
        <Stat label="orders today" value={String(todayOrders.length)} sub={`${awaitingDispatch} awaiting dispatch`} />
        <Stat label="products live" value={String(published)} sub={`${store.products.length} in catalog`} tone="accent" />
        <Stat label="average order" value={formatMoney(aov, currency)} sub={`across ${store.orders.length} order${store.orders.length === 1 ? "" : "s"}`} highlight />
      </div>

      <DashboardPanels store={store} />
    </>
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
    <div className="ssr-dash-stat" style={{
      border: "1px solid #E4E1DA",
      background: highlight ? "#EEF2F8" : "#FAF9F6",
      padding: 20,
      boxShadow: lead ? "0 12px 28px rgba(20,22,26,0.10)" : "none",
    }}>
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: "clamp(1.4rem, 3.8vw, 2.2rem)", fontWeight: 700, letterSpacing: "-0.025em", marginTop: 8, fontFamily: MONO, wordBreak: "break-word" }}>{value}</div>
      {sub && (
        <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 6, color: tone === "accent" ? "#24457A" : undefined, opacity: tone === "accent" ? 1 : 0.7, wordBreak: "break-word" }}>{sub}</div>
      )}
    </div>
  );
}

/** Instant placeholder shown while <DashboardBody> streams. */
export function DashboardSkeleton() {
  const cell: React.CSSProperties = { background: "#EDEAE3", borderRadius: 3, animation: "ssrPulse 1.4s ease-in-out infinite" };
  return (
    <>
      <style>{`@keyframes ssrPulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }`}</style>
      <div className="ssr-dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 20 }}>
            <div style={{ ...cell, width: "45%", height: 9 }} />
            <div style={{ ...cell, width: "62%", height: 30, marginTop: 14 }} />
            <div style={{ ...cell, width: "52%", height: 9, marginTop: 14 }} />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)", gap: 20 }} className="ssr-dash-split">
        <div style={{ ...cell, height: 300, border: "1px solid #E4E1DA" }} />
        <div style={{ ...cell, height: 300, border: "1px solid #E4E1DA" }} />
      </div>
      <div style={{ ...cell, height: 220, border: "1px solid #E4E1DA" }} />
    </>
  );
}
