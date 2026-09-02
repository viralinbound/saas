"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDemo } from "@/components/marketing/demo/DemoContext";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

const LINKS = [
  { href: "/#themes", label: "layouts" },
  { href: "/#included", label: "what's included" },
  { href: "/pricing", label: "pricing" },
  { href: "/about", label: "studio" },
];

const demoBtn: React.CSSProperties = {
  background: "#24457A",
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: 800,
  border: "1px solid #E4E1DA",
  padding: "9px 16px",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 12px 28px rgba(20,22,26,0.10)",
  whiteSpace: "nowrap",
};

const loginBtn: React.CSSProperties = {
  color: "#14161A",
  fontSize: 14,
  fontWeight: 700,
  border: "1px solid #E4E1DA",
  padding: "9px 14px",
  textDecoration: "none",
  whiteSpace: "nowrap",
};

export function MarketingNav() {
  const pathname = usePathname();
  const router = useRouter();
  const demo = useDemo();
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

  function goHash(href: string) {
    if (!href.startsWith("/#") || pathname !== "/") return false;
    const id = href.slice(2);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    window.history.replaceState(null, "", href);
    return true;
  }

  function openDemo() {
    setMenu(false);
    demo.open();
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
            <Link
              key={l.href}
              href={l.href}
              className="ssr-nav-link"
              onClick={(e) => {
                if (goHash(l.href)) e.preventDefault();
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ssr-nav-desktop" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <span style={{ fontFamily: MONO, fontSize: 12, color: "#24457A", whiteSpace: "nowrap" }}>
                {user.name}
              </span>
              <Link href="/app" style={loginBtn}>my store →</Link>
            </>
          ) : (
            <Link href="/login" style={loginBtn}>log in</Link>
          )}
          <button type="button" onClick={openDemo} className="ssr-demo-nav" style={demoBtn}>
            book a demo →
          </button>
        </div>

        <button
          type="button"
          className="ssr-nav-burger"
          onClick={() => setMenu((m) => !m)}
          style={{ display: "none", marginLeft: "auto", border: "1px solid #E4E1DA", padding: "10px 16px", cursor: "pointer", background: "none", fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          {menu ? "close ✕" : "menu ☰"}
        </button>
      </div>

      {menu && (
        <div style={{ borderTop: "1px solid #E4E1DA", background: "#FAF9F6", padding: "18px 28px 24px" }}>
          <div style={{ display: "grid", gap: 2, maxWidth: 1360, margin: "0 auto" }}>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={(e) => {
                  if (goHash(l.href)) e.preventDefault();
                  setMenu(false);
                }}
                style={{ color: "#14161A", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", padding: "13px 0", borderBottom: "1px solid #E4E1DA", textDecoration: "none" }}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#24457A", padding: "13px 0", borderBottom: "1px solid #E4E1DA" }}>
                  signed in as {user.name}
                </div>
                <Link href="/app" onClick={() => setMenu(false)} style={{ marginTop: 16, textAlign: "center", background: "#FAF9F6", color: "#14161A", fontSize: 16, fontWeight: 700, padding: 15, border: "1px solid #E4E1DA", textDecoration: "none" }}>my store →</Link>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenu(false)} style={{ color: "#14161A", fontSize: 19, fontWeight: 700, padding: "13px 0", borderBottom: "1px solid #E4E1DA", textDecoration: "none" }}>log in</Link>
            )}
            <button type="button" onClick={openDemo} style={{ ...demoBtn, marginTop: 16, width: "100%", padding: 15, fontSize: 16 }}>
              book a demo →
            </button>
            {user && (
              <button type="button" onClick={() => { setMenu(false); logout(); }} style={{ marginTop: 10, textAlign: "center", background: "none", border: "1px solid #E4E1DA", color: "#14161A", fontSize: 15, fontWeight: 700, padding: 14, cursor: "pointer", fontFamily: "inherit" }}>
                log out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
