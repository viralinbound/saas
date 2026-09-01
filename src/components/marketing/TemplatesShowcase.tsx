"use client";

/*
 * /templates — "walk the whole store before you pick one"
 * Faithful port of `SuperShowroom Layouts.dc.html`: six layouts, three screens
 * each (storefront / product page / cart & checkout), a live phone mock, the
 * "what ships switched on" + "styling underneath" panels, an at-a-glance
 * scroller, the photography filmstrip and the switch-later cards.
 *
 * Functionality preserved from the old page:
 *   • "Live preview ↗"  → /preview/template/<key>
 *   • every "use / select / start with" CTA → /onboarding?theme=<key>
 */

import Link from "next/link";
import { useMemo, useState } from "react";


import { LAYOUTS, MONO, filmstrip, inr, numOf } from "@/lib/layoutPreviews";
import { LayoutStorefrontView } from "@/components/marketing/LayoutStorefrontView";

type Screen = "home" | "product" | "cart";

export function TemplatesShowcase() {
  const [pick, setPick] = useState(0);
  const [screen, setScreen] = useState<Screen>("home");
  const [slide, setSlide] = useState(0);

  const L = LAYOUTS[Math.min(pick, LAYOUTS.length - 1)];
  const onDark = L.bg === "#0E1116";
  const btnFg = onDark ? "#0E1116" : "#FFFFFF";
  const i = pick;

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
      p0, lines, subtotalN, discountN, gstN, slides, si, gallery, off,
      subtotal: inr(subtotalN), gst: inr(gstN), total: inr(subtotalN - discountN + gstN),
      path: screen === "home" ? "/" : screen === "product" ? "/p/" + p0.name.split(" ").slice(0, 2).join("-") : "/cart",
      galleryTitle: "from the " + (L.name.indexOf("bakery") >= 0 ? "kitchen" : L.name.indexOf("kirana") >= 0 ? "farm" : "studio"),
      handle: "@" + L.domain.split(".")[0],
    };
  }, [L, screen, slide]);

  const cardBox: React.CSSProperties = { border: "1px solid #E4E1DA", background: "#FFFFFF" };
  const eyebrow: React.CSSProperties = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A" };

  const pickLayout = (k: number) => { setPick(k); setScreen("home"); setSlide(0); };

  return (
    <div style={{ background: "#F1EFE9", color: "#14161A" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .tpl-lift{transition:transform .3s cubic-bezier(.2,.7,.2,1)}
        .tpl-lift:hover{transform:translateY(-2px)}
        .tpl-card:hover{transform:translate(-2px,-2px)}
        .tpl-scroll{scrollbar-width:thin}
        .tpl-btn{transition:background .18s,color .18s}
        .tpl-btn:hover{background:#14161A!important;color:#FAF9F6!important}
        @media (max-width:760px){
          .tpl-tabstrip{position:static!important}
          .tpl-tabgrid{display:flex!important;grid-template-columns:none!important;overflow-x:auto;scroll-snap-type:x mandatory}
          .tpl-tabgrid>*{flex:0 0 220px;scroll-snap-align:start}
        }
      `}} />

      {/* hero */}
      <section style={{ background: "#FAF9F6", borderBottom: "1px solid #E4E1DA" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "48px 28px 26px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: 28, alignItems: "end" }}>
          <div>
            <div style={eyebrow}>six layouts · three screens each</div>
            <h1 style={{ fontSize: "clamp(34px, 4.2vw, 62px)", lineHeight: 0.92, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 12 }}>
              walk the whole store before you <span style={{ fontWeight: 600, color: "#24457A" }}>pick one.</span>
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.55, maxWidth: 620, marginTop: 16 }}>
              not screenshots — the storefront, a product page and the checkout for every layout, with the industry features switched on. everything you see is included from ₹15,000/yr.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 130px), 1fr))", gap: 12 }}>
            {[["6", "layouts", "#14161A"], ["18", "screens to walk", "#24457A"], ["36", "features on", "#14161A"]].map(([n, label, c]) => (
              <div key={label} style={{ border: "1px solid #E4E1DA", background: "#FFFFFF", padding: 16 }}>
                <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, color: c }}>{n}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 5, opacity: 0.7 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* sticky tab strip */}
      <section className="tpl-tabstrip" style={{ background: "#F1EFE9", borderBottom: "1px solid #E4E1DA", position: "sticky", top: 61, zIndex: 40 }}>
        <div className="tpl-tabgrid tpl-scroll" style={{ maxWidth: 1440, margin: "0 auto", padding: "13px 28px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 186px), 1fr))", gap: 9 }}>
          {LAYOUTS.map((d, k) => (
            <div key={d.key} onClick={() => pickLayout(k)} className="tpl-lift" style={{ border: `1px solid ${k === i ? "#24457A" : "#E4E1DA"}`, background: k === i ? "#FFFFFF" : "#FAF9F6", padding: "9px 11px", cursor: "pointer", display: "grid", gridTemplateColumns: "40px 1fr", gap: 10, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, border: "1px solid #E4E1DA", overflow: "hidden" }}>
                <img src={d.hero} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{d.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4, color: k === i ? "#24457A" : "#14161A" }}>{k === i ? "previewing ✦" : d.short}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* layout header + screen switch */}
      <section style={{ background: "#F1EFE9" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "30px 28px 18px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#24457A" }}>{"0" + (i + 1)} · {L.domain}</div>
            <h2 style={{ fontSize: "clamp(26px, 3.2vw, 42px)", lineHeight: 0.95, fontWeight: 700, letterSpacing: "-0.028em", marginTop: 9 }}>{L.name}</h2>
            <p style={{ fontSize: 16, lineHeight: 1.5, maxWidth: 620, marginTop: 9 }}>{L.bestFor}</p>
          </div>
          <div style={{ display: "grid", gap: 9, justifyItems: "end" }}>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {([["home", "storefront"], ["product", "product page"], ["cart", "cart & checkout"]] as [Screen, string][]).map(([k, label]) => (
                <div key={k} onClick={() => setScreen(k)} style={{ border: `1px solid ${screen === k ? "#14161A" : "#E4E1DA"}`, background: screen === k ? "#14161A" : "#FAF9F6", color: screen === k ? "#FFFFFF" : "#14161A", padding: "10px 15px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer" }}>{label}</div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <a href={`/preview/template/${L.key}`} target="_blank" rel="noreferrer" style={{ border: "1px solid #24457A", color: "#24457A", padding: "11px 16px", fontSize: 14, fontWeight: 700 }} className="tpl-btn">👁 live preview ↗</a>
              <Link href={`/onboarding?theme=${L.key}`} className="tpl-btn" style={{ background: "#24457A", color: "#FFFFFF", border: "1px solid #24457A", padding: "11px 18px", fontSize: 15, fontWeight: 700 }}>use {L.short} →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* browser mock + side rail */}
      <section style={{ background: "#F1EFE9", padding: "0 28px 44px" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gap: 22, alignItems: "start" }}>

          <div style={{ ...cardBox, boxShadow: "0 18px 40px rgba(20,22,26,0.12)", overflow: "hidden" }}>
            <div style={{ background: "#14161A", color: "#FAF9F6", padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 10 }}>
              <span style={{ display: "flex", gap: 5 }}>
                <span style={{ width: 9, height: 9, background: "#24457A", display: "block" }} />
                <span style={{ width: 9, height: 9, background: "#9FBBE0", display: "block" }} />
                <span style={{ width: 9, height: 9, background: "#2F6B4F", display: "block" }} />
              </span>
              <span style={{ opacity: 0.85 }}>https://{L.domain}{v.path}</span>
              <span style={{ marginLeft: "auto", opacity: 0.6 }}>desktop · 1440px</span>
            </div>

              <LayoutStorefrontView
                L={L}
                screen={screen}
                v={v}
                btnFg={btnFg}
                onDark={onDark}
                idx={i}
                onSlide={setSlide}
              />
          </div>

          {/* side rail */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 18, alignItems: "start" }}>
            {/* phone */}
            <div style={{ ...cardBox, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #E4E1DA", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>same store, on a phone</span>
                <span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.6 }}>390px</span>
              </div>
              <div style={{ padding: 20, display: "flex", justifyContent: "center", background: "#F1EFE9" }}>
                <div style={{ border: "1px solid #E4E1DA", borderRadius: 34, background: "#14161A", padding: 9, width: "100%", maxWidth: 330, boxShadow: "0 14px 32px rgba(20,22,26,0.16)" }}>
                  <div style={{ borderRadius: 27, overflow: "hidden", background: L.bg }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 15px 5px", fontFamily: MONO, fontSize: 8, color: L.fg }}>
                      <span>9:41</span><span>{L.domain}</span><span>▮▮▮</span>
                    </div>
                    <div style={{ background: L.accent, color: btnFg, padding: "6px 12px", textAlign: "center", fontFamily: MONO, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>{L.promo}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${L.line}` }}>
                      <span style={{ fontFamily: L.font, fontSize: 16, fontWeight: 700, letterSpacing: "-0.03em", color: L.fg }}>{L.store}</span>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: L.accent }}>cart · 3</span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <div style={{ aspectRatio: "4 / 3", overflow: "hidden" }}>
                        <img src={L.hero} alt={L.store} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 34%, rgba(0,0,0,0) 76%)" }} />
                      <div style={{ position: "absolute", left: 13, right: 13, bottom: 12 }}>
                        <div style={{ fontFamily: L.font, fontSize: 21, fontWeight: 700, letterSpacing: "-0.03em", color: "#FFFFFF", lineHeight: 1 }}>{L.headline}</div>
                        <div style={{ display: "inline-block", marginTop: 8, background: L.accent, color: btnFg, padding: "7px 12px", fontSize: 11, fontWeight: 700 }}>{L.cta}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, padding: "10px 12px 3px", overflow: "hidden" }}>
                      {L.chips.slice(0, 4).map((c, k) => (
                        <span key={c} style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.06em", textTransform: "uppercase", border: `1px solid ${k === 0 ? L.accent : L.line}`, background: k === 0 ? L.accent : "transparent", color: k === 0 ? btnFg : L.fg, padding: "5px 8px", whiteSpace: "nowrap" }}>{c}</span>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, padding: "9px 12px 12px" }}>
                      {L.products.slice(0, 4).map((p) => (
                        <div key={p.name} style={{ border: `1px solid ${L.line}`, background: L.card }}>
                          <div style={{ aspectRatio: "3 / 4", overflow: "hidden" }}>
                            <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <div style={{ padding: 8 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.25, color: L.fg }}>{p.name}</div>
                            <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: L.accent, marginTop: 4 }}>{p.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: `1px solid ${L.line}`, padding: "10px 12px", display: "flex", gap: 7 }}>
                      <div style={{ flex: 1, background: L.accent, color: btnFg, textAlign: "center", padding: 10, fontSize: 12, fontWeight: 700 }}>add to cart</div>
                      <div style={{ border: `1px solid ${L.fg}`, color: L.fg, padding: "10px 12px", fontSize: 12, fontWeight: 700 }}>buy now</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* what ships switched on */}
            <div style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 22 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>what ships switched on</div>
              <div style={{ display: "grid", gap: 10, marginTop: 15 }}>
                {L.options.map((o) => (
                  <div key={o.name} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 10, alignItems: "baseline", borderBottom: "1px solid #E4E1DA", paddingBottom: 10 }}>
                    <span style={{ color: "#2F6B4F", fontSize: 14 }}>✓</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{o.name}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.45, marginTop: 2, opacity: 0.75 }}>{o.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* styling underneath */}
            <div style={{ ...cardBox, padding: 22 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>the styling underneath</div>
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {[["accent", L.accent], ["page", L.bg], ["card", L.card], ["text", L.fg], ["rule", L.line]].map(([name, color]) => (
                  <div key={name} style={{ width: 52 }}>
                    <div style={{ height: 42, background: color, border: "1px solid #E4E1DA" }} />
                    <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 5, opacity: 0.65 }}>{name}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.6 }}>display type</div>
                  <div style={{ fontFamily: L.font, fontSize: 25, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>{L.typeSample}</div>
                </div>
                <div style={{ borderTop: "1px solid #E4E1DA", paddingTop: 11 }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.6 }}>checkout</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{L.checkout}</div>
                </div>
                <div style={{ borderTop: "1px solid #E4E1DA", paddingTop: 11 }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.6 }}>delivery</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{L.delivery}</div>
                </div>
              </div>
            </div>

            {/* every layout, every plan */}
            <div style={{ border: "1px solid #24457A", background: "#24457A", color: "#FFFFFF", padding: 22 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#C3D4EA" }}>every layout, every plan</div>
              <h3 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 8 }}>nothing here is an upsell.</h3>
              <p style={{ fontSize: 14, lineHeight: 1.55, marginTop: 10 }}>all six layouts and every feature on this page are included from ₹15,000/yr + 2% of sales. switch layout later and we migrate the catalog for you.</p>
              <Link href={`/onboarding?theme=${L.key}`} className="tpl-btn" style={{ display: "block", textAlign: "center", marginTop: 16, background: "#FFFFFF", color: "#24457A", border: "1px solid #FFFFFF", padding: 13, fontSize: 15, fontWeight: 700 }}>start with {L.short} →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* all six, at a glance */}
      <section style={{ background: "#FAF9F6", borderTop: "1px solid #E4E1DA" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "60px 28px 72px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 26 }}>
            <div>
              <div style={eyebrow}>side by side</div>
              <h2 style={{ fontSize: "clamp(28px, 3.4vw, 46px)", lineHeight: 0.95, fontWeight: 700, letterSpacing: "-0.028em", marginTop: 12 }}>
                all six, <span style={{ fontWeight: 600, color: "#24457A" }}>at a glance.</span>
              </h2>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.55, maxWidth: 400 }}>tap a card to load its three screens above, or scroll the row sideways. catalog, colours and features change — the console behind them does not.</p>
          </div>
          <div className="tpl-scroll" style={{ display: "flex", gap: 16, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 10 }}>
            {LAYOUTS.map((d, k) => (
              <div key={d.key} onClick={() => { pickLayout(k); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); }} className="tpl-card" style={{ flex: "0 0 288px", scrollSnapAlign: "start", border: `1px solid ${k === i ? "#24457A" : "#E4E1DA"}`, background: "#FFFFFF", overflow: "hidden", cursor: "pointer", boxShadow: k === i ? "0 14px 32px rgba(20,22,26,0.12)" : "none", display: "flex", flexDirection: "column", transition: "transform 0.35s cubic-bezier(.2,.7,.2,1)" }}>
                <div style={{ height: 200, overflow: "hidden", flex: "none" }}>
                  <img src={d.hero} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: 15 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>{d.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: k === i ? "#24457A" : "#2F6B4F" }}>{k === i ? "previewing ✦" : "load preview"}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.45, marginTop: 7, opacity: 0.75 }}>{d.bestFor}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    {[d.accent, d.bg, d.fg].map((c, ci) => (
                      <span key={ci} style={{ width: 18, height: 18, background: c, border: "1px solid #E4E1DA", display: "block" }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* the photography */}
      <section style={{ background: "#14161A", color: "#FAF9F6", borderTop: "1px solid #E4E1DA" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "64px 28px 30px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9FBBE0" }}>the photography</div>
            <h2 style={{ fontSize: "clamp(28px, 3.4vw, 46px)", lineHeight: 0.95, fontWeight: 700, letterSpacing: "-0.028em", marginTop: 12 }}>
              every layout ships <span style={{ fontWeight: 600, color: "#9FBBE0" }}>shot and cropped.</span>
            </h2>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.55, maxWidth: 420 }}>send us phone photos. we crop to the grid, compress for 4g and place them — hero, category tiles, product cards and the social strip.</p>
        </div>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 28px 64px" }}>
          <div className="tpl-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 10 }}>
            {filmstrip().map((f, k) => (
              <div key={k} style={{ flex: "0 0 210px", scrollSnapAlign: "start", border: "1px solid rgba(250,249,246,0.22)", overflow: "hidden" }}>
                <div style={{ height: 240, overflow: "hidden" }}>
                  <img src={f.img} alt={f.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "11px 12px 13px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>{f.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 5, color: "#9FBBE0" }}>{f.slot}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* change layout, keep everything else */}
      <section style={{ background: "#F1EFE9", borderTop: "1px solid #E4E1DA" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "64px 28px 72px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 28 }}>
            <div>
              <div style={eyebrow}>switching later</div>
              <h2 style={{ fontSize: "clamp(28px, 3.4vw, 46px)", lineHeight: 0.95, fontWeight: 700, letterSpacing: "-0.028em", marginTop: 12 }}>
                change layout, <span style={{ fontWeight: 600, color: "#24457A" }}>keep everything else.</span>
              </h2>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.55, maxWidth: 400 }}>pick a different layout a year in and nothing behind it moves. we migrate the catalog; your orders, customers and domain stay put.</p>
          </div>
          <div className="tpl-scroll" style={{ display: "flex", gap: 18, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 10 }}>
            {[
              { kicker: "day one", title: "we crop and place your photos", line: "phone shots become hero banners, tiles and product cards on the grid.", img: LAYOUTS[0].hero },
              { kicker: "any time after", title: "swap the layout in one tap", line: "the catalog migrates with you — nothing to re-upload or re-price.", img: LAYOUTS[4].hero },
              { kicker: "always", title: "orders and domain stay put", line: "customers, order history and your domain never move between layouts.", img: LAYOUTS[3].hero },
            ].map((w) => (
              <div key={w.title} style={{ flex: "0 0 min(100%, 330px)", scrollSnapAlign: "start", border: "1px solid #E4E1DA", background: "#FFFFFF", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 190, overflow: "hidden" }}>
                  <img src={w.img} alt={w.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "20px 22px 24px" }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>{w.kicker}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 10 }}>{w.title}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 7, opacity: 0.72 }}>{w.line}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", borderTop: "1px solid #E4E1DA", marginTop: 30, paddingTop: 24 }}>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>all six layouts and every feature above are on every plan.</span>
            <Link href="/onboarding" className="tpl-btn" style={{ background: "#24457A", color: "#FFFFFF", border: "1px solid #24457A", padding: "14px 22px", fontSize: 15, fontWeight: 700 }}>start your setup →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}


