/*
 * Shared data for the six redesigned store layouts (SuperShowroom Layouts.dc.html).
 * Used by /templates (the showcase) and /preview/template/[key] (the full-page preview).
 */

export const MONO = "'JetBrains Mono', ui-monospace, monospace";
const U = (id: string, w = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop`;

export type KV = { label: string; value: string };
export type Product = {
  /** real catalogue id — present only for a merchant store's products, so
   *  checkout can place a real order. Absent on the demo template layouts. */
  id?: string;
  name: string; price: string; mrp: string; rating: string; badge: string;
  variants: string[]; img: string;
};
export type Layout = {
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
  /** shopper-facing label for where the store ships, e.g. "Bengaluru + 18,240 pincodes". */
  serviceArea?: string;
  /** serviceable pincodes: full 6-digit codes or 2–5 digit prefixes, comma/space
   *  separated. Empty ⇒ the store ships everywhere. */
  servicePins?: string;
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

export const LAYOUTS: Layout[] = [
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
      { name: "bridal", count: "26 sets", img: U("1611085583191-a3b181a88401") },
    ],
    banner: { kicker: "try at home", headline: "three pieces, one appointment", sub: "buyers pick a slot, we send a verified courier with the pieces and an id check. the sale closes in the living room.", cta: "book a viewing", img: U("1599643478518-a784e5dc4c8f", 900) },
    checkout: "part-payment + insured delivery or store pickup",
    delivery: "insured, otp on handover, 3–6 days",
    products: [
      { name: "18k solitaire diamond ring", price: "₹24,999", mrp: "₹32,000", rating: "5.0", badge: "vvs1 · igi", variants: ["12", "14", "16"], img: U("1605100804763-247f67b3557e") },
      { name: "22k kundan choker set", price: "₹48,500", mrp: "₹60,000", rating: "5.0", badge: "1 left", variants: ["standard"], img: U("1599643478518-a784e5dc4c8f") },
      { name: "sterling emerald earrings", price: "₹3,200", mrp: "₹4,500", rating: "4.9", badge: "925 silver", variants: ["emerald", "sapphire"], img: U("1535632066927-ab7c9ab60908") },
      { name: "rose gold infinity bracelet", price: "₹8,900", mrp: "₹11,500", rating: "4.9", badge: "adjustable", variants: ["adjustable"], img: U("1611085583191-a3b181a88401") },
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

export const AVATARS = [
  U("1494790108377-be9c29b29330", 120), U("1500648767791-00dcc994a43e", 120),
  U("1534528741775-53994a69daeb", 120), U("1507003211169-0a1dd7228f2d", 120),
  U("1544005313-94ddf0286df2", 120), U("1506794778202-cad84cf45f1d", 120),
];
export const avatarFor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATARS[h % AVATARS.length];
};

export const numOf = (s: string) => parseInt(String(s).replace(/[^0-9]/g, ""), 10) || 0;
export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export function filmstrip() {
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
