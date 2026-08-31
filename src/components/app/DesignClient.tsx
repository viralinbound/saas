"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SECTION_LIBRARY,
  newSection,
  type Section,
  type SectionType,
  type StoreConfig,
  type ThemeTokens,
  DEFAULT_TOKENS,
} from "@/lib/customization";
import { buildTemplateConfig } from "@/lib/templatePresets";
import { ROOT_DOMAIN } from "@/lib/domains";

type Gate = { plan: string; isDemo: boolean; canPublishLive: boolean; customDomain: boolean; label: string };

type TemplateRow = {
  key: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
  accent_color: string;
  announcement: string | null;
  minPlan?: string;
  tierLabel?: string | null;
  isPremium?: boolean;
  locked?: boolean;
};

const box: React.CSSProperties = { border: "1px solid #E4E1DA", background: "#fff", padding: 16 };
const label: React.CSSProperties = { fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#475569", display: "block", marginBottom: 6 };
const inp: React.CSSProperties = { width: "100%", padding: "9px 11px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14 };

export function DesignClient({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [config, setConfig] = useState<StoreConfig>({ sections: [] });
  const [tokens, setTokens] = useState<ThemeTokens>(DEFAULT_TOKENS);
  const [templateKey, setTemplateKey] = useState("fashion");
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [storeName, setStoreName] = useState("");
  const [status, setStatus] = useState("draft");
  const [subdomain, setSubdomain] = useState(storeSlug);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [gate, setGate] = useState<Gate>({ plan: "free", isDemo: true, canPublishLive: false, customDomain: false, label: "Start Free" });
  const [storeId, setStoreId] = useState<string>("");
  const [customDomain, setCustomDomain] = useState("");
  const [domainMsg, setDomainMsg] = useState("");
  const [hostedPath, setHostedPath] = useState("");   // /h/<brand>
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState("");
  const [previewNonce, setPreviewNonce] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    fetch("/api/design")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setMsg(d.error); setLoaded(true); return; }
        setConfig(d.draftConfig);
        setTokens(d.tokens);
        setTemplateKey(d.templateKey);
        setTemplates(d.templates || []);
        setStoreName(d.store?.name || "");
        setStatus(d.store?.status || "draft");
        setSubdomain(d.store?.subdomain || d.store?.slug || storeSlug);
        setPublishedAt(d.publishedAt);
        if (d.gate) setGate(d.gate);
        setStoreId(d.store?.id || "");
        setCustomDomain(d.store?.customDomain || "");
        setHostedPath(d.store?.hostedPath || "");
        setLoaded(true);
      })
      .catch(() => { setMsg("Could not load the editor."); setLoaded(true); });
  }, [storeSlug]);

  const mutate = useCallback((fn: (c: StoreConfig) => StoreConfig) => {
    setConfig((c) => fn(structuredClone(c)));
    setDirty(true);
  }, []);

  function setField(id: string, key: string, value: string | boolean) {
    mutate((c) => {
      const s = c.sections.find((x) => x.id === id);
      if (s) s.settings[key] = value;
      return c;
    });
  }
  function toggleVisible(id: string) {
    mutate((c) => {
      const s = c.sections.find((x) => x.id === id);
      if (s) s.visible = !s.visible;
      return c;
    });
  }
  function move(id: string, dir: -1 | 1) {
    mutate((c) => {
      const i = c.sections.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= c.sections.length) return c;
      [c.sections[i], c.sections[j]] = [c.sections[j], c.sections[i]];
      return c;
    });
  }
  function remove(id: string) {
    mutate((c) => ({ sections: c.sections.filter((x) => x.id !== id) }));
  }
  function add(type: SectionType) {
    mutate((c) => ({ sections: [...c.sections, newSection(type)] }));
  }

  async function persist(cfg: StoreConfig, tks: ThemeTokens, tkey: string) {
    const res = await fetch("/api/design", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftConfig: cfg, tokens: tks, templateKey: tkey }),
    });
    const d = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, error: d.error as string | undefined };
  }

  async function save() {
    setSaving(true); setMsg("");
    const r = await persist(config, tokens, templateKey);
    setSaving(false);
    if (r.ok) { setDirty(false); setMsg("Draft saved."); setPreviewNonce((n) => n + 1); }
    else if ((r.error || "").includes("TEMPLATE_LOCKED") || r.status === 403) {
      setMsg("That template needs a higher plan — choose a plan to unlock it.");
    }
    else setMsg(r.error || "Save failed.");
  }

  async function publish() {
    setPublishing(true); setMsg("");
    if (dirty) await save();
    const res = await fetch("/api/design/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subdomain }),
    });
    const d = await res.json();
    setPublishing(false);
    if (res.ok) {
      setStatus(d.status || (d.demo ? "preview" : "live"));
      setPublishedAt(new Date().toISOString());
      setLiveUrl(d.url || null);
      if (d.hostPath) setHostedPath(`/${d.hostPath}`);
      setMsg(
        d.demo
          ? `Demo published at www.${ROOT_DOMAIN}/${d.hostPath} (watermarked).`
          : `Published live at www.${ROOT_DOMAIN}/${d.hostPath}`
      );
    } else setMsg(d.error || "Publish failed.");
  }

  async function unpublish() {
    setPublishing(true); setMsg("");
    const res = await fetch("/api/design/publish", { method: "DELETE" });
    setPublishing(false);
    if (res.ok) { setStatus("draft"); setMsg("Store unpublished."); }
  }

  async function saveDomain() {
    setDomainMsg("");
    if (!storeId) return;
    const res = await fetch(`/api/stores/${storeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customDomain: customDomain.trim() }),
    });
    setDomainMsg(res.ok ? "Domain saved. Point its DNS: CNAME → cname.vercel-dns.com" : "Could not save domain.");
  }

  async function applyTemplate(t: TemplateRow) {
    if (t.locked) {
      setMsg(`"${t.name}" is a ${t.tierLabel || "premium"} template — choose a plan to unlock it.`);
      router.push("/app/plans");
      return;
    }
    setTemplateKey(t.key);
    const preset = buildTemplateConfig(t.key, storeName || "Your Store");
    if (preset) {
      setConfig(preset.config);
      setTokens(preset.tokens);
      // cloud-save immediately so the live preview matches /preview/template/<key>
      setSaving(true);
      const r = await persist(preset.config, preset.tokens, t.key);
      setSaving(false);
      if (r.ok) {
        setDirty(false);
        setPreviewNonce((n) => n + 1);
        setMsg(`"${t.name}" applied & saved — the preview now matches the template demo. Edit anything, then Publish.`);
      } else {
        setDirty(true);
        setMsg(r.error?.includes("TEMPLATE_LOCKED") || r.status === 403
          ? "That template needs a higher plan — choose a plan to unlock it."
          : `"${t.name}" applied (not saved: ${r.error || "error"}). Click Save.`);
      }
    } else {
      setTokens((tk) => ({ ...tk, accent: t.accent_color || tk.accent }));
      mutate((c) => {
        const ann = c.sections.find((s) => s.type === "announcement");
        if (ann && t.announcement) ann.settings.text = t.announcement;
        return c;
      });
      setMsg(`Template "${t.name}" applied — Save & Publish to go live.`);
    }
  }

  if (!loaded) return <p style={{ opacity: 0.6 }}>Loading editor…</p>;

  const previewWidth = previewDevice === "mobile" ? 390 : "100%";
  // hosted URL = https://www.supershowroom.in/h/<company>/<project>
  const hostedFull = `https://www.${ROOT_DOMAIN}${hostedPath || `/${storeSlug}`}`;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 20, alignItems: "start" }}>
      {/* ── editor column ── */}
      <div style={{ display: "grid", gap: 16 }}>
        {/* live draft preview */}
        <div style={{ ...box, padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #E4E1DA", background: "#FAFAF8" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>live preview · your draft</span>
            <div style={{ display: "flex", gap: 6 }}>
              {(["desktop", "mobile"] as const).map((d) => (
                <button key={d} type="button" onClick={() => setPreviewDevice(d)} style={{ border: `1px solid ${previewDevice === d ? "#24457A" : "#E2E8F0"}`, background: previewDevice === d ? "#EEF2F8" : "#fff", color: previewDevice === d ? "#24457A" : "#64748B", padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                  {d === "desktop" ? "🖥 Desktop" : "📱 Mobile"}
                </button>
              ))}
              <button type="button" onClick={() => setPreviewNonce((n) => n + 1)} style={{ border: "1px solid #E2E8F0", background: "#fff", padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>↻ Refresh</button>
              <a href={`/preview/${storeSlug}`} target="_blank" rel="noreferrer" style={{ border: "1px solid #E2E8F0", background: "#fff", padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 800, textDecoration: "none", color: "#24457A" }}>Open ↗</a>
            </div>
          </div>
          <div style={{ background: "#EEF0F3", padding: previewDevice === "mobile" ? 12 : 0, display: "flex", justifyContent: "center" }}>
            <iframe
              key={previewNonce}
              src={`/preview/${storeSlug}?n=${previewNonce}`}
              title="Storefront preview"
              style={{ width: previewWidth, maxWidth: "100%", height: 460, border: 0, background: "#fff", borderRadius: previewDevice === "mobile" ? 12 : 0, boxShadow: previewDevice === "mobile" ? "0 4px 16px rgba(0,0,0,0.12)" : "none" }}
            />
          </div>
          {dirty && (
            <div style={{ padding: "6px 12px", fontSize: 12, color: "#B45309", background: "#FFF7ED", borderTop: "1px solid #FED7AA" }}>
              Unsaved changes — click <strong>Save draft</strong> to update this preview.
            </div>
          )}
        </div>

        <div style={{ ...box, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between",
          background: status === "live" ? "#F0FDF4" : status === "preview" ? "#FFF7ED" : gate.isDemo ? "#FFF7ED" : "#F8FAFC",
          borderLeft: status === "live" ? "4px solid #16A34A" : status === "preview" ? "4px solid #B45309" : "4px solid #CBD5E1" }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              plan · {gate.label} · status ·
              {status === "live" ? (
                <span style={{ background: "#DCFCE7", color: "#166534", fontWeight: 800, padding: "2px 8px", borderRadius: 999, letterSpacing: "0.08em" }}>● LIVE</span>
              ) : status === "preview" ? (
                <span style={{ background: "#FEF3C7", color: "#92400E", fontWeight: 800, padding: "2px 8px", borderRadius: 999, letterSpacing: "0.08em" }}>DEMO PREVIEW</span>
              ) : (
                <span style={{ color: "#64748B" }}>{status}</span>
              )}
              {publishedAt ? ` · last published ${new Date(publishedAt).toLocaleDateString()}` : ""}
            </div>
            <div style={{ fontWeight: 800, marginTop: 6, display: "grid", gap: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748B" }}>
                {status === "live" ? "your live website" : status === "preview" ? "your demo website" : "will publish to"}
              </span>
              <a href={hostedFull} target="_blank" rel="noreferrer"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: status === "live" ? "#15803D" : "#0F172A", fontWeight: 800, wordBreak: "break-all" }}>
                {hostedFull} ↗
              </a>
              <span style={{ fontWeight: 500, fontSize: 12, color: "#94A3B8" }}>
                editor preview <a href={`/s/${storeSlug}`} target="_blank" rel="noreferrer" style={{ color: "#24457A", fontWeight: 700 }}>/s/{storeSlug}</a>
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={save} disabled={saving || !dirty} style={{ border: "1px solid #24457A", background: "#fff", color: "#24457A", padding: "10px 14px", fontWeight: 800, cursor: dirty ? "pointer" : "default", opacity: dirty ? 1 : 0.5 }}>
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button type="button" onClick={publish} disabled={publishing} style={{ border: 0, background: gate.isDemo ? "#B45309" : status === "live" ? "#16A34A" : "#24457A", color: "#fff", padding: "10px 16px", fontWeight: 800, cursor: "pointer" }}>
              {publishing ? "Publishing…" : gate.isDemo ? "Publish demo preview" : status === "live" ? "✓ Live · re-publish" : "Publish live"}
            </button>
            {gate.isDemo && (
              <Link href="/app/plans" style={{ border: "1px solid #16A34A", background: "#F0FDF4", color: "#15803D", padding: "10px 14px", fontWeight: 800, borderRadius: 8, textDecoration: "none" }}>
                🔓 Unlock live — choose a plan
              </Link>
            )}
            {(status === "live" || status === "preview") && (
              <button type="button" onClick={unpublish} disabled={publishing} style={{ border: "1px solid #E4E1DA", background: "#14161A", color: "#fff", padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>
                Unpublish
              </button>
            )}
          </div>
        </div>

        {msg && <div style={{ ...box, background: status === "live" ? "#F0FDF4" : "#F0F9FF", borderColor: status === "live" ? "#86EFAC" : "#BAE6FD", color: status === "live" ? "#15803D" : undefined, fontWeight: 600, fontSize: 14 }}>{msg}</div>}

        <div style={box}>
          <label style={label}>Project address (used in the hosted URL)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            <span style={{ color: "#94A3B8", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{`www.${ROOT_DOMAIN}/<company>/`}</span>
            <input
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="krish"
              style={{ ...inp, maxWidth: 180, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
          <p style={{ fontSize: 12.5, marginTop: 8, color: "#475569" }}>
            Publishing goes live at{" "}
            <a href={hostedFull} target="_blank" rel="noreferrer" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: "#15803D", wordBreak: "break-all" }}>
              {hostedFull}
            </a>
          </p>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {config.sections.map((s, idx) => (
            <SectionCard
              key={s.id}
              s={s}
              first={idx === 0}
              last={idx === config.sections.length - 1}
              onField={setField}
              onToggle={toggleVisible}
              onMove={move}
              onRemove={remove}
            />
          ))}
        </div>

        <div style={box}>
          <label style={label}>Add a section</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SECTION_LIBRARY.map((l) => (
              <button key={l.type} type="button" onClick={() => add(l.type)} style={{ border: "1px dashed #94A3B8", background: "#F8FAFC", padding: "8px 12px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                + {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── side column: templates + theme ── */}
      <div style={{ display: "grid", gap: 16, position: "sticky", top: 16 }}>
        <div style={box}>
          <label style={label}>Starter template</label>
          <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 8px" }}>Free templates are open. Premium & future templates unlock with a plan.</p>
          <div style={{ display: "grid", gap: 12 }}>
            {templates.map((t) => {
              const selected = templateKey === t.key;
              return (
                <div
                  key={t.key}
                  style={{
                    border: selected ? "2px solid #24457A" : "1px solid #E2E8F0",
                    borderRadius: 10, overflow: "hidden", background: "#fff",
                    opacity: t.locked ? 0.75 : 1,
                  }}
                >
                  {/* live mini preview of the real template storefront */}
                  <button
                    type="button"
                    onClick={() => applyTemplate(t)}
                    title={t.locked ? `${t.tierLabel || "Premium"} — choose a plan to unlock` : `Apply ${t.name}`}
                    style={{ display: "block", width: "100%", border: 0, padding: 0, cursor: "pointer", background: "#EEF0F3" }}
                  >
                    <div style={{ height: 118, overflow: "hidden", position: "relative", borderBottom: "1px solid #E2E8F0" }}>
                      <iframe
                        src={`/preview/template/${t.key}`}
                        title={`${t.name} preview`}
                        tabIndex={-1}
                        style={{ width: "312%", height: 378, border: 0, transform: "scale(0.32)", transformOrigin: "top left", pointerEvents: "none", filter: t.locked ? "grayscale(0.6)" : "none" }}
                      />
                    </div>
                  </button>
                  <div style={{ padding: "8px 10px", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 800, fontSize: 13, flex: 1 }}>{t.name}</span>
                    {t.locked ? (
                      <span style={{ fontSize: 10, fontWeight: 800, background: "#FEF3C7", color: "#92400E", padding: "2px 6px", borderRadius: 999 }}>🔒 {t.tierLabel || "Premium"}</span>
                    ) : t.isPremium ? (
                      <span style={{ fontSize: 10, fontWeight: 800, background: "#DCFCE7", color: "#166534", padding: "2px 6px", borderRadius: 999 }}>✓ {t.tierLabel}</span>
                    ) : null}
                  </div>
                  <div style={{ padding: "0 10px 10px", display: "flex", gap: 12, alignItems: "center" }}>
                    <button type="button" onClick={() => applyTemplate(t)} style={{ border: 0, background: selected ? "#EEF2F8" : "#24457A", color: selected ? "#24457A" : "#fff", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      {selected ? "● Applied" : "Use this template"}
                    </button>
                    <a href={`/preview/template/${t.key}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 800, color: "#24457A", textDecoration: "none" }}>
                      Full preview ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/app/plans" style={{ display: "block", marginTop: 8, fontSize: 12, fontWeight: 700, color: "#15803D" }}>
            🔓 Unlock premium templates →
          </Link>
        </div>

        <div style={box}>
          <label style={label}>Accent colour</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="color" value={tokens.accent} onChange={(e) => { setTokens({ ...tokens, accent: e.target.value }); setDirty(true); }} style={{ width: 44, height: 34, border: "1px solid #E2E8F0", borderRadius: 6, background: "#fff" }} />
            <input value={tokens.accent} onChange={(e) => { setTokens({ ...tokens, accent: e.target.value }); setDirty(true); }} style={inp} />
          </div>
        </div>

        <div style={box}>
          <label style={label}>Custom domain</label>
          {gate.customDomain ? (
            <>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="shop.yourbrand.in" style={inp} />
                <button type="button" onClick={saveDomain} style={{ border: 0, background: "#24457A", color: "#fff", padding: "9px 12px", fontWeight: 800, borderRadius: 8, cursor: "pointer" }}>Save</button>
              </div>
              {domainMsg && <p style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>{domainMsg}</p>}
            </>
          ) : (
            <div style={{ fontSize: 12, color: "#78716C" }}>
              🔒 Custom domains are on <strong>Pro</strong> and above.{" "}
              <Link href="/app/plans" style={{ color: "#15803D", fontWeight: 700 }}>Upgrade →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  s, first, last, onField, onToggle, onMove, onRemove,
}: {
  s: Section;
  first: boolean;
  last: boolean;
  onField: (id: string, key: string, value: string | boolean) => void;
  onToggle: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
}) {
  const lib = SECTION_LIBRARY.find((l) => l.type === s.type);
  return (
    <div style={{ ...box, opacity: s.visible ? 1 : 0.55 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <strong style={{ fontSize: 14 }}>{lib?.label || s.type}</strong>
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" onClick={() => onMove(s.id, -1)} disabled={first} style={iconBtn}>↑</button>
          <button type="button" onClick={() => onMove(s.id, 1)} disabled={last} style={iconBtn}>↓</button>
          <button type="button" onClick={() => onToggle(s.id)} style={iconBtn}>{s.visible ? "🙈" : "👁"}</button>
          {lib?.removable && <button type="button" onClick={() => onRemove(s.id)} style={{ ...iconBtn, color: "#DC2626" }}>✕</button>}
        </div>
      </div>
      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        {lib?.fields.map((f) => (
          <div key={f.key}>
            <label style={label}>{f.label}</label>
            {f.kind === "toggle" ? (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={s.settings[f.key] !== false} onChange={(e) => onField(s.id, f.key, e.target.checked)} />
                {s.settings[f.key] !== false ? "On" : "Off"}
              </label>
            ) : f.kind === "textarea" ? (
              <textarea rows={2} value={String(s.settings[f.key] ?? "")} onChange={(e) => onField(s.id, f.key, e.target.value)} style={{ ...inp, resize: "vertical" }} />
            ) : f.kind === "color" ? (
              <input type="color" value={String(s.settings[f.key] || "#000000")} onChange={(e) => onField(s.id, f.key, e.target.value)} />
            ) : (
              <input value={String(s.settings[f.key] ?? "")} onChange={(e) => onField(s.id, f.key, e.target.value)} style={inp} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = { width: 28, height: 28, border: "1px solid #E2E8F0", background: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 12 };
