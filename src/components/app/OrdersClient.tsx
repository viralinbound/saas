"use client";

import type { Order, OrderItem } from "@/lib/types";
import { formatINR } from "@/lib/constants";

type OrderWithItems = Order & { items: OrderItem[] };

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
    <div style={{ border: "1px solid #E4E1DA", background: "#fff" }}>
      <table style={{ width: "100%" }}>
        <thead>
          <tr style={{ background: "#FAF9F6", textAlign: "left" }}>
            <th style={{ padding: 12 }}>Order</th>
            <th style={{ padding: 12 }}>Customer</th>
            <th style={{ padding: 12 }}>Total</th>
            <th style={{ padding: 12 }}>Status</th>
            <th style={{ padding: 12 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} style={{ borderTop: "1px solid #E4E1DA" }}>
              <td style={{ padding: 12, fontFamily: "'JetBrains Mono', monospace" }}>{o.orderNumber}</td>
              <td style={{ padding: 12 }}>{o.customerName}<br /><span style={{ fontSize: 12, opacity: 0.7 }}>{o.customerPhone}</span></td>
              <td style={{ padding: 12 }}>{formatINR(o.total)}</td>
              <td style={{ padding: 12 }}>{o.status}</td>
              <td style={{ padding: 12 }}>
                <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} style={{ padding: 8, border: "1px solid #E4E1DA" }}>
                  {["placed", "processing", "dispatched", "delivered"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", opacity: 0.7 }}>No orders yet. Publish your store and share the URL.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
