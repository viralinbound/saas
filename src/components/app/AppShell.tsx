import Link from "next/link";
import { redirect } from "next/navigation";
import { UserMenu } from "./UserMenu";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { ConsoleMenuToggle } from "./ConsoleMenuToggle";

/** Only what the console chrome actually needs. Every page can satisfy this —
 *  full-store callers pass their `products`/`orders` arrays, the streamed
 *  dashboard shell passes `productCount`/`orderCount` instead. */
type ShellStore = {
  name: string;
  slug: string;
  plan: string;
  owner: { name: string; email: string };
  products?: unknown[];
  orders?: unknown[];
  productCount?: number;
  orderCount?: number;
};

const navItems = [
  { href: "/app", label: "dashboard", meta: "" },
  { href: "/app/projects", label: "projects", meta: "" },
  { href: "/app/design", label: "design & publish", meta: "" },
  { href: "/app/builder", label: "website builder", meta: "drag & drop" },
  { href: "/app/analytics", label: "analytics", meta: "" },
  { href: "/app/catalog", label: "catalog", meta: "products" },
  { href: "/app/orders", label: "orders", meta: "orders" },
  { href: "/app/team", label: "team & access", meta: "" },
  { href: "/app/plans", label: "plans & unlock", meta: "" },
  { href: "/app/account", label: "account", meta: "" },
  { href: "/app/settings", label: "domain & settings", meta: "" },
  { href: "/app/billing", label: "billing & fees", meta: "" },
];

const MONO = "'JetBrains Mono', ui-monospace, monospace";

export function AppShell({
  store,
  crumb,
  title,
  children,
  activePath = "/app",
  flush = false,
}: {
  store: ShellStore;
  crumb: string;
  title: string;
  children: React.ReactNode;
  activePath?: string;
  flush?: boolean;
}) {
  if (!store) redirect("/login");

  const productCount = store.productCount ?? store.products?.length ?? 0;
  const orderCount = store.orderCount ?? store.orders?.length ?? 0;

  const productLimit =
    store.plan === "free" ? 10 : store.plan === "essential" ? 100 : null;
  const usagePct = productLimit
    ? Math.min(100, Math.round((productCount / productLimit) * 100))
    : Math.min(100, productCount * 3);

  return (
    <div className="console-grid" style={{ display: "grid", gridTemplateColumns: "252px minmax(0, 1fr)", minHeight: "100vh", background: "#F1EFE9", fontFamily: "'Instrument Sans', system-ui, sans-serif", color: "#14161A" }}>
      <aside id="console-aside" className="console-aside" style={{ background: "#14161A", color: "#FAF9F6", padding: "22px 18px 28px", display: "flex", flexDirection: "column", gap: 22, position: "sticky", top: 0, height: "100vh", overflowY: "auto", overscrollBehavior: "contain" }}>
        <Link href="/" style={{ color: "#FAF9F6", textDecoration: "none" }}>
          <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.028em" }}>supershowroom<span style={{ color: "#9FBBE0", marginLeft: 2 }}>✦</span></div>
          <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: "#9FBBE0", marginTop: 3 }}>merchant console</div>
        </Link>

        <ProjectSwitcher currentName={store.name} currentSlug={store.slug} />

        <nav style={{ display: "grid", gap: 3 }}>
          {navItems.map((item) => {
            const active = activePath === item.href;
            const metaVal =
              item.meta === "products" ? productCount : item.meta === "orders" ? orderCount : item.meta;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 12px",
                  textDecoration: "none",
                  background: active ? "#FAF9F6" : "transparent",
                  color: active ? "#14161A" : "#FAF9F6",
                  borderLeft: `3px solid ${active ? "#24457A" : "transparent"}`,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, textTransform: "capitalize" }}>{item.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, opacity: 0.75 }}>{metaVal}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 16, display: "grid", gap: 10 }}>
          <div style={{ border: "1px solid rgba(250,249,246,0.24)", padding: 14 }}>
            <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6 }}>
              plan · {store.plan || "free"}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>
              {productCount} / {productLimit ?? "unlimited"} products
            </div>
            <div style={{ height: 6, background: "rgba(250,249,246,0.18)", marginTop: 8 }}>
              <div style={{ width: `${usagePct}%`, height: "100%", background: "#24457A" }} />
            </div>
            <Link href="/app/billing" style={{ display: "block", fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9FBBE0", marginTop: 10, textDecoration: "none" }}>
              view billing →
            </Link>
          </div>
          <Link href={`/s/${store.slug}`} target="_blank" style={{ display: "block", border: "1px solid #9FBBE0", color: "#9FBBE0", padding: 11, textAlign: "center", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
            view live store ↗
          </Link>
        </div>
      </aside>

      <main style={{ minWidth: 0 }}>
        <header className="console-header" style={{ background: "#FAF9F6", borderBottom: "1px solid #E4E1DA", padding: "16px 30px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 40 }}>
          <ConsoleMenuToggle />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A" }}>{crumb}</div>
            <h1 className="console-title" style={{ fontSize: 25, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</h1>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <div className="console-search" style={{ border: "1px solid #E4E1DA", background: "#fff", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px" }}>
              <span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.6 }}>⌘K</span>
              <input type="text" placeholder="search orders, products, customers" style={{ border: 0, outline: "none", background: "transparent", fontSize: 13, width: 220 }} />
            </div>
            <span className="console-datepill" style={{ border: "1px solid #E4E1DA", background: "#EEF2F8", padding: "9px 12px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            </span>
            <UserMenu name={store.owner.name} email={store.owner.email} />
          </div>
        </header>
        <section className="console-body" style={{ padding: flush ? 0 : "26px 30px 60px" }}>{children}</section>
      </main>
    </div>
  );
}
