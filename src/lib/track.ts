"use client";

// Lightweight storefront analytics — fire-and-forget, never blocks the UI.

type EventType = "page_view" | "product_view" | "add_to_cart" | "begin_checkout";

function sessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem("ssr_sid");
    if (!id) {
      id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem("ssr_sid", id);
    }
    return id;
  } catch {
    return "";
  }
}

export function track(storeSlug: string, eventType: EventType, opts: { productId?: string } = {}) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      storeSlug,
      eventType,
      sessionId: sessionId(),
      path: window.location.pathname,
      productId: opts.productId,
      referrer: document.referrer || undefined,
    });
    // navigator.sendBeacon survives navigation (e.g. clicking a product link)
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}
