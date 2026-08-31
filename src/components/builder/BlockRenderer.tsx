"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Block, BlockStyle } from "@/lib/builder";
import type { Product } from "@/lib/types";
import { formatMoney } from "@/lib/constants";
import { readableTextOn } from "@/lib/color";

type Ctx = {
  storeSlug: string;
  products: Product[];
  accent: string;
  search: string;
  setSearch: (v: string) => void;
  currency: string;
  addToCart: (p: Product) => void;
};

// ── storefront customer session, kept per-store in localStorage ──────────
type Customer = { id: string; email: string; name?: string | null; phone?: string | null };
function custKey(slug: string) {
  return `ssr_cust_${slug}`;
}
function readCust(slug: string): { token: string; customer: Customer } | null {
  try {
    const raw = localStorage.getItem(custKey(slug));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function storefrontToken(slug: string): string | null {
  return readCust(slug)?.token ?? null;
}

function AccountBlock({ ctx, heading, note, align }: { ctx: Ctx; heading: string; note: string; align?: string }) {
  const onAccent = readableTextOn(ctx.accent, "#fff");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = readCust(ctx.storeSlug);
    if (!saved) return;
    setCustomer(saved.customer);
    fetch("/api/storefront/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "me", storeSlug: ctx.storeSlug, token: saved.token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.customer) setCustomer(d.customer);
        else {
          localStorage.removeItem(custKey(ctx.storeSlug));
          setCustomer(null);
        }
      })
      .catch(() => {});
  }, [ctx.storeSlug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/storefront/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: tab, storeSlug: ctx.storeSlug, ...form }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(d.error || "Could not complete that.");
      return;
    }
    try {
      localStorage.setItem(custKey(ctx.storeSlug), JSON.stringify({ token: d.token, customer: d.customer }));
    } catch {}
    setCustomer(d.customer);
  }

  async function logout() {
    const saved = readCust(ctx.storeSlug);
    await fetch("/api/storefront/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout", storeSlug: ctx.storeSlug, token: saved?.token }),
    }).catch(() => {});
    try {
      localStorage.removeItem(custKey(ctx.storeSlug));
    } catch {}
    setCustomer(null);
  }

  const inp: React.CSSProperties = { border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", width: "100%", fontSize: "0.9rem" };

  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, maxWidth: 420, margin: align === "center" ? "0 auto" : undefined }}>
      <div style={{ fontWeight: 900, fontSize: "1.1rem" }}>{heading || "Your account"}</div>
      {customer ? (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: "0.92rem" }}>Signed in as <strong>{customer.name || customer.email}</strong></p>
          <button type="button" onClick={logout} style={{ marginTop: 12, background: "#0F172A", color: "#fff", border: 0, padding: "9px 14px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: "0.85rem", color: "#64748B", marginTop: 4 }}>{note || "Sign in to track orders and save addresses."}</p>
          <div style={{ display: "flex", gap: 6, margin: "12px 0" }}>
            {(["login", "register"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid " + (tab === t ? ctx.accent : "#E2E8F0"), background: tab === t ? ctx.accent : "#fff", color: tab === t ? onAccent : "#0F172A", fontWeight: 800, cursor: "pointer", fontSize: "0.82rem" }}>
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
            {tab === "register" && (
              <>
                <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} />
                <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} />
              </>
            )}
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} />
            <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inp} />
            {err && <div style={{ color: "#B91C1C", fontSize: "0.8rem" }}>{err}</div>}
            <button type="submit" disabled={busy} style={{ background: ctx.accent, color: onAccent, border: 0, padding: "10px 12px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>
              {busy ? "Please wait…" : tab === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

type CollField = { key: string; label: string; type: string };
type CollView = {
  collection: { key: string; name: string; fields: CollField[]; allowPublicSubmit: boolean; requireLogin: boolean };
  records: { id: string; data: Record<string, unknown>; createdAt: string }[];
};

function CollectionBlock({ ctx, collectionKey, mode, heading, submitLabel, align }: {
  ctx: Ctx; collectionKey: string; mode: string; heading: string; submitLabel: string; align?: string;
}) {
  const onAccent = readableTextOn(ctx.accent, "#fff");
  const [view, setView] = useState<CollView | null>(null);
  const [error, setError] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(() => {
    if (!collectionKey) return;
    fetch(`/api/storefront/collection?store=${encodeURIComponent(ctx.storeSlug)}&key=${encodeURIComponent(collectionKey)}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setView(d)))
      .catch(() => setError("Could not load."));
  }, [collectionKey, ctx.storeSlug]);

  useEffect(load, [load, nonce]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/storefront/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeSlug: ctx.storeSlug, key: collectionKey, data: values, token: storefrontToken(ctx.storeSlug) }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(d.error || "Could not submit.");
      return;
    }
    setDone(true);
    setValues({});
    setNonce((n) => n + 1);
  }

  const inp: React.CSSProperties = { border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", width: "100%", fontSize: "0.9rem" };
  const htmlType = (t: string) => (t === "number" ? "number" : t === "email" ? "email" : t === "phone" ? "tel" : t === "date" ? "date" : "text");

  if (!collectionKey) return <p style={{ color: "#94A3B8", fontSize: "0.85rem" }}>Set a collection key for this block.</p>;
  if (error && !view) return <p style={{ color: "#B91C1C", fontSize: "0.85rem" }}>{error}</p>;
  if (!view) return <p style={{ color: "#94A3B8", fontSize: "0.85rem" }}>Loading…</p>;

  const fields = view.collection.fields || [];

  if (mode === "form") {
    return (
      <div style={{ maxWidth: 460, margin: align === "center" ? "0 auto" : undefined }}>
        {heading && <h3 style={{ fontWeight: 900, fontSize: "1.2rem", marginBottom: 12 }}>{heading}</h3>}
        {done ? (
          <div style={{ background: "#ECFDF5", border: "1px solid #10B981", borderRadius: 10, padding: 14, fontWeight: 700 }}>
            ✓ Thanks — your response was recorded.
            <button type="button" onClick={() => setDone(false)} style={{ marginLeft: 10, background: "none", border: 0, textDecoration: "underline", cursor: "pointer" }}>Add another</button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
            {fields.map((f) => (
              <label key={f.key} style={{ display: "grid", gap: 4, fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>
                {f.label}
                {f.type === "textarea" ? (
                  <textarea rows={3} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} style={{ ...inp, resize: "vertical" }} />
                ) : f.type === "checkbox" ? (
                  <input type="checkbox" checked={values[f.key] === "true"} onChange={(e) => setValues({ ...values, [f.key]: String(e.target.checked) })} />
                ) : (
                  <input type={htmlType(f.type)} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} style={inp} />
                )}
              </label>
            ))}
            {error && <div style={{ color: "#B91C1C", fontSize: "0.8rem" }}>{error}</div>}
            <button type="submit" disabled={busy} style={{ background: ctx.accent, color: onAccent, border: 0, padding: "11px 14px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>
              {busy ? "Submitting…" : submitLabel || "Submit"}
            </button>
          </form>
        )}
      </div>
    );
  }

  // list mode
  return (
    <div>
      {heading && <h3 style={{ fontWeight: 900, fontSize: "1.2rem", marginBottom: 12 }}>{heading}</h3>}
      {view.records.length === 0 ? (
        <p style={{ color: "#94A3B8", fontSize: "0.85rem" }}>No entries yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
            <thead>
              <tr>
                {fields.map((f) => (
                  <th key={f.key} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #E2E8F0", fontWeight: 800 }}>{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.records.map((r) => (
                <tr key={r.id}>
                  {fields.map((f) => (
                    <td key={f.key} style={{ padding: "8px 10px", borderBottom: "1px solid #F1F5F9" }}>{String(r.data[f.key] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function wrap(style: BlockStyle, children: React.ReactNode, extra: React.CSSProperties = {}) {
  // Auto-contrast: a custom background with no explicit text colour gets light
  // text on dark, dark text on light.
  const autoColor =
    style.color ||
    (style.bgImage ? "#FFFFFF" : style.bg ? readableTextOn(style.bg) : undefined);
  const outer: React.CSSProperties = {
    background: style.bgImage
      ? `${style.bg ? `linear-gradient(${style.bg}, ${style.bg}), ` : ""}url(${style.bgImage}) center/cover no-repeat`
      : style.bg || undefined,
    color: autoColor,
    padding: `${style.padY ?? 40}px 20px`,
    marginTop: style.mt || undefined,
    marginBottom: style.mb || undefined,
    borderRadius: style.radius ? Math.min(style.radius, 999) : undefined,
    ...extra,
  };
  const inner: React.CSSProperties = {
    maxWidth: style.maxWidth || 1120,
    margin: "0 auto",
    textAlign: style.align || "left",
    fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
    fontWeight: style.fontWeight || undefined,
    letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
    lineHeight: style.lineHeight || undefined,
  };
  return (
    <section className="ssr-block" style={outer}>
      <div style={inner}>{children}</div>
    </section>
  );
}

function One({ block, ctx }: { block: Block; ctx: Ctx }) {
  const p = block.props;
  const s = block.style;
  const str = (k: string, d = "") => String(p[k] ?? d);
  const onAccent = readableTextOn(ctx.accent, "#fff");
  const money = (n: number) => formatMoney(n, ctx.currency || "INR");

  switch (block.type) {
    case "heading": {
      const lvl = str("level", "h2");
      const size = lvl === "h1" ? "clamp(1.9rem,4vw,2.8rem)" : lvl === "h3" ? "1.25rem" : "clamp(1.4rem,3vw,2rem)";
      return wrap(s, <div style={{ fontWeight: 900, fontSize: size, lineHeight: 1.15 }}>{str("text", "Heading")}</div>);
    }
    case "text":
      return wrap(s, <p style={{ fontSize: "1rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{str("text")}</p>);
    case "image":
      return wrap(s, str("src") ? (
        <img src={str("src")} alt={str("alt")} style={{ width: "100%", maxWidth: "100%", borderRadius: Number(p.radius) || 12, display: "block", margin: s.align === "center" ? "0 auto" : undefined }} />
      ) : <div style={{ background: "#F1F5F9", borderRadius: 12, padding: 40, color: "#94A3B8", textAlign: "center" }}>Add an image URL</div>);
    case "button": {
      const solid = str("variant", "solid") === "solid";
      return wrap(s, (
        <a href={str("href", "#")} style={{
          display: "inline-block", padding: "12px 22px", borderRadius: 8, fontWeight: 800, textDecoration: "none",
          background: solid ? ctx.accent : "transparent", color: solid ? onAccent : ctx.accent,
          border: solid ? "0" : `2px solid ${ctx.accent}`,
        }}>{str("label", "Button")}</a>
      ));
    }
    case "video":
      return wrap(s, str("src") ? (
        <video
          src={str("src")}
          poster={str("poster") || undefined}
          controls={p.controls !== false}
          autoPlay={p.autoplay === true}
          loop={p.loop === true}
          muted={p.autoplay === true}
          playsInline
          style={{ width: "100%", maxWidth: "100%", borderRadius: Number(p.radius) || 12, display: "block", margin: s.align === "center" ? "0 auto" : undefined, background: "#000" }}
        />
      ) : <div style={{ background: "#F1F5F9", borderRadius: 12, padding: 40, color: "#94A3B8", textAlign: "center" }}>Add a video URL or upload one</div>);
    case "spacer":
      return <div style={{ height: Number(p.height) || 40 }} />;
    case "divider":
      return wrap(s, <hr style={{ border: 0, borderTop: "1px solid #E2E8F0" }} />);
    case "hero":
      return (
        <section className="ssr-block" style={{ position: "relative", minHeight: 380, display: "grid", alignItems: "center", padding: "56px 24px", color: "#fff",
          backgroundImage: str("image") ? `linear-gradient(0deg, rgba(0,0,0,0.35), rgba(0,0,0,0.15)), url(${str("image")})` : `linear-gradient(135deg, ${ctx.accent}, #0f172a)`,
          backgroundSize: "cover", backgroundPosition: "center" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", width: "100%" }}>
            <h1 style={{ fontSize: "clamp(1.9rem,4vw,3rem)", fontWeight: 900, maxWidth: 640, lineHeight: 1.1 }}>{str("heading", "Welcome")}</h1>
            {str("subheading") && <p style={{ marginTop: 14, maxWidth: 520, fontSize: "1.05rem", opacity: 0.95 }}>{str("subheading")}</p>}
            {str("ctaLabel") && (
              <a href={str("ctaHref", "#products")} style={{ display: "inline-block", marginTop: 22, background: "#CCFF00", color: "#000", padding: "13px 26px", borderRadius: 8, fontWeight: 900, textDecoration: "none" }}>
                {str("ctaLabel")} →
              </a>
            )}
          </div>
        </section>
      );
    case "trust": {
      const items = str("items", "Secure Checkout, COD Available, Easy Returns, Fast Dispatch").split(",").map((x) => x.trim()).filter(Boolean);
      return wrap(s, (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: s.align === "center" ? "center" : "flex-start", fontWeight: 700, fontSize: "0.9rem" }}>
          {items.map((t) => <span key={t}>✓ {t}</span>)}
        </div>
      ));
    }
    case "richtext":
      return wrap(s, (
        <>
          {str("heading") && <h2 style={{ fontWeight: 900, fontSize: "1.5rem" }}>{str("heading")}</h2>}
          {str("body") && <p style={{ marginTop: 12, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{str("body")}</p>}
        </>
      ));
    case "newsletter":
      return wrap(s, (
        <>
          <h2 style={{ fontWeight: 900, fontSize: "1.4rem" }}>{str("heading", "Join our newsletter")}</h2>
          <p style={{ marginTop: 8, opacity: 0.72 }}>{str("subheading")}</p>
          <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: s.align === "center" ? "center" : "flex-start", flexWrap: "wrap" }}>
            <input placeholder="you@email.com" style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", minWidth: 240 }} />
            <button type="button" style={{ background: ctx.accent, color: onAccent, border: 0, padding: "10px 18px", borderRadius: 8, fontWeight: 800 }}>Subscribe</button>
          </div>
        </>
      ));
    case "account":
      return wrap(s, <AccountBlock ctx={ctx} heading={str("heading")} note={str("note")} align={s.align} />);
    case "collection":
      return wrap(s, (
        <CollectionBlock
          ctx={ctx}
          collectionKey={str("collectionKey")}
          mode={str("mode", "list")}
          heading={str("heading")}
          submitLabel={str("submitLabel", "Submit")}
          align={s.align}
        />
      ));
    case "embed":
      return wrap(s, <div dangerouslySetInnerHTML={{ __html: str("html") }} />);
    case "columns": {
      const cols = block.children || [];
      return wrap(s, (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length || 2}, 1fr)`, gap: 20 }}>
          {cols.map((col, i) => (
            <div key={i}>{(col || []).map((c) => <One key={c.id} block={c} ctx={ctx} />)}</div>
          ))}
        </div>
      ));
    }
    case "products": {
      const n = Number(str("columns", "3")) || 3;
      const list = ctx.products.filter((pr) => !ctx.search || pr.name.toLowerCase().includes(ctx.search.toLowerCase()));
      return wrap(s, (
        <div id="products">
          {str("heading") && <h2 style={{ fontWeight: 900, fontSize: "1.4rem", marginBottom: 14 }}>{str("heading")}</h2>}
          {p.showSearch !== false && (
            <input value={ctx.search} onChange={(e) => ctx.setSearch(e.target.value)} placeholder="Search products…"
              style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", marginBottom: 16, width: 220 }} />
          )}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${Math.round(1000 / n)}px, 1fr))`, gap: 18 }}>
            {list.map((pr) => {
              const disc = pr.mrp && pr.mrp > pr.price ? Math.round(((pr.mrp - pr.price) / pr.mrp) * 100) : 0;
              return (
                <div key={pr.id} style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", background: "#fff", textAlign: "left" }}>
                  <div style={{ position: "relative", aspectRatio: "1", background: "#F8FAFC" }}>
                    {pr.image && <img src={pr.image} alt={pr.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    {disc > 0 && <span style={{ position: "absolute", top: 8, left: 8, background: "#FF2D75", color: "#fff", fontSize: 11, fontWeight: 900, padding: "2px 7px", borderRadius: 4 }}>{disc}% OFF</span>}
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.92rem" }}>{pr.name}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginTop: 8 }}>
                      <span style={{ fontWeight: 900 }}>{money(pr.price)}</span>
                      {pr.mrp && pr.mrp > pr.price && <span style={{ textDecoration: "line-through", color: "#94A3B8", fontSize: "0.82rem" }}>{money(pr.mrp)}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <Link href={`/s/${ctx.storeSlug}/p/${pr.id}`} style={{ flex: 1, textAlign: "center", padding: 9, border: "1px solid #E2E8F0", borderRadius: 8, fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", color: "#0F172A" }}>View</Link>
                      <button type="button" onClick={() => ctx.addToCart(pr)} style={{ flex: 1, background: ctx.accent, color: onAccent, border: 0, padding: 9, borderRadius: 8, fontWeight: 800, cursor: "pointer", fontSize: "0.82rem" }}>Add</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {list.length === 0 && <p style={{ textAlign: "center", padding: 30, color: "#64748B" }}>No products found.</p>}
        </div>
      ));
    }
    default:
      return null;
  }
}

export function BlockRenderer({ blocks, ctx, showHidden = false }: { blocks: Block[]; ctx: Ctx; showHidden?: boolean }) {
  const visible = blocks.filter((b) => showHidden || !b.style?.hidden);
  const flow = visible.filter((b) => !b.style?.free);
  const floated = visible.filter((b) => b.style?.free);
  return (
    <div style={{ position: "relative" }}>
      {flow.map((b) => <One key={b.id} block={b} ctx={ctx} />)}
      {floated.map((b) => (
        <div key={b.id} style={{ position: "absolute", left: b.style.x ?? 0, top: b.style.y ?? 0, width: b.style.w || undefined, zIndex: 5 }}>
          <One block={b} ctx={ctx} />
        </div>
      ))}
    </div>
  );
}
