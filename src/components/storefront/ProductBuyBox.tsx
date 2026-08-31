"use client";

import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";

export function ProductBuyBox({ storeSlug, product, accent }: { storeSlug: string; product: Product; accent: string }) {
  const router = useRouter();

  function buyNow() {
    const cart = [{ product, quantity: 1 }];
    sessionStorage.setItem(`cart_${storeSlug}`, JSON.stringify(cart.map((i) => ({
      productId: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      image: i.product.image,
    }))));
    router.push(`/s/${storeSlug}?checkout=1`);
  }

  return (
    <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
      <button
        type="button"
        onClick={() => router.push(`/s/${storeSlug}`)}
        style={{ flex: 1, padding: 14, border: "1px solid #E2E8F0", background: "#fff", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}
      >
        Add to Cart
      </button>
      <button
        type="button"
        onClick={buyNow}
        disabled={product.stock <= 0}
        style={{ flex: 1, padding: 14, border: 0, background: accent, color: "#fff", borderRadius: 8, fontWeight: 900, cursor: "pointer" }}
      >
        Buy Now →
      </button>
    </div>
  );
}
