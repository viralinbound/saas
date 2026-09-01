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

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const U = (id: string, w = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop`;

type KV = { label: string; value: string };
type Product = {
  name: string; price: string; mrp: string; rating: string; badge: string;
  variants: string[]; img: string;
};
type Layout = {
  key: string;
  name: string; short: string; domain: string; store: string; bestFor: string;
  extra: string[];
  bg: string; card: string; fg: string; line: string; accent: string;
  footBg: string; footFg: string; font: string; typeSample: string;
  promo: string; headline: string; sub: string; cta: string; cta2: string;
  gridTitle: string; gridMeta: string; hero: string;
  cats: string[]; chips: string[];
  tiles: { name: string; count: string; img: string }[];
  banner: { kicker: string; headline: string; sub: string; cta: string; img: string };
  checkout: string; delivery: string;
  products: Product[];
  signature: { title: string; rows: KV[] };
  reviews: { name: string; city: string; text: string }[];
  options: { name: string; detail: string }[];
  trust: { title: string; sub: string }[];
  pdp: {
    crumb: string; badge: string; variantLabel: string; stock: string;
    delivery: string; returns: string; bullets: string[];
    specTitle: string; specs: KV[];
  };
  cart: {
    coupon: string; discount: string; name: string; address: string;
    methods: { name: string; meta: string; on: boolean }[];
  };
};

const LAYOUTS: Layout[] = [
  {
    key: "fashion",
    name: "luxe apparel & fashion", short: "luxe apparel", domain: "velvetboutique.in", store: "velvet boutique",
    bestFor: "boutiques and labels with size and colour runs, lookbook photography and an exchange policy to explain.",
    extra: [U("1441984904996-e0b6ba687e04"), U("1483985988355-763728e1935b"), U("1490481651871-ab68de25d43d"), U("1479064555552-3ef4979f8908"), U("1469334031218-e382a71b716b"), U("1445205170230-053b83016050")],
    bg: "#FDF6F0", card: "#FFFFFF", fg: "#1A1410", line: "#E3D5C8", accent: "#98502F", footBg: "#1A1410", footFg: "#FDF6F0",
    font: "'Instrument Serif', serif", typeSample: "Aa editorial serif",
    promo: "festive drop · 30% off ethnic", headline: "the festive drop is live", sub: "hand-finished ethnic and everyday linen, cut in small runs.",
    cta: "shop the drop", cta2: "view lookbook",
    gridTitle: "new this week", gridMeta: "view all 340 →",
    hero: U("1610030469983-98e550d6193c", 1400),
    cats: ["ethnic", "casual", "lookbook", "sale"],
    chips: ["all", "kurta sets", "shirts", "sarees", "blazers"],
    tiles: [
      { name: "ethnic", count: "128 styles", img: U("1610030469983-98e550d6193c") },
      { name: "shirts", count: "64 styles", img: U("1596755094514-f87e34085b2c") },
      { name: "gowns", count: "41 styles", img: U("1583391733956-3750e0ff4e8b") },
      { name: "sarees", count: "87 styles", img: U("1617627143750-d86bc21e42bb") },
    ],
    banner: { kicker: "the lookbook", headline: "one outfit, four ways to wear it", sub: "styling notes and the full look shoppable in a tap — the block your buyers screenshot and send to friends.", cta: "shop the look", img: U("1507679799987-c73779587ccf", 900) },
    checkout: "slide-out cart drawer + UPI / cards / COD",
    delivery: "shiprocket, 2–5 days, free over ₹999",
    products: [
      { name: "embroidered silk kurta set", price: "₹3,499", mrp: "₹4,999", rating: "4.9", badge: "30% off", variants: ["s", "m", "l", "xl"], img: U("1610030469983-98e550d6193c") },
      { name: "pure linen cuban shirt", price: "₹1,899", mrp: "₹2,499", rating: "4.8", badge: "restocked", variants: ["m", "l", "xl"], img: U("1596755094514-f87e34085b2c") },
      { name: "georgette anarkali gown", price: "₹4,299", mrp: "₹5,999", rating: "5.0", badge: "bestseller", variants: ["s", "m", "l"], img: U("1583391733956-3750e0ff4e8b") },
      { name: "handblock chanderi saree", price: "₹2,799", mrp: "₹3,899", rating: "4.9", badge: "handloom", variants: ["free size"], img: U("1617627143750-d86bc21e42bb") },
      { name: "merino knit blazer", price: "₹5,499", mrp: "₹7,999", rating: "4.9", badge: "winter", variants: ["38", "40", "42"], img: U("1507679799987-c73779587ccf") },
      { name: "stretch chinos, khaki", price: "₹1,599", mrp: "₹2,199", rating: "4.7", badge: "everyday", variants: ["30", "32", "34"], img: U("1473966968600-fa801b869a1a") },
    ],
    signature: { title: "lookbook & fit", rows: [
      { label: "size guide", value: "inch chart per style" }, { label: "fit notes", value: "model height & size worn" },
      { label: "lookbook", value: "shop the full look" }, { label: "exchange", value: "7-day size swap" },
    ] },
    reviews: [
      { name: "ananya r", city: "bengaluru", text: "the kurta fit exactly to the inch chart. exchange for a size up took two messages on whatsapp." },
      { name: "meera n", city: "kochi", text: "ordered the saree for a wedding at 11pm, it shipped next morning with the GST invoice by email." },
      { name: "kabir s", city: "jaipur", text: "linen shirt is the real thing, not a blend. photos on the site match what arrived." },
    ],
    options: [
      { name: "size and colour variants", detail: "s/m/l/xl with per-variant stock, price and photos" },
      { name: "slide-out cart drawer", detail: "add to cart without leaving the product page" },
      { name: "lookbook grid", detail: "shop-the-look strips placed between product rows" },
      { name: "size guide overlay", detail: "inch chart and model fit notes on every style" },
      { name: "exchange request flow", detail: "buyer raises it, you approve from the console" },
      { name: "back-in-stock alerts", detail: "whatsapp ping when their size returns" },
    ],
    trust: [{ title: "free shipping over ₹999", sub: "all india" }, { title: "7-day exchange", sub: "size issues covered" }, { title: "GST invoice", sub: "on every order" }, { title: "whatsapp support", sub: "9am – 9pm ist" }],
    pdp: {
      crumb: "home / ethnic / kurta sets", badge: "bestseller · 30% off", variantLabel: "select size",
      stock: "only 4 left in m", delivery: "delivered by fri, 29 aug · free", returns: "7-day exchange on size",
      bullets: ["mulberry silk with hand-done zari on the yoke", "comes with dupatta and inner lining", "dry clean only, colour-fast tested", "made in a 12-person unit in jaipur"],
      specTitle: "fabric & fit", specs: [
        { label: "fabric", value: "mulberry silk, 90 gsm" }, { label: "work", value: "hand zari, machine finish" },
        { label: "model wears", value: "size m · 5’7”" }, { label: "care", value: "dry clean only" },
      ],
    },
    cart: { coupon: "FESTIVE30", discount: "₹1,620", name: "ananya rao", address: "14, 3rd cross, indiranagar, bengaluru 560038", methods: [
      { name: "UPI (gpay, phonepe)", meta: "auto-verified in seconds", on: true },
      { name: "credit / debit card", meta: "via razorpay", on: false },
      { name: "cash on delivery", meta: "₹40 handling fee", on: false },
    ] },
  },
  {
    key: "bakery",
    name: "artisan bakery & café", short: "artisan bakery", domain: "thecafeclub.store", store: "the cafe club",
    bestFor: "bakeries and cloud kitchens with a menu that changes daily, slot-based delivery and celebration cake orders.",
    extra: [U("1517433670267-08bbd4be890f"), U("1486427944299-d1955d23e34d"), U("1464349095431-e9a21285b5f3"), U("1499636136210-6f4ee915583e"), U("1608198093002-ad4e005484ec"), U("1509722747041-616f39b57569")],
    bg: "#FFF8E7", card: "#FFFFFF", fg: "#2B1B0E", line: "#EBDCBE", accent: "#C2410C", footBg: "#2B1B0E", footFg: "#FFF8E7",
    font: "'Instrument Serif', serif", typeSample: "Aa warm serif",
    promo: "order by 9pm for morning delivery", headline: "baked fresh at 6am", sub: "sourdough, viennoiserie and celebration cakes, baked to order.",
    cta: "see today’s menu", cta2: "book a cake",
    gridTitle: "on the counter today", gridMeta: "menu resets at 6am →",
    hero: U("1509440159596-0249088772ff", 1400),
    cats: ["cakes", "pastries", "eggless", "hampers"],
    chips: ["today", "cakes", "breads", "eggless", "hampers"],
    tiles: [
      { name: "cakes", count: "24 today", img: U("1578985545062-69928b1d9587") },
      { name: "pastries", count: "18 today", img: U("1555507036-ab1f4038808a") },
      { name: "breads", count: "9 today", img: U("1509440159596-0249088772ff") },
      { name: "hampers", count: "6 sets", img: U("1569864358642-9d1684040f43") },
    ],
    banner: { kicker: "celebration orders", headline: "cakes booked 24 hours ahead", sub: "date, time slot and the message on top — captured at checkout so nobody phones the kitchen to confirm.", cta: "book a cake", img: U("1533134242443-d4fd215305ad", 900) },
    checkout: "slot picker at checkout + UPI / COD",
    delivery: "porter same-city, 90-minute windows",
    products: [
      { name: "belgian dark truffle cake", price: "₹650", mrp: "₹850", rating: "5.0", badge: "eggless option", variants: ["500g", "1kg"], img: U("1578985545062-69928b1d9587") },
      { name: "french butter croissants", price: "₹380", mrp: "₹450", rating: "4.9", badge: "baked 6am", variants: ["box of 4", "box of 8"], img: U("1555507036-ab1f4038808a") },
      { name: "wild sourdough boule", price: "₹220", mrp: "₹280", rating: "4.8", badge: "6 left", variants: ["sliced", "whole"], img: U("1509440159596-0249088772ff") },
      { name: "parisian macarons box", price: "₹490", mrp: "₹600", rating: "4.9", badge: "gift ready", variants: ["box of 6", "box of 12"], img: U("1569864358642-9d1684040f43") },
      { name: "new york baked cheesecake", price: "₹750", mrp: "₹950", rating: "5.0", badge: "weekend only", variants: ["500g", "1kg"], img: U("1533134242443-d4fd215305ad") },
    ],
    signature: { title: "delivery slots & cake booking", rows: [
      { label: "today", value: "4pm – 6pm · 3 slots left" }, { label: "tomorrow", value: "8am – 10am · open" },
      { label: "cake orders", value: "24h notice, message on top" }, { label: "eggless", value: "tagged on every item" },
    ] },
    reviews: [
      { name: "pooja m", city: "hyderabad", text: "picked the 8–10am slot and the croissants arrived warm at 8:20. that never happens." },
      { name: "vikram s", city: "mysuru", text: "eggless tag saved me a phone call. cake had my daughter’s name piped exactly as typed." },
      { name: "sneha i", city: "chennai", text: "the menu actually changes through the day, so you know what is really available." },
    ],
    options: [
      { name: "daily menu reset", detail: "items switch on and off by time of day, on their own" },
      { name: "delivery slot selector", detail: "90-minute windows chosen and enforced at checkout" },
      { name: "eggless and allergen tags", detail: "per-item badges buyers can filter the menu by" },
      { name: "celebration cake booking", detail: "date, message on cake and a 24-hour lead time" },
      { name: "hamper builder", detail: "buyers mix items into a single gift box" },
      { name: "same-city courier", detail: "porter or dunzo pickup straight from the kitchen" },
    ],
    trust: [{ title: "baked to order", sub: "never day-old" }, { title: "90-min slots", sub: "you pick the window" }, { title: "eggless available", sub: "tagged clearly" }, { title: "fssai licensed", sub: "number on site" }],
    pdp: {
      crumb: "home / cakes / truffle", badge: "best seller · eggless option", variantLabel: "choose weight",
      stock: "baked to order · 4 hours notice", delivery: "today, 4pm – 6pm slot available", returns: "replaced if it arrives damaged",
      bullets: ["58% belgian couverture, no compound chocolate", "eggless version made in a separate batch", "message on cake captured at checkout", "kept in a chilled box until handover"],
      specTitle: "ingredients & allergens", specs: [
        { label: "contains", value: "milk, wheat, soy" }, { label: "eggless", value: "available, tick at checkout" },
        { label: "shelf life", value: "48h refrigerated" }, { label: "lead time", value: "4 hours, 24h for custom" },
      ],
    },
    cart: { coupon: "MORNING10", discount: "₹104", name: "pooja mehta", address: "flat 402, gachibowli, hyderabad 500081", methods: [
      { name: "UPI (gpay, phonepe)", meta: "auto-verified in seconds", on: true },
      { name: "cash on delivery", meta: "pay the rider", on: false },
      { name: "credit / debit card", meta: "via razorpay", on: false },
    ] },
  },
  {
    key: "skincare",
    name: "glow organic skincare", short: "glow skincare", domain: "herbalessence.shop", store: "herbal essence",
    bestFor: "skincare and wellness brands selling on ingredients, routines and repeat refills rather than one-off buys.",
    extra: [U("1526947425960-945c6e72858f"), U("1571781926291-c477ebfd024b"), U("1522335789203-aabd1fc54bc9"), U("1512207736890-6ffed8a84e8d"), U("1608248543803-ba4f8c70ae0b"), U("1594035910387-fea47794261f")],
    bg: "#F2F7F4", card: "#FFFFFF", fg: "#10231A", line: "#D5E5DC", accent: "#2F6B4F", footBg: "#10231A", footFg: "#F2F7F4",
    font: "'Instrument Sans', sans-serif", typeSample: "Aa clean grotesque",
    promo: "routine builder · save 15% on any 3", headline: "build your routine", sub: "clinically dosed actives, fragrance-free, made in small batches.",
    cta: "start the routine quiz", cta2: "shop bundles",
    gridTitle: "the shortlist", gridMeta: "sorted by repeat purchase →",
    hero: U("1556228720-195a672e8a03", 1400),
    cats: ["serums", "creams", "spf", "bundles"],
    chips: ["all", "actives", "barrier", "spf", "refills"],
    tiles: [
      { name: "serums", count: "14 skus", img: U("1620916566398-39f1143ab7be") },
      { name: "creams", count: "11 skus", img: U("1556228720-195a672e8a03") },
      { name: "cleansers", count: "8 skus", img: U("1570172619644-dfd03ed5d881") },
      { name: "spf", count: "5 skus", img: U("1598440947619-2c35fc9aa908") },
    ],
    banner: { kicker: "routine bundles", headline: "am and pm, priced as a set", sub: "three steps that work together, 15% below the sum of the parts, with a refill reminder every 45 days.", cta: "build my routine", img: U("1570172619644-dfd03ed5d881", 900) },
    checkout: "single-page checkout + subscription toggle",
    delivery: "shiprocket, 3–5 days, refill reminders",
    products: [
      { name: "20% vitamin c glow serum", price: "₹799", mrp: "₹1,199", rating: "4.9", badge: "am routine", variants: ["30ml", "50ml"], img: U("1620916566398-39f1143ab7be") },
      { name: "5-ceramide barrier cream", price: "₹649", mrp: "₹899", rating: "4.8", badge: "pm routine", variants: ["50g", "100g"], img: U("1556228720-195a672e8a03") },
      { name: "rose & aloe face wash", price: "₹450", mrp: "₹599", rating: "4.8", badge: "4 left", variants: ["150ml"], img: U("1570172619644-dfd03ed5d881") },
      { name: "mineral sunscreen spf 50", price: "₹599", mrp: "₹799", rating: "5.0", badge: "no white cast", variants: ["50ml", "100ml"], img: U("1598440947619-2c35fc9aa908") },
    ],
    signature: { title: "ingredients & routine", rows: [
      { label: "key actives", value: "20% l-ascorbic + ferulic" }, { label: "skin type", value: "oily, combination" },
      { label: "use with", value: "barrier cream, spf 50" }, { label: "refill", value: "every 45 days, 10% off" },
    ] },
    reviews: [
      { name: "sneha i", city: "chennai", text: "the percentages are printed on the page, not hidden in a pdf. that is why i bought." },
      { name: "ananya r", city: "bengaluru", text: "refill turned up on day 44 without me remembering. cancelled one month, no fuss." },
      { name: "meera n", city: "kochi", text: "batch and expiry on the listing itself. first indian brand i have seen do that." },
    ],
    options: [
      { name: "ingredient and dosage callouts", detail: "percentages, ph and patch-test notes on every product" },
      { name: "routine bundles", detail: "am/pm sets priced below the sum of the parts" },
      { name: "subscription refills", detail: "45-day cadence, discounted, with a whatsapp reminder" },
      { name: "verified reviews with photos", detail: "filtered by skin type on the review wall" },
      { name: "trial and full sizes", detail: "both sizes on one page, priced separately" },
      { name: "batch and expiry display", detail: "manufactured and use-by on every listing" },
    ],
    trust: [{ title: "fragrance-free", sub: "full inci list" }, { title: "cruelty-free", sub: "certified" }, { title: "refill & save 10%", sub: "cancel anytime" }, { title: "dermat-reviewed", sub: "formulation notes" }],
    pdp: {
      crumb: "home / serums / vitamin c", badge: "am routine · 33% off", variantLabel: "choose size",
      stock: "in stock · batch aug 2026", delivery: "delivered by sat, 30 aug · free", returns: "unopened returns for 14 days",
      bullets: ["20% l-ascorbic acid with 1% ferulic, ph 3.2", "fragrance-free, alcohol-free, patch-test notes included", "pairs with the barrier cream and spf 50", "refill every 45 days at 10% off, cancel anytime"],
      specTitle: "formulation", specs: [
        { label: "actives", value: "20% l-ascorbic, 1% ferulic" }, { label: "ph", value: "3.2" },
        { label: "skin type", value: "oily, combination" }, { label: "shelf life", value: "6 months once opened" },
      ],
    },
    cart: { coupon: "ROUTINE15", discount: "₹307", name: "sneha iyer", address: "22 besant nagar, chennai 600090", methods: [
      { name: "UPI (gpay, phonepe)", meta: "auto-verified in seconds", on: true },
      { name: "credit / debit card", meta: "via razorpay", on: false },
      { name: "subscribe & save 10%", meta: "refill every 45 days", on: false },
    ] },
  },
  {
    key: "kirana",
    name: "fresh mart & kirana", short: "fresh mart", domain: "raworganics.in", store: "raw organics",
    bestFor: "grocers and kirana stores with hundreds of skus, weight-based pricing and buyers who reorder every week.",
    extra: [U("1542838132-92c53300491e"), U("1560806887-1e4cd0b6cbd6"), U("1474979266404-7eaacbcd87c5"), U("1508061253366-f7da158b6d46"), U("1582722872445-44dc5f7e3c8f"), U("1524594081293-190a2fe0baae")],
    bg: "#F5FBF2", card: "#FFFFFF", fg: "#14210F", line: "#D9E8D0", accent: "#3F8F29", footBg: "#14210F", footFg: "#F5FBF2",
    font: "'Instrument Sans', sans-serif", typeSample: "Aa dense grotesque",
    promo: "order before 2pm · same-day delivery", headline: "same-day, straight from the farm", sub: "fruit, oils and staples picked this morning, delivered by evening.",
    cta: "start an order", cta2: "reorder last basket",
    gridTitle: "reorder your usual", gridMeta: "412 items in stock →",
    hero: U("1542838132-92c53300491e", 1400),
    cats: ["fruits", "oils", "dry fruits", "daily"],
    chips: ["all", "fruit & veg", "oils", "dry fruits", "atta & dal"],
    tiles: [
      { name: "fruit & veg", count: "146 items", img: U("1560806887-1e4cd0b6cbd6") },
      { name: "oils", count: "38 items", img: U("1474979266404-7eaacbcd87c5") },
      { name: "dry fruits", count: "52 items", img: U("1508061253366-f7da158b6d46") },
      { name: "daily", count: "61 items", img: U("1582722872445-44dc5f7e3c8f") },
    ],
    banner: { kicker: "weekly basket", headline: "last week’s order, rebuilt in one tap", sub: "buyers who reorder are your margin. the basket comes back from order history, weights and all.", cta: "see my basket", img: U("1542838132-92c53300491e", 900) },
    checkout: "one-tap reorder + COD on delivery",
    delivery: "own rider, same-day, 2-hour window",
    products: [
      { name: "kashmiri apples (1kg)", price: "₹180", mrp: "₹240", rating: "4.9", badge: "today’s pick", variants: ["500g", "1kg", "5kg"], img: U("1560806887-1e4cd0b6cbd6") },
      { name: "cold-pressed olive oil 1l", price: "₹890", mrp: "₹1,200", rating: "4.9", badge: "pantry", variants: ["500ml", "1l", "5l"], img: U("1474979266404-7eaacbcd87c5") },
      { name: "jumbo almonds (500g)", price: "₹480", mrp: "₹650", rating: "4.8", badge: "8 left", variants: ["250g", "500g", "1kg"], img: U("1508061253366-f7da158b6d46") },
      { name: "free-range eggs (12)", price: "₹130", mrp: "₹160", rating: "4.9", badge: "daily", variants: ["6 pcs", "12 pcs"], img: U("1582722872445-44dc5f7e3c8f") },
    ],
    signature: { title: "weights, reorder & slots", rows: [
      { label: "weight selector", value: "500g / 1kg / 5kg pricing" }, { label: "reorder", value: "last basket in one tap" },
      { label: "delivery slot", value: "6pm – 8pm today" }, { label: "pincodes", value: "18,240 serviceable" },
    ] },
    reviews: [
      { name: "amit k", city: "pune", text: "ordered at 1:40pm, rider was here by 7. the 5kg crate price is better than the market." },
      { name: "rahul v", city: "delhi", text: "reorder button means my monthly staples take thirty seconds instead of ten minutes." },
      { name: "pooja m", city: "hyderabad", text: "weighed in front of me at handover and it matched what i paid for." },
    ],
    options: [
      { name: "weight and pack selector", detail: "500g, 1kg and 5kg priced independently" },
      { name: "one-tap reorder", detail: "last basket rebuilt from order history" },
      { name: "high-density catalog", detail: "compact rows designed for 400+ skus on a phone" },
      { name: "same-day slot booking", detail: "cut-off times enforced automatically" },
      { name: "COD with whatsapp confirm", detail: "buyer confirms before the rider leaves" },
      { name: "out-of-stock auto-hide", detail: "items return the moment you restock" },
    ],
    trust: [{ title: "same-day delivery", sub: "order before 2pm" }, { title: "COD available", sub: "18,240 pincodes" }, { title: "weight guaranteed", sub: "weighed at packing" }, { title: "reorder in one tap", sub: "from history" }],
    pdp: {
      crumb: "home / fruit & veg / apples", badge: "today’s pick · 25% off", variantLabel: "select weight",
      stock: "picked this morning · 42 kg left", delivery: "today, 6pm – 8pm · free over ₹499", returns: "refunded if quality is off",
      bullets: ["grade a kashmiri, 180–220g per apple", "weighed and packed at dispatch, not in advance", "no wax coating, wash before eating", "crate rate available for 5kg and above"],
      specTitle: "sourcing", specs: [
        { label: "origin", value: "shopian, kashmir" }, { label: "grade", value: "a · 180–220g" },
        { label: "harvest", value: "picked 26 aug" }, { label: "storage", value: "7 days refrigerated" },
      ],
    },
    cart: { coupon: "SAMEDAY50", discount: "₹50", name: "amit khanna", address: "b-12, baner road, pune 411045", methods: [
      { name: "cash on delivery", meta: "pay the rider", on: true },
      { name: "UPI (gpay, phonepe)", meta: "auto-verified in seconds", on: false },
      { name: "credit / debit card", meta: "via razorpay", on: false },
    ] },
  },
  {
    key: "tech",
    name: "cyber tech & gadgets", short: "cyber tech", domain: "sparkelectronics.tech", store: "spark electronics",
    bestFor: "electronics sellers whose buyers compare specs, ask about warranty and want emi before they add to cart.",
    extra: [U("1498049794561-7780e7231661"), U("1519389950473-47ba0277781c"), U("1517336714731-489689fd1ca8"), U("1484704849700-f032a568e944"), U("1546435770-a3e426bf472b"), U("1550009158-9ebf69173e03")],
    bg: "#0E1116", card: "#171C24", fg: "#F2F5FA", line: "#2A313D", accent: "#4F7BFF", footBg: "#080A0E", footFg: "#F2F5FA",
    font: "'JetBrains Mono', monospace", typeSample: "Aa technical mono",
    promo: "launch week · flat ₹500 off + no-cost emi", headline: "launch week deals", sub: "audio, wearables and charging — sealed boxes, brand warranty.",
    cta: "compare models", cta2: "emi calculator",
    gridTitle: "trending builds", gridMeta: "compare up to 4 →",
    hero: U("1505740420928-5e560c06d30e", 1400),
    cats: ["audio", "wearables", "charging", "gaming"],
    chips: ["all", "audio", "wearables", "charging", "gaming"],
    tiles: [
      { name: "audio", count: "46 skus", img: U("1505740420928-5e560c06d30e") },
      { name: "wearables", count: "31 skus", img: U("1523275335684-37898b6baf30") },
      { name: "keyboards", count: "22 skus", img: U("1587829741301-dc798b83add3") },
      { name: "charging", count: "38 skus", img: U("1583863788434-e58a36330cf0") },
    ],
    banner: { kicker: "no-cost emi", headline: "₹4,999 reads as ₹417 a month", sub: "the emi table sits above the add-to-cart button, not three clicks deep in checkout where buyers drop off.", cta: "see emi plans", img: U("1523275335684-37898b6baf30", 900) },
    checkout: "emi calculator + cards / UPI / COD",
    delivery: "insured courier, 2–4 days, serial logged",
    products: [
      { name: "pro anc studio headphones", price: "₹4,999", mrp: "₹7,999", rating: "4.9", badge: "38% off", variants: ["black", "grey"], img: U("1505740420928-5e560c06d30e") },
      { name: "titanium smart watch s5", price: "₹3,499", mrp: "₹5,999", rating: "4.8", badge: "5 left", variants: ["black", "blue"], img: U("1523275335684-37898b6baf30") },
      { name: "hot-swap mech keyboard", price: "₹2,899", mrp: "₹4,299", rating: "4.9", badge: "no-cost emi", variants: ["red", "blue"], img: U("1587829741301-dc798b83add3") },
      { name: "100w gan travel charger", price: "₹1,299", mrp: "₹1,899", rating: "4.8", badge: "gan iii", variants: ["65w", "100w"], img: U("1583863788434-e58a36330cf0") },
    ],
    signature: { title: "specs, warranty & emi", rows: [
      { label: "battery", value: "40h anc off / 28h on" }, { label: "warranty", value: "2 years, brand-serviced" },
      { label: "emi from", value: "₹417/mo · 12 months" }, { label: "in the box", value: "case, 3.5mm, usb-c" },
    ] },
    reviews: [
      { name: "vikram s", city: "mysuru", text: "spec table answered every question i had. did not need to message anyone before buying." },
      { name: "kabir s", city: "jaipur", text: "serial number was logged against my order, so the warranty claim took one message." },
      { name: "rahul v", city: "delhi", text: "no-cost emi shown on the product page itself. sealed box, delivered in three days." },
    ],
    options: [
      { name: "spec tables per product", detail: "structured fields buyers can scan and compare" },
      { name: "side-by-side comparison", detail: "up to four models on one screen" },
      { name: "emi calculator", detail: "no-cost emi shown before add to cart" },
      { name: "warranty and serial capture", detail: "serial logged against the order for claims" },
      { name: "stock urgency counters", detail: "real counts, never fake timers" },
      { name: "insured shipping", detail: "declared value courier with proof of delivery" },
    ],
    trust: [{ title: "2-year warranty", sub: "brand-serviced" }, { title: "no-cost emi", sub: "from ₹417/mo" }, { title: "sealed box", sub: "serial logged" }, { title: "insured delivery", sub: "2–4 days" }],
    pdp: {
      crumb: "home / audio / over-ear", badge: "launch week · 38% off", variantLabel: "colour",
      stock: "in stock · 12 units", delivery: "delivered by thu, 28 aug · insured", returns: "7-day replacement on defects",
      bullets: ["hybrid anc, 40h battery with anc off", "ldac and aptx adaptive, multipoint pairing", "2-year brand warranty, serial logged to your order", "no-cost emi from ₹417 a month"],
      specTitle: "specifications", specs: [
        { label: "driver", value: "40mm dynamic" }, { label: "battery", value: "40h / 28h anc" },
        { label: "codecs", value: "ldac, aptx adaptive" }, { label: "warranty", value: "2 years" },
      ],
    },
    cart: { coupon: "LAUNCH500", discount: "₹500", name: "vikram shetty", address: "7 saraswathipuram, mysuru 570009", methods: [
      { name: "no-cost emi · 12 months", meta: "₹417/mo, hdfc & icici", on: true },
      { name: "credit / debit card", meta: "via razorpay", on: false },
      { name: "UPI (gpay, phonepe)", meta: "auto-verified in seconds", on: false },
    ] },
  },
  {
    key: "jewels",
    name: "royal gold & jewellery", short: "royal gold", domain: "royalgems.com", store: "royal gems",
    bestFor: "jewellers selling high-ticket pieces where purity proof, try-on and an appointment close the sale.",
    extra: [U("1573408301185-9146fe634ad0"), U("1602173574767-37ac01994b2a"), U("1611591437281-460bfbe1220a"), U("1617038220319-276d3cfab638"), U("1596944924616-7b38e7cfac36"), U("1608042314453-ae338d80c427")],
    bg: "#FBF7EE", card: "#FFFFFF", fg: "#1C1608", line: "#E8DDC2", accent: "#8A6A17", footBg: "#1C1608", footFg: "#FBF7EE",
    font: "'Instrument Serif', serif", typeSample: "Aa high serif",
    promo: "bis hallmarked · insured delivery · try at home", headline: "hallmarked, insured, yours", sub: "bis-certified gold and igi solitaires, valued and shipped insured.",
    cta: "book a viewing", cta2: "today’s gold rate",
    gridTitle: "the vault this month", gridMeta: "live gold rate applied →",
    hero: U("1515562141207-7a88fb7ce338", 1400),
    cats: ["gold", "silver", "diamond", "bridal"],
    chips: ["all", "22k gold", "18k diamond", "silver", "bridal sets"],
    tiles: [
      { name: "18k diamond", count: "64 pieces", img: U("1605100804763-247f67b3557e") },
      { name: "22k gold", count: "88 pieces", img: U("1599643478518-a784e5dc4c8f") },
      { name: "silver", count: "112 pieces", img: U("1535632066927-ab7c9ab60908") },
      { name: "bridal", count: "26 sets", img: U("1611591475155-4286fa7c2e7f") },
    ],
    banner: { kicker: "try at home", headline: "three pieces, one appointment", sub: "buyers pick a slot, we send a verified courier with the pieces and an id check. the sale closes in the living room.", cta: "book a viewing", img: U("1599643478518-a784e5dc4c8f", 900) },
    checkout: "part-payment + insured delivery or store pickup",
    delivery: "insured, otp on handover, 3–6 days",
    products: [
      { name: "18k solitaire diamond ring", price: "₹24,999", mrp: "₹32,000", rating: "5.0", badge: "vvs1 · igi", variants: ["12", "14", "16"], img: U("1605100804763-247f67b3557e") },
      { name: "22k kundan choker set", price: "₹48,500", mrp: "₹60,000", rating: "5.0", badge: "1 left", variants: ["standard"], img: U("1599643478518-a784e5dc4c8f") },
      { name: "sterling emerald earrings", price: "₹3,200", mrp: "₹4,500", rating: "4.9", badge: "925 silver", variants: ["emerald", "sapphire"], img: U("1535632066927-ab7c9ab60908") },
      { name: "rose gold infinity bracelet", price: "₹8,900", mrp: "₹11,500", rating: "4.9", badge: "adjustable", variants: ["adjustable"], img: U("1611591475155-4286fa7c2e7f") },
    ],
    signature: { title: "certification & appointment", rows: [
      { label: "purity", value: "bis hallmarked 22k" }, { label: "certificate", value: "igi, packed with the piece" },
      { label: "try at home", value: "three pieces, one visit" }, { label: "buy-back", value: "at live gold rate" },
    ] },
    reviews: [
      { name: "meera n", city: "kochi", text: "making charges shown separately from the metal rate. i could check the maths myself." },
      { name: "ananya r", city: "bengaluru", text: "try-at-home brought three rings with an id check. bought one, sent two back the same evening." },
      { name: "kabir s", city: "jaipur", text: "igi certificate was in the box and the otp handover felt safe for that value." },
    ],
    options: [
      { name: "purity and certificate tags", detail: "bis, igi and carat weight on every listing" },
      { name: "live gold rate pricing", detail: "making charges shown separately from metal" },
      { name: "try-at-home appointment", detail: "slot booking with an id verification step" },
      { name: "high-resolution try-on gallery", detail: "zoom, video and on-model shots" },
      { name: "part-payment and hold", detail: "reserve a piece with a deposit" },
      { name: "insured signature delivery", detail: "declared value with otp on handover" },
    ],
    trust: [{ title: "bis hallmarked", sub: "every piece" }, { title: "igi certificate", sub: "in the box" }, { title: "insured delivery", sub: "otp on handover" }, { title: "lifetime buy-back", sub: "at live rate" }],
    pdp: {
      crumb: "home / 18k diamond / rings", badge: "igi certified · vvs1", variantLabel: "ring size",
      stock: "made to order · 6 working days", delivery: "insured delivery, otp on handover", returns: "15-day return, full refund",
      bullets: ["0.52ct vvs1 solitaire, igi certificate in the box", "18k gold, bis hallmarked, weight 3.1g", "making charges shown separately from metal rate", "lifetime buy-back at the live gold rate"],
      specTitle: "certification", specs: [
        { label: "stone", value: "0.52ct vvs1, e colour" }, { label: "metal", value: "18k · 3.1g · bis" },
        { label: "certificate", value: "igi, in the box" }, { label: "making charges", value: "₹4,200, itemised" },
      ],
    },
    cart: { coupon: "VAULT2026", discount: "₹1,250", name: "meera nair", address: "9 panampilly nagar, kochi 682036", methods: [
      { name: "part-payment · 25% now", meta: "balance before dispatch", on: true },
      { name: "credit / debit card", meta: "via razorpay", on: false },
      { name: "bank transfer", meta: "neft / rtgs, invoice raised", on: false },
    ] },
  },
];

const AVATARS = [
  U("1494790108377-be9c29b29330", 120), U("1500648767791-00dcc994a43e", 120),
  U("1534528741775-53994a69daeb", 120), U("1507003211169-0a1dd7228f2d", 120),
  U("1544005313-94ddf0286df2", 120), U("1506794778202-cad84cf45f1d", 120),
];
const avatarFor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATARS[h % AVATARS.length];
};

const numOf = (s: string) => parseInt(String(s).replace(/[^0-9]/g, ""), 10) || 0;
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

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

  const slideData = v.slides[v.si];
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

            <div style={{ background: L.bg }}>
              <div style={{ background: L.accent, color: btnFg, padding: "8px 16px", textAlign: "center", fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>{L.promo}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "15px 24px", borderBottom: `1px solid ${L.line}`, flexWrap: "wrap" }}>
                <span style={{ fontFamily: L.font, fontSize: 23, fontWeight: 700, letterSpacing: "-0.03em", color: L.fg }}>{L.store}</span>
                <div style={{ display: "flex", gap: 15, marginLeft: 8, fontSize: 13, fontWeight: 600 }}>
                  {L.cats.map((c, k) => <span key={c} style={{ color: k === 0 ? L.accent : L.fg }}>{c}</span>)}
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 13, fontSize: 13, color: L.fg }}>
                  <span style={{ opacity: 0.6 }}>search</span>
                  <span style={{ opacity: 0.6 }}>account</span>
                  <span style={{ background: L.accent, color: btnFg, padding: "7px 13px", fontWeight: 700 }}>cart · 3</span>
                </div>
              </div>

              {screen === "home" && (
                <div>
                  <div style={{ position: "relative" }}>
                    <div style={{ aspectRatio: "24 / 9", minHeight: 320, maxHeight: 520, overflow: "hidden" }}>
                      <img src={slideData.img} alt={slideData.headline} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                        <span style={{ background: L.accent, color: btnFg, padding: "12px 22px", fontSize: 14, fontWeight: 700 }}>{slideData.cta}</span>
                        <span style={{ border: "1px solid #FFFFFF", color: "#FFFFFF", padding: "12px 18px", fontSize: 14, fontWeight: 700 }}>{L.cta2}</span>
                        <div style={{ display: "flex", gap: 7, marginLeft: 12 }}>
                          {v.slides.map((_, k) => (
                            <div key={k} onClick={() => setSlide(k)} style={{ width: k === v.si ? 28 : 10, height: 8, background: k === v.si ? "#FFFFFF" : "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.7)", cursor: "pointer" }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, padding: "18px 24px 4px", flexWrap: "wrap" }}>
                    {L.chips.map((c, k) => (
                      <span key={c} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", border: `1px solid ${k === 0 ? L.accent : L.line}`, background: k === 0 ? L.accent : "transparent", color: k === 0 ? btnFg : L.fg, padding: "7px 12px" }}>{c}</span>
                    ))}
                  </div>

                  <div style={{ padding: "18px 24px 6px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14 }}>
                    <span style={{ fontFamily: L.font, fontSize: 20, fontWeight: 700, letterSpacing: "-0.025em", color: L.fg }}>shop by category</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: L.accent }}>all categories →</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 150px), 1fr))", gap: 12, padding: "10px 24px 18px" }}>
                    {L.tiles.map((t) => (
                      <div key={t.name} style={{ border: `1px solid ${L.line}`, background: L.card, padding: "18px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 118 }}>
                        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: L.accent }}>{t.count}</div>
                        <div>
                          <div style={{ fontFamily: L.font, fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", color: L.fg, lineHeight: 1.05 }}>{t.name}</div>
                          <div style={{ width: 26, height: 2, background: L.accent, marginTop: 11 }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: "8px 24px 6px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14 }}>
                    <span style={{ fontFamily: L.font, fontSize: 20, fontWeight: 700, letterSpacing: "-0.025em", color: L.fg }}>{L.gridTitle}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: L.accent }}>{L.gridMeta}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 178px), 1fr))", gap: 13, padding: "12px 24px 20px" }}>
                    {L.products.map((p) => (
                      <div key={p.name} style={{ border: `1px solid ${L.line}`, background: L.card }}>
                        <div style={{ position: "relative" }}>
                          <div style={{ aspectRatio: "3 / 4", overflow: "hidden" }}>
                            <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                            <span style={{ border: `1px solid ${L.accent}`, color: L.accent, fontSize: 11, fontWeight: 700, padding: "6px 10px" }}>add to cart</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ margin: "0 24px 22px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", border: `1px solid ${L.line}` }}>
                    <div style={{ aspectRatio: "16 / 10", overflow: "hidden" }}>
                      <img src={L.banner.img} alt={L.banner.headline} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ background: L.card, padding: 26, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: L.accent }}>{L.banner.kicker}</div>
                      <div style={{ fontFamily: L.font, fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 8, color: L.fg, lineHeight: 1.05 }}>{L.banner.headline}</div>
                      <p style={{ fontSize: 14, lineHeight: 1.5, marginTop: 9, color: L.fg, opacity: 0.8 }}>{L.banner.sub}</p>
                      <div style={{ alignSelf: "flex-start", marginTop: 15, background: L.accent, color: btnFg, padding: "10px 17px", fontSize: 13, fontWeight: 700 }}>{L.banner.cta}</div>
                    </div>
                  </div>

                  <div style={{ margin: "0 24px 22px", border: `1px solid ${L.line}`, background: L.card }}>
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
                  </div>

                  <div style={{ padding: "4px 24px 6px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: L.font, fontSize: 20, fontWeight: 700, letterSpacing: "-0.025em", color: L.fg }}>{v.galleryTitle}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: L.accent }}>{v.handle}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(33%, 118px), 1fr))", gap: 8, padding: "10px 24px 24px" }}>
                    {v.gallery.map((g) => (
                      <div key={g.img} style={{ aspectRatio: "1 / 1", border: `1px solid ${L.line}`, overflow: "hidden" }}>
                        <img src={g.img} alt={g.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: "0 24px 6px" }}>
                    <span style={{ fontFamily: L.font, fontSize: 20, fontWeight: 700, letterSpacing: "-0.025em", color: L.fg }}>what buyers say</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))", gap: 13, padding: "12px 24px 22px" }}>
                    {L.reviews.map((r) => (
                      <div key={r.name} style={{ border: `1px solid ${L.line}`, background: L.card, padding: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", border: `1px solid ${L.line}` }}>
                            <img src={avatarFor(r.name)} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 180px), 1fr))", gap: 12, padding: "0 24px 20px" }}>
                    {L.trust.map((t) => (
                      <div key={t.title} style={{ borderTop: `1px solid ${L.line}`, paddingTop: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: L.fg }}>{t.title}</div>
                        <div style={{ fontSize: 12, marginTop: 3, color: L.fg, opacity: 0.7 }}>{t.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ margin: "0 24px 24px", border: `1px solid ${L.accent}`, background: L.card, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: L.fg }}>order on whatsapp instead</div>
                      <div style={{ fontSize: 13, marginTop: 3, color: L.fg, opacity: 0.75 }}>send a photo of what you want — we reply with a payment link.</div>
                    </div>
                    <div style={{ background: L.accent, color: btnFg, padding: "10px 16px", fontSize: 13, fontWeight: 700 }}>message us</div>
                  </div>

                  <div style={{ background: L.footBg, color: L.footFg, padding: "26px 24px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 170px), 1fr))", gap: 22 }}>
                      <div>
                        <div style={{ fontFamily: L.font, fontSize: 19, fontWeight: 700 }}>{L.store}</div>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", opacity: 0.7, marginTop: 6 }}>{L.domain}</div>
                      </div>
                      {[
                        { title: "shop", links: L.cats },
                        { title: "help", links: ["track my order", "shipping & returns", "whatsapp us", "faqs"] },
                        { title: "about", links: ["our story", "privacy policy", "terms of use", "GST & invoicing"] },
                      ].map((col) => (
                        <div key={col.title}>
                          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.65 }}>{col.title}</div>
                          <div style={{ display: "grid", gap: 6, marginTop: 9 }}>
                            {col.links.map((l) => <span key={l} style={{ fontSize: 12, opacity: 0.85 }}>{l}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.18)", marginTop: 20, paddingTop: 14, fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.65 }}>powered by supershowroom ✦ GST invoice on every order</div>
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
                          <img src={v.p0.img} alt={v.p0.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 8 }}>
                        {[v.p0.img, ...L.extra.slice(0, 3)].map((src, k) => (
                          <div key={k} style={{ aspectRatio: "1 / 1", border: `1px solid ${k === 0 ? L.accent : L.line}`, overflow: "hidden" }}>
                            <img src={src} alt="gallery" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: L.accent }}>{L.pdp.badge}</div>
                      <h3 style={{ fontFamily: L.font, fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 8, color: L.fg, lineHeight: 1.1 }}>{v.p0.name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9, fontFamily: MONO, fontSize: 11, color: L.fg }}>
                        <span style={{ color: L.accent }}>★ {v.p0.rating}</span>
                        <span style={{ opacity: 0.6 }}>{60 + i * 37} verified reviews</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 16 }}>
                        <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: L.fg }}>{v.p0.price}</span>
                        <span style={{ fontFamily: MONO, fontSize: 15, opacity: 0.45, textDecoration: "line-through", color: L.fg }}>{v.p0.mrp}</span>
                        <span style={{ background: L.accent, color: btnFg, fontFamily: MONO, fontSize: 10, padding: "4px 8px" }}>{v.off}</span>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 6, color: L.fg, opacity: 0.6 }}>inclusive of GST · {L.pdp.stock}</div>

                      <div style={{ marginTop: 20 }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: L.fg, opacity: 0.7 }}>{L.pdp.variantLabel}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
                          {v.p0.variants.map((vv, k) => (
                            <span key={vv} style={{ border: `1px solid ${k === 0 ? L.accent : L.line}`, background: k === 0 ? L.accent : "transparent", color: k === 0 ? btnFg : L.fg, padding: "9px 14px", fontSize: 13, fontWeight: 700 }}>{vv}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", border: `1px solid ${L.line}` }}>
                          <span style={{ padding: "12px 14px", color: L.fg, fontWeight: 700 }}>−</span>
                          <span style={{ padding: "12px 6px", fontFamily: MONO, color: L.fg }}>1</span>
                          <span style={{ padding: "12px 14px", color: L.fg, fontWeight: 700 }}>+</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 150, background: L.accent, color: btnFg, textAlign: "center", padding: 13, fontSize: 15, fontWeight: 700 }}>add to cart</div>
                        <div style={{ border: `1px solid ${L.fg}`, color: L.fg, padding: "13px 18px", fontSize: 15, fontWeight: 700 }}>buy now</div>
                      </div>

                      <div style={{ marginTop: 18, border: `1px solid ${L.line}`, background: L.card, padding: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: L.fg, opacity: 0.7 }}>deliver to</span>
                          <span style={{ border: `1px solid ${L.line}`, padding: "7px 10px", fontFamily: MONO, fontSize: 12, color: L.fg }}>560038</span>
                          <span style={{ color: L.accent, fontSize: 12, fontWeight: 700 }}>check</span>
                        </div>
                        <div style={{ fontSize: 13, marginTop: 9, color: L.fg }}>{L.pdp.delivery}</div>
                        <div style={{ fontSize: 13, marginTop: 4, color: L.fg, opacity: 0.75 }}>{L.pdp.returns}</div>
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
                      <div key={p.name} style={{ border: `1px solid ${L.line}`, background: L.card, display: "grid", gridTemplateColumns: "66px 1fr", gap: 11, alignItems: "center", padding: 10 }}>
                        <div style={{ width: 66, height: 66, border: `1px solid ${L.line}`, overflow: "hidden" }}>
                          <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

              {screen === "cart" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 24, padding: 24 }}>
                  <div>
                    <div style={{ fontFamily: L.font, fontSize: 24, fontWeight: 700, letterSpacing: "-0.025em", color: L.fg }}>your cart</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 5, color: L.fg, opacity: 0.6 }}>3 items · free shipping applied</div>
                    <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                      {v.lines.map((l) => (
                        <div key={l.name} style={{ border: `1px solid ${L.line}`, background: L.card, padding: 12, display: "grid", gridTemplateColumns: "76px 1fr auto", gap: 13, alignItems: "center" }}>
                          <div style={{ width: 76, height: 76, border: `1px solid ${L.line}`, overflow: "hidden" }}>
                            <img src={l.img} alt={l.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, color: L.fg }}>{l.name}</div>
                            <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 4, color: L.fg, opacity: 0.65 }}>{l.variant}</div>
                            <div style={{ display: "flex", alignItems: "center", border: `1px solid ${L.line}`, width: "max-content", marginTop: 8 }}>
                              <span style={{ padding: "5px 10px", color: L.fg, fontWeight: 700 }}>−</span>
                              <span style={{ padding: "5px 4px", fontFamily: MONO, fontSize: 12, color: L.fg }}>{l.qty}</span>
                              <span style={{ padding: "5px 10px", color: L.fg, fontWeight: 700 }}>+</span>
                            </div>
                          </div>
                          <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: L.fg }}>{l.price}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 16, border: `1px dashed ${L.line}`, padding: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: L.fg, opacity: 0.7 }}>coupon</span>
                      <span style={{ border: `1px solid ${L.line}`, padding: "8px 12px", fontFamily: MONO, fontSize: 12, color: L.fg }}>{L.cart.coupon}</span>
                      <span style={{ color: L.accent, fontSize: 13, fontWeight: 700 }}>applied — {L.cart.discount} off</span>
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
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ opacity: 0.7 }}>subtotal</span><span>{v.subtotal}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ opacity: 0.7 }}>discount</span><span style={{ color: L.accent }}>− {L.cart.discount}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ opacity: 0.7 }}>GST</span><span>{v.gst}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ opacity: 0.7 }}>shipping</span><span>free</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${L.line}`, paddingTop: 10, marginTop: 4, fontSize: 17, fontWeight: 700 }}><span>to pay</span><span>{v.total}</span></div>
                      </div>

                      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 20, color: L.fg, opacity: 0.7 }}>payment method</div>
                      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                        {L.cart.methods.map((m) => (
                          <div key={m.name} style={{ border: `1px solid ${m.on ? L.accent : L.line}`, background: m.on ? (onDark ? "#1E2530" : "#F7F4EC") : "transparent", padding: "12px 13px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: L.fg }}>{m.name}</div>
                              <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 3, color: L.fg, opacity: 0.65 }}>{m.meta}</div>
                            </div>
                            <span style={{ fontFamily: MONO, fontSize: 10, color: L.accent }}>{m.on ? "selected" : ""}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ background: L.accent, color: btnFg, textAlign: "center", padding: 14, fontSize: 15, fontWeight: 700, marginTop: 18 }}>place order · {v.total}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, lineHeight: 1.7, marginTop: 12, color: L.fg, opacity: 0.65 }}>GST invoice emailed instantly · order updates on whatsapp · {L.pdp.returns}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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

/** hero + one unseen tile + one unseen product per layout, de-duplicated by image */
function filmstrip() {
  const out: { img: string; label: string; slot: string }[] = [];
  const seen = new Set<string>();
  const key = (s: string) => s.split("?")[0];
  const take = (img: string, label: string, slot: string) => {
    if (!img || seen.has(key(img))) return;
    seen.add(key(img));
    out.push({ img, label, slot });
  };
  for (const d of LAYOUTS) {
    take(d.hero, d.short, "hero banner");
    const tile = d.tiles.find((t) => !seen.has(key(t.img)));
    if (tile) take(tile.img, tile.name, "category tile");
    const prod = d.products.find((p) => !seen.has(key(p.img)));
    if (prod) take(prod.img, prod.name.split(" ").slice(0, 3).join(" "), "product card");
  }
  return out;
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
