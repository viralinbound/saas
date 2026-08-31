import { notFound } from "next/navigation";
import Link from "next/link";
import { formatINR, getTheme } from "@/lib/constants";
import { getStoreProduct } from "@/lib/stores";
import { ProductBuyBox } from "@/components/storefront/ProductBuyBox";
import { TrackView } from "@/components/storefront/TrackView";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const result = await getStoreProduct(slug, id);
  if (!result) notFound();

  const { store, product } = result;
  const theme = getTheme(store.theme);
  const accent = store.accentColor || theme.accent;
  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <TrackView storeSlug={store.slug} productId={product.id} />
      <header style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "14px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href={`/s/${store.slug}`} style={{ fontWeight: 900, color: "#0F172A", textDecoration: "none" }}>
            ← {store.name}
          </Link>
        </div>
      </header>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40 }}>
        <div style={{ borderRadius: 16, overflow: "hidden", background: "#F8FAFC" }}>
          {product.image && <img src={product.image} alt={product.name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />}
        </div>
        <div>
          {discount > 0 && (
            <span style={{ background: "#FF2D75", color: "#fff", padding: "4px 10px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 900 }}>
              {discount}% OFF
            </span>
          )}
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, marginTop: 12, lineHeight: 1.2 }}>{product.name}</h1>
          {product.description && <p style={{ marginTop: 12, color: "#64748B", lineHeight: 1.6 }}>{product.description}</p>}
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 20 }}>
            <span style={{ fontSize: "1.8rem", fontWeight: 900 }}>{formatINR(product.price)}</span>
            {product.mrp && product.mrp > product.price && (
              <span style={{ textDecoration: "line-through", color: "#94A3B8" }}>{formatINR(product.mrp)}</span>
            )}
          </div>
          {product.variants && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 800, marginBottom: 8 }}>VARIANTS</div>
              <div className="variant-pill-row">
                {product.variants.split(" / ").map((v) => (
                  <span key={v} className="variant-pill">{v}</span>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: "0.85rem", color: product.stock > 0 ? "#10B981" : "#EF4444", fontWeight: 700 }}>
            {product.stock > 0 ? `✓ In stock (${product.stock} available)` : "Out of stock"}
          </div>
          <ProductBuyBox storeSlug={store.slug} product={product} accent={accent} />
        </div>
      </div>
    </div>
  );
}
