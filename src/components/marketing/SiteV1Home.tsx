"use client";

import { useEffect, useRef, useState } from "react";
import { useDemo } from "./demo/DemoContext";
import { PricingBlock } from "./PricingBlock";

/**
 * Faithful port of SuperShowroom Site v1.0.dc.html homepage:
 * #top → how it works → industry picker → 01 / store layouts →
 * 02 / what's included → 03 / pricing → 04 / questions → CTA.
 */

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
const SERIF = "'Instrument Serif', Georgia, serif";
const U = (id: string, w = 700) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop`;

type Theme = {
  name: string;
  tag: string;
  chip: string;
  desc: string;
  img: string;
  store: string;
  domain: string;
  promo: string;
  bg: string;
  card: string;
  fg: string;
  line: string;
  accent: string;
  btnFg: string;
  font: string;
  cats: string[];
  hero: string;
  products: { name: string; price: string; rating: string; img: string }[];
};

const THEMES: Theme[] = [
  {
    name: "luxe apparel & fashion", tag: "fashion", chip: "#FFD9E5",
    desc: "colour/size variants (s/m/l/xl), lookbook showcase & slide-out cart drawer.",
    img: U("1610030469983-98e550d6193c", 600),
    store: "velvet boutique", domain: "velvetboutique.in", promo: "festive drop · 30% off",
    bg: "#FDF6F0", card: "#FFFFFF", fg: "#1A1410", line: "#E3D5C8", accent: "#98502F", btnFg: "#FFFFFF",
    font: SERIF, cats: ["ethnic", "casual", "lookbook", "sale"],
    hero: U("1610030469983-98e550d6193c", 900),
    products: [
      { name: "embroidered silk kurta set", price: "₹3,499", rating: "4.9", img: U("1610030469983-98e550d6193c", 400) },
      { name: "pure linen cuban shirt", price: "₹1,899", rating: "4.8", img: U("1596755094514-f87e34085b2c", 400) },
      { name: "georgette anarkali gown", price: "₹4,299", rating: "5.0", img: U("1583391733956-3750e0ff4e8b", 400) },
      { name: "handblock chanderi saree", price: "₹2,799", rating: "4.9", img: U("1617627143750-d86bc21e42bb", 400) },
    ],
  },
  {
    name: "artisan bakery & café", tag: "bakery", chip: "#FFE9B8",
    desc: "daily fresh menu, eggless tags, delivery slot selector & cake booking.",
    img: U("1578985545062-69928b1d9587", 600),
    store: "the cafe club", domain: "thecafeclub.store", promo: "baked fresh at 6am",
    bg: "#FFF8E7", card: "#FFFFFF", fg: "#2B1B0E", line: "#EBDCBE", accent: "#C2410C", btnFg: "#FFFFFF",
    font: SERIF, cats: ["cakes", "pastries", "eggless", "hampers"],
    hero: U("1509440159596-0249088772ff", 900),
    products: [
      { name: "belgian dark truffle cake", price: "₹650", rating: "5.0", img: U("1578985545062-69928b1d9587", 400) },
      { name: "french butter croissants", price: "₹380", rating: "4.9", img: U("1555507036-ab1f4038808a", 400) },
      { name: "wild sourdough boule", price: "₹220", rating: "4.8", img: U("1509440159596-0249088772ff", 400) },
      { name: "parisian macarons box", price: "₹490", rating: "4.9", img: U("1569864358642-9d1684040f43", 400) },
    ],
  },
  {
    name: "glow organic skincare", tag: "skincare", chip: "#CFF3E2",
    desc: "ingredient callouts, routine bundles, subscription refills & reviews.",
    img: U("1556228720-195a672e8a03", 600),
    store: "herbal essence", domain: "herbalessence.shop", promo: "routine builder · save 15%",
    bg: "#F2F7F4", card: "#FFFFFF", fg: "#10231A", line: "#D5E5DC", accent: "#2F9E6E", btnFg: "#FFFFFF",
    font: "'Instrument Sans', sans-serif", cats: ["serums", "creams", "spf", "bundles"],
    hero: U("1556228720-195a672e8a03", 900),
    products: [
      { name: "20% vitamin c glow serum", price: "₹799", rating: "4.9", img: U("1620916566398-39f1143ab7be", 400) },
      { name: "5-ceramide barrier cream", price: "₹649", rating: "4.8", img: U("1556228720-195a672e8a03", 400) },
      { name: "rose & aloe face wash", price: "₹450", rating: "4.8", img: U("1570172619644-dfd03ed5d881", 400) },
      { name: "mineral sunscreen spf 50", price: "₹599", rating: "5.0", img: U("1598440947619-2c35fc9aa908", 400) },
    ],
  },
  {
    name: "fresh mart & kirana", tag: "grocery", chip: "#DDF3CC",
    desc: "high-density catalog, weight selector (500g, 1kg, 5kg) & one-tap cart add.",
    img: U("1560806887-1e4cd0b6cbd6", 600),
    store: "raw organics", domain: "raworganics.in", promo: "same-day delivery",
    bg: "#F5FBF2", card: "#FFFFFF", fg: "#14210F", line: "#D9E8D0", accent: "#3F8F29", btnFg: "#FFFFFF",
    font: "'Instrument Sans', sans-serif", cats: ["fruits", "oils", "dry fruits", "daily"],
    hero: U("1542838132-92c53300491e", 900),
    products: [
      { name: "kashmiri apples (1kg)", price: "₹180", rating: "4.9", img: U("1560806887-1e4cd0b6cbd6", 400) },
      { name: "cold-pressed olive oil 1l", price: "₹890", rating: "4.9", img: U("1474979266404-7eaacbcd87c5", 400) },
      { name: "jumbo almonds (500g)", price: "₹480", rating: "4.8", img: U("1508061253366-f7da158b6d46", 400) },
      { name: "free-range eggs (12)", price: "₹130", rating: "4.9", img: U("1582722872445-44dc5f7e3c8f", 400) },
    ],
  },
  {
    name: "cyber tech & gadgets", tag: "tech", chip: "#D6DEFF",
    desc: "spec tables, comparison view, warranty badges & emi calculator.",
    img: U("1505740420928-5e560c06d30e", 600),
    store: "spark electronics", domain: "sparkelectronics.tech", promo: "launch week · flat ₹500 off",
    bg: "#0E1116", card: "#171C24", fg: "#F2F5FA", line: "#2A313D", accent: "#4F7BFF", btnFg: "#0E1116",
    font: MONO, cats: ["audio", "wearables", "charging", "gaming"],
    hero: U("1505740420928-5e560c06d30e", 900),
    products: [
      { name: "pro anc studio headphones", price: "₹4,999", rating: "4.9", img: U("1505740420928-5e560c06d30e", 400) },
      { name: "titanium smart watch s5", price: "₹3,499", rating: "4.8", img: U("1523275335684-37898b6baf30", 400) },
      { name: "hot-swap mech keyboard", price: "₹2,899", rating: "4.9", img: U("1587829741301-dc798b83add3", 400) },
      { name: "100w gan travel charger", price: "₹1,299", rating: "4.8", img: U("1583863788434-e58a36330cf0", 400) },
    ],
  },
  {
    name: "royal gold & jewellery", tag: "jewellery", chip: "#F5E6BE",
    desc: "certified purity tags, try-on gallery, appointment booking & insured delivery.",
    img: U("1515562141207-7a88fb7ce338", 600),
    store: "royal gems", domain: "royalgems.com", promo: "bis hallmarked · insured",
    bg: "#FBF7EE", card: "#FFFFFF", fg: "#1C1608", line: "#E8DDC2", accent: "#8A6A17", btnFg: "#FFFFFF",
    font: SERIF, cats: ["gold", "silver", "diamond", "bridal"],
    hero: U("1515562141207-7a88fb7ce338", 900),
    products: [
      { name: "18k solitaire diamond ring", price: "₹24,999", rating: "5.0", img: U("1605100804763-247f67b3557e", 400) },
      { name: "22k kundan choker set", price: "₹48,500", rating: "5.0", img: U("1599643478518-a784e5dc4c8f", 400) },
      { name: "sterling emerald earrings", price: "₹3,200", rating: "4.9", img: U("1535632066927-ab7c9ab60908", 400) },
      { name: "rose gold infinity bracelet", price: "₹8,900", rating: "4.9", img: U("1611591475155-4286fa7c2e7f", 400) },
    ],
  },
];

const HOW = [
  { n: "01", title: "tell us what you sell", line: "one call, twenty minutes, no brief to write.", tags: ["whatsapp catalog", "phone photos", "price list"], img: U("1542838132-92c53300491e", 900), caption: "step one · your catalog", captionTitle: "phone photos are enough" },
  { n: "02", title: "we build and launch your store", line: "catalog, payments and delivery live inside a week.", tags: ["six layouts", "UPI, cards & COD", "GST invoices"], img: U("1610030469983-98e550d6193c", 900), caption: "step two · the build", captionTitle: "live in 3–7 working days" },
  { n: "03", title: "we run it — you just ship orders", line: "hosting, invoices, pickups and ads stay with us.", tags: ["pickups booked", "cart recovery", "quarterly audits"], img: U("1505740420928-5e560c06d30e", 900), caption: "step three · every month after", captionTitle: "you pack, we keep it running" },
];

const INDUSTRIES = [
  { name: "luxe apparel", line: "size & colour runs, lookbook, exchanges", img: U("1610030469983-98e550d6193c") },
  { name: "artisan bakery", line: "daily menu, delivery slots, cake booking", img: U("1509440159596-0249088772ff") },
  { name: "fresh mart", line: "weight pricing, one-tap reorder, same-day", img: U("1542838132-92c53300491e") },
  { name: "cyber tech", line: "spec tables, comparison, no-cost EMI", img: U("1505740420928-5e560c06d30e") },
  { name: "royal gold", line: "purity proof, try-at-home, insured handover", img: U("1515562141207-7a88fb7ce338") },
  { name: "glow skincare", line: "ingredient callouts, routines, refills", img: U("1556228720-195a672e8a03") },
];

const PICKER: { label: string; tag: string }[] = [
  { label: "fashion", tag: "fashion" },
  { label: "food & bakery", tag: "bakery" },
  { label: "grocery", tag: "grocery" },
  { label: "electronics", tag: "tech" },
  { label: "jewellery", tag: "jewellery" },
  { label: "skincare", tag: "skincare" },
];

const BUNDLE = [
  {
    label: "website", scope: "design, hosting & ssl",
    title: "the storefront itself",
    blurb: "your layout, your colours, your logo — built by us, and fast on a ₹8,000 android phone on 4g, which is what most of your buyers are using.",
    note: "we build it, we host it, we keep it up",
    items: [
      { name: "custom brand styling", line: "palette, typography and image curation, matched to your label." },
      { name: "six store layouts", line: "switch any time — we migrate the catalog for you." },
      { name: "every page you need", line: "home, catalog, product detail, about, policies, contact." },
      { name: "your domain connected", line: "you own it; we wire the DNS records and keep them right." },
      { name: "hosting, CDN & SSL", line: "edge hosting, https and the renewals — permanently ours." },
      { name: "mobile-first performance", line: "core web vitals watched, images compressed on upload." },
    ],
  },
  {
    label: "store & payments", scope: "catalog, cart & orders",
    title: "taking the money and getting it out",
    blurb: "catalog uploads, checkout, invoicing and pickups — the operational middle that usually lands back on the founder.",
    note: "you list and pack; the rest runs itself",
    items: [
      { name: "catalog uploads & variants", line: "size, colour and weight runs, priced and stocked separately." },
      { name: "razorpay, UPI QR & COD", line: "live at checkout from day one, no markup from us." },
      { name: "GST invoices & tax reports", line: "raised on every order, emailed, filed monthly for you." },
      { name: "shiprocket, porter & dunzo", line: "pickups booked per order, tracking pushed to the buyer." },
      { name: "pincode delivery rules", line: "serviceable areas, slot cut-offs and COD limits enforced." },
      { name: "KYC & compliance setup", line: "verification, policies and the paperwork nobody warns you about." },
      { name: "whatsapp order alerts", line: "to you and to the buyer, the second an order lands." },
      { name: "out-of-stock handling", line: "items hide themselves and return when you restock." },
    ],
  },
  {
    label: "growth & support", scope: "seo, crm & ads",
    title: "getting found, then getting remembered",
    blurb: "search, feeds, recovery and a human on whatsapp — the part that decides whether the store earns or just exists.",
    note: "quarterly audits and fixes, no ticket, no invoice",
    items: [
      { name: "SEO, schema & sitemaps", line: "structured data and meta tags, submitted and monitored." },
      { name: "google shopping feed", line: "synced daily, with the meta catalog and ads pixel wired." },
      { name: "abandoned cart recovery", line: "whatsapp follow-up on carts people leave behind." },
      { name: "coupons & repeat campaigns", line: "discount codes and repeat-buyer nudges, run for you." },
      { name: "analytics & tracking", line: "GA4 and conversion tracking, read and reported." },
      { name: "a human on whatsapp", line: "usually the person who built your store. no queue number." },
    ],
  },
];

const FAQS: [string, string][] = [
  ["how does the 2% fee on sales work?", "it applies to completed orders only, ex GST. it is billed monthly against a statement that lists every order it was charged on — refunds and cancelled orders never count."],
  ["do you sell me a domain?", "no — we do not register or resell domains. buy it wherever you like, or use the one you already own, and it stays entirely in your name. connecting it is free on every plan: we set the dns records, issue and renew the ssl certificate, and handle www and https redirects."],
  ["how long does launch take?", "3 to 7 working days from the moment your catalog reaches us — design, build, payments and pickup partners included. faster if your product photos are ready."],
  ["can i use my existing GST and bank account?", "yes. we configure GST invoicing, your razorpay or UPI account and your payout bank during onboarding. money moves from the buyer to you — we never hold it."],
  ["what happens if i want to leave?", "you keep the domain — it was always in your name — and you get a full export of products, orders and customers. no exit fee, no notice period, no contract to run down."],
];

function useReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal, .reveal-l, .reveal-r, .reveal-blur"));
    if (!("IntersectionObserver" in window)) return;
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
    const t = window.setTimeout(() => els.forEach((e) => e.classList.add("in")), 2500);
    return () => { io.disconnect(); window.clearTimeout(t); };
  }, []);
}

export function SiteV1Home() {
  useReveal();
  const demo = useDemo();
  const [themeIx, setThemeIx] = useState(0);
  const [hstep, setHstep] = useState(0);
  const [hrun, setHrun] = useState(false);
  const [hauto, setHauto] = useState(true);
  const [tab, setTab] = useState(0);
  const [faq, setFaq] = useState(0);
  const live = THEMES[themeIx];
  const how = HOW[hstep];
  const bundle = BUNDLE[tab];
  const indCarouselRef = useRef<HTMLDivElement>(null);

  function scrollIndCarousel(dir: "left" | "right") {
    const el = indCarouselRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".ssr-ind-card");
    const step = card ? card.offsetWidth + 14 : 280;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  }

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 50);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    setHrun(false);
    const t = window.setTimeout(() => setHrun(true), 40);
    return () => window.clearTimeout(t);
  }, [hstep]);

  useEffect(() => {
    if (!hauto) return;
    const t = window.setInterval(() => setHstep((s) => (s + 1) % HOW.length), 5000);
    return () => window.clearInterval(t);
  }, [hauto]);

  function pickTheme(ix: number, scroll = false) {
    setThemeIx(ix);
    if (!scroll) return;
    const el = document.getElementById("themes");
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: "smooth" });
  }

  return (
    <div style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif", color: "#14161A", background: "#FAF9F6" }}>
      {/* #top hero */}
      <section id="top" style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid #E4E1DA", backgroundImage: "radial-gradient(rgba(20,22,26,0.09) 1px, transparent 1px)", backgroundSize: "32px 32px", backgroundColor: "#FAF9F6" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 90% at 50% 40%, rgba(250,249,246,0.4) 0%, #FAF9F6 62%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 1360, margin: "0 auto", padding: "40px 28px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#14161A", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              managed online stores for indian sellers · bengaluru
            </div>
            <h1 style={{ fontSize: "clamp(44px, 6vw, 96px)", lineHeight: 0.88, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
              an online store you<br />never have to <span style={{ fontWeight: 600, color: "#24457A" }}>operate.</span>
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.55, maxWidth: 600, marginTop: 18, color: "#14161A" }}>
              we build the storefront, upload your catalog, wire up UPI, COD and GST invoices — then keep the whole thing running. ₹15,000 a year plus 2% of what actually sells.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18, alignItems: "stretch" }}>
              <button type="button" onClick={demo.open} style={{ background: "#24457A", color: "#FFFFFF", fontSize: 17, fontWeight: 800, padding: "17px 28px", border: "1px solid #24457A", boxShadow: "0 12px 28px rgba(36,69,122,0.24)", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit" }}>
                book a demo
                <span style={{ fontFamily: MONO, fontSize: 12, opacity: 0.8 }}>20 min</span>
              </button>
              <a href="/#included" style={{ background: "#FAF9F6", color: "#14161A", fontSize: 17, fontWeight: 700, padding: "17px 26px", border: "1px solid #14161A", display: "flex", alignItems: "center", textDecoration: "none" }}>see how it works ↓</a>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 12, opacity: 0.65 }}>no card, no contract · we open a real store on the call</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 150px), 1fr))", borderTop: "1px solid #E4E1DA", marginTop: 28, maxWidth: 600 }}>
              {[
                { t: "live in a week", d: "3–7 working days from catalog handoff." },
                { t: "UPI, cards & COD", d: "GST invoices raised per order." },
                { t: "run by us", d: "hosting, pickups and ads stay ours." },
              ].map((c, i) => (
                <div key={c.t} style={{ padding: i === 0 ? "16px 18px 0 0" : i === 1 ? "16px 18px 0 18px" : "16px 0 0 18px", borderRight: i < 2 ? "1px solid #E4E1DA" : undefined }}>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>{c.t}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.45, marginTop: 4, opacity: 0.66 }}>{c.d}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: -26, right: 6, zIndex: 3, background: "#EEF2F8", border: "1px solid #E4E1DA", padding: "8px 14px", fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", boxShadow: "0 12px 28px rgba(20,22,26,0.10)", animation: "floaty 6s ease-in-out infinite" }}>no lock-in ✦ leave with your data</div>
            <div style={{ border: "1px solid #E4E1DA", background: "#FFFFFF", overflow: "hidden", marginBottom: 16, boxShadow: "0 18px 40px rgba(20,22,26,0.14)" }}>
              <div style={{ background: "#14161A", color: "#FAF9F6", padding: "9px 13px", display: "flex", alignItems: "center", gap: 9, fontFamily: MONO, fontSize: 10 }}>
                <span style={{ display: "flex", gap: 4 }}>
                  <span style={{ width: 8, height: 8, background: "#24457A", display: "block" }} />
                  <span style={{ width: 8, height: 8, background: "#9FBBE0", display: "block" }} />
                  <span style={{ width: 8, height: 8, background: "#2F6B4F", display: "block" }} />
                </span>
                <span style={{ opacity: 0.85 }}>velvetboutique.in</span>
                <span style={{ marginLeft: "auto", opacity: 0.6 }}>live store</span>
              </div>
              <div style={{ background: "#FDF6F0" }}>
                <div style={{ background: "#98502F", color: "#FFFFFF", padding: "6px 12px", textAlign: "center", fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>festive drop · 30% off ethnic</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderBottom: "1px solid #E3D5C8" }}>
                  <span style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "#1A1410" }}>velvet boutique</span>
                  <div style={{ display: "flex", gap: 11, fontSize: 11, fontWeight: 600, color: "#1A1410" }}>
                    <span style={{ color: "#98502F" }}>ethnic</span><span>casual</span><span>lookbook</span>
                  </div>
                  <span style={{ marginLeft: "auto", background: "#98502F", color: "#FFFFFF", padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>cart · 2</span>
                </div>
                <div style={{ position: "relative" }}>
                  <div style={{ aspectRatio: "16 / 7", overflow: "hidden" }}>
                    <img src={U("1610030469983-98e550d6193c", 1000)} alt="sample storefront hero" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 34%, rgba(0,0,0,0) 78%)" }} />
                  <div style={{ position: "absolute", left: 16, right: 16, bottom: 13 }}>
                    <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "#FFFFFF", lineHeight: 1 }}>the festive drop is live</div>
                    <div style={{ display: "inline-block", marginTop: 9, background: "#98502F", color: "#FFFFFF", padding: "7px 13px", fontSize: 11, fontWeight: 700 }}>shop the drop</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "12px 16px 14px" }}>
                  {[
                    { name: "embroidered silk kurta set", price: "₹3,499", mrp: "₹4,999", img: U("1610030469983-98e550d6193c", 400), sizes: ["s", "m", "l", "xl"] },
                    { name: "pure linen cuban shirt", price: "₹1,899", mrp: "₹2,499", img: U("1596755094514-f87e34085b2c", 400), sizes: ["m", "l", "xl"] },
                  ].map((p) => (
                    <div key={p.name} style={{ border: "1px solid #E3D5C8", background: "#FFFFFF" }}>
                      <div style={{ aspectRatio: "3 / 4", overflow: "hidden" }}>
                        <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ padding: 9 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.25, color: "#1A1410" }}>{p.name}</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 5 }}>
                          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: "#98502F" }}>{p.price}</span>
                          <span style={{ fontFamily: MONO, fontSize: 9, color: "#1A1410", opacity: 0.45, textDecoration: "line-through" }}>{p.mrp}</span>
                        </div>
                        <div style={{ display: "flex", gap: 4, marginTop: 7 }}>
                          {p.sizes.map((z) => (
                            <span key={z} style={{ border: "1px solid #E3D5C8", color: "#1A1410", fontFamily: MONO, fontSize: 8, padding: "3px 5px" }}>{z}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid #E3D5C8", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "#1A1410" }}>
                  <span>UPI · cards · COD</span><span>GST invoice</span><span>ships in 2–5 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section
        style={{ background: "#24457A", color: "#FAF9F6", borderBottom: "1px solid #E4E1DA", overflow: "clip" }}
        onPointerEnter={() => setHauto(false)}
        onPointerLeave={() => setHauto(true)}
      >
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "64px 28px 68px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 26 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C3D4EA" }}>how it works</div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C3D4EA", opacity: 0.8 }}>
              {hauto ? "playing · hover a step to hold" : `holding · step ${how.n} of 03`}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 44, alignItems: "center" }}>
            <div style={{ borderTop: "1px solid rgba(250,249,246,0.35)" }}>
              {HOW.map((st, k) => {
                const on = k === hstep;
                return (
                  <div
                    key={st.n}
                    onClick={() => setHstep(k)}
                    onMouseEnter={() => setHstep(k)}
                    style={{ position: "relative", padding: "22px 20px 22px 0", borderBottom: "1px solid rgba(250,249,246,0.22)", cursor: "pointer", display: "grid", gridTemplateColumns: "74px 1fr", gap: 18, alignItems: "start", opacity: on ? 1 : 0.82, transition: "opacity 0.5s ease" }}
                  >
                    <div style={{ fontFamily: MONO, fontSize: 42, fontWeight: 700, letterSpacing: "-0.02em", color: on ? "#FFFFFF" : "rgba(195,212,234,0.65)", lineHeight: 1, transition: "color 0.45s ease, transform 0.55s cubic-bezier(.2,.7,.2,1)", transform: on ? "translateX(6px)" : "none" }}>{st.n}</div>
                    <div>
                      <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, color: "#FFFFFF" }}>{st.title}</div>
                      <div style={{ fontSize: 15, lineHeight: 1.5, marginTop: 8, color: "#E7EEF8" }}>{st.line}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", maxHeight: on ? 140 : 0, overflow: "hidden", opacity: on ? 1 : 0, transition: "max-height 0.5s cubic-bezier(.2,.7,.2,1), opacity 0.4s ease" }}>
                        {st.tags.map((t) => (
                          <span key={t} style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", border: "1px solid rgba(250,249,246,0.4)", padding: "6px 10px", color: "#FFFFFF" }}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ position: "absolute", left: 0, bottom: -1, height: 2, background: "#FFFFFF", width: on && hrun ? "100%" : 0, transition: `width ${on && hrun ? "4.6s" : "0.2s"} linear` }} />
                  </div>
                );
              })}
            </div>
            <div style={{ position: "relative", aspectRatio: "4 / 3", border: "1px solid rgba(250,249,246,0.3)", overflow: "hidden" }}>
              {HOW.map((st, k) => (
                <div key={st.n} style={{ position: "absolute", inset: 0, opacity: k === hstep ? 1 : 0, transform: k === hstep ? "scale(1.04)" : "scale(1.14)", transition: "opacity 0.65s ease, transform 1.2s cubic-bezier(.2,.7,.2,1)" }}>
                  <img src={st.img} alt={st.captionTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,22,26,0.82) 0%, rgba(20,22,26,0.35) 34%, rgba(20,22,26,0) 72%)" }} />
              <div style={{ position: "absolute", left: 20, right: 20, bottom: 18 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C3D4EA" }}>{how.caption}</div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 6, color: "#FFFFFF" }}>{how.captionTitle}</div>
              </div>
              <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 6 }}>
                {HOW.map((st, k) => (
                  <span key={st.n} style={{ width: 8, height: 8, background: k === hstep ? "#FFFFFF" : "rgba(250,249,246,0.35)", display: "block" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* what do you sell */}
      <section style={{ background: "#FAF9F6", borderBottom: "1px solid #E4E1DA" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "26px 28px", display: "flex", alignItems: "center", gap: "18px 22px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#24457A" }}>what do you sell</span>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            {PICKER.map((p) => {
              const ix = THEMES.findIndex((t) => t.tag === p.tag);
              const on = ix === themeIx;
              return (
                <button
                  key={p.tag}
                  type="button"
                  onClick={() => pickTheme(ix, true)}
                  style={{ border: `1px solid ${on ? "#14161A" : "#E4E1DA"}`, background: on ? "#14161A" : "#FAF9F6", color: on ? "#FAF9F6" : "#14161A", padding: "10px 16px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 9, fontFamily: "inherit" }}
                >
                  <span style={{ width: 10, height: 10, background: THEMES[ix]?.chip ?? "#EEF2F8", border: "1px solid #14161A", display: "block" }} />
                  {p.label}
                </button>
              );
            })}
          </div>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", marginLeft: "auto", opacity: 0.6 }}>jumps to your layout ↓</span>
        </div>
      </section>

      {/* industries */}
      <section style={{ borderBottom: "1px solid #E4E1DA", background: "#F1EFE9" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "56px 28px 64px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 26 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A" }}>industries we build for</div>
              <h2 style={{ fontSize: "clamp(28px, 3.4vw, 46px)", lineHeight: 0.95, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 12 }}>one console, <span style={{ fontWeight: 600, color: "#24457A" }}>every kind of catalog.</span></h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, alignSelf: "flex-end" }}>
              <a href="/templates" style={{ fontSize: 15, fontWeight: 700, borderBottom: "1px solid #24457A", color: "#24457A", textDecoration: "none" }}>walk all six, full size →</a>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => scrollIndCarousel("left")}
                  aria-label="Scroll left"
                  style={{ width: 36, height: 36, border: "1px solid #24457A", background: "#FFFFFF", color: "#24457A", fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => scrollIndCarousel("right")}
                  aria-label="Scroll right"
                  style={{ width: 36, height: 36, border: "1px solid #24457A", background: "#24457A", color: "#FFFFFF", fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
                >
                  →
                </button>
              </div>
            </div>
          </div>
          <div
            ref={indCarouselRef}
            style={{
              display: "flex",
              gap: 14,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
              paddingBottom: 12,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {INDUSTRIES.map((c) => (
              <a
                key={c.name}
                href="/templates"
                className="ssr-ind-card"
                style={{
                  flex: "0 0 calc((100% - 42px) / 4)",
                  minWidth: 230,
                  scrollSnapAlign: "start",
                  border: "1px solid #E4E1DA",
                  background: "#FFFFFF",
                  overflow: "hidden",
                  color: "#14161A",
                  display: "block",
                  textDecoration: "none",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                }}
              >
                <div style={{ aspectRatio: "4 / 5", overflow: "hidden" }}>
                  <img src={c.img} alt={`${c.name} layout`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>{c.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 6, opacity: 0.62 }}>{c.line}</div>
                </div>
              </a>
            ))}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 18, opacity: 0.6 }}>layouts, photographed with stock imagery · scroll one by one or click arrows</div>
        </div>
      </section>

      {/* 01 / store layouts */}
      <section id="themes" style={{ scrollMarginTop: 150, borderBottom: "1px solid #E4E1DA", background: "#FAF9F6" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap", marginBottom: 46 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A", marginBottom: 16 }}>01 / store layouts</div>
              <h2 style={{ fontSize: "clamp(40px, 5vw, 80px)", lineHeight: 0.88, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
                six layouts.<br /><span style={{ fontWeight: 600, color: "#24457A" }}>swap in one tap.</span>
              </h2>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 56, alignItems: "start" }}>
            <div>
              {THEMES.map((t, i) => {
                const on = i === themeIx;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setThemeIx(i)}
                    style={{ width: "100%", textAlign: "left", border: "1px solid #E4E1DA", background: on ? "#EEF2F8" : "#FAF9F6", boxShadow: on ? "0 10px 24px rgba(20,22,26,0.10)" : "none", padding: "18px 20px", marginBottom: 14, display: "grid", gridTemplateColumns: "74px 1fr auto", gap: 18, alignItems: "center", transform: on ? "translate(-2px,-2px)" : "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <div style={{ width: 74, height: 74, border: "1px solid #E4E1DA", overflow: "hidden", background: "#F1EFE9" }}>
                      <img src={t.img} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: on ? "none" : "grayscale(0.6) contrast(1.05)" }} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>{t.name}</span>
                        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", border: "1px solid #E4E1DA", padding: "3px 7px", background: t.chip }}>{t.tag}</span>
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.45, marginTop: 5, color: "#14161A", opacity: 0.78 }}>{t.desc}</div>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: on ? "#14161A" : "#24457A" }}>{on ? "live now ✦" : "preview"}</div>
                  </button>
                );
              })}
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 24 }}>
                <a href="/templates" style={{ background: "#24457A", color: "#FFFFFF", border: "1px solid #E4E1DA", padding: "14px 22px", fontSize: 16, fontWeight: 800, boxShadow: "0 12px 28px rgba(20,22,26,0.10)", textDecoration: "none" }}>preview all six, full size →</a>
                <a href="/signup" style={{ color: "#14161A", fontSize: 15, fontWeight: 700, borderBottom: "1px solid #E4E1DA", alignSelf: "center", textDecoration: "none" }}>or edit one yourself</a>
              </div>
            </div>

            <div style={{ position: "sticky", top: 118, width: "100%", maxWidth: 380, justifySelf: "center" }}>
              <div style={{ border: "1px solid #E4E1DA", borderRadius: 34, background: "#14161A", padding: 9, boxShadow: "0 12px 28px rgba(20,22,26,0.10)" }}>
                <div style={{ borderRadius: 26, overflow: "hidden", background: live.bg, height: 620, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 6px", fontFamily: MONO, fontSize: 9, color: live.fg }}>
                    <span>9:41</span><span>{live.domain}</span><span>▮▮▮</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: `1px solid ${live.line}` }}>
                    <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.03em", color: live.fg, fontFamily: live.font }}>{live.store}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: live.accent }}>cart · 2</span>
                  </div>
                  <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                    <div className="ssr-phone-scroll" style={{ animation: "tick 24s linear infinite alternate" }}>
                      <div style={{ height: 168, position: "relative", overflow: "hidden" }}>
                        <img src={live.hero} alt={live.store} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 46%, rgba(0,0,0,0) 74%)" }} />
                        <div style={{ position: "absolute", left: 12, bottom: 12, background: live.accent, color: live.bg, padding: "5px 10px", fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>{live.promo}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, padding: "12px 12px 6px", overflow: "hidden" }}>
                        {live.cats.map((c, i) => (
                          <span key={c} style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", border: `1px solid ${i === 0 ? live.accent : live.line}`, background: i === 0 ? live.accent : "transparent", color: i === 0 ? live.btnFg : live.fg, padding: "5px 9px", whiteSpace: "nowrap" }}>{c}</span>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "8px 12px 16px" }}>
                        {live.products.map((p) => (
                          <div key={p.name} style={{ border: `1px solid ${live.line}`, background: live.card }}>
                            <div style={{ aspectRatio: "3 / 4", overflow: "hidden" }}>
                              <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            <div style={{ padding: 8 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.25, color: live.fg }}>{p.name}</div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: live.accent }}>{p.price}</span>
                                <span style={{ fontFamily: MONO, fontSize: 9, color: live.fg, opacity: 0.6 }}>★ {p.rating}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: "0 12px 18px" }}>
                        <div style={{ border: `1px dashed ${live.line}`, padding: 12, fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: live.fg, opacity: 0.75 }}>free shipping over ₹999 · COD available · GST invoice</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px", borderTop: `1px solid ${live.line}`, display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, background: live.accent, color: live.btnFg, textAlign: "center", padding: 11, fontSize: 13, fontWeight: 800 }}>add to cart</div>
                    <div style={{ border: `1px solid ${live.fg}`, color: live.fg, padding: "11px 14px", fontSize: 13, fontWeight: 800 }}>buy now</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center", opacity: 0.7 }}>live preview — hover to pause the scroll</div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 / what's included */}
      <section id="included" style={{ borderBottom: "1px solid #E4E1DA", background: "#14161A", color: "#FAF9F6", scrollMarginTop: 150 }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 28px" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9FBBE0", marginBottom: 16 }}>02 / what&apos;s included</div>
          <h2 style={{ fontSize: "clamp(40px, 5vw, 80px)", lineHeight: 0.88, fontWeight: 700, letterSpacing: "-0.03em", maxWidth: 900, margin: 0 }}>
            your job: make and ship.<br /><span style={{ fontWeight: 600, color: "#9FBBE0" }}>ours: everything else.</span>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 640, marginTop: 22, color: "#E7EEF8" }}>nothing to subscribe to, nobody to chase, no builder to learn. every line below is on every plan — pick a column to see what it covers.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 40 }}>
            {BUNDLE.map((g, k) => {
              const on = k === tab;
              return (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => setTab(k)}
                  style={{ border: `1px solid ${on ? "#FAF9F6" : "rgba(250,249,246,0.4)"}`, background: on ? "#FAF9F6" : "transparent", color: on ? "#14161A" : "#FAF9F6", padding: "15px 24px", cursor: "pointer", display: "flex", alignItems: "baseline", gap: 12, fontFamily: "inherit" }}
                >
                  <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>{g.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.75 }}>{g.items.length} items</span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 30, borderTop: "1px solid rgba(250,249,246,0.28)" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "30px 0 26px", borderBottom: "1px solid rgba(250,249,246,0.18)" }}>
              <div>
                <div style={{ fontSize: "clamp(24px, 2.8vw, 36px)", fontWeight: 700, letterSpacing: "-0.025em" }}>{bundle.title}</div>
                <div style={{ fontSize: 15, lineHeight: 1.55, marginTop: 8, maxWidth: 680, color: "#C3D4EA" }}>{bundle.blurb}</div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", border: "1px solid rgba(250,249,246,0.4)", padding: "7px 12px", color: "#FAF9F6" }}>{bundle.scope}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
              {bundle.items.map((it, k) => (
                <div key={it.name} style={{ padding: "22px 30px 22px 0", borderBottom: "1px solid rgba(250,249,246,0.14)", display: "grid", gridTemplateColumns: "34px 1fr", gap: 14, alignItems: "baseline" }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: "#9FBBE0" }}>{String(k + 1).padStart(2, "0")}</span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{it.name}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 5, color: "#B9C4D4" }}>{it.line}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid rgba(250,249,246,0.18)", padding: "26px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>{bundle.note}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9FBBE0" }}>no add-ons · no usage tiers</span>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" style={{ scrollMarginTop: 150, borderBottom: "1px solid #E4E1DA", background: "#FAF9F6" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 28px" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A", marginBottom: 16 }}>03 / pricing</div>
          <h2 style={{ fontSize: "clamp(40px, 5vw, 80px)", lineHeight: 0.88, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
            pay once a year. <span style={{ fontWeight: 600, color: "#24457A" }}>then only when it sells.</span>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.55, maxWidth: 620, marginTop: 20 }}>no per-app charges, no markup on top of your payment gateway, no surprise at renewal. move up a plan any time and we migrate you without rebuilding the site.</p>
          <p style={{ fontSize: 17, lineHeight: 1.55, maxWidth: 660, marginTop: 14, fontWeight: 600 }}>
            not sure which plan fits —{" "}
            <button type="button" onClick={demo.open} style={{ fontWeight: 700, color: "#24457A", border: 0, borderBottom: "1px solid #24457A", background: "none", cursor: "pointer", font: "inherit", padding: 0 }}>book a demo</button>
            {" "}and we will tell you on the call, or just start below.
          </p>
          <div style={{ marginTop: 40 }}>
            <PricingBlock showHeader={false} />
          </div>
        </div>
      </section>

      <section style={{ borderBottom: "1px solid #E4E1DA", background: "#FAF9F6" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "96px 28px" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A", marginBottom: 16 }}>04 / questions</div>
          <h2 style={{ fontSize: "clamp(36px, 4.4vw, 66px)", lineHeight: 0.9, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 36 }}>
            the things people <span style={{ fontWeight: 600, color: "#24457A" }}>actually ask.</span>
          </h2>
          <div style={{ borderTop: "1px solid #E4E1DA" }}>
            {FAQS.map(([q, a], k) => {
              const open = faq === k;
              return (
                <div key={q} onClick={() => setFaq(open ? -1 : k)} style={{ borderBottom: "1px solid #E4E1DA", padding: "24px 4px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                    <span style={{ fontSize: "clamp(19px, 2.2vw, 27px)", fontWeight: 800, letterSpacing: "-0.03em" }}>{q}</span>
                    <span style={{ fontSize: 24, color: "#24457A" }}>{open ? "–" : "+"}</span>
                  </div>
                  {open && <p style={{ fontSize: 16, lineHeight: 1.6, marginTop: 12, maxWidth: 720 }}>{a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CursorCatalogCTA />
    </div>
  );
}

const TRAIL_POOL = [
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
    if (reduce) return;
    TRAIL_POOL.forEach((p) => { const im = new Image(); im.src = p.img; });
    let last: { x: number; y: number } | null = null;
    let i = 0;
    let hold = 0;
    const spawn = (x: number, y: number) => {
      const item = TRAIL_POOL[i % TRAIL_POOL.length];
      const tilt = (i % 2 ? 1 : -1) * (4 + (i % 4) * 2);
      i++;
      const fig = document.createElement("div");
      fig.className = "trailfig";
      fig.setAttribute("style", `position:absolute;left:${x}px;top:${y}px;width:150px;height:190px;overflow:hidden;border:1px solid rgba(250,249,246,0.3);z-index:1;pointer-events:none;opacity:1;transform:translate(-50%,-50%) rotate(${tilt}deg);transition:opacity .5s ease, transform .5s cubic-bezier(.2,.7,.2,1);`);
      const img = document.createElement("img");
      img.src = item.img;
      img.alt = item.alt;
      img.setAttribute("style", "width:100%;height:100%;object-fit:cover;display:block;");
      fig.appendChild(img);
      el.appendChild(fig);
      window.setTimeout(() => { fig.style.opacity = "0"; fig.style.transform = `translate(-50%,-64%) rotate(${tilt}deg)`; }, 620);
      window.setTimeout(() => { fig.remove(); }, 1200);
      const live = el.querySelectorAll(".trailfig");
      if (live.length > 12) live[0].remove();
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (last && Math.hypot(x - last.x, y - last.y) < 44) { last = { x, y }; return; }
      last = { x, y };
      spawn(x, y);
    };
    const startHold = () => { if (hold) return; hold = window.setInterval(() => { if (last) spawn(last.x, last.y); }, 130); };
    const stopHold = () => { if (hold) { window.clearInterval(hold); hold = 0; } };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerdown", startHold, { passive: true });
    el.addEventListener("pointerup", stopHold, { passive: true });
    el.addEventListener("pointercancel", stopHold, { passive: true });
    el.addEventListener("pointerleave", stopHold, { passive: true });
    return () => {
      stopHold();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", startHold);
      el.removeEventListener("pointerup", stopHold);
      el.removeEventListener("pointercancel", stopHold);
      el.removeEventListener("pointerleave", stopHold);
      el.querySelectorAll(".trailfig").forEach((n) => n.remove());
    };
  }, []);

  return (
    <section ref={stageRef} className="ssr-catalog-cta" style={{ background: "#14161A", color: "#FAF9F6", borderTop: "1px solid #E4E1DA", position: "relative", overflow: "hidden", cursor: "crosshair" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {TRAIL_POOL.map((p) => (
          <div key={p.alt} style={{ position: "absolute", left: p.left, top: p.top, width: 132, height: 166, overflow: "hidden", border: "1px solid rgba(250,249,246,0.16)", opacity: 0.17, transform: p.tilt }}>
            <img src={p.img} alt={p.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1000, margin: "0 auto", padding: "150px 28px", textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250,249,246,0.45)", marginBottom: 34 }}>move your cursor ✦ the catalog follows</div>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9FBBE0" }}>ready when you are</div>
        <h2 style={{ fontSize: "clamp(44px, 6.4vw, 100px)", lineHeight: 0.86, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 18, color: "#FAF9F6" }}>
          ₹15,000 a year.<br /><span style={{ fontWeight: 600, color: "#9FBBE0" }}>2% when it sells.</span>
        </h2>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 36 }}>
          <a href="/signup" style={{ pointerEvents: "auto", background: "#EEF2F8", color: "#14161A", border: "2px solid #EEF2F8", padding: "18px 30px", fontSize: 18, fontWeight: 700, textDecoration: "none", boxShadow: "0 12px 28px rgba(20,22,26,0.10)" }}>start essential →</a>
          <button type="button" onClick={demo.open} style={{ pointerEvents: "auto", background: "none", color: "#FAF9F6", border: "2px solid #FAF9F6", padding: "18px 30px", fontFamily: "inherit", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>book a demo</button>
        </div>
      </div>
    </section>
  );
}
