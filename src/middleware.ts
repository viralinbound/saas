import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { PLATFORM_DOMAINS, APP_URL } from "@/lib/domains";
// Hosts that ARE the SuperShowroom app itself, never a tenant storefront.
const RESERVED_LABELS = new Set(["www", "app", "api", "admin", "dashboard", "supershowroom", "staging", "preview"]);
// Top-level path segments that are real app/marketing routes — never a storefront.
const RESERVED_TOP_SEGMENTS = new Set([
  "app", "api", "auth", "_next", "login", "signup", "onboarding", "join",
  "pricing", "about", "domains", "templates", "features", "contact",
  "preview", "s", "h", "blog", "terms", "privacy", "legal", "help", "docs",
  "favicon.ico", "robots.txt", "sitemap.xml", "styles.css",
]);
// e.g. [".supershowroom.in", ".supershowroom.app"] plus ".localhost" for dev
const SUBDOMAIN_BASES = [...PLATFORM_DOMAINS.map((d) => `.${d}`), ".localhost"];

/**
 * If the request Host is a tenant subdomain — `<brand>.supershowroom.in`
 * (or `<brand>.localhost` in dev) — return `<brand>`, else null.
 */
function tenantSubdomain(host: string): string | null {
  const h = host.split(":")[0].toLowerCase();
  for (const base of SUBDOMAIN_BASES) {
    if (h.endsWith(base)) {
      const label = h.slice(0, -base.length);
      if (label && !label.includes(".") && !RESERVED_LABELS.has(label)) return label;
    }
  }
  return null;
}

/** Is this Host the SuperShowroom app itself (console / marketing), not a
 *  merchant's connected custom domain? */
function isAppHost(host: string): boolean {
  const h = host.split(":")[0].toLowerCase();
  if (!h || h === "localhost" || h.endsWith(".localhost")) return true;
  if (PLATFORM_DOMAINS.includes(h) || PLATFORM_DOMAINS.some((d) => h === `www.${d}`)) return true;
  if (h.endsWith(".vercel.app")) return true; // production + preview deployments
  try {
    if (new URL(APP_URL).host.split(":")[0].toLowerCase() === h) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const sub = tenantSubdomain(host);

  // ─── tenant storefront hosting: <brand>.supershowroom.app ───────────────
  if (sub) {
    // The merchant console isn't served from a storefront subdomain.
    if (
      pathname === "/login" || pathname === "/signup" ||
      pathname.startsWith("/app") || pathname.startsWith("/onboarding")
    ) {
      return NextResponse.redirect(new URL(pathname.startsWith("/app") ? pathname : "/app", APP_URL));
    }
    // Let API + framework assets pass straight through on the subdomain.
    if (
      pathname.startsWith("/api") || pathname.startsWith("/_next") ||
      pathname.startsWith("/auth") || pathname.startsWith("/s/") ||
      pathname.startsWith("/h/") || pathname.includes(".")
    ) {
      return NextResponse.next();
    }
    // Everything else renders the published storefront for this brand.
    // `/` → /s/<brand>, `/about` → /s/<brand>/about, `/p/x` → /s/<brand>/p/x
    const rewrite = request.nextUrl.clone();
    rewrite.pathname = `/s/${sub}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(rewrite);
  }

  // ─── connected custom domain: shop.yourbrand.com → that store's storefront ──
  if (!isAppHost(host)) {
    if (
      pathname.startsWith("/api") || pathname.startsWith("/_next") ||
      pathname.startsWith("/auth") || pathname.startsWith("/s/") ||
      pathname.startsWith("/h/") || pathname.includes(".")
    ) {
      return NextResponse.next();
    }
    const bare = host.split(":")[0];
    const rw = request.nextUrl.clone();
    rw.pathname = `/s/${bare}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(rw);
  }

  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  // ─── clean hosted URL: /<company>/<project> (no /h/ prefix) ─────────────
  // 1 or 2 lowercase-slug segments, first not a real route → serve the storefront.
  const cleanHost = /^\/([a-z0-9-]{2,60})(?:\/([a-z0-9-]{1,60}))?\/?$/.exec(pathname);
  if (cleanHost && !RESERVED_TOP_SEGMENTS.has(cleanHost[1])) {
    const rw = request.nextUrl.clone();
    rw.pathname = `/h/${cleanHost[1]}${cleanHost[2] ? `/${cleanHost[2]}` : ""}`;
    return NextResponse.rewrite(rw);
  }

  // `hasStore` is only consulted by the login/signup, onboarding and /app
  // redirects below — tell updateSession to skip its 3 queries otherwise.
  const wantStore =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/app");

  const { supabaseResponse, user, hasStore } = await updateSession(request, { wantStore });
  const isLoggedIn = !!user;

  // A redirect from middleware must carry the (possibly refreshed) auth
  // cookies from supabaseResponse — otherwise the next request looks logged out.
  const redirect = (to: string) => {
    const res = NextResponse.redirect(new URL(to, request.url));
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  const authPages = ["/login", "/signup"];
  const isAuthPage = authPages.includes(pathname);
  const isOnboarding = pathname.startsWith("/onboarding");
  const isApp = pathname.startsWith("/app");

  const q = request.nextUrl.searchParams;
  const isRecoveryScreen = pathname === "/login" && (q.has("recovery") || q.has("reset") || q.has("error"));

  if (isAuthPage && isLoggedIn && !isRecoveryScreen) {
    // Signed-in users go to the dashboard; unfinished onboarding goes to setup.
    return redirect(hasStore ? "/app" : "/onboarding");
  }

  if (isOnboarding && !isLoggedIn) {
    return redirect(`/login?next=/onboarding`);
  }

  // Already onboarded (has a store) → skip setup, go straight to the console.
  const onboardingLaunched = q.get("launched") === "1";
  if (isOnboarding && isLoggedIn && hasStore && !onboardingLaunched) {
    return redirect("/app");
  }

  if (isApp && !isLoggedIn) {
    return redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  if (isApp && isLoggedIn && !hasStore) {
    return redirect("/onboarding");
  }

  return supabaseResponse;
}

export const config = {
  // Run on everything except Next's static assets so tenant-subdomain
  // Host-based routing can be resolved for any path.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
