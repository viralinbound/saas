"use client";

import { useState } from "react";
import { THEMES, CURRENCIES } from "@/lib/constants";

type StoreInfo = {
  id: string;
  name: string;
  slug: string;
  status: string;
  customDomain: string | null;
  theme: string;
  currency?: string;
  url: string;
};

export function SettingsClient({ store }: { store: StoreInfo }) {
  const [status, setStatus] = useState(store.status);
  const [theme, setTheme] = useState(store.theme);
  const [currency, setCurrency] = useState(store.currency || "INR");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function save(patch: Record<string, string>) {
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/stores/${store.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Saved successfully");
      if (patch.status) setStatus(patch.status);
      if (patch.theme) setTheme(patch.theme);
      if (patch.currency) setCurrency(patch.currency);
    } else {
      setMessage("Could not save");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 20, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>hosted URL</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, marginTop: 8, wordBreak: "break-all" }}>{store.url}</div>
        <p style={{ marginTop: 8, fontSize: 14 }}>In production this becomes <code>{store.slug}.supershowroom.com</code></p>
      </div>

      <div style={{ border: "1px solid #E4E1DA", background: status === "live" ? "#EEF2F8" : "#FFF7ED", padding: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800 }}>Publish store</h3>
        <p style={{ marginTop: 8 }}>When published, buyers can visit your URL and place orders.</p>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          {status === "draft" ? (
            <button type="button" disabled={loading} onClick={() => save({ status: "live" })} style={{ background: "#24457A", color: "#fff", border: 0, padding: "12px 18px", fontWeight: 800, cursor: "pointer" }}>
              Publish store →
            </button>
          ) : (
            <button type="button" disabled={loading} onClick={() => save({ status: "draft" })} style={{ background: "#14161A", color: "#fff", border: 0, padding: "12px 18px", fontWeight: 800, cursor: "pointer" }}>
              Unpublish (draft)
            </button>
          )}
          <span style={{ alignSelf: "center", fontWeight: 700 }}>Status: {status}</span>
        </div>
      </div>

      <div style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800 }}>Theme</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          {THEMES.map((t) => (
            <button key={t.key} type="button" onClick={() => save({ theme: t.key })} style={{ border: "1px solid #E4E1DA", background: theme === t.key ? "#EEF2F8" : "#fff", padding: 12, textAlign: "left", cursor: "pointer" }}>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800 }}>Currency</h3>
        <p style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>
          Prices and totals display in this currency across your storefront and dashboard. You enter prices directly in it — there is no conversion.
        </p>
        <select
          value={currency}
          onChange={(e) => save({ currency: e.target.value })}
          disabled={loading}
          style={{ marginTop: 12, border: "1px solid #E4E1DA", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontWeight: 700, minWidth: 220 }}
        >
          {Object.entries(CURRENCIES).map(([code, c]) => (
            <option key={code} value={code}>{code} — {c.symbol.trim() || code}</option>
          ))}
        </select>
      </div>

      {message && <p style={{ color: "#24457A", fontWeight: 700 }}>{message}</p>}
    </div>
  );
}
