"use client";

/*
 * A working storefront rendered from a resolved `Layout` (one of the six
 * redesigned .dc layouts, or a merchant's customised version of one).
 * Owns all the shop state — category filter, search, product page, cart,
 * checkout, place-order — and renders <LayoutStorefrontView>. No page
 * chrome: callers wrap it (marketing preview bar, or the merchant console).
 */

import { useMemo, useState } from "react";
import { numOf, type Layout } from "@/lib/layoutPreviews";
import { buildLayoutView } from "@/lib/layoutView";
import { LayoutStorefrontView, type ShopApi } from "@/components/marketing/LayoutStorefrontView";
import type { LayoutBlocks } from "@/lib/layoutCommerce";
import { saveOrder } from "@/lib/orderHistory";

type P = Layout["products"][number];
type Line = { p: P; qty: number; variant: string };
export type Screen = "home" | "product" | "cart";

const scrollTop = () => { if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };
const ref6 = () => "SSR-" + Math.random().toString(36).slice(2, 8).toUpperCase();

export function ShoppableLayout({
  layout,
  blocks,
  showBranding = true,
  orderSlug,
  whatsappNumber = "918431101466",
  screen,
  onScreen,
  idx = 0,
}: {
  layout: Layout;
  blocks?: Partial<LayoutBlocks>;
  showBranding?: boolean;
  /** localStorage order-history bucket (e.g. `demo-fashion` or the store slug) */
  orderSlug: string;
  whatsappNumber?: string;
  /** optional controlled screen (marketing preview drives this from its top bar) */
  screen?: Screen;
  onScreen?: (s: Screen) => void;
  idx?: number;
}) {
  const L = layout;
  const onDark = L.bg === "#0E1116";
  const btnFg = onDark ? "#0E1116" : "#FFFFFF";

  const [screenState, setScreenState] = useState<Screen>("home");
  const scr = screen ?? screenState;
  const setScreen = (s: Screen) => { onScreen ? onScreen(s) : setScreenState(s); };

  const [slide, setSlide] = useState(0);
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

  const v = useMemo(() => buildLayoutView(L, slide), [L, slide]);

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
    saveOrder(orderSlug, {
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
    cart, active, qty, variant, method, placed, cat, query, galleryPick, pinOK, searchOpen,
    openProduct: (p) => { setActive(p); setQty(1); setVariant(p.variants[0]); setGalleryPick(p.img); setPinOK(false); setScreen("product"); scrollTop(); },
    addToCart,
    buyNow: (p) => { addToCart(p, qty, variant); setScreen("cart"); scrollTop(); },
    setQty, setVariant,
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
    whatsapp: () => { if (typeof window !== "undefined") window.open(`https://wa.me/${whatsappNumber}`, "_blank", "noopener"); },
  };

  return (
    <LayoutStorefrontView
      L={L}
      screen={scr}
      v={v}
      btnFg={btnFg}
      onDark={onDark}
      idx={idx}
      onSlide={setSlide}
      shop={shop}
      blocks={blocks}
      showBranding={showBranding}
    />
  );
}
