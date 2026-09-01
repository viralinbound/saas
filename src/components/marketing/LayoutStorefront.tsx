"use client";

/*
 * Full-page "live preview" of a redesigned store layout — opened from the
 * "live preview ↗" button on /templates. The storefront here is a WORKING
 * shoppable site: tap a product to open it, filter by category, search, add
 * to cart, change qty, pick a payment method and place an order (kept in the
 * browser via orderHistory). A thin SuperShowroom bar on top switches screen
 * and starts a real setup.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { LAYOUTS, MONO, inr, numOf, type Layout } from "@/lib/layoutPreviews";
import { LayoutStorefrontView, type ShopApi } from "@/components/marketing/LayoutStorefrontView";
import { saveOrder } from "@/lib/orderHistory";

type Screen = "home" | "product" | "cart";
type P = Layout["products"][number];
type Line = { p: P; qty: number; variant: string };

const scrollTop = () => { if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };
const ref6 = () => "SSR-" + Math.random().toString(36).slice(2, 8).toUpperCase();

export function LayoutStorefront({ layoutKey }: { layoutKey: string }) {
  const L: Layout = LAYOUTS.find((d) => d.key === layoutKey) ?? LAYOUTS[0];
  const idx = LAYOUTS.indexOf(L);
  const onDark = L.bg === "#0E1116";
  const btnFg = onDark ? "#0E1116" : "#FFFFFF";

  const [screen, setScreen] = useState<Screen>("home");
  const [slide, setSlide] = useState(0);

  // shoppable state for the redesigned storefront
  const [cart, setCart] = useState<Line[]>([]);
  const [active, setActive] = useState<P>(L.products[0]);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<string>(L.products[0].variants[0]);
  const [method, setMethod] = useState<string>(L.cart.methods[0].name);
  const [placed, setPlaced] = useState<string | null>(null);
  const [cat, setCat] = useState("");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [galleryPick, setGalleryPick] = useState("");
  const [pinOK, setPinOK] = useState(false);

  const jumpTo = (id: string) => {
    if (typeof document === "undefined") return;
    setScreen("home");
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const v = useMemo(() => {
    const p0 = L.products[0];
    const lines = L.products.slice(0, 3).map((p) => ({
      name: p.name, variant: p.variants[0] + " · in stock", qty: "1", price: p.price, img: p.img,
    }));
    const subtotalN = L.products.slice(0, 3).reduce((a, p) => a + numOf(p.price), 0);
    const discountN = numOf(L.cart.discount);
    const gstN = Math.round((subtotalN - discountN) * 0.05);
    const slides = [
      { kicker: "now on the storefront", img: L.hero, headline: L.headline, sub: L.sub, cta: L.cta },
      { kicker: L.banner.kicker, img: L.banner.img, headline: L.banner.headline, sub: L.banner.sub, cta: L.banner.cta },
      { kicker: L.signature.title, img: L.products[1] ? L.products[1].img : L.hero, headline: L.gridTitle, sub: L.options[0].name + " — " + L.options[0].detail + ".", cta: L.cta2 },
    ];
    const si = slide % slides.length;
    const gallery = (L.extra || []).slice(0, 6).map((src, k) => ({ img: src, alt: L.store + " shot " + (k + 1) }));
    const off = L.pdp.badge.indexOf("off") >= 0
      ? Math.round((1 - numOf(p0.price) / numOf(p0.mrp)) * 100) + "% off"
      : "save " + inr(numOf(p0.mrp) - numOf(p0.price));
    return {
      p0, si, slides, gallery, off, lines,
      subtotal: inr(subtotalN), gst: inr(gstN), total: inr(subtotalN - discountN + gstN),
      galleryTitle: "from the " + (L.name.indexOf("bakery") >= 0 ? "kitchen" : L.name.indexOf("kirana") >= 0 ? "farm" : "studio"),
      handle: "@" + L.domain.split(".")[0],
    };
  }, [L, slide]);

  const addToCart = (p: P, q = 1, vr = p.variants[0]) => {
    setCart((prev) => {
      const at = prev.findIndex((c) => c.p.name === p.name && c.variant === vr);
      if (at >= 0) {
        const next = [...prev];
        next[at] = { ...next[at], qty: next[at].qty + q };
        return next;
      }
      return [...prev, { p, qty: q, variant: vr }];
    });
  };

  const placeOrder = () => {
    if (!cart.length) return;
    const subtotalN = cart.reduce((a, c) => a + numOf(c.p.price) * c.qty, 0);
    const discountN = Math.min(numOf(L.cart.discount), subtotalN);
    const gstN = Math.round((subtotalN - discountN) * 0.05);
    const r = ref6();
    saveOrder(`demo-${L.key}`, {
      orderNumber: r,
      placedAt: new Date().toISOString(),
      storeName: L.store,
      customerName: L.cart.name,
      city: L.cart.address.split(",").slice(-1)[0]?.trim(),
      paymentMethod: method || L.cart.methods[0].name,
      total: subtotalN - discountN + gstN,
      currency: "INR",
      items: cart.map((c) => ({ name: c.p.name, quantity: c.qty, price: numOf(c.p.price), variant: c.variant })),
      preview: true,
    });
    setPlaced(r);
    setCart([]);
  };

  const shop: ShopApi = {
    cartCount: cart.reduce((a, c) => a + c.qty, 0),
    cart,
    active,
    qty,
    variant,
    method,
    placed,
    cat,
    query,
    galleryPick,
    pinOK,
    searchOpen,
    openProduct: (p) => { setActive(p); setQty(1); setVariant(p.variants[0]); setGalleryPick(p.img); setPinOK(false); setScreen("product"); scrollTop(); },
    addToCart,
    buyNow: (p) => { addToCart(p, qty, variant); setScreen("cart"); scrollTop(); },
    setQty,
    setVariant,
    setLineQty: (i, n) => setCart((prev) => (n <= 0 ? prev.filter((_, x) => x !== i) : prev.map((c, x) => (x === i ? { ...c, qty: n } : c)))),
    removeLine: (i) => setCart((prev) => prev.filter((_, x) => x !== i)),
    setMethod,
    setCat: (c) => { setCat(c); setQuery(""); },
    setQuery: (q) => { setQuery(q); if (q) setCat(""); },
    setGalleryPick,
    checkPin: () => setPinOK(true),
    toggleSearch: () => setSearchOpen((o) => !o),
    goCart: () => { setScreen("cart"); scrollTop(); },
    goHome: () => { setPlaced(null); setCat(""); setQuery(""); setSearchOpen(false); setScreen("home"); scrollTop(); },
    placeOrder,
    toGrid: () => jumpTo("ssr-grid"),
    toLookbook: () => jumpTo("ssr-lookbook"),
    whatsapp: () => { if (typeof window !== "undefined") window.open("https://wa.me/918431101466", "_blank", "noopener"); },
  };

  const pill = (activeState: boolean): React.CSSProperties => ({
    border: `1px solid ${activeState ? "#FAF9F6" : "rgba(250,249,246,0.35)"}`,
    background: activeState ? "#FAF9F6" : "transparent",
    color: activeState ? "#14161A" : "#FAF9F6",
    padding: "6px 12px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em",
    textTransform: "uppercase", fontWeight: 700, cursor: "pointer",
  });

  return (
    <div style={{ minHeight: "100vh", background: L.bg }}>
      <div style={{ position: "sticky", top: 0, zIndex: 80, background: "#14161A", color: "#FAF9F6", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 16px" }}>
        <Link href="/templates" style={{ color: "#9FBBE0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>← all layouts</Link>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", opacity: 0.7 }}>{L.name} · live preview</span>

        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          {(["home", "product", "cart"] as Screen[]).map((s) => (
            <div key={s} onClick={() => { setScreen(s); scrollTop(); }} style={pill(screen === s)}>
              {s === "cart" ? `checkout${shop.cartCount ? ` (${shop.cartCount})` : ""}` : s}
            </div>
          ))}
          <Link href={`/onboarding?theme=${L.key}`} style={{ background: "#24457A", color: "#FFFFFF", padding: "7px 14px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>use this layout →</Link>
        </div>
      </div>

      <div style={{ margin: "0 auto", maxWidth: 1440, boxShadow: "0 18px 40px rgba(20,22,26,0.12)" }}>
        <LayoutStorefrontView
          L={L}
          screen={screen}
          v={v}
          btnFg={btnFg}
          onDark={onDark}
          idx={idx}
          onSlide={setSlide}
          shop={shop}
        />
      </div>
    </div>
  );
}
