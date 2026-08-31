"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, StatTile, PageHeader, BarChart, Badge, ui } from "@/components/ui/kit";

type Analytics = {
  store: { name: string; slug: string; status: string; subdomain: string | null };
  rangeDays: number;
  generatedAt: string;
  kpis: { revenue: number; orders: number; aov: number; views: number; productViews: number; addToCart: number; beginCheckout: number; conversion: number };
  series: { day: string; orders: number; revenue: number; views: number }[];
  funnel: { label: string; value: number }[];
  topProducts: { name: string | null; units: number; revenue: number }[];
  recentOrders: { order_number: string; customer_name: string; total: number; status: string; created_at: string }[];
};

const inr = (paise: number) => `₹${Math.round((paise || 0) / 100).toLocaleString("en-IN")}`;
const RANGES = [7, 14, 30] as const;

export function AnalyticsClient() {
  const [days, setDays] = useState<number>(14);
  const [data, setData] = useState<Analytics | null>(null);
  const [err, setErr] = useState("");
  const [live, setLive] = useState(true);
  const [tick, setTick] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (d: number) => {
    const res = await fetch(`/api/analytics?days=${d}`);
    const j = await res.json();
    if (!res.ok) { setErr(j.error || "Could not load analytics"); return; }
    setErr("");
    setData(j);
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!live) return;
    timer.current = setInterval(() => { load(days); setTick((t) => t + 1); }, 12000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [live, days, load]);

  if (err) return <Card><p style={{ color: ui.red, fontWeight: 600 }}>{err}</p></Card>;
  if (!data) return <p style={{ opacity: 0.6 }}>Loading analytics…</p>;

  const k = data.kpis;
  const maxFunnel = Math.max(1, ...data.funnel.map((f) => f.value));

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <PageHeader
        title="Business analytics"
        subtitle={`${data.store.name} · updated ${new Date(data.generatedAt).toLocaleTimeString("en-IN")}`}
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setLive((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${ui.border}`, background: "#fff", padding: "7px 12px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: live ? "#16A34A" : "#94A3B8", boxShadow: live ? "0 0 0 3px rgba(22,163,74,0.2)" : "none" }} />
              {live ? "Live" : "Paused"}
            </button>
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDays(r)}
                style={{
                  border: `1px solid ${days === r ? ui.brand : ui.border}`,
                  background: days === r ? "#EEF2F8" : "#fff",
                  color: days === r ? ui.brand : ui.sub,
                  padding: "7px 12px", borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: "pointer",
                }}
              >
                {r}d
              </button>
            ))}
          </div>
        }
      />

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <StatTile label={`revenue · ${days}d`} value={inr(k.revenue)} hint={`${k.orders} orders`} tone={k.revenue > 0 ? "up" : "default"} />
        <StatTile label="avg order value" value={inr(k.aov)} />
        <StatTile label="storefront views" value={k.views.toLocaleString("en-IN")} hint={`${k.productViews} product views`} />
        <StatTile label="conversion" value={`${k.conversion}%`} hint={`${k.beginCheckout} reached checkout`} tone={k.conversion >= 1 ? "up" : "default"} />
      </div>

      {/* revenue chart */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Revenue &amp; visits — last {days} days</div>
          <div style={{ fontSize: 12, color: ui.sub }}>bars = ₹ revenue/day</div>
        </div>
        <BarChart
          data={data.series.map((s) => ({ label: s.day.slice(5), value: s.revenue }))}
          format={(n) => inr(n)}
          height={150}
        />
        <div style={{ display: "flex", gap: 18, marginTop: 12, fontSize: 12, color: ui.sub, flexWrap: "wrap" }}>
          <span>Total views: <strong style={{ color: ui.ink }}>{data.series.reduce((a, s) => a + s.views, 0).toLocaleString("en-IN")}</strong></span>
          <span>Best day: <strong style={{ color: ui.ink }}>{inr(Math.max(0, ...data.series.map((s) => s.revenue)))}</strong></span>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* funnel */}
        <Card>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Conversion funnel</div>
          <div style={{ display: "grid", gap: 8 }}>
            {data.funnel.map((f, i) => (
              <div key={f.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700 }}>{f.label}</span>
                  <span style={{ color: ui.sub }}>
                    {f.value.toLocaleString("en-IN")}
                    {i > 0 && data.funnel[i - 1].value > 0 && (
                      <span style={{ marginLeft: 6, color: "#94A3B8" }}>
                        {Math.min(100, Math.round((f.value / data.funnel[i - 1].value) * 100))}%
                      </span>
                    )}
                  </span>
                </div>
                <div style={{ height: 10, background: "#F1F5F9", borderRadius: 4 }}>
                  <div style={{ width: `${(f.value / maxFunnel) * 100}%`, height: "100%", background: ui.brand, borderRadius: 4, transition: "width 0.3s" }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* top products */}
        <Card>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Top products</div>
          {data.topProducts.length === 0 ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>No sales in this period yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {data.topProducts.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9", paddingBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                    {i + 1}. {p.name || "Deleted product"}
                  </div>
                  <div style={{ fontSize: 12, color: ui.sub, whiteSpace: "nowrap" }}>{p.units} sold · {inr(p.revenue)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* recent orders */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Latest orders</div>
          {data.store.status === "preview" && <Badge tone="amber">demo store</Badge>}
        </div>
        {data.recentOrders.length === 0 ? (
          <p style={{ color: "#94A3B8", fontSize: 13 }}>No orders yet. Share your storefront link to start selling.</p>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {data.recentOrders.map((o) => (
              <div key={o.order_number} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9", paddingBottom: 6, fontSize: 13 }}>
                <div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{o.order_number}</span>
                  <span style={{ color: ui.sub, marginLeft: 8 }}>{o.customer_name}</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Badge tone="gray">{o.status}</Badge>
                  <strong>{inr(o.total)}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center" }}>
        {live ? "Auto-refreshing every 12s" : "Live updates paused"} · refresh #{tick}
      </p>
    </div>
  );
}
