import Link from "next/link";

export function AuthLayout({
  children,
  title,
  subtitle,
  mode = "login",
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  mode?: "login" | "signup";
}) {
  const perks = mode === "signup"
    ? [
        { icon: "🎯", text: "Personalized setup based on your goals" },
        { icon: "🚀", text: "Free plan — no credit card" },
        { icon: "🏪", text: "Your store live in under 5 minutes" },
        { icon: "🛒", text: "Cart, checkout & orders built in" },
      ]
    : [
        { icon: "📦", text: "Manage products & inventory" },
        { icon: "💳", text: "Track orders & revenue" },
        { icon: "🌐", text: "Publish your storefront URL" },
        { icon: "⚡", text: "Shopify-style merchant console" },
      ];

  return (
    <>
      <style>{`
        .auth-input:focus { border-color: #24457A !important; box-shadow: 0 0 0 3px rgba(36,69,122,0.12) !important; }
        @media (max-width: 900px) {
          .auth-split { grid-template-columns: 1fr !important; }
          .auth-split-aside { padding: 32px 24px !important; min-height: auto !important; }
          .auth-split-main { padding: 32px 20px !important; }
        }
      `}</style>
      <div
        className="auth-split"
        style={{
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
          fontFamily: "'Instrument Sans', 'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <aside
          className="auth-split-aside"
          style={{
            background: "#14161A",
            color: "#FAF9F6",
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid #24457A",
          }}
        >
          <div>
            <Link href="/" style={{ color: "#FAF9F6", textDecoration: "none" }}>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.028em" }}>
                supershowroom<span style={{ color: "#9FBBE0" }}>✦</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: "#9FBBE0", marginTop: 4 }}>
                by viral inbound
              </div>
            </Link>
            <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(1.9rem, 3.2vw, 2.6rem)", fontWeight: 400, lineHeight: 1.1, marginTop: 48, color: "#FAF9F6", letterSpacing: "-0.015em" }}>
              {title}
            </h1>
            <p style={{ marginTop: 16, fontSize: "1rem", lineHeight: 1.6, color: "#CBC7BE", maxWidth: 420 }}>
              {subtitle}
            </p>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {perks.map((p) => (
              <div key={p.text} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.9rem", color: "#E4E1DA" }}>
                <span style={{ fontSize: "1rem" }}>{p.icon}</span>
                <span>{p.text}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: "14px 16px", background: "rgba(159,187,224,0.08)", border: "1px solid rgba(159,187,224,0.18)", fontSize: "0.8rem", color: "#9AA0A8" }}>
              Trusted by Indian SMBs · Built for Shopify-like workflows
            </div>
          </div>
        </aside>

        <main
          className="auth-split-main"
          style={{
            background: "#F1EFE9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 28px",
          }}
        >
          <div style={{ width: "100%", maxWidth: 400 }}>
            <div style={{ marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#94A3B8" }}>
              {mode === "signup" ? "merchant signup" : "merchant login"}
            </div>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
