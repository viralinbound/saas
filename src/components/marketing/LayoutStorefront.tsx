"use client";

/*
 * Full-page "live preview" of a redesigned store layout — opened from the
 * "live preview ↗" button on /templates. Shows the exact storefront design
 * from the showcase (promo bar, nav, hero carousel, category tiles, product
 * grid, signature features, gallery, reviews, checkout) full-bleed, with a
 * thin SuperShowroom bar on top to switch screen and start a setup.
 *
 * `shoppable` (optional) is the real StorefrontClient element, built on the
 * server — a toggle flips to it so buyers can actually add to cart / order.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { LAYOUTS, MONO, inr, numOf, type Layout } from "@/lib/layoutPreviews";
import { LayoutStorefrontView } from "@/components/marketing/LayoutStorefrontView";

type Screen = "home" | "product" | "cart";

export function LayoutStorefront({
  layoutKey,
  shoppable,
}: {
  layoutKey: string;
  shoppable?: React.ReactNode;
}) {
  const L: Layout = LAYOUTS.find((d) => d.key === layoutKey) ?? LAYOUTS[0];
  const idx = LAYOUTS.indexOf(L);
  const onDark = L.bg === "#0E1116";
  const btnFg = onDark ? "#0E1116" : "#FFFFFF";

  const [mode, setMode] = useState<"design" | "shop">("design");
  const [screen, setScreen] = useState<Screen>("home");
  const [slide, setSlide] = useState(0);

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

  const pill = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? "#FAF9F6" : "rgba(250,249,246,0.35)"}`,
    background: active ? "#FAF9F6" : "transparent",
    color: active ? "#14161A" : "#FAF9F6",
    padding: "6px 12px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em",
    textTransform: "uppercase", fontWeight: 700, cursor: "pointer",
  });

  return (
    <div style={{ minHeight: "100vh", background: L.bg }}>
      {/* thin control bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 80, background: "#14161A", color: "#FAF9F6", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 16px" }}>
        <Link href="/templates" style={{ color: "#9FBBE0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>← all layouts</Link>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", opacity: 0.7 }}>{L.name} · live preview</span>

        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          {shoppable && (
            <>
              <div onClick={() => setMode("design")} style={pill(mode === "design")}>design</div>
              <div onClick={() => setMode("shop")} style={pill(mode === "shop")}>shoppable demo</div>
              <span style={{ width: 1, background: "rgba(250,249,246,0.25)", margin: "0 4px" }} />
            </>
          )}
          {mode === "design" && (["home", "product", "cart"] as Screen[]).map((s) => (
            <div key={s} onClick={() => setScreen(s)} style={pill(screen === s)}>{s === "cart" ? "checkout" : s}</div>
          ))}
          <Link href={`/onboarding?theme=${L.key}`} style={{ background: "#24457A", color: "#FFFFFF", padding: "7px 14px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>use this layout →</Link>
        </div>
      </div>

      {mode === "shop" && shoppable ? (
        <div>{shoppable}</div>
      ) : (
        <div style={{ margin: "0 auto", maxWidth: 1440, boxShadow: "0 18px 40px rgba(20,22,26,0.12)" }}>
          <LayoutStorefrontView
            L={L}
            screen={screen}
            v={v}
            btnFg={btnFg}
            onDark={onDark}
            idx={idx}
            onSlide={setSlide}
          />
        </div>
      )}
    </div>
  );
}
