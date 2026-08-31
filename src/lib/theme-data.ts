import type { ThemeKey } from "./constants";

export type SampleProduct = {
  name: string;
  description: string;
  price: number;
  mrp: number;
  image: string;
  category: string;
  variants?: string;
};

const SAMPLES: Record<ThemeKey, SampleProduct[]> = {
  fashion: [
    { name: "Embroidered Silk Kurta Set", description: "Hand-embroidered pure silk kurta with a matching churidar and organza dupatta. Fully lined, side slits and a concealed zip for a clean fit.", price: 349900, mrp: 499900, image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop", category: "ethnic", variants: "S / M / L / XL" },
    { name: "Pure Linen Cuban Shirt", description: "Garment-washed 100% European linen in a relaxed Cuban-collar cut. Breathes through peak summer and only gets softer with every wash.", price: 189900, mrp: 249900, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop", category: "casual", variants: "M / L / XL" },
    { name: "Royal Georgette Anarkali", description: "Floor-length georgette Anarkali with zari work on the yoke and a flared three-metre hem. Comes with an inner and a chiffon dupatta.", price: 429900, mrp: 599900, image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&auto=format&fit=crop", category: "ethnic", variants: "S / M / L" },
  ],
  bakery: [
    { name: "Belgian Truffle Cake (500g)", description: "Moist chocolate sponge layered with 55% Belgian dark chocolate ganache under a mirror glaze. Baked fresh to order, eggless on request.", price: 65000, mrp: 85000, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop", category: "cakes", variants: "500g / 1kg" },
    { name: "French Butter Croissants (4)", description: "27 hand-laminated layers of French cultured butter, proofed overnight and baked each morning. Crisp shell, honeycomb crumb.", price: 38000, mrp: 45000, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop", category: "pastries", variants: "Box of 4" },
    { name: "Wild Sourdough Boule", description: "750g naturally leavened loaf with a 48-hour cold ferment, blistered crust and an open crumb. Just stone-milled flour, water and salt.", price: 22000, mrp: 28000, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop", category: "pastries", variants: "Whole / Sliced" },
  ],
  skincare: [
    { name: "Vitamin C Glow Serum (30ml)", description: "20% L-ascorbic acid with ferulic acid and vitamin E to brighten dullness and even out tone. Lightweight, fragrance-free, UV-blocking bottle.", price: 79900, mrp: 119900, image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop", category: "serums", variants: "30ml / 50ml" },
    { name: "Ceramide Barrier Cream (50g)", description: "A three-ceramide and squalane moisturiser that rebuilds a compromised skin barrier overnight. Non-comedogenic and safe for sensitised skin.", price: 64900, mrp: 89900, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop", category: "creams", variants: "50g / 100g" },
    { name: "Mineral Sunscreen SPF 50", description: "Broad-spectrum SPF 50 PA++++ with non-nano zinc oxide. Blends in with zero white cast and sits well under makeup.", price: 59900, mrp: 79900, image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop", category: "creams", variants: "50ml / 100ml" },
  ],
  kirana: [
    { name: "Organic Kashmiri Apples (1kg)", description: "Hand-picked high-altitude Kashmiri apples, crisp and honey-sweet. Certified organic and packed the same day they are harvested.", price: 18000, mrp: 24000, image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop", category: "fruits", variants: "1kg / 2kg" },
    { name: "Cold-Pressed Olive Oil (1L)", description: "First cold-press extra-virgin olive oil, unfiltered and under 0.3% acidity. Grassy, peppery finish — best for finishing and salads.", price: 89000, mrp: 120000, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop", category: "oils", variants: "500ml / 1L" },
    { name: "Free-Range Eggs (12 pcs)", description: "Pasture-raised eggs from grain-fed hens with rich orange yolks. Collected daily and delivered within 48 hours of laying.", price: 13000, mrp: 16000, image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop", category: "fruits", variants: "Pack of 12" },
  ],
  tech: [
    { name: "Wireless ANC Headphones", description: "Hybrid active noise cancellation, 40-hour battery and LDAC hi-res audio. Memory-foam earcups and USB-C quick charge (5 min = 4 hrs).", price: 499900, mrp: 799900, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop", category: "audio", variants: "Black / Gray" },
    { name: "Titanium Smart Watch", description: "1.43\" AMOLED always-on display, single-lead ECG, SpO2 and 14-day battery. Grade-5 titanium case, sapphire glass, 5ATM water resistance.", price: 349900, mrp: 599900, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop", category: "wearables", variants: "Black / Blue" },
    { name: "100W GaN Fast Charger", description: "Four ports sharing 100W with intelligent power distribution. GaN-II internals keep it cool and pocket-sized, with foldable pins.", price: 129900, mrp: 189900, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop", category: "audio", variants: "100W / 65W" },
  ],
  jewels: [
    { name: "18K Gold Solitaire Ring", description: "0.50ct IGI-certified VVS1/F round-brilliant solitaire in an 18K gold six-prong setting. Hallmarked, with a lifetime buy-back guarantee.", price: 2499900, mrp: 3200000, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop", category: "gold", variants: "Size 12 / 14 / 16" },
    { name: "Gold Kundan Choker", description: "BIS-hallmarked 22K gold choker set with uncut kundan and freshwater pearl drops. Includes matching earrings and a fitted case.", price: 4850000, mrp: 6000000, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop", category: "gold", variants: "Standard Fit" },
    { name: "Sterling Silver Emerald Earrings", description: "925 sterling silver drop earrings with lab-grown emerald-cut stones and rhodium plating to resist tarnish. Secure push-back closure.", price: 320000, mrp: 450000, image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop", category: "silver", variants: "Green / Blue" },
  ],
};

export function getSampleProducts(theme: string): SampleProduct[] {
  const key = theme as ThemeKey;
  return SAMPLES[key] || SAMPLES.fashion;
}
