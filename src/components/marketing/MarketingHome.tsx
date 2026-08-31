"use client";

import { useEffect, useRef, useState } from "react";
import { useDemo } from "./demo/DemoContext";
import { PricingBlock } from "./PricingBlock";

/* ------------------------------------------------------------------ *
 *  Faithful port of "SuperShowroom Homepage.dc.html" (redesign v1).
 *  Static/self-contained: no backend calls. Marketing links point at
 *  the live app routes (/signup, /login, /templates, /pricing).
 * ------------------------------------------------------------------ */

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
const SERIF = "'Instrument Serif', Georgia, serif";

const U = (id: string, w = 700) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop`;

/* ---------- data ---------- */

const INCLUSIONS = [
  { n: "01", name: "domain, SSL & DNS", line: "you own the domain; we wire and renew the rest." },
  { n: "02", name: "GST invoices", line: "raised and emailed on every single order." },
  { n: "03", name: "UPI, cards & COD", line: "live at checkout from the day you launch." },
  { n: "04", name: "whatsapp alerts", line: "to you and to the buyer, per order." },
];

const HERO_PRODUCTS = [
  { name: "embroidered silk kurta set", price: "₹3,499", mrp: "₹4,999", img: U("1610030469983-98e550d6193c", 500), kb: "19s", kbDelay: "0s", sizes: ["S", "M", "L", "XL"] },
  { name: "pure linen cuban shirt", price: "₹1,899", mrp: "₹2,499", img: U("1596755094514-f87e34085b2c", 500), kb: "23s", kbDelay: "-7s", sizes: ["M", "L", "XL"] },
];

const STORES = [
  { name: "velvet boutique", domain: "velvetboutique.in", tag: "fashion · 340 skus", img: U("1610030469983-98e550d6193c") },
  { name: "the cafe club", domain: "thecafeclub.store", tag: "bakery · daily menu", img: U("1509440159596-0249088772ff") },
  { name: "raw organics", domain: "raworganics.in", tag: "kirana · same-day", img: U("1542838132-92c53300491e") },
  { name: "spark electronics", domain: "sparkelectronics.tech", tag: "tech · emi enabled", img: U("1505740420928-5e560c06d30e") },
  { name: "royal gems", domain: "royalgems.com", tag: "jewellery · insured", img: U("1515562141207-7a88fb7ce338") },
  { name: "herbal essence", domain: "herbalessence.shop", tag: "skincare · routine bundles", img: U("1556228720-195a672e8a03") },
  { name: "urban threads", domain: "urbanthreads.in", tag: "fashion · 210 skus", img: U("1596755094514-f87e34085b2c") },
  { name: "artisan bakers", domain: "artisanbakers.store", tag: "bakery · cake booking", img: U("1578985545062-69928b1d9587") },
  { name: "organics co.", domain: "organicsco.in", tag: "grocery · subscriptions", img: U("1474979266404-7eaacbcd87c5") },
  { name: "cyber tech", domain: "cybertech.store", tag: "tech · warranty tracking", img: U("1587829741301-dc798b83add3") },
];

const OPS = [
  { n: "01", name: "hosting, CDN & SSL renewals", tag: "continuous" },
  { n: "02", name: "catalog uploads & variants", tag: "on request" },
  { n: "03", name: "delivery partner setup", tag: "at setup" },
  { n: "04", name: "shiprocket & porter pickups", tag: "per order" },
  { n: "05", name: "GST invoicing & tax reports", tag: "monthly" },
  { n: "06", name: "KYC & compliance paperwork", tag: "at setup" },
  { n: "07", name: "pincode & COD delivery rules", tag: "at setup" },
  { n: "08", name: "SEO, schema & sitemaps", tag: "monthly" },
  { n: "09", name: "google shopping feed", tag: "daily sync" },
  { n: "10", name: "meta pixel, GA4 & conversions", tag: "continuous" },
  { n: "11", name: "whatsapp CRM & cart recovery", tag: "per cart" },
  { n: "12", name: "coupons & repeat campaigns", tag: "on request" },
];

type Theme = {
  name: string; tag: string; desc: string;
  store: string; domain: string; promo: string; headline: string;
  bg: string; card: string; fg: string; line: string; accent: string; btnFg: string;
  font: string; cats: string[]; hero: string;
  products: { name: string; price: string; img: string }[];
};

const THEMES: Theme[] = [
  {
    name: "luxe apparel", tag: "fashion", desc: "colour and size runs, lookbook strips, slide-out cart.",
    store: "velvet boutique", domain: "velvetboutique.in", promo: "festive drop · 30% off", headline: "the festive drop is live",
    bg: "#FDF6F0", card: "#FFFFFF", fg: "#1A1410", line: "#E3D5C8", accent: "#98502F", btnFg: "#FFFFFF",
    font: SERIF, cats: ["ethnic", "casual", "lookbook", "sale"], hero: U("1610030469983-98e550d6193c", 900),
    products: [
      { name: "embroidered silk kurta set", price: "₹3,499", img: U("1610030469983-98e550d6193c") },
      { name: "pure linen cuban shirt", price: "₹1,899", img: U("1596755094514-f87e34085b2c") },
      { name: "georgette anarkali gown", price: "₹4,299", img: U("1583391733956-3750e0ff4e8b") },
      { name: "handblock chanderi saree", price: "₹2,799", img: U("1617627143750-d86bc21e42bb") },
    ],
  },
  {
    name: "artisan bakery", tag: "food", desc: "daily menu resets, eggless tags, delivery slots, cake booking.",
    store: "the cafe club", domain: "thecafeclub.store", promo: "baked fresh at 6am", headline: "baked fresh at 6am",
    bg: "#FFF8E7", card: "#FFFFFF", fg: "#2B1B0E", line: "#EBDCBE", accent: "#C2410C", btnFg: "#FFFFFF",
    font: SERIF, cats: ["cakes", "pastries", "eggless", "hampers"], hero: U("1509440159596-0249088772ff", 900),
    products: [
      { name: "belgian dark truffle cake", price: "₹650", img: U("1578985545062-69928b1d9587") },
      { name: "french butter croissants", price: "₹380", img: U("1555507036-ab1f4038808a") },
      { name: "wild sourdough boule", price: "₹220", img: U("1509440159596-0249088772ff") },
      { name: "parisian macarons box", price: "₹490", img: U("1569864358642-9d1684040f43") },
    ],
  },
  {
    name: "glow skincare", tag: "beauty", desc: "ingredient callouts, routine bundles, subscription refills.",
    store: "herbal essence", domain: "herbalessence.shop", promo: "routine builder · save 15%", headline: "build your routine",
    bg: "#F2F7F4", card: "#FFFFFF", fg: "#10231A", line: "#D5E5DC", accent: "#2F6B4F", btnFg: "#FFFFFF",
    font: "'Instrument Sans', sans-serif", cats: ["serums", "creams", "spf", "bundles"], hero: U("1556228720-195a672e8a03", 900),
    products: [
      { name: "20% vitamin c glow serum", price: "₹799", img: U("1620916566398-39f1143ab7be") },
      { name: "5-ceramide barrier cream", price: "₹649", img: U("1556228720-195a672e8a03") },
      { name: "rose & aloe face wash", price: "₹450", img: U("1570172619644-dfd03ed5d881") },
      { name: "mineral sunscreen spf 50", price: "₹599", img: U("1598440947619-2c35fc9aa908") },
    ],
  },
  {
    name: "fresh mart", tag: "kirana", desc: "weight selectors, one-tap reorder, same-day slots.",
    store: "raw organics", domain: "raworganics.in", promo: "same-day delivery", headline: "straight from the farm",
    bg: "#F5FBF2", card: "#FFFFFF", fg: "#14210F", line: "#D9E8D0", accent: "#3F8F29", btnFg: "#FFFFFF",
    font: "'Instrument Sans', sans-serif", cats: ["fruits", "oils", "dry fruits", "daily"], hero: U("1542838132-92c53300491e", 900),
    products: [
      { name: "kashmiri apples (1kg)", price: "₹180", img: U("1560806887-1e4cd0b6cbd6") },
      { name: "cold-pressed olive oil", price: "₹890", img: U("1474979266404-7eaacbcd87c5") },
      { name: "jumbo almonds (500g)", price: "₹480", img: U("1508061253366-f7da158b6d46") },
      { name: "free-range eggs (12)", price: "₹130", img: U("1582722872445-44dc5f7e3c8f") },
    ],
  },
  {
    name: "cyber tech", tag: "electronics", desc: "spec tables, comparison view, warranty badges, EMI.",
    store: "spark electronics", domain: "sparkelectronics.tech", promo: "launch week · ₹500 off", headline: "launch week deals",
    bg: "#0E1116", card: "#171C24", fg: "#F2F5FA", line: "#2A313D", accent: "#4F7BFF", btnFg: "#0E1116",
    font: MONO, cats: ["audio", "wearables", "charging", "gaming"], hero: U("1505740420928-5e560c06d30e", 900),
    products: [
      { name: "pro anc studio headphones", price: "₹4,999", img: U("1505740420928-5e560c06d30e") },
      { name: "titanium smart watch s5", price: "₹3,499", img: U("1523275335684-37898b6baf30") },
      { name: "hot-swap mech keyboard", price: "₹2,899", img: U("1587829741301-dc798b83add3") },
      { name: "100w gan travel charger", price: "₹1,299", img: U("1583863788434-e58a36330cf0") },
    ],
  },
  {
    name: "royal gold", tag: "jewellery", desc: "purity tags, try-on gallery, appointments, insured delivery.",
    store: "royal gems", domain: "royalgems.com", promo: "BIS hallmarked · insured", headline: "hallmarked, insured, yours",
    bg: "#FBF7EE", card: "#FFFFFF", fg: "#1C1608", line: "#E8DDC2", accent: "#8A6A17", btnFg: "#FFFFFF",
    font: SERIF, cats: ["gold", "silver", "diamond", "bridal"], hero: U("1515562141207-7a88fb7ce338", 900),
    products: [
      { name: "18k solitaire diamond ring", price: "₹24,999", img: U("1605100804763-247f67b3557e") },
      { name: "22k kundan choker set", price: "₹48,500", img: U("1599643478518-a784e5dc4c8f") },
      { name: "sterling emerald earrings", price: "₹3,200", img: U("1535632066927-ab7c9ab60908") },
      { name: "rose gold bracelet", price: "₹8,900", img: U("1611591475155-4286fa7c2e7f") },
    ],
  },
];

const STORY = [
  {
    n: "01", eyebrow: "step one · your catalog", headline: "send us what you already have.",
    body: "phone photos, a price list, a whatsapp catalog — whatever exists. we crop, compress and list it with variants, stock and GST rates.",
    glow: "rgba(36,69,122,0.55)",
    screen: { chrome: "catalog upload", title: "uploading your catalog", sub: "218 of 340 products", foot: "variants auto-detected", state: "in progress",
      rows: [
        { label: "photos processed", value: "640", pct: "78%", fg: "#2F6B4F" },
        { label: "variants mapped", value: "1,120", pct: "64%", fg: "#24457A" },
        { label: "GST rates set", value: "340", pct: "100%", fg: "#2F6B4F" },
      ] },
  },
  {
    n: "02", eyebrow: "step two · the build", headline: "we build the storefront around it.",
    body: "one of six layouts, your colours and logo, your domain wired with SSL. you see it on a staging link before anything goes public.",
    glow: "rgba(159,187,224,0.5)",
    screen: { chrome: "build status", title: "building velvetboutique.in", sub: "day 3 of 5", foot: "staging link sent", state: "on track",
      rows: [
        { label: "layout & branding", value: "done", pct: "100%", fg: "#2F6B4F" },
        { label: "pages & policies", value: "done", pct: "100%", fg: "#2F6B4F" },
        { label: "domain & SSL", value: "wiring", pct: "55%", fg: "#24457A" },
      ] },
  },
  {
    n: "03", eyebrow: "step three · money in", headline: "payments and delivery go live.",
    body: "UPI, cards and COD at checkout. GST invoices raised per order. shiprocket and porter booked for pickups, with pincode rules enforced.",
    glow: "rgba(47,107,79,0.5)",
    screen: { chrome: "checkout", title: "first test order", sub: "₹3,499 · UPI", foot: "GST invoice emailed", state: "paid ✦",
      rows: [
        { label: "UPI & cards", value: "live", pct: "100%", fg: "#2F6B4F" },
        { label: "COD pincodes", value: "18,240", pct: "92%", fg: "#24457A" },
        { label: "pickup partner", value: "booked", pct: "100%", fg: "#2F6B4F" },
      ] },
  },
  {
    n: "04", eyebrow: "step four · buyers arrive", headline: "then we go and find the buyers.",
    body: "schema and sitemaps for google, a shopping feed synced daily, coupons, and whatsapp follow-up on the carts people walk away from.",
    glow: "rgba(152,80,47,0.45)",
    screen: { chrome: "growth", title: "where orders came from", sub: "last 30 days", foot: "feed synced 2h ago", state: "growing",
      rows: [
        { label: "google search", value: "412", pct: "68%", fg: "#24457A" },
        { label: "shopping feed", value: "286", pct: "47%", fg: "#24457A" },
        { label: "cart recovery", value: "94", pct: "22%", fg: "#2F6B4F" },
      ] },
  },
  {
    n: "05", eyebrow: "step five · your part", headline: "you pack. we keep it running.",
    body: "orders land on whatsapp, labels print themselves, and hosting, renewals, audits and bug fixes stay ours — no ticket, no invoice.",
    glow: "rgba(36,69,122,0.55)",
    screen: { chrome: "orders", title: "today", sub: "14 orders · ₹48,600", foot: "labels ready to print", state: "all clear",
      rows: [
        { label: "packed", value: "11", pct: "79%", fg: "#2F6B4F" },
        { label: "awaiting pickup", value: "3", pct: "21%", fg: "#24457A" },
        { label: "uptime this month", value: "99.9%", pct: "99%", fg: "#2F6B4F" },
      ] },
  },
];

const PILLARS = [
  { n: "01", name: "your website", scope: "design, hosting & ssl",
    body: "your layout, your colours, your logo — built by us. clean type, fast loads, and it holds up on a ₹8,000 android phone on 4g, which is what most of your buyers are using.",
    points: ["custom brand styling", "hosting, ssl & your domain", "content & pages"] },
  { n: "02", name: "your store", scope: "catalog, cart & orders",
    body: "list products with size, colour or weight variants. take UPI, cards and COD. stock counts, order statuses and GST invoices update themselves.",
    points: ["product management", "instant payments", "orders & alerts"] },
  { n: "03", name: "your growth", scope: "seo, crm & ads",
    body: "get found, then get remembered: schema and sitemaps for google, a shopping feed, coupon codes, and whatsapp follow-up on carts people abandon.",
    points: ["search optimisation", "google ads & social kit", "whatsapp crm & coupons"] },
];

const SCOPE = [
  { n: "01", name: "integration", line: "delivery partners, meta pixel, GA, conversion tracking." },
  { n: "02", name: "compliance", line: "KYC, GST invoicing, tax reports, pincode delivery rules." },
  { n: "03", name: "marketing", line: "SEO, google business profile, coupons, social launch kits." },
  { n: "04", name: "upkeep & support", line: "quarterly audits, speed optimisation, bug fixes, whatsapp support." },
];

const GUARANTEES = [
  { n: "01", name: "not a builder", line: "we do the building. you never have to learn a page editor." },
  { n: "02", name: "not a ticket queue", line: "whatsapp a human, usually the one who built your store." },
  { n: "03", name: "not a template farm", line: "every layout has 350+ shipped stores of evidence behind it." },
];

const FAQS: [string, string][] = [
  ["how does the 2% fee on sales work?", "it applies to completed orders only, ex GST, billed monthly against a statement that lists every order. refunds and cancellations never count towards it."],
  ["do you sell me a domain?", "no. bring your own or buy it anywhere you like — it stays in your name. connecting it (DNS, SSL, redirects) is free on every plan."],
  ["how long does launch take?", "3–7 working days from catalog handoff. faster if your product photos are ready when we start."],
  ["can i use my existing GST and bank account?", "yes, both are configured during onboarding. money moves buyer → you directly; we never hold your funds."],
  ["what happens if i want to leave?", "you keep your domain and get a full export of products, orders and customers. no exit fee, no notice period."],
];

const TILES = [
  { img: U("1596755094514-f87e34085b2c", 600), alt: "linen shirt listing", kb: "17s", kbDelay: "0s" },
  { img: U("1555507036-ab1f4038808a", 600), alt: "croissant listing", kb: "21s", kbDelay: "-4s" },
  { img: U("1508061253366-f7da158b6d46", 600), alt: "almonds listing", kb: "19s", kbDelay: "-8s" },
  { img: U("1587829741301-dc798b83add3", 600), alt: "keyboard listing", kb: "23s", kbDelay: "-12s" },
];

const MARQUEE = ["✦ the cafe club", "✦ raw organics", "✦ velvet boutique", "✦ spark electronics", "✦ herbal essence", "✦ urban threads", "✦ royal gems", "✦ artisan bakers"];

/* ---------- scroll reveal ---------- */
function useReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal, .reveal-l, .reveal-r, .reveal-blur")
    );
    if (!("IntersectionObserver" in window)) return; // stays visible via CSS default

    root.classList.add("js-reveal");
    const io = new IntersectionObserver(
      (ents) => {
        ents.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 }
    );
    els.forEach((e) => io.observe(e));

    // Safety net: if the observer never fires (embedded viewports, odd scroll
    // containers), reveal everything after a short delay so nothing stays hidden.
    const t = window.setTimeout(() => {
      els.forEach((e) => e.classList.add("in"));
    }, 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);
}

/* ---------- component ---------- */

export function MarketingHome() {
  useReveal();
  const [step, setStep] = useState(0);
  const [themeIx, setThemeIx] = useState(0);
  const [faq, setFaq] = useState(0);

  const cur = STORY[step];
  const L = THEMES[themeIx];

  return (
    <div style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif", color: "#14161A", background: "#FAF9F6" }}>
      {/* ============ HERO ============ */}
      <section id="top" style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid #E4E1DA" }}>
        <div style={{ position: "absolute", top: -120, right: -80, width: 460, height: 460, borderRadius: 999, background: "#EEF2F8", opacity: 0.7, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -160, left: -100, width: 380, height: 380, borderRadius: 999, background: "#F1EFE9", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 1360, margin: "0 auto", padding: "72px 28px 64px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 430px), 1fr))", gap: 56, alignItems: "center" }}>
          <div className="reveal">
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#24457A" }}>
              managed online stores for indian sellers · bengaluru
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: "clamp(46px, 6vw, 92px)", lineHeight: 0.94, fontWeight: 400, letterSpacing: "-0.02em", marginTop: 20 }}>
              an online store you never have to operate.
              <span style={{ display: "inline-block", width: 3, height: "0.72em", background: "#24457A", marginLeft: 8, verticalAlign: "baseline", animation: "blink 1.1s step-end infinite" }} />
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 560, marginTop: 24 }}>
              we build the storefront, upload your catalog, wire up UPI, COD and GST invoices — then keep the whole thing running. hosting, pickup partners, ads feed and cart recovery included. <span style={{ fontFamily: MONO, fontWeight: 700 }}>₹15,000</span> a year plus <span style={{ fontFamily: MONO, fontWeight: 700 }}>2%</span> of what actually sells.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginTop: 30 }}>
              <a href="/signup" style={btnPill("#24457A", "#fff")}>start your setup →</a>
              <a href="/templates" style={{ fontSize: 16, fontWeight: 700, borderBottom: "1px solid #E4E1DA", paddingBottom: 2 }}>or preview all six layouts →</a>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 20, color: "#2F6B4F" }}>
              no lock-in ✦ leave with your data
            </div>
          </div>

          {/* device mock */}
          <div style={{ position: "relative" }} className="reveal">
            <div style={{ position: "absolute", top: -16, left: -14, zIndex: 3, background: "#98502F", color: "#fff", borderRadius: 999, padding: "9px 16px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", boxShadow: "0 12px 28px rgba(20,22,26,0.10)", animation: "floaty 6s ease-in-out infinite" }}>
              festive drop
            </div>
            <div style={{ border: "1px solid #E4E1DA", borderRadius: 34, overflow: "hidden", background: "#fff", boxShadow: "0 12px 28px rgba(20,22,26,0.10)" }}>
              <div style={{ background: "#14161A", color: "#FAF9F6", padding: "11px 15px", display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 10 }}>
                <span style={{ display: "flex", gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: "#98502F", display: "block" }} />
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: "#9FBBE0", display: "block" }} />
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: "#2F6B4F", display: "block" }} />
                </span>
                <span style={{ opacity: 0.85 }}>velvetboutique.in</span>
              </div>
              <div style={{ background: "#FDF6F0" }}>
                <div style={{ background: "#98502F", color: "#fff", padding: "7px 14px", textAlign: "center", fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  the festive drop is live
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: "1px solid #E3D5C8" }}>
                  <span style={{ fontFamily: SERIF, fontSize: 21, color: "#1A1410" }}>velvet boutique</span>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, fontWeight: 600, color: "#1A1410" }}>
                    <span style={{ color: "#98502F" }}>ethnic</span><span>casual</span><span>lookbook</span>
                  </div>
                  <span style={{ marginLeft: "auto", background: "#98502F", color: "#fff", padding: "6px 12px", borderRadius: 999, fontFamily: MONO, fontSize: 10 }}>cart · 2</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "16px 18px" }}>
                  {HERO_PRODUCTS.map((p) => (
                    <div key={p.name} style={{ border: "1px solid #E3D5C8", borderRadius: 18, overflow: "hidden", background: "#fff" }}>
                      <div style={{ aspectRatio: "3 / 4", overflow: "hidden" }}>
                        <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", animation: `kb ${p.kb} ${p.kbDelay} ease-in-out infinite` }} />
                      </div>
                      <div style={{ padding: "11px 12px 13px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3, color: "#1A1410" }}>{p.name}</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 6, fontFamily: MONO }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#2F6B4F" }}>{p.price}</span>
                          <span style={{ fontSize: 10, color: "#1A1410", opacity: 0.5, textDecoration: "line-through" }}>{p.mrp}</span>
                        </div>
                        <div style={{ display: "flex", gap: 5, marginTop: 9 }}>
                          {p.sizes.map((z) => (
                            <span key={z} style={{ border: "1px solid #E3D5C8", borderRadius: 999, fontFamily: MONO, fontSize: 9, padding: "3px 7px", color: "#1A1410" }}>{z}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid #E3D5C8", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1A1410" }}>
                  <span>UPI · cards · COD</span><span>GST invoice</span><span>ships in 2–5 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* inclusions strip */}
        <div style={{ position: "relative", maxWidth: 1360, margin: "0 auto", padding: "0 28px 72px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: 16 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase" }}>included on every plan</span>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#24457A" }}>no add-ons, no usage tiers</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 210px), 1fr))", borderTop: "1px solid #14161A" }}>
            {INCLUSIONS.map((i) => (
              <div key={i.n} className="reveal" style={{ padding: "26px 28px 26px 0", borderRight: "1px solid #E4E1DA" }}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", color: "#24457A" }}>{i.n}</div>
                <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 12 }}>{i.name}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 6, opacity: 0.68 }}>{i.line}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" style={{ background: "#14161A", color: "#FAF9F6", borderBottom: "1px solid #E4E1DA" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "64px 28px 72px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9FBBE0" }}>{cur.eyebrow}</div>
            <h2 style={{ fontFamily: SERIF, fontSize: "clamp(34px, 4.4vw, 64px)", lineHeight: 0.98, letterSpacing: "-0.02em", marginTop: 16 }}>{cur.headline}</h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 480, marginTop: 18, color: "#E7EEF8" }}>{cur.body}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 30, flexWrap: "wrap" }}>
              {STORY.map((st, k) => (
                <button key={st.n} onClick={() => setStep(k)} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", border: `1px solid ${k === step ? "#FAF9F6" : "rgba(250,249,246,0.4)"}`, borderRadius: 999, background: k === step ? "#FAF9F6" : "transparent", color: k === step ? "#14161A" : "#FAF9F6", padding: "8px 14px", cursor: "pointer" }}>
                  {st.n}
                </button>
              ))}
            </div>
          </div>

          <div style={{ position: "relative", justifySelf: "center" }}>
            <div style={{ position: "absolute", inset: "-14% -8%", borderRadius: 999, background: cur.glow, filter: "blur(64px)", animation: "pulse 7s ease-in-out infinite", pointerEvents: "none" }} />
            <div style={{ position: "relative", border: "1px solid rgba(250,249,246,0.28)", borderRadius: 34, background: "#0B0D11", padding: 10, width: 300, boxShadow: "0 12px 28px rgba(20,22,26,0.10)" }}>
              <div style={{ borderRadius: 26, overflow: "hidden", background: "#FAF9F6", height: 470, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 8px", fontFamily: MONO, fontSize: 9, color: "#14161A" }}>
                  <span>9:41</span><span>{cur.screen.chrome}</span><span>▮▮▮</span>
                </div>
                <div style={{ padding: "4px 16px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: "#14161A" }}>{cur.screen.title}</div>
                  <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#24457A", marginTop: 5 }}>{cur.screen.sub}</div>
                  <div style={{ display: "grid", gap: 9, marginTop: 16 }}>
                    {cur.screen.rows.map((r) => (
                      <div key={r.label} style={{ border: "1px solid #E4E1DA", borderRadius: 18, background: "#fff", padding: "11px 13px" }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#14161A" }}>{r.label}</span>
                          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: r.fg }}>{r.value}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 999, background: "#F1EFE9", marginTop: 9, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 999, background: r.fg, width: r.pct, transition: "width 0.5s cubic-bezier(.2,.7,.2,1)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "auto", borderTop: "1px solid #E4E1DA", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#14161A", opacity: 0.65 }}>{cur.screen.foot}</span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: "#2F6B4F" }}>{cur.screen.state}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* marquee */}
      <div style={{ background: "#14161A", color: "#FAF9F6", borderBottom: "1px solid #E4E1DA", overflow: "hidden", padding: "18px 0" }}>
        <div style={{ display: "flex", width: "max-content", animation: "mq 30s linear infinite" }}>
          {[0, 1].map((dup) => (
            <div key={dup} style={{ display: "flex", gap: 46, paddingRight: 46, fontFamily: MONO, fontSize: 14, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              {MARQUEE.map((m) => <span key={m}>{m}</span>)}
            </div>
          ))}
        </div>
      </div>

      {/* ============ STORES WE RUN ============ */}
      <section style={{ borderBottom: "1px solid #E4E1DA", background: "#F1EFE9" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "88px 28px" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A" }}>02 / who does what</div>
          <h2 className="reveal-blur" style={{ fontFamily: SERIF, fontSize: "clamp(36px, 4.6vw, 68px)", lineHeight: 0.96, letterSpacing: "-0.02em", marginTop: 14 }}>stores we built and still run today.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 16, marginTop: 44 }}>
            {STORES.map((s) => (
              <div key={s.name} className="reveal ssr-card" style={{ border: "1px solid #E4E1DA", borderRadius: 26, background: "#fff", overflow: "hidden", transition: "transform 0.4s cubic-bezier(0.2,0.8,0.2,1)" }}>
                <div style={{ aspectRatio: "4 / 5", overflow: "hidden" }}>
                  <img src={s.img} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "15px 17px 18px" }}>
                  <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>{s.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em", marginTop: 5, color: "#24457A" }}>{s.domain}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 8, opacity: 0.6 }}>{s.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ YOUR JOB / OUR JOB ============ */}
      <section style={{ borderBottom: "1px solid #E4E1DA", background: "#FAF9F6" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 28px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: 64, alignItems: "start" }}>
          <div className="reveal-l">
            <h2 style={{ fontFamily: SERIF, fontSize: "clamp(36px, 4.6vw, 68px)", lineHeight: 0.96, letterSpacing: "-0.02em" }}>your job: make and ship. ours: everything else.</h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, marginTop: 24, maxWidth: 480 }}>nothing to subscribe to, nobody to chase, no builder to learn. you list products, pack orders and answer buyers. the twelve things on the right are ours, every month.</p>
            <div style={{ border: "1px solid #E4E1DA", borderRadius: 26, background: "#F1EFE9", padding: "22px 24px", marginTop: 32, maxWidth: 460 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#2F6B4F" }}>and then some</div>
              <p style={{ fontSize: 15, lineHeight: 1.55, marginTop: 9 }}>plus quarterly audits, speed tuning and bug fixes — no ticket, no invoice.</p>
            </div>
          </div>
          <div className="reveal-r">
            <div style={{ borderTop: "1px solid #14161A" }}>
              {OPS.map((o) => (
                <div key={o.n} style={{ display: "grid", gridTemplateColumns: "62px 1fr auto", gap: 14, alignItems: "baseline", padding: "15px 0", borderBottom: "1px solid #E4E1DA" }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: "#24457A" }}>{o.n}</span>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{o.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#2F6B4F" }}>{o.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ LAYOUTS ============ */}
      <section id="layouts" style={{ borderBottom: "1px solid #E4E1DA", background: "#F1EFE9", scrollMarginTop: 150 }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 28px" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A" }}>03 / store layouts</div>
          <h2 className="reveal-blur" style={{ fontFamily: SERIF, fontSize: "clamp(40px, 5.2vw, 80px)", lineHeight: 0.94, letterSpacing: "-0.02em", marginTop: 14 }}>six layouts. swap in one tap.</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 56, alignItems: "start", marginTop: 44 }}>
            <div>
              {THEMES.map((t, k) => {
                const active = k === themeIx;
                return (
                  <button key={t.name} onClick={() => setThemeIx(k)} style={{ width: "100%", textAlign: "left", border: `1px solid ${active ? "#24457A" : "#E4E1DA"}`, borderRadius: 26, background: active ? "#fff" : "#FAF9F6", padding: "18px 20px", marginBottom: 14, display: "grid", gridTemplateColumns: "72px 1fr auto", gap: 18, alignItems: "center", cursor: "pointer" }}>
                    <div style={{ width: 72, height: 72, borderRadius: 18, overflow: "hidden", border: "1px solid #E4E1DA" }}>
                      <img src={t.hero} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.025em" }}>{t.name}</span>
                        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", border: "1px solid #E4E1DA", borderRadius: 999, padding: "3px 9px", background: active ? "#EEF2F8" : "#fff" }}>{t.tag}</span>
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.45, marginTop: 6, opacity: 0.74 }}>{t.desc}</div>
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: active ? "#24457A" : "rgba(20,22,26,0.45)" }}>{active ? "live ✦" : "pick"}</span>
                  </button>
                );
              })}
              <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", marginTop: 26 }}>
                <a href="/templates" style={btnPill("#24457A", "#fff", 16)}>preview all six, full size →</a>
                <a href="/signup" style={{ fontSize: 15, fontWeight: 700, borderBottom: "1px solid #E4E1DA", paddingBottom: 2 }}>or edit one yourself</a>
              </div>
            </div>

            {/* live preview */}
            <div style={{ position: "sticky", top: 108, justifySelf: "center", width: "100%", maxWidth: 360 }}>
              <div style={{ border: "1px solid #E4E1DA", borderRadius: 34, background: "#14161A", padding: 10 }}>
                <div style={{ borderRadius: 26, overflow: "hidden", background: L.bg, height: 580, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 17px 6px", fontFamily: MONO, fontSize: 9, color: L.fg }}>
                    <span>9:41</span><span>{L.domain}</span><span>▮▮▮</span>
                  </div>
                  <div style={{ background: L.accent, color: L.btnFg, padding: "7px 14px", textAlign: "center", fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>{L.promo}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${L.line}` }}>
                    <span style={{ fontFamily: L.font, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: L.fg }}>{L.store}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: L.accent }}>cart · 2</span>
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div className="ssr-phone-scroll" style={{ animation: "tick 22s linear infinite alternate" }}>
                      <div style={{ position: "relative" }}>
                        <div style={{ height: 170, overflow: "hidden" }}>
                          <img src={L.hero} alt={L.store} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0) 76%)" }} />
                        <div style={{ position: "absolute", left: 14, right: 14, bottom: 12, fontFamily: L.font, fontSize: 21, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.05 }}>{L.headline}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, padding: "12px 14px 4px", flexWrap: "wrap" }}>
                        {L.cats.map((c, ci) => (
                          <span key={c} style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.06em", textTransform: "uppercase", border: `1px solid ${ci === 0 ? L.accent : L.line}`, borderRadius: 999, background: ci === 0 ? L.accent : "transparent", color: ci === 0 ? L.btnFg : L.fg, padding: "5px 9px", whiteSpace: "nowrap" }}>{c}</span>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 14px 16px" }}>
                        {[...L.products, ...L.products].map((p, pi) => (
                          <div key={`${p.name}-${pi}`} style={{ border: `1px solid ${L.line}`, borderRadius: 16, overflow: "hidden", background: L.card }}>
                            <div style={{ aspectRatio: "3 / 4", overflow: "hidden" }}>
                              <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            <div style={{ padding: "8px 9px 10px" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.25, color: L.fg }}>{p.name}</div>
                              <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: L.accent, marginTop: 4 }}>{p.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center", marginTop: 14, opacity: 0.6 }}>live preview — auto-scrolls · hover to pause</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHAT'S INCLUDED ============ */}
      <section id="included" style={{ borderBottom: "1px solid #E4E1DA", background: "#FAF9F6", scrollMarginTop: 150 }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 28px" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A" }}>04 / what&apos;s included</div>
          <h2 className="reveal-blur" style={{ fontFamily: SERIF, fontSize: "clamp(40px, 5.2vw, 80px)", lineHeight: 0.94, letterSpacing: "-0.02em", marginTop: 14 }}>three parts, all of them operated.</h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 620, marginTop: 22 }}>design and build, catalog and orders, marketing and support. no part of it lands back on your desk later.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 22, marginTop: 46 }}>
            {PILLARS.map((p) => (
              <div key={p.n} className="reveal" style={{ border: "1px solid #E4E1DA", borderRadius: 34, background: "#F1EFE9", padding: 30, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>pillar {p.n}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", border: "1px solid #E4E1DA", borderRadius: 999, background: "#fff", padding: "4px 10px" }}>{p.scope}</span>
                </div>
                <h3 style={{ fontFamily: SERIF, fontSize: 34, letterSpacing: "-0.02em", marginTop: 16 }}>{p.name}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, marginTop: 12, opacity: 0.78 }}>{p.body}</p>
                <div style={{ borderTop: "1px solid #E4E1DA", marginTop: 22 }}>
                  {p.points.map((s) => (
                    <div key={s} style={{ display: "grid", gridTemplateColumns: "20px 1fr", gap: 10, alignItems: "baseline", padding: "12px 0", borderBottom: "1px solid #E4E1DA" }}>
                      <span style={{ color: "#2F6B4F", fontSize: 13 }}>✓</span>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 46 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#24457A" }}>the parts nobody warns you about</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 240px), 1fr))", borderTop: "1px solid #14161A", marginTop: 16 }}>
              {SCOPE.map((s) => (
                <div key={s.n} style={{ padding: "26px 26px 26px 0", borderRight: "1px solid #E4E1DA" }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: "#24457A" }}>{s.n}</div>
                  <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 12 }}>{s.name}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 6, opacity: 0.68 }}>{s.line}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" style={{ borderBottom: "1px solid #E4E1DA", background: "#F1EFE9", scrollMarginTop: 150 }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 28px" }}>
          <PricingBlock />
        </div>
      </section>

      {/* ============ STUDIO ============ */}
      <section id="studio" style={{ borderBottom: "1px solid #E4E1DA", background: "#FAF9F6", scrollMarginTop: 150 }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: 64, alignItems: "center" }}>
            <div className="reveal-l">
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A" }}>06 / the studio</div>
              <h2 style={{ fontFamily: SERIF, fontSize: "clamp(36px, 4.6vw, 68px)", lineHeight: 0.96, letterSpacing: "-0.02em", marginTop: 14 }}>you don&apos;t lose to competitors. you lose months to vendors.</h2>
              <p style={{ fontSize: 17, lineHeight: 1.6, marginTop: 24 }}>supershowroom is built and run by viral inbound, a founder-led studio in bengaluru with 350+ shipped projects behind it. the person who answers your whatsapp is the person who built your store.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
                {[
                  { value: "350+", label: "shipped", fg: "#14161A" },
                  { value: "4", label: "plans", fg: "#14161A" },
                  { value: "1:1", label: "founder support", fg: "#24457A" },
                  { value: "0", label: "lock-in", fg: "#2F6B4F" },
                ].map((s) => (
                  <div key={s.label} style={{ border: "1px solid #E4E1DA", borderRadius: 999, background: "#F1EFE9", padding: "11px 20px" }}>
                    <span style={{ fontFamily: MONO, fontSize: 19, fontWeight: 700, color: s.fg }}>{s.value}</span>
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginLeft: 8, opacity: 0.7 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              {GUARANTEES.map((g) => (
                <div key={g.n} className="reveal-r" style={{ border: "1px solid #E4E1DA", borderRadius: 26, background: "#F1EFE9", padding: "26px 28px" }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>guarantee {g.n}</div>
                  <h3 style={{ fontFamily: SERIF, fontSize: 30, letterSpacing: "-0.02em", marginTop: 8 }}>{g.name}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.55, marginTop: 8, opacity: 0.76 }}>{g.line}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section style={{ borderBottom: "1px solid #E4E1DA", background: "#F1EFE9" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "96px 28px" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A" }}>07 / questions</div>
          <h2 className="reveal-blur" style={{ fontFamily: SERIF, fontSize: "clamp(36px, 4.6vw, 68px)", lineHeight: 0.96, letterSpacing: "-0.02em", marginTop: 14 }}>the things people actually ask.</h2>
          <div style={{ marginTop: 40, borderTop: "1px solid #14161A" }}>
            {FAQS.map(([q, a], k) => {
              const open = faq === k;
              return (
                <div key={q} style={{ borderBottom: "1px solid #E4E1DA" }}>
                  <button onClick={() => setFaq(open ? -1 : k)} style={{ width: "100%", background: "none", border: 0, display: "grid", gridTemplateColumns: "1fr 28px", gap: 16, alignItems: "center", padding: "24px 0", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: open ? "#24457A" : "#14161A" }}>{q}</span>
                    <span style={{ fontFamily: MONO, fontSize: 19, color: "#24457A", textAlign: "right" }}>{open ? "−" : "+"}</span>
                  </button>
                  {open && <p style={{ fontSize: 16, lineHeight: 1.65, paddingBottom: 26, maxWidth: 760, opacity: 0.8 }}>{a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ SHOT FOR THE STOREFRONT ============ */}
      <section style={{ background: "#14161A", borderTop: "1px solid #E4E1DA" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "84px 28px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9FBBE0" }}>shot for the storefront</div>
              <h2 className="reveal-blur" style={{ fontFamily: SERIF, fontSize: "clamp(32px, 4vw, 58px)", lineHeight: 0.98, letterSpacing: "-0.02em", color: "#FAF9F6", marginTop: 14 }}>your catalog, photographed and listed.</h2>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 360, color: "#E7EEF8" }}>send us what you have — phone photos are fine. we crop, compress and list them with variants and prices.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 190px), 1fr))", gap: 14, marginTop: 44 }}>
            {TILES.map((t) => (
              <div key={t.alt} className="reveal" style={{ aspectRatio: "1 / 1", border: "1px solid rgba(250,249,246,0.28)", borderRadius: 26, overflow: "hidden" }}>
                <img src={t.img} alt={t.alt} style={{ width: "100%", height: "100%", objectFit: "cover", animation: `kb ${t.kb} ${t.kbDelay} ease-in-out infinite` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA — cursor-follow catalog ============ */}
      <CursorCatalogCTA />
    </div>
  );
}

/* ---------- cursor-follow catalog CTA (ported from Site v1.0.dc.html) ---------- */

const TRAIL_POOL: { img: string; alt: string; left: string; top: string; tilt: string }[] = [
  ["1596755094514-f87e34085b2c", "linen shirt"],
  ["1555507036-ab1f4038808a", "croissants"],
  ["1508061253366-f7da158b6d46", "almonds"],
  ["1587829741301-dc798b83add3", "keyboard"],
  ["1610030469983-98e550d6193c", "silk kurta set"],
  ["1515562141207-7a88fb7ce338", "gold jewellery"],
  ["1620916566398-39f1143ab7be", "vitamin c serum"],
  ["1560806887-1e4cd0b6cbd6", "kashmiri apples"],
  ["1523275335684-37898b6baf30", "smart watch"],
  ["1578985545062-69928b1d9587", "truffle cake"],
].map(([id, alt], k) => ({
  img: `https://images.unsplash.com/photo-${id}?w=340&auto=format&fit=crop`,
  alt,
  left: [6, 24, 42, 60, 78, 14, 33, 52, 70, 86][k] + "%",
  top: [12, 62, 18, 68, 22, 74, 8, 46, 78, 34][k] + "%",
  tilt: `rotate(${(k % 2 ? 1 : -1) * (4 + (k % 4) * 2)}deg)`,
}));

function CursorCatalogCTA() {
  const stageRef = useRef<HTMLElement | null>(null);
  const demo = useDemo();

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Touch devices (mobile / tablet) have no cursor — skip the trail entirely.
    const finePointer = window.matchMedia?.("(pointer: fine)").matches ?? true;
    if (reduce || !finePointer) return;

    // preload
    TRAIL_POOL.forEach((p) => { const im = new Image(); im.src = p.img; });

    let last: { x: number; y: number } | null = null;
    let i = 0;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (last && Math.hypot(x - last.x, y - last.y) < 88) return;
      last = { x, y };
      const item = TRAIL_POOL[i % TRAIL_POOL.length];
      const tilt = (i % 2 ? 1 : -1) * (4 + (i % 4) * 2);
      i++;

      const fig = document.createElement("div");
      fig.className = "trailfig";
      fig.setAttribute(
        "style",
        `position:absolute;left:${x}px;top:${y}px;width:150px;height:190px;overflow:hidden;` +
          `border:1px solid rgba(250,249,246,0.3);z-index:1;pointer-events:none;opacity:1;` +
          `transform:translate(-50%,-50%) rotate(${tilt}deg);` +
          `transition:opacity .5s ease, transform .5s cubic-bezier(.2,.7,.2,1);`
      );
      const img = document.createElement("img");
      img.src = item.img;
      img.alt = item.alt;
      img.setAttribute("style", "width:100%;height:100%;object-fit:cover;display:block;");
      fig.appendChild(img);
      el.appendChild(fig);

      window.setTimeout(() => {
        fig.style.opacity = "0";
        fig.style.transform = `translate(-50%,-64%) rotate(${tilt}deg)`;
      }, 620);
      window.setTimeout(() => { fig.remove(); }, 1200);

      const live = el.querySelectorAll(".trailfig");
      if (live.length > 9) live[0].remove();
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.querySelectorAll(".trailfig").forEach((n) => n.remove());
    };
  }, []);

  return (
    <section
      ref={stageRef}
      className="ssr-catalog-cta"
      style={{ background: "#14161A", color: "#FAF9F6", borderTop: "1px solid #E4E1DA", position: "relative", overflow: "hidden", cursor: "crosshair" }}
    >
      {/* faint static scatter */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {TRAIL_POOL.map((p) => (
          <div key={p.alt} style={{ position: "absolute", left: p.left, top: p.top, width: 132, height: 166, overflow: "hidden", border: "1px solid rgba(250,249,246,0.16)", opacity: 0.17, transform: p.tilt }}>
            <img src={p.img} alt={p.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1000, margin: "0 auto", padding: "150px 28px", textAlign: "center", pointerEvents: "none" }}>
        <div className="ssr-cta-hint" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250,249,246,0.45)", marginBottom: 34 }}>
          move your cursor ✦ the catalog follows
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9FBBE0" }}>ready when you are</div>
        <h2 className="reveal-blur" style={{ fontFamily: SERIF, fontSize: "clamp(44px, 6.4vw, 100px)", lineHeight: 0.86, fontWeight: 400, letterSpacing: "-0.03em", marginTop: 18 }}>
          ₹15,000 a year.<br />
          <span style={{ color: "#9FBBE0" }}>2% when it sells.</span>
        </h2>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 36 }}>
          <a href="/signup" style={{ pointerEvents: "auto", background: "#EEF2F8", color: "#14161A", border: "2px solid #EEF2F8", padding: "18px 30px", fontSize: 18, fontWeight: 700, textDecoration: "none", boxShadow: "0 12px 28px rgba(20,22,26,0.10)" }}>
            start essential →
          </a>
          <button onClick={demo.open} style={{ pointerEvents: "auto", background: "none", color: "#FAF9F6", border: "2px solid #FAF9F6", padding: "18px 30px", fontFamily: "inherit", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>
            book a demo
          </button>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 26, opacity: 0.6 }}>
          no card, no contract · we open a real store on the call
        </div>
      </div>
    </section>
  );
}

function btnPill(bg: string, fg: string, fontSize = 17): React.CSSProperties {
  return {
    background: bg,
    color: fg,
    fontSize,
    fontWeight: 700,
    padding: fontSize >= 17 ? "18px 30px" : "16px 26px",
    borderRadius: 34,
    textDecoration: "none",
    display: "inline-block",
    whiteSpace: "nowrap",
  };
}
