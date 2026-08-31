"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product, Store } from "@/lib/types";
import { formatMoney, getTheme } from "@/lib/constants";
import { coerceConfig, coerceTokens, type StoreConfig, type ThemeTokens, type Section } from "@/lib/customization";
import { track } from "@/lib/track";
import { readableTextOn, luminance } from "@/lib/color";
import { mediaCover, mediaSlides } from "@/lib/media";
import { loadOrders, saveOrder, type LocalOrder } from "@/lib/orderHistory";

type CartItem = { product: Product; quantity: number; variant?: string; engraving?: string };

export function StorefrontClient({
  store,
  config,
  tokens,
  demo = false,
  previewOnly = false,
}: {
  store: Store & { products: Product[] };
  config?: StoreConfig;
  tokens?: ThemeTokens;
  demo?: boolean;
  previewOnly?: boolean;
}) {
  const themeKey = store.theme || "fashion";
  const theme = getTheme(themeKey);
  const cfg = coerceConfig(config, store.name);
  const tok = coerceTokens(tokens);
  const accent = tok.accent || store.accentColor || theme.accent;
  const money = (n: number) => formatMoney(n, store.currency || "INR");
  // readable text on the accent-coloured buttons / chips
  const onAccent = readableTextOn(accent, "#fff");
  // the accent used as text on a white surface — swap for ink if it's too pale
  const accentInk = (luminance(accent) ?? 0) > 0.62 ? "#0F172A" : accent;

  const sec = (type: Section["type"]) => cfg.sections.find((s) => s.type === type && s.visible);
  const str = (s: Section | undefined, key: string, fallback = "") => (s ? String(s.settings[key] ?? fallback) : fallback);

  const announcement = sec("announcement");
  const hero = sec("hero");
  const trust = sec("trust_bar");
  const grid = sec("featured_products");
  const richText = sec("rich_text");

  const heroImage = str(hero, "image") || theme.hero;
  const trustItems = (str(trust, "items", "Secure Checkout, COD Available, Easy Returns, Fast Dispatch"))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const showSearch = grid ? grid.settings["showSearch"] !== false : true;

  // Interactive States
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("");

  // Industry Modals State
  const [activeModal, setActiveModal] = useState<
    "sizeGuide" | "goldRates" | "deliverySlot" | "techSpecs" | "dermaGuide" | "emiCalc" | null
  >(null);

  // Cart & Promotion Features
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [customEngraving, setCustomEngraving] = useState("");
  const [giftWrapped, setGiftWrapped] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("Morning (7:00 AM - 11:00 AM)");

  // Order Form State
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    address: "",
    city: "",
    pincode: "",
    paymentMethod: "cod",
  });
  const [formErr, setFormErr] = useState("");
  const [locating, setLocating] = useState(false);

  // Buyer order history (localStorage — works for previews too)
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState<LocalOrder[]>([]);
  useEffect(() => {
    setOrderHistory(loadOrders(store.slug));
  }, [store.slug]);

  async function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setFormErr("Location isn't available on this device — please fill the address manually.");
      return;
    }
    setLocating(true);
    setFormErr("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: "application/json" } }
          );
          const j = await res.json();
          const a = j.address || {};
          const line = [a.house_number, a.road, a.neighbourhood, a.suburb].filter(Boolean).join(", ");
          setForm((f) => ({
            ...f,
            address: line || f.address || j.display_name || "",
            city: a.city || a.town || a.village || a.state_district || f.city,
            pincode: a.postcode || f.pincode,
          }));
        } catch {
          setFormErr("Couldn't look up that location — please fill the address manually.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setFormErr("Location permission was blocked — please fill the address manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function validateForm(): string {
    if (form.customerName.trim().length < 2) return "Enter your full name.";
    if (form.customerPhone.replace(/\D/g, "").length < 10) return "Enter a valid 10-digit phone number.";
    if (form.address.trim().length < 5) return "Enter a delivery address.";
    if (!form.city.trim()) return "Enter your city.";
    if (!/^\d{6}$/.test(form.pincode.trim())) return "Enter a valid 6-digit pincode.";
    return "";
  }

  function recordOrder(orderNumber: string, preview: boolean) {
    const rec: LocalOrder = {
      orderNumber,
      placedAt: new Date().toISOString(),
      storeName: store.name,
      customerName: form.customerName.trim(),
      city: form.city.trim() || undefined,
      paymentMethod: form.paymentMethod,
      total: subtotal,
      currency: store.currency || "INR",
      items: cart.map((i) => ({ name: i.product.name, quantity: i.quantity, price: i.product.price, variant: i.variant })),
      preview,
    };
    setOrderHistory(saveOrder(store.slug, rec));
  }

  const categories = useMemo(() => {
    const cats = new Set(store.products.map((p) => p.category));
    return ["all", ...Array.from(cats)];
  }, [store.products]);

  const filtered = useMemo(() => {
    return store.products.filter((p) => {
      const matchCat = activeCategory === "all" || p.category === activeCategory;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [store.products, activeCategory, search]);

  const rawSubtotal = useMemo(() => cart.reduce((s, i) => s + i.product.price * i.quantity, 0), [cart]);
  const subtotal = Math.max(0, rawSubtotal - discountAmount);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    if (!previewOnly) track(store.slug, "page_view");
  }, [store.slug, previewOnly]);

  function addToCart(product: Product, chosenVariant?: string) {
    const variantToUse = chosenVariant || (product.variants ? product.variants.split("/")[0].trim() : undefined);
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.variant === variantToUse);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.variant === variantToUse
            ? { ...i, quantity: i.quantity + 1, engraving: customEngraving || i.engraving }
            : i
        );
      }
      return [...prev, { product, quantity: 1, variant: variantToUse, engraving: customEngraving }];
    });
    if (!previewOnly) track(store.slug, "add_to_cart", { productId: product.id });
    setQuickViewProduct(null);
    setCartOpen(true);
  }

  function updateQty(id: string, delta: number, variant?: string) {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === id && i.variant === variant ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function applyCoupon() {
    if (couponCode.trim().toUpperCase() === "LAUNCH15" || couponCode.trim().toUpperCase() === "SUPER15") {
      const discount = Math.round(rawSubtotal * 0.15);
      setDiscountAmount(discount);
      setCouponApplied(true);
    } else {
      alert("Invalid coupon code. Try 'LAUNCH15' for 15% OFF!");
    }
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setFormErr(err);
      return;
    }
    setFormErr("");

    if (previewOnly) {
      recordOrder(`PRV-${Date.now().toString().slice(-6)}`, true);
      setOrderDone(true);
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
      return;
    }
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeSlug: store.slug,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        address: form.address.trim(),
        city: form.city.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
        paymentMethod: form.paymentMethod,
        deliverySlot: themeKey === "bakery" ? selectedSlot : undefined,
        customEngraving: customEngraving || undefined,
        giftWrapped,
        discountAmount,
        items: cart.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          variant: i.variant,
          engraving: i.engraving,
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      recordOrder(data?.order?.orderNumber || `ORD-${Date.now().toString().slice(-6)}`, false);
      setOrderDone(true);
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
    } else {
      setFormErr(data?.error || "Could not place the order. Please try again.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", fontFamily: tok.bodyFont || "'Plus Jakarta Sans', sans-serif", background: "#FAF9F6" }}>
      {demo && (
        <div style={{ position: "sticky", top: 0, zIndex: 400, background: "#0F172A", color: "#fff", padding: "8px 16px", fontSize: 13, textAlign: "center", fontWeight: 600 }}>
          ⚡ Live Interactive Demo of <strong>{theme.name}</strong> template.
          <a href="/signup" style={{ color: "#CCFF00", fontWeight: 800, marginLeft: 10, textDecoration: "none" }}>Launch Your Store Now →</a>
        </div>
      )}

      {announcement && (
        <div className="real-store-announcement" style={{ background: "#1E293B", color: "#F8FAFC" }}>
          {str(announcement, "text", theme.announcement)}
        </div>
      )}

      {/* ── Industry Specific Live Feature Strip ───────────────────────── */}
      <div style={{ background: "#0F172A", color: "#E2E8F0", padding: "8px 20px", fontSize: "0.82rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        {themeKey === "jewels" && (
          <>
            <span>💎 <strong>Live Gold Rate Today:</strong> 24K: ₹7,850/g · 22K: ₹7,195/g | 100% BIS Hallmarked Gold & Certified Diamonds</span>
            <button onClick={() => setActiveModal("goldRates")} style={{ background: "rgba(255,255,255,0.12)", color: "#FCD34D", border: 0, padding: "4px 10px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer", fontWeight: 700 }}>
              Verify Hallmark & Rates ↗
            </button>
          </>
        )}
        {themeKey === "bakery" && (
          <>
            <span>🥐 <strong>Fresh Out Of Oven!</strong> Order before 4:00 PM for Same-Day Express Delivery. Eggless options available.</span>
            <button onClick={() => setActiveModal("deliverySlot")} style={{ background: "rgba(255,255,255,0.12)", color: "#FDBA74", border: 0, padding: "4px 10px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer", fontWeight: 700 }}>
              Select Delivery Slot ⏰
            </button>
          </>
        )}
        {themeKey === "skincare" && (
          <>
            <span>🌿 <strong>Clean Beauty Guarantee:</strong> 100% Dermatologist-Formulated · Fragrance-Free · Cruelty-Free</span>
            <button onClick={() => setActiveModal("dermaGuide")} style={{ background: "rgba(255,255,255,0.12)", color: "#6EE7B7", border: 0, padding: "4px 10px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer", fontWeight: 700 }}>
              4-Step Routine Guide 📖
            </button>
          </>
        )}
        {themeKey === "kirana" && (
          <>
            <span>🥦 <strong>Farm Fresh Guarantee:</strong> 3-Hour Delivery | Add products to cart for instant free delivery!</span>
            <span style={{ color: "#4ADE80", fontWeight: 700 }}>✓ Free Express Shipping over ₹499</span>
          </>
        )}
        {themeKey === "tech" && (
          <>
            <span>⚡ <strong>Official Brand Stock:</strong> Brand Warranty · No-Cost EMI from ₹499/mo · Next-Day Dispatch</span>
            <button onClick={() => setActiveModal("emiCalc")} style={{ background: "rgba(255,255,255,0.12)", color: "#C084FC", border: 0, padding: "4px 10px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer", fontWeight: 700 }}>
              EMI Calculator & Specs 📊
            </button>
          </>
        )}
        {themeKey === "fashion" && (
          <>
            <span>✨ <strong>Festive Special:</strong> Flat 15% OFF with code <strong>LAUNCH15</strong> | Free Alterations & Easy Returns</span>
            <button onClick={() => setActiveModal("sizeGuide")} style={{ background: "rgba(255,255,255,0.12)", color: "#93C5FD", border: 0, padding: "4px 10px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer", fontWeight: 700 }}>
              View Size Chart 📏
            </button>
          </>
        )}
      </div>

      {/* ── Navigation Header ────────────────────────────────────────── */}
      <header className="real-store-nav" style={{ background: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "#0F172A", fontFamily: tok.headingFont || "serif", letterSpacing: "-0.02em" }}>
          {store.name}
        </div>

        <ul className="real-store-menu-links">
          <li><a href="#products">Shop All</a></li>
          {themeKey === "fashion" && <li><button onClick={() => setActiveModal("sizeGuide")} style={{ background: "none", border: 0, cursor: "pointer", fontWeight: 700, color: "#334155" }}>Size Guide</button></li>}
          {themeKey === "tech" && <li><button onClick={() => setActiveModal("emiCalc")} style={{ background: "none", border: 0, cursor: "pointer", fontWeight: 700, color: "#334155" }}>Specs Comparison</button></li>}
          <li><a href="#about">About Brand</a></li>
        </ul>

        <div className="real-store-nav-icons">
          {showSearch && (
            <input
              type="search"
              placeholder="Search catalog..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "1px solid #CBD5E1", borderRadius: 8, padding: "8px 12px", fontSize: "0.85rem", width: 170, outline: "none" }}
            />
          )}
          <button
            type="button"
            onClick={() => setOrdersOpen(true)}
            style={{ background: "#FFF", color: "#334155", border: "1px solid #CBD5E1", padding: "10px 14px", borderRadius: 8, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📦 My Orders{orderHistory.length ? ` (${orderHistory.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            style={{ background: accent, color: onAccent, border: 0, padding: "10px 18px", borderRadius: 8, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            🛒 Cart ({cartCount})
          </button>
        </div>
      </header>

      {/* ── Buyer Order History ──────────────────────────────────────── */}
      {ordersOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 650, display: "flex", justifyContent: "flex-end" }} onClick={() => setOrdersOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFF", width: "100%", maxWidth: 440, height: "100%", overflowY: "auto", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 900, fontSize: "1.2rem", color: "#0F172A" }}>Your orders from {store.name}</h3>
              <button onClick={() => setOrdersOpen(false)} style={{ border: 0, background: "#F1F5F9", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontWeight: 800 }}>✕</button>
            </div>
            {orderHistory.length === 0 ? (
              <p style={{ color: "#64748B", fontSize: "0.9rem", lineHeight: 1.6 }}>
                No orders yet. Add something to the cart and check out — your orders will show up here on this device.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {orderHistory.map((o) => (
                  <div key={o.orderNumber + o.placedAt} style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                      <strong style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.9rem" }}>{o.orderNumber}</strong>
                      <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{new Date(o.placedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                      {o.items.map((it, k) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#334155" }}>
                          <span>{it.name}{it.variant ? ` · ${it.variant}` : ""} × {it.quantity}</span>
                          <span style={{ fontFamily: "ui-monospace, monospace" }}>{money(it.price * it.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "0.9rem" }}>
                      <span>{o.paymentMethod.toUpperCase()} · {o.city || "—"}</span>
                      <span style={{ fontFamily: "ui-monospace, monospace" }}>{money(o.total)}</span>
                    </div>
                    {o.preview && <div style={{ marginTop: 6, fontSize: "0.7rem", color: "#B45309", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>demo preview order</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Hero Section ────────────────────────────────────────────── */}
      {hero && (
        <section className="real-store-hero" style={{ backgroundImage: `url(${heroImage})`, margin: 0, position: "relative" }}>
          <div style={{ background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(2px)", padding: "40px 30px", borderRadius: 16, maxWidth: 620, color: "#FFFFFF" }}>
            <span style={{ background: accent, color: onAccent, padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 800, display: "inline-block", marginBottom: 12, letterSpacing: "0.05em" }}>
              {theme.name.split(" ")[0].toUpperCase()} COLLECTION 2026
            </span>
            <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 3.2rem)", fontWeight: 900, lineHeight: 1.1, fontFamily: tok.headingFont }}>
              {str(hero, "heading", `Welcome to ${store.name}`)}
            </h1>
            <p style={{ marginTop: 14, opacity: 0.95, fontSize: "1.05rem", lineHeight: 1.6 }}>
              {str(hero, "subheading", "Explore curated luxury collections crafted with precision, authenticity, and care.")}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
              <a href="#products" style={{ background: "#CCFF00", color: "#000", padding: "14px 28px", borderRadius: 8, fontWeight: 900, textDecoration: "none" }}>
                {str(hero, "ctaLabel", "Explore Products")} →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Trust Bar ─────────────────────────────────────────────── */}
      {trust && trustItems.length > 0 && (
        <div className="real-store-trust-strip" style={{ background: "#F1F5F9", borderBottom: "1px solid #E2E8F0" }}>
          {trustItems.map((t) => (
            <span key={t} style={{ fontWeight: 700, color: "#334155", fontSize: "0.88rem" }}>
              ✓ {t}
            </span>
          ))}
        </div>
      )}

      {/* ── Brand Story Section ─────────────────────────────────────── */}
      {richText && (
        <section style={{ maxWidth: 850, margin: "0 auto", padding: "50px 24px 20px", textAlign: "center" }}>
          {str(richText, "heading") && (
            <h2 style={{ fontWeight: 900, fontSize: "1.8rem", fontFamily: tok.headingFont, color: "#0F172A" }}>
              {str(richText, "heading")}
            </h2>
          )}
          {str(richText, "body") && (
            <p style={{ marginTop: 14, color: "#475569", lineHeight: 1.8, fontSize: "1.02rem" }}>
              {str(richText, "body")}
            </p>
          )}
        </section>
      )}

      {orderDone && (
        <div style={{ maxWidth: 1200, margin: "20px auto", padding: "0 24px" }}>
          <div style={{ background: "#ECFDF5", border: "2px solid #10B981", padding: 20, borderRadius: 14, color: "#065F46", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
              🎉 Order placed{orderHistory[0] ? ` — ${orderHistory[0].orderNumber}` : ""}!
            </div>
            <div style={{ fontSize: "0.92rem", marginTop: 4 }}>
              Your items are confirmed. We&apos;ll reach out on WhatsApp/Phone shortly.
            </div>
            <button
              type="button"
              onClick={() => setOrdersOpen(true)}
              style={{ marginTop: 10, background: "#065F46", color: "#fff", border: 0, padding: "8px 16px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}
            >
              View order history →
            </button>
          </div>
        </div>
      )}

      {/* ── Product Catalog Section ─────────────────────────────────── */}
      <section id="products" style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: accentInk, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              INSTANT ONLINE CATALOG
            </span>
            <h2 style={{ fontWeight: 900, fontSize: "1.8rem", color: "#0F172A", fontFamily: tok.headingFont, marginTop: 4 }}>
              {grid ? str(grid, "heading", "Featured Collections") : "Featured Collections"}
            </h2>
          </div>

          {/* Interactive Category Chips */}
          <div className="real-store-category-bar" style={{ margin: 0 }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`real-cat-chip${activeCategory === cat ? " active" : ""}`}
                onClick={() => setActiveCategory(cat)}
                style={activeCategory === cat ? { background: accent, borderColor: accent, color: onAccent } : {}}
              >
                {cat === "all" ? "All Products" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
          {filtered.map((p) => {
            const discount = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
            const parsedVariants = p.variants ? p.variants.split("/").map((v) => v.trim()) : [];

            return (
              <div
                key={p.id}
                className="storefront-product-card"
                style={{
                  background: "#FFFFFF",
                  borderRadius: tok.radius || "12px",
                  border: "1px solid #E2E8F0",
                  overflow: "hidden",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="storefront-img-box" style={{ position: "relative", height: 240, overflow: "hidden", background: "#F8FAFC" }}>
                  {mediaCover(p.image) && <img src={mediaCover(p.image)!} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  {mediaSlides(p.image).length > 1 && (
                    <span style={{ position: "absolute", top: 12, right: 12, background: "rgba(15,23,42,0.78)", color: "#fff", fontSize: "0.68rem", fontWeight: 700, padding: "3px 7px", borderRadius: 4 }}>
                      1/{mediaSlides(p.image).length}
                    </span>
                  )}
                  {discount > 0 && <span className="storefront-discount-badge" style={{ background: "#EF4444", color: "#fff", fontWeight: 800, padding: "4px 8px", borderRadius: 4, position: "absolute", top: 12, left: 12, fontSize: "0.75rem" }}>{discount}% OFF</span>}
                  <button
                    type="button"
                    onClick={() => { setQuickViewProduct(p); setSelectedVariant(parsedVariants[0] || ""); }}
                    style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(15,23,42,0.85)", color: "#fff", border: 0, padding: "6px 12px", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", backdropFilter: "blur(4px)" }}
                  >
                    👁️ Quick View
                  </button>
                </div>

                <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>{p.category}</span>
                    <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A", marginTop: 4, lineHeight: 1.3 }}>{p.name}</h3>
                    {p.description && <p style={{ fontSize: "0.82rem", color: "#64748B", marginTop: 6, lineHeight: 1.4 }}>{p.description}</p>}

                    {/* Variant Pills Preview */}
                    {parsedVariants.length > 0 && (
                      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                        {parsedVariants.slice(0, 3).map((v) => (
                          <span key={v} style={{ fontSize: "0.72rem", background: "#F1F5F9", padding: "2px 8px", borderRadius: 4, color: "#475569", fontWeight: 600 }}>
                            {v}
                          </span>
                        ))}
                        {parsedVariants.length > 3 && <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>+{parsedVariants.length - 3} more</span>}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                      <span style={{ fontWeight: 900, fontSize: "1.15rem", color: "#0F172A" }}>{money(p.price)}</span>
                      {p.mrp && p.mrp > p.price && (
                        <span style={{ textDecoration: "line-through", color: "#94A3B8", fontSize: "0.88rem" }}>{money(p.mrp)}</span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => { setQuickViewProduct(p); setSelectedVariant(parsedVariants[0] || ""); }}
                        style={{ flex: 1, textAlign: "center", padding: "10px", border: "1px solid #CBD5E1", background: "#FFF", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", color: "#0F172A" }}
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => addToCart(p, parsedVariants[0])}
                        style={{ flex: 1, background: accent, color: onAccent, border: 0, padding: "10px", borderRadius: 8, fontWeight: 800, cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        Add +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Quick View Product Modal ─────────────────────────────────── */}
      {quickViewProduct && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFF", borderRadius: 16, maxWidth: 700, width: "100%", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)", position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <button
              onClick={() => setQuickViewProduct(null)}
              style={{ position: "absolute", top: 12, right: 12, background: "#F1F5F9", border: 0, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontWeight: 800, zIndex: 10 }}
            >
              ✕
            </button>

            <QuickViewGallery key={quickViewProduct.id} raw={quickViewProduct.image} name={quickViewProduct.name} />


            <div style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: accentInk, textTransform: "uppercase" }}>{quickViewProduct.category}</span>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0F172A", marginTop: 4 }}>{quickViewProduct.name}</h3>
                <p style={{ fontSize: "0.88rem", color: "#475569", marginTop: 8, lineHeight: 1.5 }}>{quickViewProduct.description}</p>

                {/* Rating Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                  <span style={{ color: "#F59E0B" }}>★★★★★</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>4.9 (High Demand)</span>
                </div>

                {/* Interactive Variant Picker */}
                {quickViewProduct.variants && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 6 }}>
                      Select Option / Size:
                    </label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {quickViewProduct.variants.split("/").map((v) => {
                        const variantName = v.trim();
                        const isSelected = selectedVariant === variantName;
                        return (
                          <button
                            key={variantName}
                            type="button"
                            onClick={() => setSelectedVariant(variantName)}
                            style={{
                              border: isSelected ? `2px solid ${accent}` : "1px solid #CBD5E1",
                              background: isSelected ? accent : "#FFF",
                              color: isSelected ? "#FFF" : "#0F172A",
                              padding: "6px 12px",
                              borderRadius: 6,
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {variantName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontWeight: 900, fontSize: "1.4rem", color: "#0F172A" }}>{money(quickViewProduct.price)}</span>
                  {quickViewProduct.mrp && <span style={{ textDecoration: "line-through", color: "#94A3B8" }}>{money(quickViewProduct.mrp)}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(quickViewProduct, selectedVariant)}
                  style={{ width: "100%", background: accent, color: onAccent, border: 0, padding: 14, borderRadius: 8, fontWeight: 900, cursor: "pointer", fontSize: "0.95rem" }}
                >
                  Add to Cart →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Industry Specific Modals ───────────────────────────────── */}
      {activeModal === "goldRates" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFF", borderRadius: 14, padding: 28, maxWidth: 500, width: "100%", position: "relative" }}>
            <button onClick={() => setActiveModal(null)} style={{ position: "absolute", top: 12, right: 12, border: 0, background: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            <h3 style={{ fontWeight: 900, fontSize: "1.25rem", color: "#0F172A" }}>💎 BIS Hallmark & Today's Gold Rates</h3>
            <p style={{ fontSize: "0.88rem", color: "#475569", marginTop: 6 }}>All prices updated live based on daily bullion market standard rate.</p>
            <div style={{ marginTop: 16, background: "#FEF3C7", padding: 16, borderRadius: 10, border: "1px solid #F59E0B" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontWeight: 800 }}><span>24K Pure Gold (99.9%):</span><span>₹7,850 / gram</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontWeight: 800 }}><span>22K Fine Gold (91.6%):</span><span>₹7,195 / gram</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span>18K Diamond Gold (75.0%):</span><span>₹5,890 / gram</span></div>
            </div>
            <p style={{ marginTop: 14, fontSize: "0.82rem", color: "#64748B" }}>✓ Lifetime 100% Exchange Guarantee on metal weight. All items stamped with 6-digit HUID Hallmark code.</p>
          </div>
        </div>
      )}

      {activeModal === "deliverySlot" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFF", borderRadius: 14, padding: 28, maxWidth: 500, width: "100%", position: "relative" }}>
            <button onClick={() => setActiveModal(null)} style={{ position: "absolute", top: 12, right: 12, border: 0, background: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            <h3 style={{ fontWeight: 900, fontSize: "1.25rem", color: "#0F172A" }}>⏰ Select Fresh Bake Delivery Slot</h3>
            <p style={{ fontSize: "0.88rem", color: "#475569", marginTop: 6 }}>Bakes are proofed overnight and delivered warm straight from our oven.</p>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {["Morning (7:00 AM - 11:00 AM)", "Afternoon (12:00 PM - 4:00 PM)", "Evening (5:00 PM - 9:00 PM)"].map((slot) => (
                <button
                  key={slot}
                  onClick={() => { setSelectedSlot(slot); setActiveModal(null); }}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: selectedSlot === slot ? `2px solid ${accent}` : "1px solid #CBD5E1",
                    background: selectedSlot === slot ? "#FEF3C7" : "#FFF",
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  ✓ {slot}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeModal === "dermaGuide" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFF", borderRadius: 14, padding: 28, maxWidth: 500, width: "100%", position: "relative" }}>
            <button onClick={() => setActiveModal(null)} style={{ position: "absolute", top: 12, right: 12, border: 0, background: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            <h3 style={{ fontWeight: 900, fontSize: "1.25rem", color: "#0F172A" }}>📖 4-Step Clinical Routine Guide</h3>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#F1F5F9", padding: 12, borderRadius: 8 }}><strong>Step 1: Cleanse</strong> — Gentle pH 5.5 Gel Cleanser</div>
              <div style={{ background: "#F1F5F9", padding: 12, borderRadius: 8 }}><strong>Step 2: Treat</strong> — 20% Vitamin C or 10% Niacinamide</div>
              <div style={{ background: "#F1F5F9", padding: 12, borderRadius: 8 }}><strong>Step 3: Moisturise</strong> — 5-Ceramide Barrier Repair Cream</div>
              <div style={{ background: "#F1F5F9", padding: 12, borderRadius: 8 }}><strong>Step 4: Protect</strong> — Mineral SPF 50 Broad Spectrum</div>
            </div>
          </div>
        </div>
      )}

      {activeModal === "emiCalc" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFF", borderRadius: 14, padding: 28, maxWidth: 500, width: "100%", position: "relative" }}>
            <button onClick={() => setActiveModal(null)} style={{ position: "absolute", top: 12, right: 12, border: 0, background: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            <h3 style={{ fontWeight: 900, fontSize: "1.25rem", color: "#0F172A" }}>📊 No-Cost EMI Calculator</h3>
            <p style={{ fontSize: "0.88rem", color: "#475569", marginTop: 6 }}>Available on major bank credit cards (HDFC, ICICI, SBI, Axis).</p>
            <div style={{ marginTop: 16, background: "#F3E8FF", padding: 16, borderRadius: 10, border: "1px solid #C084FC" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontWeight: 800 }}><span>3 Months No-Cost EMI:</span><span>₹1,666 / mo</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontWeight: 800 }}><span>6 Months No-Cost EMI:</span><span>₹833 / mo</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span>12 Months Standard EMI:</span><span>₹450 / mo</span></div>
            </div>
          </div>
        </div>
      )}

      {activeModal === "sizeGuide" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFF", borderRadius: 14, padding: 28, maxWidth: 520, width: "100%", position: "relative" }}>
            <button onClick={() => setActiveModal(null)} style={{ position: "absolute", top: 12, right: 12, border: 0, background: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            <h3 style={{ fontWeight: 900, fontSize: "1.25rem", color: "#0F172A" }}>📏 Interactive Size Guide</h3>
            <p style={{ fontSize: "0.88rem", color: "#475569", marginTop: 6 }}>Use a tape measure around your body or inner ring circumference.</p>
            <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#F1F5F9", textAlign: "left" }}>
                  <th style={{ padding: 8 }}>Size</th>
                  <th style={{ padding: 8 }}>Chest / Ring Inner (mm)</th>
                  <th style={{ padding: 8 }}>Fit Type</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #E2E8F0" }}><td style={{ padding: 8, fontWeight: 800 }}>S / Size 12</td><td style={{ padding: 8 }}>36" / 16.5 mm</td><td style={{ padding: 8 }}>Slim Fit</td></tr>
                <tr style={{ borderBottom: "1px solid #E2E8F0" }}><td style={{ padding: 8, fontWeight: 800 }}>M / Size 14</td><td style={{ padding: 8 }}>38" / 17.3 mm</td><td style={{ padding: 8 }}>Regular Fit</td></tr>
                <tr style={{ borderBottom: "1px solid #E2E8F0" }}><td style={{ padding: 8, fontWeight: 800 }}>L / Size 16</td><td style={{ padding: 8 }}>40" / 18.1 mm</td><td style={{ padding: 8 }}>Comfort Fit</td></tr>
                <tr><td style={{ padding: 8, fontWeight: 800 }}>XL / Size 18</td><td style={{ padding: 8 }}>42" / 18.9 mm</td><td style={{ padding: 8 }}>Relaxed Fit</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Slide-Out Cart & Checkout Drawer ────────────────────────── */}
      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(3px)", zIndex: 500 }} onClick={() => setCartOpen(false)}>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(440px, 100%)", background: "#fff", padding: 24, overflowY: "auto", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #E2E8F0" }}>
              <h2 style={{ fontWeight: 900, fontSize: "1.25rem" }}>Your Bag ({cartCount})</h2>
              <button type="button" onClick={() => setCartOpen(false)} style={{ border: 0, background: "none", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748B" }}>
                <div style={{ fontSize: "3rem" }}>🛍️</div>
                <p style={{ fontWeight: 700, marginTop: 12 }}>Your shopping bag is empty.</p>
                <button onClick={() => setCartOpen(false)} style={{ marginTop: 16, background: accent, color: onAccent, border: 0, padding: "10px 20px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>Explore Collections</button>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ overflowY: "auto" }}>
                  {cart.map((item) => (
                    <div key={`${item.product.id}-${item.variant}`} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid #F1F5F9" }}>
                      {mediaCover(item.product.image) && <img src={mediaCover(item.product.image)!} alt="" style={{ width: 68, height: 68, objectFit: "cover", borderRadius: 8 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0F172A" }}>{item.product.name}</div>
                        {item.variant && <span style={{ fontSize: "0.75rem", background: "#F1F5F9", padding: "2px 6px", borderRadius: 4, color: "#475569", fontWeight: 700 }}>{item.variant}</span>}
                        <div style={{ fontWeight: 900, color: "#0F172A", marginTop: 4 }}>{money(item.product.price)}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                          <button type="button" onClick={() => updateQty(item.product.id, -1, item.variant)} style={{ width: 26, height: 26, border: "1px solid #CBD5E1", background: "#FFF", cursor: "pointer", borderRadius: 4, fontWeight: 800 }}>−</button>
                          <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>{item.quantity}</span>
                          <button type="button" onClick={() => updateQty(item.product.id, 1, item.variant)} style={{ width: 26, height: 26, border: "1px solid #CBD5E1", background: "#FFF", cursor: "pointer", borderRadius: 4, fontWeight: 800 }}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Interactive Coupon Box */}
                  <div style={{ marginTop: 20, padding: 14, background: "#F8FAFC", borderRadius: 10, border: "1px dashed #CBD5E1" }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 6 }}>Promo Code / Coupon:</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Try LAUNCH15"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        style={{ flex: 1, padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: "0.85rem", textTransform: "uppercase" }}
                      />
                      <button type="button" onClick={applyCoupon} style={{ background: "#0F172A", color: "#FFF", border: 0, padding: "8px 14px", borderRadius: 6, fontWeight: 800, cursor: "pointer" }}>Apply</button>
                    </div>
                    {couponApplied && <p style={{ color: "#10B981", fontSize: "0.78rem", fontWeight: 800, marginTop: 6 }}>✓ Code LAUNCH15 applied! Saved {money(discountAmount)}</p>}
                  </div>

                  {/* Custom Engraving Option */}
                  {(themeKey === "jewels" || themeKey === "fashion") && (
                    <div style={{ marginTop: 14 }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", display: "block" }}>Free Custom Laser Engraving (Optional):</label>
                      <input
                        type="text"
                        placeholder="e.g. A & R 2026"
                        maxLength={25}
                        value={customEngraving}
                        onChange={(e) => setCustomEngraving(e.target.value)}
                        style={{ width: "100%", padding: 8, border: "1px solid #CBD5E1", borderRadius: 6, fontSize: "0.82rem", marginTop: 4 }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "2px solid #0F172A" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.9rem", color: "#64748B" }}>
                    <span>Subtotal</span><span>{money(rawSubtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.9rem", color: "#10B981", marginTop: 4 }}>
                      <span>Discount</span><span>-{money(discountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "1.2rem", color: "#0F172A", marginTop: 8 }}>
                    <span>Total Amount</span><span>{money(subtotal)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                    style={{ width: "100%", marginTop: 16, background: accent, color: onAccent, border: 0, padding: 14, borderRadius: 8, fontWeight: 900, cursor: "pointer", fontSize: "1rem" }}
                  >
                    Proceed to Checkout →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Direct Checkout Modal ────────────────────────────────────── */}
      {checkoutOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFF", borderRadius: 16, padding: 28, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontWeight: 900, fontSize: "1.3rem", color: "#0F172A", marginBottom: 6 }}>Fast Checkout ({money(subtotal)})</h3>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              style={{ width: "100%", marginBottom: 12, padding: 10, border: `1px dashed ${accent}`, background: "#F8FAFC", borderRadius: 8, fontWeight: 800, color: accentInk, cursor: locating ? "wait" : "pointer" }}
            >
              {locating ? "Locating…" : "📍 Use my current location"}
            </button>
            <form onSubmit={placeOrder} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={{ fontSize: "0.8rem", fontWeight: 800 }}>Full Name</label><input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} style={{ width: "100%", padding: 10, border: "1px solid #CBD5E1", borderRadius: 8 }} /></div>
              <div><label style={{ fontSize: "0.8rem", fontWeight: 800 }}>Phone / WhatsApp</label><input required inputMode="tel" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} style={{ width: "100%", padding: 10, border: "1px solid #CBD5E1", borderRadius: 8 }} /></div>
              <div><label style={{ fontSize: "0.8rem", fontWeight: 800 }}>Delivery Address</label><textarea required rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={{ width: "100%", padding: 10, border: "1px solid #CBD5E1", borderRadius: 8 }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={{ fontSize: "0.8rem", fontWeight: 800 }}>City</label><input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ width: "100%", padding: 10, border: "1px solid #CBD5E1", borderRadius: 8 }} /></div>
                <div><label style={{ fontSize: "0.8rem", fontWeight: 800 }}>Pincode</label><input required inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} style={{ width: "100%", padding: 10, border: "1px solid #CBD5E1", borderRadius: 8 }} /></div>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 800 }}>Payment</label>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  {(["cod", "upi", "card"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, paymentMethod: m })}
                      style={{ flex: 1, padding: 9, borderRadius: 8, border: `1px solid ${form.paymentMethod === m ? accent : "#CBD5E1"}`, background: form.paymentMethod === m ? "#EEF2F8" : "#FFF", fontWeight: 800, textTransform: "uppercase", fontSize: "0.75rem", cursor: "pointer" }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              {formErr && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", padding: 10, borderRadius: 8, fontSize: "0.85rem" }}>{formErr}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => { setCheckoutOpen(false); setFormErr(""); }} style={{ flex: 1, padding: 12, border: "1px solid #CBD5E1", background: "#FFF", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Back</button>
                <button type="submit" style={{ flex: 1, background: accent, color: onAccent, border: 0, padding: 12, borderRadius: 8, fontWeight: 900, cursor: "pointer" }}>Confirm Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* Quick-view media carousel: ◀ ▶ steps through every image, then any videos. */
function QuickViewGallery({ raw, name }: { raw: string | null; name: string }) {
  const slides = mediaSlides(raw);
  const [ix, setIx] = useState(0);
  const cur = slides[ix];
  const many = slides.length > 1;
  const go = (dir: -1 | 1) => setIx((i) => (i + dir + slides.length) % slides.length);

  return (
    <div style={{ position: "relative", height: "100%", minHeight: 320, background: "#F8FAFC" }}>
      {cur ? (
        cur.type === "image" ? (
          <img src={cur.url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <video src={cur.url} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000" }} />
        )
      ) : (
        <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#94A3B8", fontSize: "0.85rem" }}>No image</div>
      )}

      {many && (
        <>
          <button onClick={() => go(-1)} aria-label="previous image" style={qvArrow("left")}>◀</button>
          <button onClick={() => go(1)} aria-label="next image" style={qvArrow("right")}>▶</button>
          <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
            {slides.map((_, k) => (
              <span key={k} onClick={() => setIx(k)} style={{ width: 7, height: 7, borderRadius: "50%", background: k === ix ? "#0F172A" : "rgba(15,23,42,0.3)", cursor: "pointer" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function qvArrow(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 10,
    transform: "translateY(-50%)",
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: 0,
    background: "rgba(15,23,42,0.82)",
    color: "#fff",
    fontSize: 12,
    cursor: "pointer",
  };
}
