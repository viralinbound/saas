"use client";

import { useCallback, useEffect, useState } from "react";
import { ROOT_DOMAIN } from "@/lib/domains";
import { formatINR } from "@/lib/constants";

type Project = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  theme: string;
  brand: string;
  hostedPath: string;
  brandedHost: string;
  customDomain: string | null;
  createdAt: string;
  stats?: { orders: number; revenue: number; products: number; views: number };
};

const THEMES = ["fashion", "bakery", "skincare", "kirana", "tech", "jewels"] as const;
const box: React.CSSProperties = { border: "1px solid #E4E1DA", background: "#fff", borderRadius: 10, overflow: "hidden" };
const MONO = "'JetBrains Mono', monospace";
const mini: React.CSSProperties = { border: "1px solid #E4E1DA", background: "#fff", borderRadius: 6, padding: "5px 9px", fontSize: 11, fontWeight: 800, cursor: "pointer" };

function statusPill(s: string) {
  const map: Record<string, [string, string]> = {
    live: ["#DCFCE7", "#166534"],
    preview: ["#FEF3C7", "#92400E"],
    draft: ["#F1F5F9", "#475569"],
  };
  const [bg, fg] = map[s] ?? map.draft;
  return <span style={{ background: bg, color: fg, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase" }}>{s}</span>;
}

/** Scaled, non-interactive live preview of a store's current draft. */
function PreviewThumb({ slug, nonce, height = 150 }: { slug: string; nonce: number; height?: number }) {
  return (
    <div style={{ height, overflow: "hidden", background: "#EEF0F3", position: "relative", borderBottom: "1px solid #E4E1DA" }}>
      <iframe
        key={nonce}
        src={`/preview/${slug}?thumb=${nonce}`}
        title={`${slug} preview`}
        tabIndex={-1}
        style={{
          width: "333%",
          height: `${Math.round(height * 3.33)}px`,
          border: 0,
          transform: "scale(0.3)",
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export function ProjectGrid({ compact = false }: { compact?: boolean }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", theme: "fashion" as (typeof THEMES)[number] });
  const [domainDraft, setDomainDraft] = useState<Record<string, string>>({});
  const [nonce, setNonce] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/projects");
      const d = await r.json();
      setProjects(d.projects ?? []);
      setActiveId(d.activeId ?? null);
      setDomainDraft(Object.fromEntries((d.projects ?? []).map((p: Project) => [p.id, p.customDomain ?? ""])));
    } catch {
      setMsg("Could not load projects.");
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function open(id: string) {
    await fetch("/api/projects", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    // stay on the current page — just re-resolve against the new active project
    window.location.reload();
  }

  async function publish(id: string, live: boolean) {
    setBusyId(id);
    setMsg("");
    const res = live
      ? await fetch("/api/projects/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
      : await fetch(`/api/projects/publish?id=${id}`, { method: "DELETE" });
    const d = await res.json();
    setBusyId(null);
    if (!res.ok) { setMsg(d.error || "Action failed."); return; }
    setMsg(live ? `Published → ${d.url || "your branded host"}` : "Store unpublished.");
    setNonce((n) => n + 1);
    load();
  }

  async function create() {
    if (draft.name.trim().length < 2) { setMsg("Give the project a name."); return; }
    setCreating(true);
    setMsg("");
    const r = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    const d = await r.json();
    setCreating(false);
    if (!r.ok) { setMsg(d.error || "Could not create project."); return; }
    window.location.assign("/app/design");
  }

  async function saveDomain(id: string) {
    const r = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, customDomain: domainDraft[id] ?? "" }),
    });
    const d = await r.json();
    if (r.ok) { setMsg(`Domain saved. Point its DNS: CNAME → cname.vercel-dns.com`); load(); }
    else setMsg(d.error || "Could not save domain.");
  }

  async function rename(id: string, name: string) {
    await fetch("/api/projects", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name }) });
    load();
  }

  if (loading) return <p style={{ opacity: 0.6, fontSize: 13 }}>Loading projects…</p>;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!compact && (
        <p style={{ fontSize: 13, color: "#475569" }}>
          Every project is its own store — its own template, products, pages, media, orders and hosted address.
          Publish as many as you like; each goes live on its own <span style={{ fontFamily: MONO }}>&lt;brand&gt;.{ROOT_DOMAIN}</span> (or your custom domain).
        </p>
      )}
      {msg && <div style={{ border: "1px solid #86EFAC", background: "#F0FDF4", borderRadius: 8, padding: "10px 12px", fontWeight: 600, fontSize: 13 }}>{msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${compact ? 240 : 300}px, 1fr))`, gap: 14 }}>
        {projects.map((p) => {
          const isActive = p.id === activeId;
          const isLive = p.status === "live" || p.status === "preview";
          return (
            <div key={p.id} style={{ ...box, borderColor: isActive ? "#24457A" : "#E4E1DA", borderWidth: isActive ? 2 : 1 }}>
              <PreviewThumb slug={p.slug} nonce={nonce} height={compact ? 120 : 150} />
              <div style={{ padding: 14, display: "grid", gap: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                  {compact ? (
                    <strong style={{ fontSize: 14 }}>{p.name}</strong>
                  ) : (
                    <input
                      defaultValue={p.name}
                      onBlur={(e) => e.target.value.trim() && e.target.value !== p.name && rename(p.id, e.target.value.trim())}
                      style={{ fontWeight: 800, fontSize: 14, border: "1px solid transparent", borderRadius: 6, padding: "2px 4px", flex: 1, background: "transparent" }}
                    />
                  )}
                  {statusPill(p.status)}
                </div>
                <div style={{ fontSize: 11, color: "#64748B", fontFamily: MONO }}>
                  {p.theme} · {p.plan}{isActive && <span style={{ color: "#16A34A", fontWeight: 800 }}> · ACTIVE</span>}
                </div>

                {p.stats && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, margin: "2px 0" }}>
                    {[
                      ["revenue", formatINR(p.stats.revenue)],
                      ["orders", String(p.stats.orders)],
                      ["products", String(p.stats.products)],
                      ["views", String(p.stats.views)],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: "#F8FAFC", border: "1px solid #E4E1DA", borderRadius: 6, padding: "5px 6px", textAlign: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: "#0F172A", lineHeight: 1.1 }}>{v}</div>
                        <div style={{ fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", fontFamily: MONO }}>{k}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "grid", gap: 2, fontSize: 11 }}>
                  {(() => {
                    const url = p.customDomain ? `https://${p.customDomain}` : `https://www.${ROOT_DOMAIN}${p.hostedPath}`;
                    return (
                      <a href={url} target="_blank" rel="noreferrer"
                        style={{ color: isLive ? "#15803D" : "#0F172A", fontWeight: 800, fontFamily: MONO, textDecoration: "none", wordBreak: "break-all" }}>
                        {url.replace(/^https:\/\//, "")} ↗
                      </a>
                    );
                  })()}
                </div>

                {!compact && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      value={domainDraft[p.id] ?? ""}
                      onChange={(e) => setDomainDraft((s) => ({ ...s, [p.id]: e.target.value }))}
                      placeholder="shop.yourbrand.com"
                      style={{ flex: 1, border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 8px", fontSize: 12 }}
                    />
                    <button type="button" onClick={() => saveDomain(p.id)} style={mini}>Save</button>
                  </div>
                )}

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button type="button" disabled={isActive} onClick={() => open(p.id)} style={{ ...mini, background: isActive ? "#EEF2F8" : "#24457A", color: isActive ? "#24457A" : "#fff", borderColor: "#24457A" }}>
                    {isActive ? "● Active" : "Switch to this"}
                  </button>
                  <button type="button" disabled={busyId === p.id} onClick={() => publish(p.id, true)} style={{ ...mini, background: "#16A34A", color: "#fff", borderColor: "#16A34A" }}>
                    {busyId === p.id ? "…" : isLive ? "Re-publish" : "Publish live"}
                  </button>
                  {isLive && (
                    <button type="button" disabled={busyId === p.id} onClick={() => publish(p.id, false)} style={{ ...mini, color: "#B91C1C", borderColor: "#FCA5A5" }}>
                      Unpublish
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* new project */}
        <div style={{ ...box, border: "1px dashed #CBD5E1", padding: 14, display: "grid", gap: 9, alignContent: "start" }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>＋ New project</div>
          <input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Project / store name"
            style={{ border: "1px solid #E2E8F0", borderRadius: 6, padding: "8px 10px", fontSize: 13 }}
          />
          <select
            value={draft.theme}
            onChange={(e) => setDraft((d) => ({ ...d, theme: e.target.value as (typeof THEMES)[number] }))}
            style={{ border: "1px solid #E2E8F0", borderRadius: 6, padding: "8px 10px", fontSize: 13 }}
          >
            {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button type="button" onClick={create} disabled={creating} style={{ border: 0, background: "#14161A", color: "#fff", padding: "10px 12px", fontWeight: 800, borderRadius: 8, cursor: "pointer" }}>
            {creating ? "Creating…" : "Create & open builder →"}
          </button>
        </div>
      </div>
    </div>
  );
}
