// The domain the SuperShowroom app + tenant storefronts live on.
// Override with NEXT_PUBLIC_ROOT_DOMAIN in the environment.
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "supershowroom.in";

// Hosts that ARE the app / storefront platform (current + legacy), never a
// merchant's connected custom domain.
export const PLATFORM_DOMAINS = Array.from(
  new Set([ROOT_DOMAIN, "supershowroom.in", "supershowroom.app"])
);

/** `<brand>.<root>` — a project's temporary hosted address. */
export const brandedHost = (brand: string) => `${brand}.${ROOT_DOMAIN}`;

/** The canonical URL of the app / marketing site. */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || `https://www.${ROOT_DOMAIN}`;

/** The public site origin — always the real domain, never a preview/vercel URL. */
export const SITE_URL = `https://www.${ROOT_DOMAIN}`;

/** Full public URL of a published store: https://www.<root>/<company>/<project> */
export const hostedUrl = (companyPath: string) => `${SITE_URL}/${companyPath.replace(/^\/+/, "")}`;
