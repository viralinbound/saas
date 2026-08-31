/**
 * Buyer-side order history, kept in the browser (localStorage) so a shopper can
 * see what they've ordered from a storefront — including template previews,
 * which don't persist orders anywhere.
 */

export type LocalOrderLine = { name: string; quantity: number; price: number; variant?: string };
export type LocalOrder = {
  orderNumber: string;
  placedAt: string; // ISO
  storeName: string;
  customerName: string;
  city?: string;
  paymentMethod: string;
  total: number;
  currency: string;
  items: LocalOrderLine[];
  preview: boolean;
};

const key = (slug: string) => `ssr_orders_${slug}`;

export function loadOrders(slug: string): LocalOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(slug));
    const arr = raw ? (JSON.parse(raw) as LocalOrder[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveOrder(slug: string, order: LocalOrder): LocalOrder[] {
  const next = [order, ...loadOrders(slug)].slice(0, 50);
  try {
    window.localStorage.setItem(key(slug), JSON.stringify(next));
  } catch {
    /* storage full / disabled — order history is best-effort */
  }
  return next;
}
