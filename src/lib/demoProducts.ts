// Demo catalogue for the standalone template previews (/templates/preview/[key]).
// Not stored anywhere — purely for showing a finished, shoppable storefront.

import type { Product } from "./types";

const U = (id: string) => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`;

type Seed = { name: string; price: number; mrp?: number; image: string; category: string; description?: string; variants?: string };

const CATALOGUE: Record<string, Seed[]> = {
  fashion: [
    { name: "Tailored Wool Overcoat", price: 899000, mrp: 1199000, image: U("photo-1591047139829-d91aecb6caea"), category: "outerwear", description: "Double-faced Italian wool, unlined.", variants: "S / M / L / XL" },
    { name: "Oversized Cotton Shirt", price: 249000, mrp: 329000, image: U("photo-1596755094514-f87e34085b2c"), category: "shirts", description: "Garment-washed poplin, mother-of-pearl buttons.", variants: "M / L / XL" },
    { name: "Pleated Wide-Leg Trouser", price: 329000, image: U("photo-1594633312681-425c7b97ccd1"), category: "trousers", description: "High-rise, fluid drape.", variants: "28 / 30 / 32 / 34" },
    { name: "Merino Crew Knit", price: 279000, mrp: 349000, image: U("photo-1576566588028-4147f3842f27"), category: "knitwear", description: "16-gauge extra-fine merino.", variants: "S / M / L" },
    { name: "Leather Derby Shoe", price: 649000, image: U("photo-1533867617858-e7b97e060509"), category: "footwear", description: "Goodyear-welted, full-grain calf.", variants: "UK 7 / UK 8 / UK 9 / UK 10" },
    { name: "Structured Tote Bag", price: 459000, mrp: 559000, image: U("photo-1584917865442-de89df76afd3"), category: "accessories", description: "Vegetable-tanned leather, suede lining.", variants: "Tan / Black / Olive" },
  ],
  bakery: [
    { name: "Country Sourdough Loaf", price: 32000, image: U("photo-1585478259715-1c093a7b70d3"), category: "bread", description: "48-hour ferment, stone-milled flour.", variants: "Whole Boule / Sliced" },
    { name: "Butter Croissant (Box of 4)", price: 48000, mrp: 56000, image: U("photo-1555507036-ab1f4038808a"), category: "viennoiserie", description: "27 layers, French cultured butter.", variants: "Box of 4 / Box of 8" },
    { name: "Dark Chocolate Babka", price: 42000, image: U("photo-1509440159596-0249088772ff"), category: "pastry", description: "70% couverture, brioche dough.", variants: "Regular / Eggless" },
    { name: "Classic Cinnamon Roll", price: 18000, image: U("photo-1509365390695-33aee754301f"), category: "pastry", description: "Cardamom-spiced, cream-cheese glaze.", variants: "Pack of 2 / Pack of 4" },
    { name: "Signature Carrot Cake", price: 95000, mrp: 110000, image: U("photo-1621303837174-89787a7d4729"), category: "cakes", description: "Walnut, orange zest, mascarpone frosting.", variants: "500g / 1kg / Eggless 500g" },
    { name: "Seeded Rye Batard", price: 36000, image: U("photo-1598373182133-52452f7691ef"), category: "bread", description: "Sunflower, flax and pumpkin seeds.", variants: "Whole / Sliced" },
  ],
  skincare: [
    { name: "Gentle Gel Cleanser", price: 89000, image: U("photo-1556228578-8c89e6adf883"), category: "cleanse", description: "pH 5.5, non-stripping, fragrance-free.", variants: "150ml / 250ml" },
    { name: "10% Niacinamide Serum", price: 119000, mrp: 149000, image: U("photo-1620916566398-39f1143ab7be"), category: "treat", description: "Pore refining, barrier supporting.", variants: "30ml / 50ml" },
    { name: "Hyaluronic Hydra Essence", price: 129000, image: U("photo-1608248543803-ba4f8c70ae0b"), category: "treat", description: "Triple-weight HA, plumping.", variants: "50ml / 100ml" },
    { name: "Ceramide Moisturiser", price: 139000, mrp: 169000, image: U("photo-1556229174-5e42a09e45af"), category: "moisturise", description: "Ceramide NP + squalane, 50 ml.", variants: "50g / 100g" },
    { name: "Mineral SPF 50 Fluid", price: 149000, image: U("photo-1571875257727-256c39da42af"), category: "protect", description: "Zinc oxide, no white cast.", variants: "50ml / 100ml" },
    { name: "Overnight Retinal 0.1%", price: 189000, mrp: 219000, image: U("photo-1612817288484-6f916006741a"), category: "treat", description: "Encapsulated retinaldehyde.", variants: "30ml" },
  ],
  kirana: [
    { name: "Chakki Fresh Atta 5 kg", price: 27500, image: U("photo-1568254183919-78a4f43a2877"), category: "staples", description: "100% whole wheat, stone-ground.", variants: "5kg / 10kg" },
    { name: "Toor Dal 1 kg", price: 16500, mrp: 18900, image: U("photo-1596797038530-2c107229654b"), category: "staples", description: "Unpolished, premium grade.", variants: "1kg / 2kg / 5kg" },
    { name: "Cold-Pressed Groundnut Oil 1 L", price: 24900, image: U("photo-1474979266404-7eaacbcd87c5"), category: "oils", description: "Wooden-churned, filtered.", variants: "1L / 2L / 5L Tin" },
    { name: "Farm Eggs (Tray of 30)", price: 21000, image: U("photo-1518569656558-1f25e69d93d7"), category: "dairy", description: "Free-range, grain-fed.", variants: "Pack of 12 / Tray of 30" },
    { name: "Fresh Vegetable Box", price: 34900, mrp: 39900, image: U("photo-1540420773420-3366772f4999"), category: "produce", description: "8 seasonal vegetables, hand-picked.", variants: "Standard Crate / Family Crate" },
    { name: "Basmati Rice 5 kg", price: 62000, image: U("photo-1586201375761-83865001e31c"), category: "staples", description: "Aged 12 months, extra-long grain.", variants: "5kg / 10kg" },
  ],
  tech: [
    { name: "14\" Ultrabook (16 GB / 512 GB)", price: 7499000, mrp: 8499000, image: U("photo-1496181133206-80ce9b88a853"), category: "laptops", description: "2.8K OLED, 70 Wh, 1.29 kg.", variants: "16GB RAM / 512GB SSD | 32GB RAM / 1TB SSD" },
    { name: "ANC Wireless Headphones", price: 1299000, mrp: 1799000, image: U("photo-1505740420928-5e560c06d30e"), category: "audio", description: "40 h battery, LDAC, USB-C.", variants: "Matte Black / Space Gray / Silver" },
    { name: "Mechanical 75% Keyboard", price: 649000, image: U("photo-1587829741301-dc798b83add3"), category: "accessories", description: "Hot-swap, gasket mount, PBT caps.", variants: "Linear Red Switches / Tactile Brown Switches" },
    { name: "4K 27\" IPS Monitor", price: 2899000, mrp: 3299000, image: U("photo-1527443224154-c4a3942d3acf"), category: "displays", description: "99% sRGB, 65 W USB-C PD.", variants: "27-inch 4K / 32-inch 4K" },
    { name: "1080p Webcam", price: 349000, image: U("photo-1587826080692-f439cd0b70da"), category: "accessories", description: "Auto-framing, dual mics.", variants: "Full HD 1080p" },
    { name: "100 W GaN Charger", price: 279000, mrp: 349000, image: U("photo-1591290619762-841b0c58add1"), category: "accessories", description: "3-port, foldable pins.", variants: "100W Black / 65W White" },
  ],
  jewels: [
    { name: "22 kt Gold Jhumka Earrings", price: 4850000, image: U("photo-1535632066927-ab7c9ab60908"), category: "earrings", description: "BIS hallmarked, 8.2 g.", variants: "22K Gold / Standard Fit" },
    { name: "Solitaire Diamond Ring 0.50 ct", price: 8990000, mrp: 9990000, image: U("photo-1605100804763-247f67b3557e"), category: "rings", description: "IGI certified, VS1 / F, 18 kt.", variants: "Size 12 / Size 14 / Size 16 / Size 18" },
    { name: "Temple Gold Necklace Set", price: 12500000, image: U("photo-1611591437281-460bfbe1220a"), category: "necklaces", description: "Lakshmi motif, antique finish.", variants: "22K Gold Antique" },
    { name: "Diamond Tennis Bracelet", price: 6750000, mrp: 7450000, image: U("photo-1602173574767-37ac01994b2a"), category: "bracelets", description: "2.0 ct total, 18 kt white gold.", variants: "7 inch / 7.5 inch" },
    { name: "Pearl Drop Pendant", price: 1890000, image: U("photo-1599643478518-a784e5dc4c8f"), category: "pendants", description: "South Sea pearl, 18 kt chain.", variants: "Yellow Gold / Rose Gold" },
    { name: "Gold Kada (Pair)", price: 9200000, image: U("photo-1610694955371-d4a3e0ce4b52"), category: "bangles", description: "22 kt, 20 g each, screw clasp.", variants: "Size 2.4 / Size 2.6 / Size 2.8" },
  ],
};

export function demoProductsFor(key: string): Product[] {
  const seeds = CATALOGUE[key] ?? CATALOGUE.fashion;
  return seeds.map((s, i) => ({
    id: `demo-${key}-${i}`,
    storeId: `demo-${key}`,
    name: s.name,
    description: s.description ?? null,
    price: s.price,
    mrp: s.mrp ?? null,
    image: s.image,
    category: s.category,
    stock: 25,
    sku: null,
    variants: s.variants ?? null,
    published: true,
    createdAt: new Date(),
  }));
}
