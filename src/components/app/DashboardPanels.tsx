import type { Store, Product, Order } from "@/lib/types";
import { formatMoney } from "@/lib/constants";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

type StoreWith = Store & {
  products: Product[];
  orders: (Order & { items: unknown[] })[];
};

/**
 * Interactive dashboard panels ported from `SuperShowroom App.dc.html#dashboard`:
 * a 14-day revenue/orders bar chart (grows in), a dark "needs you today" panel
 * driven by real stock + order status, and a styled live order feed.
 */
export function DashboardPanels({ store }: { store: StoreWith }) {
  const currency = store.currency || "INR";

  // ---- 14-day series ----
  const days: { label: string; rev: number; ord: number }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const dayOrders = store.orders.filter((o) => new Date(o.createdAt).toDateString() === key);
    days.push({
      label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      rev: dayOrders.reduce((s, o) => s + o.total, 0),
      ord: dayOrders.length,
    });
  }
  const maxRev = Math.max(1, ...days.map((d) => d.rev));
  const maxOrd = Math.max(1, ...days.map((d) => d.ord));

  // ---- needs-you signals ----
  const lowStock = store.products.filter((p) => p.published && p.stock <= 5).sort((a, b) => a.stock - b.stock);
  const pending = store.orders.filter((o) => ["placed", "pending", "cod_pending", "confirm"].includes(o.status));
  const recent = [...store.orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)", gap: 20, alignItems: "start" }} className="ssr-dash-split">
        {/* revenue & orders chart */}
        <div style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#24457A" }}>last 14 days</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.035em", marginTop: 4 }}>revenue &amp; orders</h3>
            </div>
            <div style={{ display: "flex", gap: 14, fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <span><span style={{ display: "inline-block", width: 9, height: 9, background: "#14161A", marginRight: 5 }} />revenue</span>
              <span><span style={{ display: "inline-block", width: 9, height: 9, background: "#24457A", marginRight: 5 }} />orders</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 210, marginTop: 26, borderBottom: "1px solid #E4E1DA", paddingBottom: 2 }}>
            {days.map((d, i) => (
              <div key={i} title={`${d.label} · ${formatMoney(d.rev, currency)} · ${d.ord} orders`} style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 3, height: "100%" }}>
                <div style={{ flex: 1, height: `${Math.max(2, (d.rev / maxRev) * 100)}%`, background: "#14161A", transformOrigin: "50% 100%", animation: `growY .5s cubic-bezier(.2,.8,.2,1) ${i * 0.03}s both` }} />
                <div style={{ width: 6, height: `${Math.max(2, (d.ord / maxOrd) * 100)}%`, background: "#24457A", transformOrigin: "50% 100%", animation: `growY .7s cubic-bezier(.2,.8,.2,1) ${i * 0.03}s both` }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 9, opacity: 0.6, marginTop: 8 }}>
            <span>{days[0].label}</span><span>{days[7].label}</span><span>{days[13].label}</span>
          </div>
        </div>

        {/* needs you today */}
        <div style={{ border: "1px solid #E4E1DA", background: "#14161A", color: "#FAF9F6", padding: 24 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9FBBE0" }}>needs you today</div>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <NeedCard
              title={lowStock.length ? `${lowStock.length} product${lowStock.length === 1 ? "" : "s"} low on stock` : "stock levels are healthy"}
              body={lowStock.length ? lowStock.slice(0, 3).map((p) => `${p.name} · ${p.stock} left`).join(", ") : "nothing under 5 units right now"}
              cta="restock →"
              href="/app/catalog"
            />
            <NeedCard
              title={pending.length ? `${pending.length} order${pending.length === 1 ? "" : "s"} to confirm` : "no orders waiting on you"}
              body={pending.length ? "open orders and confirm dispatch" : "every order is moving"}
              cta="open orders →"
              href="/app/orders"
              tint
            />
            <NeedCard
              title="GST invoices auto-filed"
              body={`${store.orders.length} order${store.orders.length === 1 ? "" : "s"} this store · statement on the 1st`}
              cta="review →"
              href="/app/billing"
            />
          </div>
        </div>
      </div>

      {/* live order feed */}
      <div style={{ border: "1px solid #E4E1DA", background: "#FAF9F6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "18px 22px", borderBottom: "1px solid #E4E1DA" }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.035em" }}>live order feed</h3>
          <a href="/app/orders" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#24457A", textDecoration: "none" }}>all orders →</a>
        </div>
        <div className="rtable" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F1EFE9" }}>
                {["order", "customer", "items", "payment", "total", "status"].map((h, i) => (
                  <th key={h} style={{ textAlign: "left", padding: i === 0 || i === 5 ? "11px 22px" : "11px 12px", fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} style={{ borderTop: "1px solid #E4E1DA" }}>
                  <td data-label="order" style={{ padding: "13px 22px", fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>{o.orderNumber}</td>
                  <td data-label="customer" style={{ padding: "13px 12px", fontWeight: 700 }}>{o.customerName}</td>
                  <td data-label="items" style={{ padding: "13px 12px", opacity: 0.8 }}>{o.items.length} item{o.items.length === 1 ? "" : "s"}</td>
                  <td data-label="payment" style={{ padding: "13px 12px", fontFamily: MONO, fontSize: 12, textTransform: "uppercase" }}>{o.paymentMethod}</td>
                  <td data-label="total" style={{ padding: "13px 12px", fontFamily: MONO, fontSize: 13, fontWeight: 700 }}>{formatMoney(o.total, currency)}</td>
                  <td data-label="status" style={{ padding: "13px 22px" }}>
                    <span style={{ border: "1px solid #E4E1DA", background: statusTint(o.status), padding: "4px 9px", fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>{o.status}</span>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 26, textAlign: "center", opacity: 0.7 }}>No orders yet — they&apos;ll appear here the moment one lands.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NeedCard({ title, body, cta, href, tint }: { title: string; body: string; cta: string; href: string; tint?: boolean }) {
  return (
    <div style={{ border: "1px solid rgba(250,249,246,0.25)", padding: 14, background: tint ? "rgba(36,69,122,0.16)" : "transparent" }}>
      <div style={{ fontSize: 15, fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{body}</div>
      <a href={href} style={{ display: "inline-block", fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9FBBE0", marginTop: 10, textDecoration: "none" }}>{cta}</a>
    </div>
  );
}

function statusTint(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("deliver") || s.includes("complete") || s.includes("paid")) return "#EAF4EC";
  if (s.includes("cancel") || s.includes("refund")) return "#FBECEC";
  if (s.includes("ship") || s.includes("dispatch")) return "#EEF2F8";
  return "#F1EFE9";
}
