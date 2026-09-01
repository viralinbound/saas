"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { ROOT_DOMAIN } from "@/lib/domains";
import { THEMES } from "@/lib/constants";
import {
  isStarterTemplate,
  starterLayout,
  seedLayoutPatch,
  seedStarterConfig,
  starterTemplateName,
  STARTER_TEMPLATE_KEYS,
  DEFAULT_LAYOUT_BLOCKS,
  LAYOUT_BLOCKS,
  type LayoutPatch,
} from "@/lib/layoutCommerce";

type Gate = {
  plan: string;
  isDemo: boolean;
  canPublishLive: boolean;
  customDomain: boolean;
  label: string;
  sectionStyleEditor?: boolean;
  addSections?: boolean;
};

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

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const box: React.CSSProperties = { border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 16 };
const label: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#14161A",
  display: "block",
  marginBottom: 10,
};
const inp: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #E4E1DA",
  borderRadius: 0,
  fontSize: 14,
  background: "#FFFFFF",
};

const FONT_PAIRS = [
  { name: "bricolage", stack: "'Instrument Sans', system-ui, sans-serif", sample: "Aa modern grotesque" },
  { name: "instrument", stack: "'Instrument Serif', Georgia, serif", sample: "Aa editorial serif" },
  { name: "jetbrains", stack: "'JetBrains Mono', monospace", sample: "Aa technical mono" },
] as const;

const RADII = [
  { label: "sharp", value: "0px" },
  { label: "soft", value: "8px" },
  { label: "round", value: "20px" },
] as const;

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
  const [hostedPath, setHostedPath] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState("");
  const [previewNonce, setPreviewNonce] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("mobile");
  const [showCopy, setShowCopy] = useState(false);

  useEffect(() => {
    fetch("/api/design")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setMsg(d.error);
          setLoaded(true);
          return;
        }
        // A store on one of the six .dc templates whose saved config predates
        // the redesign: upgrade it in-place to the .dc starter config (Save
        // persists it; the storefront already renders the new design).
        if (isStarterTemplate(d.templateKey) && !(d.draftConfig && d.draftConfig.layout)) {
          const seeded = seedStarterConfig(d.templateKey, d.store?.name || "Your Store");
          setConfig(seeded.config);
          setTokens(seeded.tokens);
          setDirty(true);
        } else {
          setConfig(d.draftConfig);
          setTokens(d.tokens);
        }
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
      .catch(() => {
        setMsg("Could not load the editor.");
        setLoaded(true);
      });
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

  function patchTokens(p: Partial<ThemeTokens>) {
    setTokens((t) => ({ ...t, ...p }));
    setDirty(true);
  }

  // ── starter (.dc) layout editing ─────────────────────────────────────
  const isStarter = !!(config.layout && Object.keys(config.layout).length > 0);
  const savedPatch = (config.layout || {}) as LayoutPatch;
  // Show every field the .dc layout offers: fall back to the base layout for
  // anything the merchant hasn't touched yet (e.g. stores seeded before a
  // field was added). Edits still write only to config.layout.
  const patch: LayoutPatch = isStarter
    ? { ...seedLayoutPatch(starterLayout(templateKey), storeName || "Your Store"), ...savedPatch }
    : savedPatch;
  const blockState: Record<string, boolean> = { ...DEFAULT_LAYOUT_BLOCKS, ...(config.blocks || {}) };

  function patchLayout(p: Partial<LayoutPatch>) {
    mutate((c) => ({ ...c, layout: { ...(c.layout as LayoutPatch), ...p } }));
  }
  // repeatable-row list editing on a LayoutPatch array field
  function patchRow<K extends "tiles" | "reviews" | "trust">(field: K, i: number, row: Partial<NonNullable<LayoutPatch[K]>[number]>) {
    const list = [...((patch[field] as unknown[]) ?? [])] as Record<string, unknown>[];
    list[i] = { ...list[i], ...row };
    patchLayout({ [field]: list } as Partial<LayoutPatch>);
  }
  function addRow<K extends "tiles" | "reviews" | "trust">(field: K, blank: Record<string, unknown>) {
    patchLayout({ [field]: [...((patch[field] as unknown[]) ?? []), blank] } as Partial<LayoutPatch>);
  }
  function delRow<K extends "tiles" | "reviews" | "trust">(field: K, i: number) {
    patchLayout({ [field]: ((patch[field] as unknown[]) ?? []).filter((_, x) => x !== i) } as Partial<LayoutPatch>);
  }
  function patchSig(row: number, r: { label?: string; value?: string }) {
    const sig = patch.signature ?? { title: "", rows: [] };
    const rows = [...sig.rows];
    rows[row] = { ...rows[row], ...r };
    patchLayout({ signature: { ...sig, rows } });
  }
  function toggleBlock(id: string) {
    mutate((c) => {
      const cur: Record<string, boolean> = { ...DEFAULT_LAYOUT_BLOCKS, ...(c.blocks || {}) };
      return { ...c, blocks: { ...cur, [id]: !cur[id] } };
    });
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
    setSaving(true);
    setMsg("");
    const r = await persist(config, tokens, templateKey);
    setSaving(false);
    if (r.ok) {
      setDirty(false);
      setMsg("Draft saved.");
      setPreviewNonce((n) => n + 1);
    } else if ((r.error || "").includes("TEMPLATE_LOCKED") || r.status === 403) {
      setMsg("That template needs a higher plan — choose a plan to unlock it.");
    } else setMsg(r.error || "Save failed.");
  }

  // Live preview: when an edit stops for ~700ms, quietly save the draft and
  // refresh the preview iframe so changes show without pressing Save.
  useEffect(() => {
    if (!loaded || !dirty) return;
    const t = setTimeout(async () => {
      const r = await persist(config, tokens, templateKey);
      if (r.ok) {
        setDirty(false);
        setPreviewNonce((n) => n + 1);
      }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, tokens, templateKey, dirty, loaded]);

  async function publish() {
    setPublishing(true);
    setMsg("");
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
    setPublishing(true);
    setMsg("");
    const res = await fetch("/api/design/publish", { method: "DELETE" });
    setPublishing(false);
    if (res.ok) {
      setStatus("draft");
      setMsg("Store unpublished.");
    }
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
      setMsg(`"${starterTemplateName(t.key)}" needs a higher plan — choose one to unlock it.`);
      router.push("/app/plans");
      return;
    }
    setTemplateKey(t.key);

    // Every template is one of the six redesigned .dc layouts: seed its full
    // patch + block toggles + tokens, save through the same RPC, then offer to
    // load its sample catalogue.
    const { config: starterCfg, tokens: starterTokens } = seedStarterConfig(t.key, storeName || "Your Store");
    setConfig(starterCfg);
    setTokens(starterTokens);
    setSaving(true);
    const r = await persist(starterCfg, starterTokens, t.key);
    setSaving(false);
    if (r.ok) {
      setDirty(false);
      // Fill an empty catalogue with this template's products (never touches a
      // catalogue that already has products — use "load sample products" for that).
      let seeded = 0;
      try {
        const sc = await fetch("/api/design/seed-catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: t.key }),
        }).then((x) => x.json());
        seeded = sc.added ?? 0;
      } catch {}
      setPreviewNonce((n) => n + 1);
      setMsg(
        `"${starterTemplateName(t.key)}" applied${seeded ? ` with ${seeded} sample products` : ""} — customise every part below, then Publish.`
      );
    } else {
      setDirty(true);
      setMsg(
        r.error?.includes("TEMPLATE_LOCKED") || r.status === 403
          ? "That template needs a higher plan — choose a plan to unlock it."
          : `Template applied (not saved: ${r.error || "error"}). Click Save.`
      );
    }
  }

  async function loadSampleProducts() {
    const replace = confirm(
      "Replace the whole catalogue with this template's sample products? Any products you added will be removed."
    );
    setMsg("Loading sample products…");
    const res = await fetch("/api/design/seed-catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: templateKey, replace }),
    });
    const d = await res.json().catch(() => ({}));
    setMsg(
      res.ok
        ? d.replaced
          ? `Catalogue replaced with ${d.added} products from this template.`
          : `${d.added ?? 0} sample products added to your catalogue.`
        : d.error || "Could not load samples."
    );
    if (res.ok) setPreviewNonce((n) => n + 1);
  }

  const swatches = useMemo(() => {
    const colors = [...THEMES.map((t) => t.accent), tokens.accent];
    return Array.from(new Set(colors)).slice(0, 5);
  }, [tokens.accent]);

  const fontKey = tokens.headingFont.includes("JetBrains")
    ? "jetbrains"
    : tokens.headingFont.includes("Serif") || tokens.headingFont.includes("Playfair") || tokens.headingFont.includes("Fraunces")
      ? "instrument"
      : "bricolage";

  const radiusPx = Number.parseInt(tokens.radius, 10);
  const radiusKey = radiusPx === 0 ? "sharp" : radiusPx <= 10 ? "soft" : "round";

  if (!loaded) return <p style={{ opacity: 0.6, padding: 24 }}>Loading editor…</p>;

  const hostedFull = `https://www.${ROOT_DOMAIN}${hostedPath || `/${storeSlug}`}`;
  const mobile = previewDevice === "mobile";
  const changeLabel = dirty ? "1 unpublished change" : status === "draft" ? "draft · not published" : "theme saved";

  return (
    <div className="ssr-editor-shell">
      <aside className="ssr-editor-rail">
        <div className="ssr-editor-note">Tip: fine-tuning is easier on a laptop — but the preview, theme picks and Publish all work here.</div>

        <div>
          <div style={label}>industry preset</div>
          <div style={{ display: "grid", gap: 6 }}>
            {(templates.length ? templates : STARTER_TEMPLATE_KEYS.map((k) => ({ key: k, name: starterTemplateName(k), locked: false, tierLabel: null }))).map((t) => {
              const selected = templateKey === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => applyTemplate(t as TemplateRow)}
                  style={{
                    border: "1px solid #E4E1DA",
                    background: selected ? "#14161A" : "#FAF9F6",
                    color: selected ? "#FAF9F6" : "#14161A",
                    padding: "10px 12px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left",
                    opacity: t.locked ? 0.72 : 1,
                  }}
                >
                  <span>{isStarterTemplate(t.key) ? starterTemplateName(t.key) : (t.name || t.key)}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9 }}>
                    {t.locked ? "lock" : selected ? "✦" : ""}
                  </span>
                </button>
              );
            })}
          </div>
          <Link href="/app/plans" style={{ display: "block", marginTop: 10, fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#2F6B4F", textDecoration: "none", fontWeight: 700 }}>
            unlock premium presets →
          </Link>
        </div>

        <div>
          <div style={label}>accent colour</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {swatches.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => patchTokens({ accent: c })}
                style={{
                  width: 44,
                  height: 44,
                  background: c,
                  border: tokens.accent.toLowerCase() === c.toLowerCase() ? "2px solid #14161A" : "1px solid #E4E1DA",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
            <input
              type="color"
              value={tokens.accent}
              onChange={(e) => patchTokens({ accent: e.target.value })}
              style={{ width: 44, height: 44, border: "1px solid #E4E1DA", background: "#fff", padding: 0, cursor: "pointer" }}
            />
          </div>
        </div>

        <div>
          <div style={label}>type pairing</div>
          <div style={{ display: "grid", gap: 6 }}>
            {FONT_PAIRS.map((f) => {
              const on = fontKey === f.name;
              return (
                <button
                  key={f.name}
                  type="button"
                  onClick={() =>
                    patchTokens({
                      headingFont: f.stack,
                      bodyFont: f.name === "jetbrains" ? f.stack : "'Instrument Sans', system-ui, sans-serif",
                    })
                  }
                  style={{
                    border: "1px solid #E4E1DA",
                    background: on ? "#EEF2F8" : "#FAF9F6",
                    padding: "10px 12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 10,
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontFamily: f.stack, fontSize: 17, fontWeight: 700 }}>{f.sample}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7 }}>{f.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={label}>corners</div>
          <div style={{ display: "flex", gap: 6 }}>
            {RADII.map((r) => {
              const on = radiusKey === r.label;
              return (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => patchTokens({ radius: r.value })}
                  style={{
                    flex: 1,
                    border: "1px solid #E4E1DA",
                    background: on ? "#EEF2F8" : "#FAF9F6",
                    padding: 10,
                    textAlign: "center",
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {isStarter ? (
          <>
            <div>
              <div style={label}>homepage content</div>
              <div style={{ display: "grid", gap: 10 }}>
                {([
                  ["store", "store name"],
                  ["promo", "promo bar text"],
                  ["headline", "hero headline"],
                  ["sub", "hero sub-text"],
                  ["cta", "hero button"],
                  ["cta2", "secondary button"],
                  ["gridTitle", "product grid title"],
                  ["gridMeta", "product grid link"],
                ] as [keyof LayoutPatch, string][]).map(([k, lbl]) => (
                  <label key={k} style={{ display: "block" }}>
                    <span style={{ ...label, marginBottom: 6 }}>{lbl}</span>
                    <input
                      style={inp}
                      value={String((patch[k] as string) ?? "")}
                      onChange={(e) => patchLayout({ [k]: e.target.value } as Partial<LayoutPatch>)}
                    />
                  </label>
                ))}
                <label style={{ display: "block" }}>
                  <span style={{ ...label, marginBottom: 6 }}>categories (comma separated)</span>
                  <input
                    style={inp}
                    value={(patch.chips ?? []).join(", ")}
                    onChange={(e) => patchLayout({ chips: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  />
                </label>
              </div>
            </div>

            <div>
              <div style={label}>feature banner</div>
              <div style={{ display: "grid", gap: 10 }}>
                {([
                  ["kicker", "eyebrow"],
                  ["headline", "headline"],
                  ["sub", "text"],
                  ["cta", "button"],
                  ["img", "image URL"],
                ] as [string, string][]).map(([k, lbl]) => (
                  <label key={k} style={{ display: "block" }}>
                    <span style={{ ...label, marginBottom: 6 }}>{lbl}</span>
                    <input
                      style={inp}
                      value={String((patch.banner?.[k as keyof typeof patch.banner] as string) ?? "")}
                      onChange={(e) => patchLayout({ banner: { ...(patch.banner || {}), [k]: e.target.value } })}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div style={label}>colours</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {([
                  ["bg", "page"],
                  ["card", "card"],
                  ["fg", "text"],
                  ["line", "lines"],
                  ["footBg", "footer bg"],
                  ["footFg", "footer text"],
                ] as [keyof LayoutPatch, string][]).map(([k, lbl]) => (
                  <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700 }}>
                    <input
                      type="color"
                      value={String((patch[k] as string) || "#ffffff")}
                      onChange={(e) => patchLayout({ [k]: e.target.value } as Partial<LayoutPatch>)}
                      style={{ width: 34, height: 30, border: "1px solid #E4E1DA", background: "#fff", padding: 2 }}
                    />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div style={label}>category tiles</div>
              <div style={{ display: "grid", gap: 8 }}>
                {(patch.tiles ?? []).map((t, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6 }}>
                    <input style={inp} value={t.name} placeholder="name" onChange={(e) => patchRow("tiles", i, { name: e.target.value })} />
                    <input style={inp} value={t.count} placeholder="count" onChange={(e) => patchRow("tiles", i, { count: e.target.value })} />
                    <button type="button" onClick={() => delRow("tiles", i)} style={{ border: "1px solid #E4E1DA", background: "#fff", padding: "0 10px", cursor: "pointer", fontFamily: MONO }}>×</button>
                  </div>
                ))}
                <button type="button" onClick={() => addRow("tiles", { name: "new", count: "0 items", img: (patch.tiles ?? [])[0]?.img || "" })} style={{ border: "1px dashed #E4E1DA", background: "#fff", padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ tile</button>
              </div>
            </div>

            <div>
              <div style={label}>signature features</div>
              <input style={{ ...inp, marginBottom: 8 }} value={patch.signature?.title ?? ""} placeholder="panel title" onChange={(e) => patchLayout({ signature: { title: e.target.value, rows: patch.signature?.rows ?? [] } })} />
              <div style={{ display: "grid", gap: 8 }}>
                {(patch.signature?.rows ?? []).map((r, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <input style={inp} value={r.label} placeholder="label" onChange={(e) => patchSig(i, { label: e.target.value })} />
                    <input style={inp} value={r.value} placeholder="value" onChange={(e) => patchSig(i, { value: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={label}>customer reviews</div>
              <div style={{ display: "grid", gap: 10 }}>
                {(patch.reviews ?? []).map((r, i) => (
                  <div key={i} style={{ border: "1px solid #E4E1DA", padding: 8, display: "grid", gap: 6 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6 }}>
                      <input style={inp} value={r.name} placeholder="name" onChange={(e) => patchRow("reviews", i, { name: e.target.value })} />
                      <input style={inp} value={r.city} placeholder="city" onChange={(e) => patchRow("reviews", i, { city: e.target.value })} />
                      <button type="button" onClick={() => delRow("reviews", i)} style={{ border: "1px solid #E4E1DA", background: "#fff", padding: "0 10px", cursor: "pointer", fontFamily: MONO }}>×</button>
                    </div>
                    <textarea style={{ ...inp, minHeight: 54, resize: "vertical" }} value={r.text} placeholder="review" onChange={(e) => patchRow("reviews", i, { text: e.target.value })} />
                  </div>
                ))}
                <button type="button" onClick={() => addRow("reviews", { name: "", city: "", text: "" })} style={{ border: "1px dashed #E4E1DA", background: "#fff", padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ review</button>
              </div>
            </div>

            <div>
              <div style={label}>trust badges</div>
              <div style={{ display: "grid", gap: 6 }}>
                {(patch.trust ?? []).map((t, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6 }}>
                    <input style={inp} value={t.title} placeholder="title" onChange={(e) => patchRow("trust", i, { title: e.target.value })} />
                    <input style={inp} value={t.sub} placeholder="sub" onChange={(e) => patchRow("trust", i, { sub: e.target.value })} />
                    <button type="button" onClick={() => delRow("trust", i)} style={{ border: "1px solid #E4E1DA", background: "#fff", padding: "0 10px", cursor: "pointer", fontFamily: MONO }}>×</button>
                  </div>
                ))}
                <button type="button" onClick={() => addRow("trust", { title: "new badge", sub: "" })} style={{ border: "1px dashed #E4E1DA", background: "#fff", padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ badge</button>
              </div>
            </div>

            <div>
              <div style={label}>whatsapp number</div>
              <input style={inp} value={patch.whatsapp ?? ""} placeholder="9199…" onChange={(e) => patchLayout({ whatsapp: e.target.value })} />
            </div>

            <div>
              <div style={label}>sections {gate.addSections === false ? "· plan-gated" : ""}</div>
              <div style={{ display: "grid", gap: 6, opacity: gate.addSections === false ? 0.55 : 1 }}>
                {LAYOUT_BLOCKS.map((blk) => {
                  const on = blockState[blk.id] !== false;
                  return (
                    <button
                      key={blk.id}
                      type="button"
                      disabled={gate.addSections === false}
                      onClick={() => toggleBlock(blk.id)}
                      style={{
                        border: "1px solid #E4E1DA",
                        background: on ? "#EEF2F8" : "#FAF9F6",
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: gate.addSections === false ? "not-allowed" : "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{blk.label}</span>
                      <span style={{ fontFamily: MONO, fontSize: 10 }}>{on ? "on" : "off"}</span>
                    </button>
                  );
                })}
              </div>
              {gate.addSections === false && (
                <Link href="/app/plans" style={{ display: "block", marginTop: 8, fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#2F6B4F", textDecoration: "none", fontWeight: 700 }}>
                  choose a plan to toggle sections →
                </Link>
              )}
            </div>
          </>
        ) : (
        <div>
          <div style={label}>homepage blocks</div>
          <div style={{ display: "grid", gap: 6 }}>
            {config.sections.map((s) => {
              const lib = SECTION_LIBRARY.find((l) => l.type === s.type);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleVisible(s.id)}
                  style={{
                    border: "1px solid #E4E1DA",
                    background: s.visible ? "#EEF2F8" : "#FAF9F6",
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{(lib?.label || s.type).toLowerCase()}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10 }}>{s.visible ? "on" : "off"}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {SECTION_LIBRARY.filter((l) => !config.sections.some((s) => s.type === l.type)).map((l) => (
              <button
                key={l.type}
                type="button"
                onClick={() => add(l.type)}
                style={{ border: "1px dashed #E4E1DA", background: "#fff", padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                + {l.label.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        )}

        <div>
          <div style={label}>project address</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            <span style={{ color: "#94A3B8", fontSize: 11, fontFamily: MONO }}>{`www.${ROOT_DOMAIN}/`}</span>
            <input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} style={{ ...inp, maxWidth: 140, fontFamily: MONO, fontSize: 12 }} />
          </div>
        </div>

        <div>
          <div style={label}>custom domain</div>
          {gate.customDomain ? (
            <>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="shop.yourbrand.in" style={inp} />
                <button type="button" onClick={saveDomain} style={{ border: 0, background: "#24457A", color: "#fff", padding: "9px 12px", fontWeight: 800, cursor: "pointer" }}>
                  save
                </button>
              </div>
              {domainMsg && <p style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>{domainMsg}</p>}
            </>
          ) : (
            <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
              custom domains unlock on pro.{" "}
              <Link href="/app/plans" style={{ color: "#2F6B4F", fontWeight: 700, textDecoration: "none" }}>
                unlock →
              </Link>
            </div>
          )}
        </div>
      </aside>

      <div className="ssr-editor-canvas">
        {gate.isDemo && (
          <div style={{ border: "1px solid #E4E1DA", background: "#EEF2F8", padding: "14px 16px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>demo mode · {gate.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>watermarked preview until you unlock a plan</div>
            </div>
            <Link href="/app/plans" style={{ border: 0, background: "#2F6B4F", color: "#FAF9F6", padding: "10px 16px", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
              unlock live →
            </Link>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {(["mobile", "desktop"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setPreviewDevice(d)}
                style={{
                  border: "1px solid #E4E1DA",
                  background: previewDevice === d ? "#EEF2F8" : "#FAF9F6",
                  padding: "9px 14px",
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPreviewNonce((n) => n + 1)}
              style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: "9px 14px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer" }}
            >
              refresh
            </button>
            <a
              href={`/preview/${storeSlug}`}
              target="_blank"
              rel="noreferrer"
              style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: "9px 14px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, textDecoration: "none", color: "#14161A" }}
            >
              open ↗
            </a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#24457A" }}>{changeLabel}</span>
            <button type="button" onClick={save} disabled={saving || !dirty} style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: dirty ? "pointer" : "default", opacity: dirty ? 1 : 0.45 }}>
              {saving ? "saving…" : "save draft"}
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={publishing}
              style={{ border: "1px solid #E4E1DA", background: "#24457A", color: "#FFFFFF", padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 12px 28px rgba(20,22,26,0.10)" }}
            >
              {publishing ? "publishing…" : "publish theme"}
            </button>
            {(status === "live" || status === "preview") && (
              <button type="button" onClick={unpublish} disabled={publishing} style={{ border: "1px solid #E4E1DA", background: "#14161A", color: "#fff", padding: "10px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                unpublish
              </button>
            )}
          </div>
        </div>

        {msg && (
          <div style={{ ...box, background: status === "live" ? "#EAF4EC" : "#EEF2F8", fontWeight: 600, fontSize: 14 }}>{msg}</div>
        )}

        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748B" }}>
          {status === "live" ? "live" : status === "preview" ? "demo preview" : "will publish to"} ·{" "}
          <a href={hostedFull} target="_blank" rel="noreferrer" style={{ color: "#24457A", fontWeight: 700, wordBreak: "break-all" }}>
            {hostedFull}
          </a>
          {liveUrl ? ` · ${liveUrl}` : ""}
          {publishedAt ? ` · ${new Date(publishedAt).toLocaleDateString()}` : ""}
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 8px" }}>
          <div
            style={{
              border: "1px solid #E4E1DA",
              background: "#14161A",
              padding: 9,
              borderRadius: mobile ? 34 : 0,
              boxShadow: "0 12px 28px rgba(20,22,26,0.10)",
              width: mobile ? 380 : "100%",
              maxWidth: "100%",
            }}
          >
            <iframe
              key={previewNonce}
              src={`/preview/${storeSlug}?n=${previewNonce}`}
              title="Storefront preview"
              style={{
                display: "block",
                width: "100%",
                height: mobile ? 640 : 720,
                border: 0,
                background: "#fff",
                borderRadius: mobile ? 26 : 0,
              }}
            />
          </div>
        </div>

        {isStarter && (
          <button
            type="button"
            onClick={loadSampleProducts}
            style={{ border: "1px dashed #14161A", background: "#FAF9F6", padding: "10px 12px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", textAlign: "left" }}
          >
            load this template&apos;s sample products →
          </button>
        )}

        {!isStarter && (
        <button
          type="button"
          onClick={() => setShowCopy((v) => !v)}
          style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: "10px 12px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", textAlign: "left" }}
        >
          {showCopy ? "hide block copy" : "edit block copy"}
        </button>
        )}

        {!isStarter && showCopy && (
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
        )}
      </div>
    </div>
  );
}

function SectionCard({
  s,
  first,
  last,
  onField,
  onToggle,
  onMove,
  onRemove,
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
          <button type="button" onClick={() => onMove(s.id, -1)} disabled={first} style={iconBtn}>
            ↑
          </button>
          <button type="button" onClick={() => onMove(s.id, 1)} disabled={last} style={iconBtn}>
            ↓
          </button>
          <button type="button" onClick={() => onToggle(s.id)} style={iconBtn}>
            {s.visible ? "on" : "off"}
          </button>
          {lib?.removable && (
            <button type="button" onClick={() => onRemove(s.id)} style={{ ...iconBtn, color: "#DC2626" }}>
              ✕
            </button>
          )}
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

const iconBtn: React.CSSProperties = {
  minWidth: 28,
  height: 28,
  border: "1px solid #E4E1DA",
  background: "#fff",
  borderRadius: 0,
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 700,
  padding: "0 6px",
};
