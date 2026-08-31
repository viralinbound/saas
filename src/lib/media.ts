/**
 * Product media is packed into the single `products.image` text column so we can
 * carry multiple images + videos without a schema change.
 *
 *  - legacy value  →  a plain URL string  ("https://…/x.jpg")
 *  - new value     →  JSON: {"v":1,"images":["…","…"],"videos":["…"]}
 *
 * The FIRST image stays the "cover" so any code that still reads a bare URL keeps
 * working after we JSON-encode (it just needs to run through `mediaCover`).
 */

export type ProductMedia = {
  images: string[];
  videos: string[];
};

export function parseMedia(raw: string | null | undefined): ProductMedia {
  if (!raw) return { images: [], videos: [] };
  const s = raw.trim();
  if (s.startsWith("{")) {
    try {
      const o = JSON.parse(s) as Partial<ProductMedia>;
      return {
        images: Array.isArray(o.images) ? o.images.filter(Boolean).map(String) : [],
        videos: Array.isArray(o.videos) ? o.videos.filter(Boolean).map(String) : [],
      };
    } catch {
      /* fall through to treat as URL */
    }
  }
  return { images: [s], videos: [] };
}

export function serializeMedia(m: ProductMedia): string | null {
  const images = m.images.map((u) => u.trim()).filter(Boolean);
  const videos = m.videos.map((u) => u.trim()).filter(Boolean);
  if (images.length === 0 && videos.length === 0) return null;
  // Keep it a plain URL when there's exactly one image and no video — maximally
  // compatible with anything that still reads the column directly.
  if (images.length === 1 && videos.length === 0) return images[0];
  return JSON.stringify({ v: 1, images, videos });
}

/** First image (or first video poster fallback handled by the caller). */
export function mediaCover(raw: string | null | undefined): string | null {
  const m = parseMedia(raw);
  return m.images[0] ?? null;
}

/** Ordered list the storefront carousel steps through: images first, then videos. */
export function mediaSlides(raw: string | null | undefined): { type: "image" | "video"; url: string }[] {
  const m = parseMedia(raw);
  return [
    ...m.images.map((url) => ({ type: "image" as const, url })),
    ...m.videos.map((url) => ({ type: "video" as const, url })),
  ];
}
