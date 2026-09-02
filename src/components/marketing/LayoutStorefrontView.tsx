"use client";

/*
 * The redesigned storefront body for one layout — promo bar + nav + the
 * home / product / cart screen. Shared by /templates (inside the browser
 * mock) and /preview/template/[key] (full-bleed, the "live preview").
 */

import { MONO, avatarFor, inr, numOf, type Layout } from "@/lib/layoutPreviews";
import { DEFAULT_LAYOUT_BLOCKS, type LayoutBlocks } from "@/lib/layoutCommerce";
import { Img } from "@/components/storefront/Img";

type P = Layout["products"][number];
type Slide = { kicker: string; img: string; headline: string; sub: string; cta: string };
export type LayoutView = {
  si: number;
  slides: Slide[];
  gallery: { img: string; alt: string }[];
  galleryTitle: string;
  handle: string;
  p0: P;
  off: string;
  lines: { name: string; variant: string; qty: string; price: string; img: string }[];
  subtotal: string;
  gst: string;
  total: string;
};

/** When present, the storefront is a working shoppable site (the /preview page). */
export type ShopApi = {
  cartCount: number;
  cart: { p: P; qty: number; variant: string }[];
  active: P;
  qty: number;
  variant: string;
  method: string;
  placed: string | null;
  cat: string;            // active category filter ("" = all)
  query: string;          // search text
  galleryPick: string;    // product-page main image
  pin: string;            // pincode typed on the product page
  pinStatus: "idle" | "ok" | "no" | "bad";
  searchOpen: boolean;
  openProduct: (p: P) => void;
  addToCart: (p: P, qty?: number, variant?: string) => void;
  buyNow: (p: P) => void;
  setQty: (n: number) => void;
  setVariant: (v: string) => void;
  setLineQty: (i: number, n: number) => void;
  removeLine: (i: number) => void;
  setMethod: (m: string) => void;
  setCat: (c: string) => void;
  setQuery: (q: string) => void;
  setGalleryPick: (src: string) => void;
  setPin: (v: string) => void;
  checkPin: () => void;
  toggleSearch: () => void;
  openAccount: () => void;
  account: { name: string | null } | null;
  goCart: () => void;
  goHome: () => void;
  placeOrder: () => void;
  toGrid: () => void;
  toLookbook: () => void;
  whatsapp: () => void;
};

const norm = (s: string) => s.toLowerCase().replace(/s\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
/** loose match: does a product belong to a category label / search term? */
function pMatch(p: P, term: string) {
  const t = norm(term);
  if (!t) return true;
  const hay = norm(p.name + " " + p.badge + " " + p.variants.join(" "));
  return t.split(" ").some((w) => w.length > 1 && hay.includes(w));
}

export function LayoutStorefrontView({
  L, screen, v, btnFg, onDark, idx, onSlide, shop, blocks, showBranding = true, editable = false, onEditPart,
}: {
  L: Layout;
  screen: "home" | "product" | "cart";
  v: LayoutView;
  btnFg: string;
  onDark: boolean;
  idx: number;
  onSlide: (n: number) => void;
  shop?: ShopApi;
  blocks?: Partial<LayoutBlocks>;
  showBranding?: boolean;
  /** click-to-edit: outline sections on hover, report the clicked part */
  editable?: boolean;
  onEditPart?: (part: string) => void;
}) {
  const b: LayoutBlocks = { ...DEFAULT_LAYOUT_BLOCKS, ...blocks };
  const slideData = v.slides[v.si];
  const setSlide = onSlide;
  const i = idx;

  // wraps a storefront section so a click in the editor jumps the side panel
  const Edit = ({ part, children, style }: { part: string; children: React.ReactNode; style?: React.CSSProperties }) =>
    editable ? (
      <div
        className="ssr-edit-part"
        onClick={(e) => { e.stopPropagation(); onEditPart?.(part); }}
        style={{ position: "relative", cursor: "pointer", ...style }}
      >
        <span className="ssr-edit-tag">{part}</span>
        {children}
      </div>
    ) : (
      <>{children}</>
    );

  // the product shown on the product screen (falls back to the mock's p0)
  const pd: P = shop?.active ?? v.p0;
  const off = L.pdp.badge.indexOf("off") >= 0
    ? Math.round((1 - numOf(pd.price) / numOf(pd.mrp)) * 100) + "% off"
    : "save " + inr(numOf(pd.mrp) - numOf(pd.price));

  // cart rows + live totals (shop mode) or the static mock rows
  const rows = shop
    ? shop.cart.map((c) => ({ name: c.p.name, variant: c.variant + " · in stock", qty: String(c.qty), price: inr(numOf(c.p.price) * c.qty), img: c.p.img }))
    : v.lines;
  const itemCount = shop ? shop.cart.reduce((a, c) => a + c.qty, 0) : 3;
  const subtotalN = shop ? shop.cart.reduce((a, c) => a + numOf(c.p.price) * c.qty, 0) : numOf(v.subtotal);
  const discountN = shop ? Math.min(numOf(L.cart.discount), subtotalN) : numOf(L.cart.discount);
  const gstN = Math.round((subtotalN - discountN) * 0.05);
  const money = {
    subtotal: shop ? inr(subtotalN) : v.subtotal,
    discount: inr(discountN),
    gst: shop ? inr(gstN) : v.gst,
    total: shop ? inr(subtotalN - discountN + gstN) : v.total,
  };
  const pointer: React.CSSProperties = shop ? { cursor: "pointer" } : {};

  // category + search filtering for the product grid (shop mode only)
  const activeCat = shop && shop.cat && norm(shop.cat) !== norm(L.chips[0]) ? shop.cat : "";
  let visible = L.products;
  if (shop) {
    if (activeCat) { const f = L.products.filter((p) => pMatch(p, activeCat)); if (f.length) visible = f; }
    if (shop.query.trim()) { const f = visible.filter((p) => pMatch(p, shop.query)); visible = f; }
  }
  const filterLabel = shop?.query.trim() ? `“${shop.query.trim()}”` : activeCat;
  const galleryMain = shop?.galleryPick || pd.img;

  return (
            <div style={{ background: L.bg }}>
<style dangerouslySetInnerHTML={{ __html: `
  .ssr-h-card, .ssr-h-tile, .ssr-h-lift, .ssr-h-btn, .ssr-h-thumb img, .ssr-h-link {
    transition: transform .18s ease, box-shadow .18s ease, filter .16s ease, opacity .16s ease;
  }
  .ssr-h-card { will-change: transform; }
  .ssr-h-card:hover { transform: translateY(-4px); box-shadow: 0 16px 34px rgba(20,22,26,0.14); }
  .ssr-h-card:hover .ssr-h-thumb img,
  .ssr-h-thumb:hover img { transform: scale(1.06); }
  .ssr-h-thumb { overflow: hidden; }
  .ssr-h-tile:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(20,22,26,0.12); }
  .ssr-h-lift:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(20,22,26,0.10); }
  .ssr-h-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
  .ssr-h-btn:active { transform: translateY(0); filter: brightness(0.94); }
  .ssr-h-link { text-underline-offset: 3px; }
  .ssr-h-link:hover { opacity: 1; text-decoration: underline; }
  @media (prefers-reduced-motion: reduce) {
    .ssr-h-card, .ssr-h-tile, .ssr-h-lift, .ssr-h-btn, .ssr-h-thumb img, .ssr-h-link { transition: none; }
    .ssr-h-card:hover, .ssr-h-tile:hover, .ssr-h-lift:hover, .ssr-h-btn:hover { transform: none; }
    .ssr-h-card:hover .ssr-h-thumb img { transform: none; }
  }
` }} />
{editable && (
  <style dangerouslySetInnerHTML={{ __html: `
    .ssr-edit-part { outline: 1px dashed rgba(36,69,122,0.35); outline-offset: -1px; transition: outline-color .12s; }
    .ssr-edit-part:hover { outline: 2px solid #24457A; outline-offset: -2px; z-index: 5; }
    .ssr-edit-tag { position: absolute; top: 0; left: 0; z-index: 6; background: #24457A; color: #fff;
      font: 700 9px/1 'JetBrains Mono', monospace; letter-spacing: .12em; text-transform: uppercase;
      padding: 3px 6px; opacity: 0; pointer-events: none; }
    .ssr-edit-part:hover > .ssr-edit-tag { opacity: 1; }
  ` }} />
)}
{b.promo && (
  <Edit part="promo">
    <div style={{ background: L.accent, color: btnFg, padding: "8px 16px", textAlign: "center", fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>{L.promo}</div>
  </Edit>
)}
<Edit part="content"><div style={{ display: "flex", alignItems: "center", gap: 20, padding: "15px 24px", borderBottom: `1px solid ${L.line}`, flexWrap: "wrap" }}>
  <span onClick={shop?.goHome} style={{ fontFamily: L.font, fontSize: 23, fontWeight: 700, letterSpacing: "-0.03em", color: L.fg, ...pointer }}>{L.store}</span>
  <div style={{ display: "flex", gap: 15, marginLeft: 8, fontSize: 13, fontWeight: 600 }}>
    {L.cats.map((c, k) => {
      const on = shop ? norm(shop.cat || L.cats[0]) === norm(c) : k === 0;
      return <span key={c} className="ssr-h-link" onClick={() => shop?.setCat(c)} style={{ color: on ? L.accent : L.fg, ...pointer }}>{c}</span>;
    })}
  </div>
  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 13, fontSize: 13, color: L.fg }}>
    <span className="ssr-h-link" onClick={shop?.toggleSearch} style={{ opacity: 0.75, ...pointer }}>search</span>
    <span className="ssr-h-link" onClick={shop?.openAccount} style={{ opacity: 0.75, fontWeight: shop?.account ? 700 : 400, color: shop?.account ? L.accent : undefined, ...pointer }}>
      {shop?.account ? (shop.account.name ? shop.account.name.split(" ")[0].toLowerCase() : "account") : "account"}
    </span>
    <span className="ssr-h-btn" onClick={shop?.goCart} style={{ background: L.accent, color: btnFg, padding: "7px 13px", fontWeight: 700, ...pointer }}>cart · {shop ? shop.cartCount : 3}</span>
  </div>
  {shop?.searchOpen && (
    <div style={{ flexBasis: "100%", display: "flex", gap: 8, marginTop: 4 }}>
      <input autoFocus value={shop.query} onChange={(e) => shop.setQuery(e.target.value)} placeholder="search the catalog…" style={{ flex: 1, border: `1px solid ${L.line}`, background: L.card, color: L.fg, padding: "10px 12px", fontFamily: MONO, fontSize: 12 }} />
      {shop.query && <button type="button" onClick={() => shop.setQuery("")} style={{ border: `1px solid ${L.line}`, background: "transparent", color: L.fg, padding: "0 12px", cursor: "pointer", fontFamily: MONO, fontSize: 11 }}>clear</button>}
    </div>
  )}
</div></Edit>

{screen === "home" && (
  <div>
    {b.hero && (
    <Edit part="content"><div style={{ position: "relative" }}>
      <div style={{ aspectRatio: "24 / 9", minHeight: 320, maxHeight: 520, overflow: "hidden" }}>
        <Img fallback={L.hero} src={slideData.img} alt={slideData.headline} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.5) 34%, rgba(0,0,0,0.1) 66%, rgba(0,0,0,0) 88%)" }} />
      <div onClick={() => setSlide((v.si - 1 + v.slides.length) % v.slides.length)} style={arrow("left")}>‹</div>
      <div onClick={() => setSlide((v.si + 1) % v.slides.length)} style={arrow("right")}>›</div>
      <div style={{ position: "absolute", top: 18, right: 18, fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", background: "rgba(0,0,0,0.42)", border: "1px solid rgba(255,255,255,0.4)", color: "#FFFFFF", padding: "5px 9px" }}>{"0" + (v.si + 1)} / {"0" + v.slides.length}</div>
      <div style={{ position: "absolute", left: 34, right: 34, bottom: 30 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#FFFFFF", opacity: 0.9 }}>{slideData.kicker}</div>
        <div style={{ fontFamily: L.font, fontSize: "clamp(30px, 3.4vw, 48px)", fontWeight: 700, letterSpacing: "-0.03em", color: "#FFFFFF", lineHeight: 1, marginTop: 10, maxWidth: 720 }}>{slideData.headline}</div>
        <div style={{ fontSize: 15, color: "#FFFFFF", marginTop: 10, maxWidth: 520, lineHeight: 1.5 }}>{slideData.sub}</div>
        <div style={{ display: "flex", gap: 9, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
          <span className="ssr-h-btn" onClick={shop?.toGrid} style={{ background: L.accent, color: btnFg, padding: "12px 22px", fontSize: 14, fontWeight: 700, ...pointer }}>{slideData.cta}</span>
          <span className="ssr-h-btn" onClick={shop?.toLookbook} style={{ border: "1px solid #FFFFFF", color: "#FFFFFF", padding: "12px 18px", fontSize: 14, fontWeight: 700, ...pointer }}>{L.cta2}</span>
          <div style={{ display: "flex", gap: 7, marginLeft: 12 }}>
            {v.slides.map((_, k) => (
              <div key={k} onClick={() => setSlide(k)} style={{ width: k === v.si ? 28 : 10, height: 8, background: k === v.si ? "#FFFFFF" : "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.7)", cursor: "pointer" }} />
            ))}
          </div>
        </div>
      </div>
    </div></Edit>
    )}

    {b.chips && (
    <Edit part="content"><div style={{ display: "flex", gap: 8, padding: "18px 24px 4px", flexWrap: "wrap" }}>
      {L.chips.map((c, k) => {
        const on = shop ? norm(shop.cat || L.chips[0]) === norm(c) : k === 0;
        return (
          <span key={c} className="ssr-h-btn" onClick={() => shop?.setCat(c)} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", border: `1px solid ${on ? L.accent : L.line}`, background: on ? L.accent : "transparent", color: on ? btnFg : L.fg, padding: "7px 12px", ...pointer }}>{c}</span>
        );
      })}
    </div></Edit>
    )}

    {b.tiles && (
    <Edit part="tiles">
    <div style={{ padding: "18px 24px 6px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14 }}>
      <span style={{ fontFamily: L.font, fontSize: 20, fontWeight: 700, letterSpacing: "-0.025em", color: L.fg }}>shop by category</span>
      <span className="ssr-h-link" onClick={() => { shop?.setCat(L.chips[0]); shop?.toGrid(); }} style={{ fontFamily: MONO, fontSize: 11, color: L.accent, ...pointer }}>all categories →</span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 150px), 1fr))", gap: 12, padding: "10px 24px 18px" }}>
      {L.tiles.map((t) => (
        <div key={t.name} className="ssr-h-tile" onClick={() => { shop?.setCat(t.name); shop?.toGrid(); }} style={{ border: `1px solid ${shop && norm(shop.cat) === norm(t.name) ? L.accent : L.line}`, background: L.card, padding: "18px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 118, ...pointer }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: L.accent }}>{t.count}</div>
          <div>
            <div style={{ fontFamily: L.font, fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", color: L.fg, lineHeight: 1.05 }}>{t.name}</div>
            <div style={{ width: 26, height: 2, background: L.accent, marginTop: 11 }} />
          </div>
        </div>
      ))}
    </div>
    </Edit>
    )}

    {b.products && (
    <Edit part="content">
    <div id="ssr-grid" style={{ padding: "8px 24px 6px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, flexWrap: "wrap", scrollMarginTop: 60 }}>
      <span style={{ fontFamily: L.font, fontSize: 20, fontWeight: 700, letterSpacing: "-0.025em", color: L.fg }}>
        {filterLabel ? `${L.gridTitle} · ${filterLabel}` : L.gridTitle}
      </span>
      {filterLabel
        ? <span onClick={() => { shop?.setCat(L.chips[0]); shop?.setQuery(""); }} style={{ fontFamily: MONO, fontSize: 11, color: L.accent, ...pointer }}>clear filter ✕</span>
        : <span style={{ fontFamily: MONO, fontSize: 11, color: L.accent }}>{L.gridMeta}</span>}
    </div>
    {shop && visible.length === 0 ? (
      <div style={{ padding: "24px", textAlign: "center", fontSize: 14, color: L.fg, opacity: 0.7 }}>
        nothing matches {filterLabel}. <span onClick={() => { shop.setCat(L.chips[0]); shop.setQuery(""); }} style={{ color: L.accent, cursor: "pointer", fontWeight: 700 }}>show everything</span>
      </div>
    ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 178px), 1fr))", gap: 13, padding: "12px 24px 20px" }}>
      {visible.map((p) => (
        <div key={p.name} className="ssr-h-card" onClick={() => shop?.openProduct(p)} style={{ border: `1px solid ${L.line}`, background: L.card, ...pointer }}>
          <div style={{ position: "relative" }}>
            <div className="ssr-h-thumb" style={{ aspectRatio: "3 / 4", overflow: "hidden" }}>
              <Img fallback={L.hero} src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", top: 8, left: 8, background: L.accent, color: btnFg, fontFamily: MONO, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 7px" }}>{p.badge}</div>
          </div>
          <div style={{ padding: 11 }}>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: L.fg }}>{p.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 7 }}>
              <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: L.accent }}>{p.price}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: L.fg, opacity: 0.45, textDecoration: "line-through" }}>{p.mrp}</span>
            </div>
            <div style={{ display: "flex", gap: 5, marginTop: 9, flexWrap: "wrap" }}>
              {p.variants.map((vv) => (
                <span key={vv} style={{ border: `1px solid ${L.line}`, color: L.fg, fontFamily: MONO, fontSize: 9, padding: "4px 6px" }}>{vv}</span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 9, color: L.fg, opacity: 0.6 }}>★ {p.rating}</span>
              <button type="button" className="ssr-h-btn" onClick={(e) => { e.stopPropagation(); shop?.addToCart(p); }} style={{ border: `1px solid ${L.accent}`, color: L.accent, background: "transparent", fontSize: 11, fontWeight: 700, padding: "6px 10px", ...pointer }}>add to cart</button>
            </div>
          </div>
        </div>
      ))}
    </div>
    )}
    </Edit>
    )}

    {b.lookbook && (
    <Edit part="banner"><div id="ssr-lookbook" style={{ margin: "0 24px 22px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", border: `1px solid ${L.line}`, scrollMarginTop: 60 }}>
      <div style={{ aspectRatio: "16 / 10", overflow: "hidden" }}>
        <Img fallback={L.hero} src={L.banner.img} alt={L.banner.headline} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ background: L.card, padding: 26, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: L.accent }}>{L.banner.kicker}</div>
        <div style={{ fontFamily: L.font, fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 8, color: L.fg, lineHeight: 1.05 }}>{L.banner.headline}</div>
        <p style={{ fontSize: 14, lineHeight: 1.5, marginTop: 9, color: L.fg, opacity: 0.8 }}>{L.banner.sub}</p>
        <div className="ssr-h-btn" onClick={shop?.toGrid} style={{ alignSelf: "flex-start", marginTop: 15, background: L.accent, color: btnFg, padding: "10px 17px", fontSize: 13, fontWeight: 700, ...pointer }}>{L.banner.cta}</div>
      </div>
    </div></Edit>
    )}

    <Edit part="signature"><div style={{ margin: "0 24px 22px", border: `1px solid ${L.line}`, background: L.card }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${L.line}`, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <span style={{ fontFamily: L.font, fontSize: 18, fontWeight: 700, color: L.fg, letterSpacing: "-0.02em" }}>{L.signature.title}</span>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: L.accent }}>built into this layout</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))" }}>
        {L.signature.rows.map((r) => (
          <div key={r.label} style={{ padding: "14px 16px", borderRight: `1px solid ${L.line}` }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: L.fg, opacity: 0.6 }}>{r.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6, color: L.fg }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div></Edit>

    <div style={{ padding: "4px 24px 6px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
      <span style={{ fontFamily: L.font, fontSize: 20, fontWeight: 700, letterSpacing: "-0.025em", color: L.fg }}>{v.galleryTitle}</span>
      <span style={{ fontFamily: MONO, fontSize: 11, color: L.accent }}>{v.handle}</span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(33%, 118px), 1fr))", gap: 8, padding: "10px 24px 24px" }}>
      {v.gallery.map((g) => (
        <div key={g.img} className="ssr-h-lift ssr-h-thumb" style={{ aspectRatio: "1 / 1", border: `1px solid ${L.line}`, overflow: "hidden" }}>
          <Img fallback={L.hero} src={g.img} alt={g.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ))}
    </div>

    {b.reviews && (<Edit part="reviews">
    <div style={{ padding: "0 24px 6px" }}>
      <span style={{ fontFamily: L.font, fontSize: 20, fontWeight: 700, letterSpacing: "-0.025em", color: L.fg }}>what buyers say</span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))", gap: 13, padding: "12px 24px 22px" }}>
      {L.reviews.map((r) => (
        <div key={r.name} className="ssr-h-lift" style={{ border: `1px solid ${L.line}`, background: L.card, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", border: `1px solid ${L.line}` }}>
              <Img fallback={L.hero} src={avatarFor(r.name)} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: L.fg }}>{r.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: L.fg, opacity: 0.6, marginTop: 2 }}>verified buyer · {r.city}</div>
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: L.accent }}>★★★★★</div>
          <p style={{ fontSize: 13, lineHeight: 1.5, marginTop: 9, color: L.fg }}>{r.text}</p>
        </div>
      ))}
    </div>
    </Edit>)}

    {b.trust && (
    <Edit part="trust"><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 180px), 1fr))", gap: 12, padding: "0 24px 20px" }}>
      {L.trust.map((t) => (
        <div key={t.title} style={{ borderTop: `1px solid ${L.line}`, paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: L.fg }}>{t.title}</div>
          <div style={{ fontSize: 12, marginTop: 3, color: L.fg, opacity: 0.7 }}>{t.sub}</div>
        </div>
      ))}
    </div></Edit>
    )}

    <div style={{ margin: "0 24px 24px", border: `1px solid ${L.accent}`, background: L.card, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: L.fg }}>order on whatsapp instead</div>
        <div style={{ fontSize: 13, marginTop: 3, color: L.fg, opacity: 0.75 }}>send a photo of what you want — we reply with a payment link.</div>
      </div>
      <div className="ssr-h-btn" onClick={shop?.whatsapp} style={{ background: L.accent, color: btnFg, padding: "10px 16px", fontSize: 13, fontWeight: 700, ...pointer }}>message us</div>
    </div>

    <div style={{ background: L.footBg, color: L.footFg, padding: "26px 24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 170px), 1fr))", gap: 22 }}>
        <div>
          <div style={{ fontFamily: L.font, fontSize: 19, fontWeight: 700 }}>{L.store}</div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", opacity: 0.7, marginTop: 6 }}>{L.domain}</div>
        </div>
        {[
          { title: "shop", links: L.cats, kind: "cat" as const },
          { title: "help", links: ["track my order", "shipping & returns", "whatsapp us", "faqs"], kind: "help" as const },
          { title: "about", links: ["our story", "privacy policy", "terms of use", "GST & invoicing"], kind: "info" as const },
        ].map((col) => (
          <div key={col.title}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.65 }}>{col.title}</div>
            <div style={{ display: "grid", gap: 6, marginTop: 9 }}>
              {col.links.map((l) => (
                <span
                  key={l}
                  className="ssr-h-link"
                  onClick={() => {
                    if (!shop) return;
                    if (col.kind === "cat") { shop.setCat(l); shop.toGrid(); }
                    else if (l === "track my order" || l === "whatsapp us") shop.goCart();
                    else shop.whatsapp();
                  }}
                  style={{ fontSize: 12, opacity: 0.85, ...pointer }}
                >{l}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.18)", marginTop: 20, paddingTop: 14, fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.65 }}>{showBranding ? "powered by supershowroom ✦ " : ""}GST invoice on every order</div>
    </div>
  </div>
)}

{screen === "product" && (
  <div>
    <div style={{ padding: "13px 24px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: L.fg, opacity: 0.6, borderBottom: `1px solid ${L.line}` }}>{L.pdp.crumb}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 26, padding: "22px 24px" }}>
      <div>
        <div style={{ border: `1px solid ${L.line}`, overflow: "hidden" }}>
          <div style={{ aspectRatio: "4 / 5", overflow: "hidden" }}>
            <Img fallback={L.hero} src={galleryMain} alt={pd.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 8 }}>
          {[pd.img, ...L.extra.slice(0, 3)].map((src, k) => (
            <div key={k} className="ssr-h-lift" onClick={() => shop?.setGalleryPick(src)} style={{ aspectRatio: "1 / 1", border: `1px solid ${galleryMain === src ? L.accent : L.line}`, overflow: "hidden", ...pointer }}>
              <Img fallback={L.hero} src={src} alt="gallery" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: L.accent }}>{pd.badge}</div>
        <h3 style={{ fontFamily: L.font, fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 8, color: L.fg, lineHeight: 1.1 }}>{pd.name}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9, fontFamily: MONO, fontSize: 11, color: L.fg }}>
          <span style={{ color: L.accent }}>★ {pd.rating}</span>
          <span style={{ opacity: 0.6 }}>{60 + i * 37} verified reviews</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 16 }}>
          <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: L.fg }}>{pd.price}</span>
          <span style={{ fontFamily: MONO, fontSize: 15, opacity: 0.45, textDecoration: "line-through", color: L.fg }}>{pd.mrp}</span>
          <span style={{ background: L.accent, color: btnFg, fontFamily: MONO, fontSize: 10, padding: "4px 8px" }}>{off}</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 6, color: L.fg, opacity: 0.6 }}>inclusive of GST · {L.pdp.stock}</div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: L.fg, opacity: 0.7 }}>{L.pdp.variantLabel}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
            {pd.variants.map((vv, k) => {
              const on = shop ? vv === shop.variant : k === 0;
              return (
                <button key={vv} type="button" className="ssr-h-btn" onClick={() => shop?.setVariant(vv)} style={{ border: `1px solid ${on ? L.accent : L.line}`, background: on ? L.accent : "transparent", color: on ? btnFg : L.fg, padding: "9px 14px", fontSize: 13, fontWeight: 700, ...pointer }}>{vv}</button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", border: `1px solid ${L.line}` }}>
            <button type="button" onClick={() => shop?.setQty(Math.max(1, shop.qty - 1))} style={{ padding: "12px 14px", color: L.fg, fontWeight: 700, background: "transparent", border: 0, ...pointer }}>−</button>
            <span style={{ padding: "12px 6px", fontFamily: MONO, color: L.fg }}>{shop ? shop.qty : 1}</span>
            <button type="button" onClick={() => shop?.setQty(shop.qty + 1)} style={{ padding: "12px 14px", color: L.fg, fontWeight: 700, background: "transparent", border: 0, ...pointer }}>+</button>
          </div>
          <button type="button" className="ssr-h-btn" onClick={() => shop?.addToCart(pd, shop.qty, shop.variant)} style={{ flex: 1, minWidth: 150, background: L.accent, color: btnFg, textAlign: "center", padding: 13, fontSize: 15, fontWeight: 700, border: 0, ...pointer }}>add to cart</button>
          <button type="button" className="ssr-h-btn" onClick={() => shop?.buyNow(pd)} style={{ border: `1px solid ${L.fg}`, color: L.fg, background: "transparent", padding: "13px 18px", fontSize: 15, fontWeight: 700, ...pointer }}>buy now</button>
        </div>

        <div style={{ marginTop: 18, border: `1px solid ${L.line}`, background: L.card, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: L.fg, opacity: 0.7 }}>deliver to</span>
            <input
              value={shop?.pin ?? ""}
              onChange={(e) => shop?.setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              onKeyDown={(e) => { if (e.key === "Enter") shop?.checkPin(); }}
              inputMode="numeric"
              placeholder="6-digit pincode"
              disabled={!shop}
              style={{ border: `1px solid ${L.line}`, background: L.bg, color: L.fg, padding: "7px 10px", fontFamily: MONO, fontSize: 12, width: 128 }}
            />
            <button type="button" className="ssr-h-btn" onClick={() => shop?.checkPin()} style={{ border: `1px solid ${L.accent}`, background: "transparent", color: L.accent, fontSize: 12, fontWeight: 700, padding: "7px 12px", ...pointer }}>check</button>
          </div>
          {shop?.pinStatus === "ok" && (
            <div style={{ fontSize: 13, marginTop: 9, color: L.accent, fontWeight: 700 }}>✓ serviceable · {L.pdp.delivery} · to {shop.pin}</div>
          )}
          {shop?.pinStatus === "no" && (
            <div style={{ fontSize: 13, marginTop: 9, color: "#B91C1C", fontWeight: 700 }}>we don’t deliver to {shop.pin} yet{L.serviceArea ? ` — ${L.serviceArea}` : ""}. message us on whatsapp to check.</div>
          )}
          {shop?.pinStatus === "bad" && (
            <div style={{ fontSize: 13, marginTop: 9, color: "#B91C1C", fontWeight: 700 }}>enter a valid 6-digit pincode</div>
          )}
          {(!shop || shop.pinStatus === "idle") && (
            <div style={{ fontSize: 13, marginTop: 9, color: L.fg }}>{L.pdp.delivery}</div>
          )}
          <div style={{ fontSize: 13, marginTop: 4, color: L.fg, opacity: 0.75 }}>{L.pdp.returns}</div>
          {L.serviceArea && (
            <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 6, color: L.fg, opacity: 0.6, letterSpacing: "0.04em" }}>serviceable area · {L.serviceArea}</div>
          )}
        </div>

        <div style={{ display: "grid", gap: 7, marginTop: 18 }}>
          {L.pdp.bullets.map((b) => (
            <div key={b} style={{ display: "grid", gridTemplateColumns: "16px 1fr", gap: 9, alignItems: "baseline" }}>
              <span style={{ color: L.accent, fontSize: 13 }}>✓</span>
              <span style={{ fontSize: 13, lineHeight: 1.45, color: L.fg }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={{ margin: "0 24px 22px", border: `1px solid ${L.line}`, background: L.card }}>
      <div style={{ padding: "13px 16px", borderBottom: `1px solid ${L.line}`, fontFamily: L.font, fontSize: 17, fontWeight: 700, color: L.fg }}>{L.pdp.specTitle}</div>
      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
        <tbody>
          {L.pdp.specs.map((r) => (
            <tr key={r.label}>
              <td style={{ padding: "11px 16px", borderTop: `1px solid ${L.line}`, width: "34%", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: L.fg, opacity: 0.65 }}>{r.label}</td>
              <td style={{ padding: "11px 16px", borderTop: `1px solid ${L.line}`, fontWeight: 700, color: L.fg }}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div style={{ padding: "0 24px 8px", fontFamily: L.font, fontSize: 19, fontWeight: 700, color: L.fg }}>goes well with</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 170px), 1fr))", gap: 12, padding: "10px 24px 26px" }}>
      {L.products.slice(1, 4).map((p) => (
        <div key={p.name} className="ssr-h-lift" onClick={() => shop?.openProduct(p)} style={{ border: `1px solid ${L.line}`, background: L.card, display: "grid", gridTemplateColumns: "66px 1fr", gap: 11, alignItems: "center", padding: 10, ...pointer }}>
          <div className="ssr-h-thumb" style={{ width: 66, height: 66, border: `1px solid ${L.line}`, overflow: "hidden" }}>
            <Img fallback={L.hero} src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.25, color: L.fg }}>{p.name}</div>
            <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: L.accent, marginTop: 5 }}>{p.price}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{screen === "cart" && shop && shop.placed && (
  <div style={{ padding: "60px 24px", textAlign: "center" }}>
    <div style={{ width: 54, height: 54, borderRadius: "50%", background: L.accent, color: btnFg, display: "grid", placeItems: "center", fontSize: 26, margin: "0 auto" }}>✓</div>
    <div style={{ fontFamily: L.font, fontSize: 28, fontWeight: 700, color: L.fg, marginTop: 16 }}>order placed</div>
    <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", color: L.fg, opacity: 0.7, marginTop: 8 }}>{shop.placed} · GST invoice emailed · updates on whatsapp</div>
    <button type="button" className="ssr-h-btn" onClick={shop.goHome} style={{ marginTop: 22, background: L.accent, color: btnFg, border: 0, padding: "12px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>continue shopping</button>
  </div>
)}

{screen === "cart" && shop && !shop.placed && shop.cart.length === 0 && (
  <div style={{ padding: "60px 24px", textAlign: "center" }}>
    <div style={{ fontFamily: L.font, fontSize: 26, fontWeight: 700, color: L.fg }}>your cart is empty</div>
    <div style={{ fontSize: 14, color: L.fg, opacity: 0.7, marginTop: 8 }}>add a few pieces from the storefront to see the checkout.</div>
    <button type="button" className="ssr-h-btn" onClick={shop.goHome} style={{ marginTop: 20, border: `1px solid ${L.accent}`, color: L.accent, background: "transparent", padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>browse the store</button>
  </div>
)}

{screen === "cart" && !(shop && (shop.placed || shop.cart.length === 0)) && (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 24, padding: 24 }}>
    <div>
      <div style={{ fontFamily: L.font, fontSize: 24, fontWeight: 700, letterSpacing: "-0.025em", color: L.fg }}>your cart</div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 5, color: L.fg, opacity: 0.6 }}>{itemCount} item{itemCount === 1 ? "" : "s"} · free shipping applied</div>
      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        {rows.map((l, ri) => (
          <div key={l.name + ri} style={{ border: `1px solid ${L.line}`, background: L.card, padding: 12, display: "grid", gridTemplateColumns: "76px 1fr auto", gap: 13, alignItems: "center" }}>
            <div style={{ width: 76, height: 76, border: `1px solid ${L.line}`, overflow: "hidden" }}>
              <Img fallback={L.hero} src={l.img} alt={l.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, color: L.fg }}>{l.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 4, color: L.fg, opacity: 0.65 }}>{l.variant}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", border: `1px solid ${L.line}`, width: "max-content" }}>
                  <button type="button" onClick={() => shop?.setLineQty(ri, Number(l.qty) - 1)} style={{ padding: "5px 10px", color: L.fg, fontWeight: 700, background: "transparent", border: 0, ...pointer }}>−</button>
                  <span style={{ padding: "5px 4px", fontFamily: MONO, fontSize: 12, color: L.fg }}>{l.qty}</span>
                  <button type="button" onClick={() => shop?.setLineQty(ri, Number(l.qty) + 1)} style={{ padding: "5px 10px", color: L.fg, fontWeight: 700, background: "transparent", border: 0, ...pointer }}>+</button>
                </div>
                {shop && <button type="button" onClick={() => shop.removeLine(ri)} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: L.fg, opacity: 0.55, background: "transparent", border: 0, cursor: "pointer" }}>remove</button>}
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: L.fg }}>{l.price}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, border: `1px dashed ${L.line}`, padding: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: L.fg, opacity: 0.7 }}>coupon</span>
        <span style={{ border: `1px solid ${L.line}`, padding: "8px 12px", fontFamily: MONO, fontSize: 12, color: L.fg }}>{L.cart.coupon}</span>
        <span style={{ color: L.accent, fontSize: 13, fontWeight: 700 }}>applied — {money.discount} off</span>
      </div>

      <div style={{ marginTop: 16, border: `1px solid ${L.line}`, background: L.card, padding: 16 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: L.fg, opacity: 0.7 }}>delivering to</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 7, color: L.fg }}>{L.cart.name}</div>
        <div style={{ fontSize: 13, marginTop: 3, color: L.fg, opacity: 0.78 }}>{L.cart.address}</div>
        <div style={{ fontFamily: MONO, fontSize: 11, marginTop: 8, color: L.accent }}>change address</div>
      </div>
    </div>

    <div>
      <div style={{ border: `1px solid ${L.line}`, background: L.card, padding: 20 }}>
        <div style={{ fontFamily: L.font, fontSize: 19, fontWeight: 700, color: L.fg }}>order summary</div>
        <div style={{ display: "grid", gap: 9, marginTop: 15, fontFamily: MONO, fontSize: 13, color: L.fg }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ opacity: 0.7 }}>subtotal</span><span>{money.subtotal}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ opacity: 0.7 }}>discount</span><span style={{ color: L.accent }}>− {money.discount}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ opacity: 0.7 }}>GST</span><span>{money.gst}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ opacity: 0.7 }}>shipping</span><span>free</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${L.line}`, paddingTop: 10, marginTop: 4, fontSize: 17, fontWeight: 700 }}><span>to pay</span><span>{money.total}</span></div>
        </div>

        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 20, color: L.fg, opacity: 0.7 }}>payment method</div>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {L.cart.methods.map((m) => {
            const on = shop ? (shop.method || L.cart.methods[0].name) === m.name : m.on;
            return (
              <div key={m.name} className="ssr-h-lift" onClick={() => shop?.setMethod(m.name)} style={{ border: `1px solid ${on ? L.accent : L.line}`, background: on ? (onDark ? "#1E2530" : "#F7F4EC") : "transparent", padding: "12px 13px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, ...pointer }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: L.fg }}>{m.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 3, color: L.fg, opacity: 0.65 }}>{m.meta}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 10, color: L.accent }}>{on ? "selected" : ""}</span>
              </div>
            );
          })}
        </div>

        <button type="button" className="ssr-h-btn" onClick={shop?.placeOrder} style={{ width: "100%", background: L.accent, color: btnFg, textAlign: "center", padding: 14, fontSize: 15, fontWeight: 700, marginTop: 18, border: 0, ...pointer }}>place order · {money.total}</button>
        <div style={{ fontFamily: MONO, fontSize: 10, lineHeight: 1.7, marginTop: 12, color: L.fg, opacity: 0.65 }}>GST invoice emailed instantly · order updates on whatsapp · {L.pdp.returns}</div>
      </div>
    </div>
  </div>
)}
            </div>
  );
}

function arrow(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", top: "50%",
    left: side === "left" ? 18 : undefined,
    right: side === "right" ? 18 : undefined,
    marginTop: -22, width: 44, height: 44,
    border: "1px solid rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.3)", color: "#FFFFFF",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer",
  };
}
