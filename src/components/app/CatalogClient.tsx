"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { formatINR } from "@/lib/constants";
import { parseMedia, serializeMedia, mediaCover } from "@/lib/media";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

type Draft = {
  id: string | null;
  name: string;
  description: string;
  price: string; // rupees
  mrp: string; // rupees
  category: string;
  stock: string;
  sku: string;
  variants: string;
  published: boolean;
  images: string[];
  videos: string[];
  galleryIx: number;
};

const emptyDraft = (): Draft => ({
  id: null,
  name: "",
  description: "",
  price: "",
  mrp: "",
  category: "all",
  stock: "100",
  sku: "",
  variants: "",
  published: true,
  images: [],
  videos: [],
  galleryIx: 0,
});

function draftFromProduct(p: Product): Draft {
  const m = parseMedia(p.image);
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    price: (p.price / 100).toString(),
    mrp: p.mrp != null ? (p.mrp / 100).toString() : "",
    category: p.category || "all",
    stock: String(p.stock),
    sku: p.sku ?? "",
    variants: p.variants ?? "",
    published: p.published,
    images: m.images,
    videos: m.videos,
    galleryIx: 0,
  };
}

const field: React.CSSProperties = {
  width: "100%",
  border: "1px solid #E4E1DA",
  background: "#FFFFFF",
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
};
const microLabel: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 9,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  marginBottom: 6,
  display: "block",
  color: "#475569",
};

export function CatalogClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return ["all", ...Array.from(set).filter((c) => c !== "all").sort()];
  }, [products]);

  const visible = useMemo(
    () =>
      products.filter((p) => {
        const catOk = activeCat === "all" || p.category === activeCat;
        const q = search.trim().toLowerCase();
        const searchOk = !q || p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q);
        return catOk && searchOk;
      }),
    [products, activeCat, search]
  );

  function openNew() {
    setError("");
    const d = emptyDraft();
    if (activeCat !== "all") d.category = activeCat;
    setDraft(d);
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError("");
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      price: Math.round(parseFloat(draft.price || "0") * 100),
      mrp: draft.mrp ? Math.round(parseFloat(draft.mrp) * 100) : null,
      category: (draft.category || "all").trim() || "all",
      stock: parseInt(draft.stock || "0", 10) || 0,
      sku: draft.sku.trim() || null,
      variants: draft.variants.trim() || null,
      published: draft.published,
      image: serializeMedia({ images: draft.images, videos: draft.videos }),
    };

    if (!payload.name || !payload.price) {
      setBusy(false);
      setError("Name and price are required.");
      return;
    }

    const res = await fetch(draft.id ? `/api/products/${draft.id}` : "/api/products", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save the product.");
      return;
    }
    const saved: Product = data.product;
    setProducts((prev) => {
      const i = prev.findIndex((p) => p.id === saved.id);
      if (i === -1) return [saved, ...prev];
      const copy = prev.slice();
      copy[i] = saved;
      return copy;
    });
    setDraft(null);
  }

  async function del() {
    if (!draft?.id) return;
    if (!confirm(`Delete "${draft.name}"? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/products/${draft.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not delete.");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== draft.id));
    setDraft(null);
  }

  return (
    <div className="ssr-catalog-grid" style={{ display: "grid", gridTemplateColumns: draft ? "minmax(0,1fr) 360px" : "minmax(0,1fr)", gap: 20, alignItems: "start" }}>
      {/* ---------------- list ---------------- */}
      <div style={{ border: "1px solid #E4E1DA", background: "#FAF9F6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid #E4E1DA", flexWrap: "wrap" }}>
          <div style={{ border: "1px solid #E4E1DA", background: "#FFFFFF", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.55 }}>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`search ${products.length} products`}
              style={{ border: 0, outline: "none", background: "transparent", fontSize: 13, width: 180 }}
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map((c) => {
              const on = c === activeCat;
              return (
                <button
                  key={c}
                  onClick={() => setActiveCat(c)}
                  style={{
                    border: `1px solid ${on ? "#24457A" : "#E4E1DA"}`,
                    background: on ? "#EEF2F8" : "#FFFFFF",
                    color: on ? "#24457A" : "#475569",
                    padding: "8px 12px",
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <button
            onClick={openNew}
            style={{ marginLeft: "auto", border: "1px solid #24457A", background: "#24457A", color: "#fff", padding: "9px 15px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            + add product
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F1EFE9" }}>
                {["product", "category", "price", "stock", "live"].map((h, i) => (
                  <th key={h} style={{ textAlign: "left", padding: i === 0 ? "11px 20px" : "11px 12px", fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const cover = mediaCover(p.image);
                const selected = draft?.id === p.id;
                return (
                  <tr
                    key={p.id}
                    onClick={() => { setError(""); setDraft(draftFromProduct(p)); }}
                    style={{ borderTop: "1px solid #E4E1DA", background: selected ? "#EEF2F8" : "transparent", cursor: "pointer" }}
                  >
                    <td style={{ padding: "11px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, border: "1px solid #E4E1DA", overflow: "hidden", flex: "none", background: "#F1EFE9" }}>
                          {cover && <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800 }}>{p.name}</div>
                          {p.sku && <div style={{ fontFamily: MONO, fontSize: 10, opacity: 0.6, marginTop: 2 }}>{p.sku}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 12px", fontFamily: MONO, fontSize: 11, opacity: 0.8 }}>{p.category}</td>
                    <td style={{ padding: "11px 12px", fontFamily: MONO, fontSize: 13, fontWeight: 700 }}>{formatINR(p.price)}</td>
                    <td style={{ padding: "11px 12px" }}>
                      <span style={{ border: "1px solid #E4E1DA", background: p.stock <= 3 ? "#FFF1E6" : "#F1EFE9", padding: "3px 8px", fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
                        {p.stock} left
                      </span>
                    </td>
                    <td style={{ padding: "11px 12px", fontFamily: MONO, fontSize: 11, color: p.published ? "#2F6B4F" : "#98502F" }}>
                      {p.published ? "live" : "hidden"}
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 28, textAlign: "center", opacity: 0.7 }}>
                    {products.length === 0 ? "No products yet — add your first one." : "No products match this filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- editor drawer ---------------- */}
      {draft && (
        <div className="ssr-catalog-editor" style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", boxShadow: "0 12px 28px rgba(20,22,26,0.10)", position: "sticky", top: 96 }}>
          <div style={{ borderBottom: "1px solid #E4E1DA", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              {draft.id ? "editing product" : "new product"}
            </div>
            <button onClick={() => setDraft(null)} style={{ border: 0, background: "none", cursor: "pointer", fontFamily: MONO, fontSize: 11, color: "#24457A" }}>close ✕</button>
          </div>

          <div style={{ padding: 16, display: "grid", gap: 14, maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}>
            <Gallery draft={draft} setDraft={setDraft} />

            <div>
              <label style={microLabel}>title</label>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={{ ...field, fontWeight: 700 }} />
            </div>

            <div>
              <label style={microLabel}>description</label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={3}
                placeholder="What makes this product worth buying…"
                style={{ ...field, resize: "vertical", lineHeight: 1.5 }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={microLabel}>price ₹</label>
                <input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} inputMode="decimal" style={{ ...field, fontFamily: MONO }} />
              </div>
              <div>
                <label style={microLabel}>mrp ₹</label>
                <input value={draft.mrp} onChange={(e) => setDraft({ ...draft, mrp: e.target.value })} inputMode="decimal" style={{ ...field, fontFamily: MONO }} />
              </div>
            </div>

            <CategoryPicker draft={draft} setDraft={setDraft} known={categories} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={microLabel}>stock</label>
                <input value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} inputMode="numeric" style={{ ...field, fontFamily: MONO }} />
              </div>
              <div>
                <label style={microLabel}>sku</label>
                <input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} style={{ ...field, fontFamily: MONO }} />
              </div>
            </div>

            <div>
              <label style={microLabel}>variants (slash-separated)</label>
              <input value={draft.variants} onChange={(e) => setDraft({ ...draft, variants: e.target.value })} placeholder="S / M / L / XL" style={{ ...field, fontFamily: MONO }} />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
              Published on storefront
            </label>

            {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", padding: 10, fontSize: 13 }}>{error}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={save} disabled={busy} style={{ flex: 1, border: "1px solid #14161A", background: "#14161A", color: "#9FBBE0", padding: 12, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                {busy ? "saving…" : draft.id ? "save changes" : "add product"}
              </button>
              {draft.id && (
                <button onClick={del} disabled={busy} style={{ border: "1px solid #E4E1DA", background: "#FFF1F1", color: "#B91C1C", padding: "12px 14px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                  delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- gallery with ◀ ▶ arrows + add image / video ---------------- */
function Gallery({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  const slides = [
    ...draft.images.map((url) => ({ type: "image" as const, url })),
    ...draft.videos.map((url) => ({ type: "video" as const, url })),
  ];
  const ix = Math.min(draft.galleryIx, Math.max(0, slides.length - 1));
  const cur = slides[ix];
  const step = (dir: -1 | 1) => {
    if (slides.length < 2) return;
    setDraft({ ...draft, galleryIx: (ix + dir + slides.length) % slides.length });
  };
  const addImage = () => {
    const url = prompt("Image URL (jpg / png / webp)");
    if (url && url.trim()) setDraft({ ...draft, images: [...draft.images, url.trim()], galleryIx: draft.images.length });
  };
  const addVideo = () => {
    const url = prompt("Video URL (mp4 / webm)");
    if (url && url.trim()) setDraft({ ...draft, videos: [...draft.videos, url.trim()], galleryIx: draft.images.length + draft.videos.length });
  };
  const removeCurrent = () => {
    if (!cur) return;
    if (cur.type === "image") {
      const i = draft.images.indexOf(cur.url);
      setDraft({ ...draft, images: draft.images.filter((_, k) => k !== i), galleryIx: 0 });
    } else {
      const i = draft.videos.indexOf(cur.url);
      setDraft({ ...draft, videos: draft.videos.filter((_, k) => k !== i), galleryIx: 0 });
    }
  };
  const moveCurrent = (dir: -1 | 1) => {
    if (!cur || cur.type !== "image") return;
    const i = draft.images.indexOf(cur.url);
    const j = i + dir;
    if (j < 0 || j >= draft.images.length) return;
    const arr = draft.images.slice();
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setDraft({ ...draft, images: arr, galleryIx: j });
  };

  return (
    <div>
      <label style={microLabel}>
        media · {slides.length} item{slides.length === 1 ? "" : "s"}{slides.length ? ` · ${ix + 1}/${slides.length}` : ""}
      </label>
      <div style={{ position: "relative", height: 168, border: "1px solid #E4E1DA", background: "#F1EFE9", overflow: "hidden" }}>
        {cur ? (
          cur.type === "image" ? (
            <img src={cur.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <video src={cur.url} controls muted style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000" }} />
          )
        ) : (
          <div style={{ display: "grid", placeItems: "center", height: "100%", fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.5 }}>
            no media yet
          </div>
        )}

        {slides.length > 1 && (
          <>
            <button onClick={() => step(-1)} aria-label="previous" style={arrowBtn("left")}>◀</button>
            <button onClick={() => step(1)} aria-label="next" style={arrowBtn("right")}>▶</button>
          </>
        )}
        {ix === 0 && cur?.type === "image" && (
          <span style={{ position: "absolute", top: 6, left: 6, background: "#14161A", color: "#EEF2F8", fontFamily: MONO, fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 6px" }}>cover</span>
        )}
      </div>

      {slides.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {slides.map((s, k) => (
            <button
              key={s.type + s.url + k}
              onClick={() => setDraft({ ...draft, galleryIx: k })}
              style={{ width: 40, height: 40, border: `1px solid ${k === ix ? "#24457A" : "#E4E1DA"}`, padding: 0, background: "#000", cursor: "pointer", overflow: "hidden" }}
            >
              {s.type === "image"
                ? <img src={s.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ color: "#fff", fontSize: 14 }}>▶</span>}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <button onClick={addImage} style={miniBtn}>+ image</button>
        <button onClick={addVideo} style={miniBtn}>+ video</button>
        {cur?.type === "image" && (
          <>
            <button onClick={() => moveCurrent(-1)} style={miniBtn}>◀ move</button>
            <button onClick={() => moveCurrent(1)} style={miniBtn}>move ▶</button>
          </>
        )}
        {cur && <button onClick={removeCurrent} style={{ ...miniBtn, color: "#B91C1C" }}>remove</button>}
      </div>
    </div>
  );
}

function CategoryPicker({ draft, setDraft, known }: { draft: Draft; setDraft: (d: Draft) => void; known: string[] }) {
  const [adding, setAdding] = useState(false);
  const opts = Array.from(new Set([...known.filter((c) => c !== "all"), draft.category].filter(Boolean)));
  return (
    <div>
      <label style={microLabel}>category</label>
      {adding ? (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            autoFocus
            value={draft.category === "all" ? "" : draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            placeholder="new category name"
            style={{ ...field }}
          />
          <button onClick={() => setAdding(false)} style={miniBtn}>done</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} style={{ ...field }}>
            <option value="all">all</option>
            {opts.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button onClick={() => { setAdding(true); setDraft({ ...draft, category: "" }); }} style={miniBtn}>+ new</button>
        </div>
      )}
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  border: "1px solid #E4E1DA",
  background: "#FFFFFF",
  padding: "6px 10px",
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  fontWeight: 700,
  cursor: "pointer",
};

function arrowBtn(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 8,
    transform: "translateY(-50%)",
    width: 30,
    height: 30,
    border: "1px solid #E4E1DA",
    background: "rgba(250,249,246,0.92)",
    color: "#14161A",
    fontSize: 11,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  };
}
