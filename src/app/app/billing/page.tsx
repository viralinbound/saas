import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { PLANS, formatINR } from "@/lib/constants";

export default async function BillingPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");
  const plan = PLANS[store.plan as keyof typeof PLANS] || PLANS.pro;
  const totalSales = store.orders.reduce((s, o) => s + o.total, 0);
  const totalFees = store.orders.reduce((s, o) => s + o.platformFee, 0);

  return (
    <AppShell store={store} crumb="plan & fees" title="billing" activePath="/app/billing">
      <div style={{ display: "grid", gap: 20, maxWidth: 720 }}>
        <div style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 24 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase" }}>current plan</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{plan.name}</div>
          <p style={{ marginTop: 8 }}>₹{plan.price.toLocaleString("en-IN")}/yr · {plan.feePercent}% sales fee</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ border: "1px solid #E4E1DA", padding: 20 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Total sales processed</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{formatINR(totalSales)}</div>
          </div>
          <div style={{ border: "1px solid #E4E1DA", padding: 20 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Platform fees owed</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{formatINR(totalFees)}</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
