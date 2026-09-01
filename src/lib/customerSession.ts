/**
 * Storefront-customer session, kept per store in the browser. The token is a
 * random 48-hex string minted by the storefront_register / storefront_authenticate
 * Supabase RPCs; the server validates it on every request (storefront_session).
 * Nothing sensitive lives here — just the opaque token + display fields.
 */

export type StoreCustomer = { id: string; email: string; name: string | null; phone: string | null };
export type CustomerSession = { token: string; customer: StoreCustomer };

const key = (slug: string) => `ssr_customer_${slug}`;

export function loadCustomer(slug: string): CustomerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(slug));
    if (!raw) return null;
    const s = JSON.parse(raw) as CustomerSession;
    return s?.token && s?.customer ? s : null;
  } catch {
    return null;
  }
}

export function saveCustomer(slug: string, s: CustomerSession) {
  try {
    window.localStorage.setItem(key(slug), JSON.stringify(s));
  } catch {
    /* storage disabled — session just won't persist across reloads */
  }
}

export function clearCustomer(slug: string) {
  try {
    window.localStorage.removeItem(key(slug));
  } catch {
    /* noop */
  }
}
