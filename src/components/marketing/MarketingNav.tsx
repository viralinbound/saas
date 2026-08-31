"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

const LINKS = [
  { href: "/templates", label: "layouts" },
  { href: "/features", label: "what's included" },
  { href: "/pricing", label: "pricing" },
  { href: "/domains", label: "domain search" },
  { href: "/about", label: "studio" },
];

export function MarketingNav() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { setUser(d.user || null); })
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 95, background: "rgba(250,249,246,0.96)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderBottom: "1px solid #E4E1DA" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "15px 28px", display: "flex", alignItems: "center", gap: "16px 30px", flexWrap: "wrap" }}>
        <Link href="/" style={{ color: "#14161A", lineHeight: 1, textDecoration: "none" }}>
          <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: "-0.03em" }}>
            supershowroom<span style={{ color: "#24457A", marginLeft: 3 }}>✦</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "#24457A", marginTop: 3 }}>by viral inbound</div>
        </Link>

        <nav className="ssr-nav-desktop" style={{ display: "flex", gap: 24, marginLeft: "auto", fontSize: 15, fontWeight: 600 }}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="ssr-nav-link">{l.label}</Link>
          ))}
        </nav>

        <div className="ssr-nav-desktop" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <>
              <span style={{ fontFamily: MONO, fontSize: 12, color: "#24457A", whiteSpace: "nowrap" }}>
                {user.name}
              </span>
              <Link href="/app" className="ssr-pill">my store →</Link>
              <button type="button" onClick={logout} style={{ background: "none", border: 0, color: "#14161A", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="ssr-nav-link">log in</Link>
              <Link href="/signup" className="ssr-pill">start your setup →</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="ssr-nav-burger"
          onClick={() => setMenu((m) => !m)}
          style={{ display: "none", marginLeft: "auto", border: "1px solid #E4E1DA", borderRadius: 999, padding: "10px 16px", cursor: "pointer", background: "none", fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          {menu ? "close ✕" : "menu ☰"}
        </button>
      </div>

      {menu && (
        <div style={{ borderTop: "1px solid #E4E1DA", background: "#FAF9F6", padding: "18px 28px 24px" }}>
          <div style={{ display: "grid", gap: 2, maxWidth: 1360, margin: "0 auto" }}>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenu(false)} style={{ color: "#14161A", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", padding: "13px 0", borderBottom: "1px solid #E4E1DA", textDecoration: "none" }}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <Link href="/app" onClick={() => setMenu(false)} style={{ marginTop: 16, textAlign: "center", background: "#24457A", color: "#fff", fontSize: 16, fontWeight: 700, padding: 15, borderRadius: 34, textDecoration: "none" }}>my store →</Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenu(false)} style={{ color: "#14161A", fontSize: 19, fontWeight: 700, padding: "13px 0", borderBottom: "1px solid #E4E1DA", textDecoration: "none" }}>log in</Link>
                <Link href="/signup" onClick={() => setMenu(false)} style={{ marginTop: 16, textAlign: "center", background: "#24457A", color: "#fff", fontSize: 16, fontWeight: 700, padding: 15, borderRadius: 34, textDecoration: "none" }}>start your setup →</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
