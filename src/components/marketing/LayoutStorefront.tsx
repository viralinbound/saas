"use client";

/*
 * Full-page "live preview" of a redesigned store layout — opened from the
 * "live preview ↗" button on /templates. A thin SuperShowroom bar on top
 * switches screen and starts a real setup; the storefront below is the
 * shared <ShoppableLayout> (working cart / checkout / filters / search).
 */

import Link from "next/link";
import { useState } from "react";
import { LAYOUTS, MONO, type Layout } from "@/lib/layoutPreviews";
import { ShoppableLayout, type Screen } from "@/components/storefront/ShoppableLayout";

export function LayoutStorefront({ layoutKey }: { layoutKey: string }) {
  const L: Layout = LAYOUTS.find((d) => d.key === layoutKey) ?? LAYOUTS[0];
  const idx = LAYOUTS.indexOf(L);
  const [screen, setScreen] = useState<Screen>("home");

  const pill = (activeState: boolean): React.CSSProperties => ({
    border: `1px solid ${activeState ? "#FAF9F6" : "rgba(250,249,246,0.35)"}`,
    background: activeState ? "#FAF9F6" : "transparent",
    color: activeState ? "#14161A" : "#FAF9F6",
    padding: "6px 12px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em",
    textTransform: "uppercase", fontWeight: 700, cursor: "pointer",
  });

  return (
    <div style={{ minHeight: "100vh", background: L.bg }}>
      <div style={{ position: "sticky", top: 0, zIndex: 80, background: "#14161A", color: "#FAF9F6", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 16px" }}>
        <Link href="/templates" style={{ color: "#9FBBE0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>← all layouts</Link>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", opacity: 0.7 }}>{L.name} · live preview</span>

        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          {(["home", "product", "cart"] as Screen[]).map((s) => (
            <div key={s} onClick={() => { setScreen(s); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); }} style={pill(screen === s)}>
              {s === "cart" ? "checkout" : s}
            </div>
          ))}
          <Link href={`/onboarding?theme=${L.key}`} style={{ background: "#24457A", color: "#FFFFFF", padding: "7px 14px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>use this layout →</Link>
        </div>
      </div>

      <div style={{ margin: "0 auto", maxWidth: 1440, boxShadow: "0 18px 40px rgba(20,22,26,0.12)" }}>
        <ShoppableLayout
          layout={L}
          orderSlug={`demo-${L.key}`}
          idx={idx}
          screen={screen}
          onScreen={setScreen}
        />
      </div>
    </div>
  );
}
