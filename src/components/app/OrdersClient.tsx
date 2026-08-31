"use client";

import type { Order, OrderItem } from "@/lib/types";
import { formatINR } from "@/lib/constants";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

type OrderWithItems = Order & { items: OrderItem[] };

function statusTint(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("deliver")) return "#EAF4EC";
  if (s.includes("cancel") || s.includes("refund")) return "#FBECEC";
  if (s.includes("dispatch") || s.includes("ship")) return "#EEF2F8";
  return "#F1EFE9";
}

export function OrdersClient({ orders }: { orders: OrderWithItems[] }) {
  async function updateStatus(id: string, status: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    window.location.reload();
  }

  return (
    <div style={{ border: "1px solid #E4E1DA", background: "#FAF9F6" }}>
      <div className="rtable" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F1EFE9" }}>
              {["order", "customer", "items", "total", "status", "update"].map((h, i) => (
                <th key={h} style={{ textAlign: "left", padding: i === 0 || i === 5 ? "12px 20px" : "12px 12px", fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid #E4E1DA" }}>
                <td data-label="order" style={{ padding: "13px 20px", fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>
                  {o.orderNumber}
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </div>
                </td>
                <td data-label="customer" style={{ padding: "13px 12px", fontWeight: 700 }}>
                  {o.customerName}
                  <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 400, opacity: 0.7, marginTop: 2 }}>{o.customerPhone}</div>
                </td>
                <td data-label="items" style={{ padding: "13px 12px", opacity: 0.8 }}>
                  {o.items.length} item{o.items.length === 1 ? "" : "s"}
                </td>
                <td data-label="total" style={{ padding: "13px 12px", fontFamily: MONO, fontSize: 13, fontWeight: 700 }}>{formatINR(o.total)}</td>
                <td data-label="status" style={{ padding: "13px 12px" }}>
                  <span style={{ border: "1px solid #E4E1DA", background: statusTint(o.status), padding: "4px 9px", fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>{o.status}</span>
                </td>
                <td data-label="update" style={{ padding: "13px 20px" }}>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    style={{ padding: "8px 10px", border: "1px solid #E4E1DA", background: "#fff", fontFamily: MONO, fontSize: 11 }}
                  >
                    {["placed", "processing", "dispatched", "delivered", "cancelled"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 26, textAlign: "center", opacity: 0.7 }}>
                  No orders yet. Publish your store and share the URL.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
