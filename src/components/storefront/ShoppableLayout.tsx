"use client";

/*
 * A working storefront rendered from a resolved `Layout` (one of the six
 * redesigned .dc layouts, or a merchant's customised version of one).
 * Owns all the shop state — category filter, search, product page, cart,
 * checkout, place-order — and renders <LayoutStorefrontView>. No page
 * chrome: callers wrap it (marketing preview bar, or the merchant console).
 */

import { useEffect, useMemo, useState } from "react";
import { numOf, type Layout } from "@/lib/layoutPreviews";
import { buildLayoutView } from "@/lib/layoutView";
import { LayoutStorefrontView, type ShopApi } from "@/components/marketing/LayoutStorefrontView";
import type { LayoutBlocks } from "@/lib/layoutCommerce";
import { saveOrder } from "@/lib/orderHistory";
import { StorefrontAccountPanel } from "@/components/storefront/StorefrontAccountPanel";
import { loadCustomer, saveCustomer, clearCustomer, type CustomerSession } from "@/lib/customerSession";

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
  accountSlug,
  editable = false,
  onEditPart,
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
  /** real store slug — enables customer sign-in/up on this store. Omitted on the
   *  marketing template preview (no real store to hold accounts). */
  accountSlug?: string;
  /** click-to-edit mode: outline sections, report the clicked part to the editor */
  editable?: boolean;
  onEditPart?: (part: string) => void;
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
  const [cartPulse, setCartPulse] = useState(0); // bumps the nav cart pill on add
  const [lastAdded, setLastAdded] = useState(""); // name of the most recent add — shown in the toast
  const [pin, setPin] = useState("");
  const [pinStatus, setPinStatus] = useState<"idle" | "ok" | "no" | "bad">("idle");

  const checkPin = () => {
    const p = pin.trim();
    if (!/^\d{6}$/.test(p)) { setPinStatus("bad"); return; }
    const tokens = (L.servicePins || "")
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!tokens.length) { setPinStatus("ok"); return; } // ships everywhere
    const ok = tokens.some((t) => (t.length >= 6 ? t === p : p.startsWith(t)));
    setPinStatus(ok ? "ok" : "no");
  };

  // storefront customer session (per store) — only when accountSlug is set
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [acctOpen, setAcctOpen] = useState(false);
  useEffect(() => {
    if (accountSlug) setCustomer(loadCustomer(accountSlug));
  }, [accountSlug]);

  const jumpTo = (id: string) => {
    if (typeof document === "undefined") return;
    setScreen("home");
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const v = useMemo(() => buildLayoutView(L, slide), [L, slide]);

  const addToCart = (p: P, q = 1, vr = p.variants[0]) => {
    setCartPulse((n) => n + 1);
    setLastAdded(p.name);
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

  const placeOrder = (details?: { name?: string; city?: string; discountApplied?: boolean }) => {
    if (!cart.length) return;
    const subtotalN = cart.reduce((a, c) => a + numOf(c.p.price) * c.qty, 0);
    const discountN = details?.discountApplied ? Math.min(numOf(L.cart.discount), subtotalN) : 0;
    const gstN = Math.round((subtotalN - discountN) * 0.05);
    const r = ref6();
    saveOrder(orderSlug, {
      orderNumber: r,
      placedAt: new Date().toISOString(),
      storeName: L.store,
      customerName: details?.name?.trim() || customer?.customer.name || "guest",
      city: details?.city?.trim() || "",
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
    cart, active, qty, variant, method, placed, cat, query, galleryPick, pin, pinStatus, searchOpen, cartPulse, lastAdded,
    openProduct: (p) => { setActive(p); setQty(1); setVariant(p.variants[0]); setGalleryPick(p.img); setPinStatus("idle"); setScreen("product"); scrollTop(); },
    addToCart,
    buyNow: (p) => { addToCart(p, qty, variant); setScreen("cart"); scrollTop(); },
    setQty, setVariant,
    setLineQty: (i, n) => setCart((prev) => (n <= 0 ? prev.filter((_, x) => x !== i) : prev.map((c, x) => (x === i ? { ...c, qty: n } : c)))),
    removeLine: (i) => setCart((prev) => prev.filter((_, x) => x !== i)),
    setMethod,
    setCat: (c) => { setCat(c); setQuery(""); },
    setQuery: (q) => { setQuery(q); if (q) setCat(""); },
    setGalleryPick,
    setPin: (v: string) => { setPin(v); setPinStatus("idle"); },
    checkPin,
    toggleSearch: () => setSearchOpen((o) => !o),
    openAccount: () => { if (accountSlug) setAcctOpen(true); },
    account: customer ? { name: customer.customer.name } : null,
    goCart: () => { setScreen("cart"); scrollTop(); },
    goHome: () => { setPlaced(null); setCat(""); setQuery(""); setSearchOpen(false); setScreen("home"); scrollTop(); },
    placeOrder,
    toGrid: () => jumpTo("ssr-grid"),
    toLookbook: () => jumpTo("ssr-lookbook"),
    whatsapp: () => { if (typeof window !== "undefined") window.open(`https://wa.me/${whatsappNumber}`, "_blank", "noopener"); },
  };

  return (
    <>
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
        editable={editable}
        onEditPart={onEditPart}
      />
      {acctOpen && accountSlug && (
        <StorefrontAccountPanel
          storeSlug={accountSlug}
          accent={L.accent}
          fg={L.fg}
          card={L.card}
          line={L.line}
          btnFg={btnFg}
          session={customer}
          onAuthed={(s) => { saveCustomer(accountSlug, s); setCustomer(s); setAcctOpen(false); }}
          onLogout={() => { clearCustomer(accountSlug); setCustomer(null); setAcctOpen(false); }}
          onClose={() => setAcctOpen(false)}
        />
      )}
    </>
  );
}
