"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product, Store } from "@/lib/types";
import { formatMoney } from "@/lib/constants";
import { track } from "@/lib/track";
import { readableTextOn } from "@/lib/color";
import type { SiteConfig } from "@/lib/builder";
import { BlockRenderer } from "./BlockRenderer";

type CartItem = { product: Product; quantity: number };

/**
 * Renders a v2 { pages: [...] } site for the public storefront and the builder
 * preview. Chrome (nav, cart, checkout) lives here; page content is the block
 * tree of the page whose `path` matches `pagePath`.
 */
export function V2Storefront({
  store,
  site,
  pagePath = "",
  accent = "#0052FF",
  demo = false,
  editable = false,
}: {
  store: Store & { products: Product[] };
  site: SiteConfig;
  pagePath?: string;
  accent?: string;
  demo?: boolean;
  editable?: boolean;
}) {
  const page = site.pages.find((p) => p.path === pagePath) || site.pages[0];
  const onAccent = readableTextOn(accent, "#fff");
  const currency = store.currency || "INR";
  const money = (n: number) => formatMoney(n, currency);

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", address: "", city: "", pincode: "", paymentMethod: "cod" });

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.product.price * i.quantity, 0), [cart]);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    if (!editable) track(store.slug, "page_view");
  }, [store.slug, pagePath, editable]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { product, quantity: 1 }];
    });
    if (!editable) track(store.slug, "add_to_cart", { productId: product.id });
    setCartOpen(true);
  }
  function updateQty(id: string, d: number) {
    setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, quantity: i.quantity + d } : i)).filter((i) => i.quantity > 0));
  }
  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (editable) { setOrderDone(true); setCart([]); setCheckoutOpen(false); setCartOpen(false); return; }
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeSlug: store.slug,
        ...form,
        items: cart.map((i) => ({ productId: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity })),
      }),
    });
    if (res.ok) { setOrderDone(true); setCart([]); setCheckoutOpen(false); setCartOpen(false); }
  }

  const pageHref = (path: string) => (editable ? "#" : path ? `/s/${store.slug}/${path}` : `/s/${store.slug}`);

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fff" }}>
      {demo && (
        <div style={{ position: "sticky", top: 0, zIndex: 400, background: "#111827", color: "#fff", padding: "8px 16px", fontSize: 13, textAlign: "center", fontWeight: 600 }}>
          🔓 Demo store built with <strong>SuperShowroom</strong> — not a live shop yet.
          <a href="/signup" style={{ color: "#CCFF00", fontWeight: 800, marginLeft: 8, textDecoration: "none" }}>Launch your own →</a>
        </div>
      )}

      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 24px", borderBottom: "1px solid #E2E8F0", position: "sticky", top: demo ? 37 : 0, background: "#fff", zIndex: 300, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#0F172A" }}>{store.name}</div>
        <nav style={{ display: "flex", gap: 18, fontWeight: 700, fontSize: "0.9rem" }}>
          {site.pages.map((p) => (
            <Link key={p.id} href={pageHref(p.path)} style={{ color: p.path === (page?.path ?? "") ? accent : "#334155", textDecoration: "none" }}>
              {p.name}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={() => setCartOpen(true)} style={{ background: accent, color: onAccent, border: 0, padding: "10px 16px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>
          Cart ({cartCount})
        </button>
      </header>

      {orderDone && (
        <div style={{ maxWidth: 1120, margin: "16px auto", padding: "0 24px" }}>
          <div style={{ background: "#ECFDF5", border: "1px solid #10B981", padding: 16, borderRadius: 12, fontWeight: 700 }}>
            ✓ Order placed successfully! We will contact you shortly for delivery.
          </div>
        </div>
      )}

      {page ? (
        <BlockRenderer
          blocks={page.blocks}
          ctx={{ storeSlug: store.slug, products: store.products, accent, currency, search, setSearch, addToCart }}
        />
      ) : (
        <div style={{ padding: 60, textAlign: "center", color: "#64748B" }}>This page has no content yet.</div>
      )}

      <footer style={{ background: "#0F172A", color: "#94A3B8", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontWeight: 900, color: "#fff", fontSize: "1.1rem" }}>{store.name}</div>
        <p style={{ marginTop: 8, fontSize: "0.85rem" }}>Powered by SuperShowroom · Secure payments · Fast delivery across India</p>
      </footer>

      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500 }} onClick={() => setCartOpen(false)}>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(420px, 100%)", background: "#fff", padding: 24, overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900 }}>Your Cart ({cartCount})</h2>
              <button type="button" onClick={() => setCartOpen(false)} style={{ border: 0, background: "none", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>
            {cart.length === 0 ? (
              <p style={{ color: "#64748B" }}>Your cart is empty. Add some products!</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.product.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid #E2E8F0" }}>
                    {item.product.image && <img src={item.product.image} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>{item.product.name}</div>
                      <div style={{ fontWeight: 700, marginTop: 4 }}>{money(item.product.price)}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                        <button type="button" onClick={() => updateQty(item.product.id, -1)} style={{ width: 28, height: 28, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", borderRadius: 4 }}>−</button>
                        <span style={{ fontWeight: 800 }}>{item.quantity}</span>
                        <button type="button" onClick={() => updateQty(item.product.id, 1)} style={{ width: 28, height: 28, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", borderRadius: 4 }}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "2px solid #0F172A" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "1.1rem" }}>
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <button type="button" onClick={() => { if (!editable) track(store.slug, "begin_checkout"); setCheckoutOpen(true); setCartOpen(false); }} style={{ width: "100%", marginTop: 16, background: accent, color: onAccent, border: 0, padding: 14, borderRadius: 8, fontWeight: 900, cursor: "pointer", fontSize: "1rem" }}>
                    Checkout →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", padding: 24, zIndex: 600 }}>
          <form onSubmit={placeOrder} style={{ maxWidth: 480, width: "100%", background: "#fff", borderRadius: 12, padding: 28 }}>
            <h2 style={{ fontWeight: 900, marginBottom: 4 }}>Checkout</h2>
            <p style={{ marginBottom: 20, color: "#64748B" }}>Order total: <strong>{money(subtotal)}</strong></p>
            {([
              ["customerName", "Full Name", true],
              ["customerPhone", "Phone / WhatsApp", true],
              ["customerEmail", "Email (optional)", false],
            ] as const).map(([k, label, req]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{label}</label>
                <input required={req} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px" }} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Delivery Address</label>
              <textarea required rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>City</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px" }} /></div>
              <div><label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Pincode</label><input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px" }} /></div>
            </div>
            <div style={{ margin: "12px 0" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Payment</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px" }}>
                <option value="cod">Cash on Delivery</option>
                <option value="upi">UPI</option>
                <option value="card">Credit / Debit Card</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setCheckoutOpen(false)} style={{ flex: 1, border: "1px solid #E2E8F0", background: "#fff", padding: "11px 12px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>Back</button>
              <button type="submit" style={{ flex: 1, border: 0, background: accent, color: onAccent, padding: "11px 12px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>Place Order</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
