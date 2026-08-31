"use client";

import { useEffect, useState } from "react";

type Item = { id: string; kind: string; title: string; detail?: string; at: string };

const ICON: Record<string, string> = {
  publish: "🚀",
  preview: "👁️",
  unpublish: "⏸️",
  plan: "💳",
  order: "🛍️",
};

function ago(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function ActivityFeed() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 20 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>
        recent activity
      </div>
      {items === null ? (
        <p style={{ marginTop: 12, opacity: 0.5, fontSize: 14 }}>Loading…</p>
      ) : items.length === 0 ? (
        <p style={{ marginTop: 12, color: "#94A3B8", fontSize: 14 }}>Nothing yet. Publish your store or take an order to see activity here.</p>
      ) : (
        <ul style={{ marginTop: 12, display: "grid", gap: 2, listStyle: "none", padding: 0 }}>
          {items.map((it) => (
            <li key={it.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 8px", borderBottom: "1px solid #F1F5F9" }}>
              <span style={{ fontSize: 16, lineHeight: "20px" }}>{ICON[it.kind] || "•"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{it.title}</div>
                {it.detail && (
                  <div style={{ fontSize: 12, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.detail}</div>
                )}
              </div>
              <span style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>{ago(it.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
