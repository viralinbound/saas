import type { Metadata } from "next";
import Link from "next/link";

/*
 * /about — "the studio" (section 06 of SuperShowroom Site.dc.html), opened
 * from the "studio" nav link. Faithful port: 06 / the studio eyebrow, the
 * big headline, the founder paragraph, the 4-cell stat grid, two catalog
 * photos and the three guarantee cards — plus a contact block and CTA.
 */

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SERIF = "'Instrument Serif', Georgia, serif";

export const metadata: Metadata = {
  title: "The studio — built and run by Viral Inbound",
  description:
    "SuperShowroom is built and run by Viral Inbound, a founder-led studio in Bengaluru with 350+ shipped projects. The person who answers your WhatsApp is the person who built your store.",
};

const STATS = [
  { value: "350+", label: "shipped", fg: "#14161A" },
  { value: "4", label: "plans", fg: "#14161A" },
  { value: "1:1", label: "founder support", fg: "#24457A" },
  { value: "0", label: "lock-in", fg: "#14161A" },
];

const GUARANTEES = [
  { n: "01", name: "not a builder", line: "we do the building. you never have to learn a page editor." },
  { n: "02", name: "not a ticket queue", line: "whatsapp a human, usually the one who built your store. no bots, no queue number." },
  { n: "03", name: "not a template farm", line: "every layout has 350+ shipped stores of evidence behind it." },
];

const CONTACT = [
  { label: "email", value: "hello@vilms.in", href: "mailto:hello@vilms.in" },
  { label: "phone / whatsapp", value: "+91 84311 01466", href: "https://wa.me/918431101466" },
  { label: "location", value: "bengaluru, india", href: null },
];

export default function StudioPage() {
  return (
    <div style={{ background: "#F1EFE9", color: "#14161A" }}>
      {/* 06 / the studio */}
      <section style={{ borderBottom: "1px solid #E4E1DA", background: "#F1EFE9" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: "48px 64px", alignItems: "start" }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A", marginBottom: 16 }}>06 / the studio</div>
              <h1 style={{ fontSize: "clamp(38px, 4.6vw, 72px)", lineHeight: 0.9, fontWeight: 700, letterSpacing: "-0.03em" }}>
                you don&apos;t lose to competitors. you lose <span style={{ fontWeight: 600, color: "#24457A" }}>months to vendors.</span>
              </h1>
              <p style={{ fontSize: 17, lineHeight: 1.6, marginTop: 24, maxWidth: 620 }}>
                supershowroom is built and run by viral inbound, a founder-led studio in bengaluru with 350+ shipped projects behind it. the person who answers your whatsapp is the person who built your store.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 120px), 1fr))", border: "1px solid #E4E1DA", marginTop: 32, background: "#FAF9F6" }}>
                {STATS.map((s, k) => (
                  <div key={s.label} style={{ padding: "20px 14px", borderRight: k < STATS.length - 1 ? "1px solid #E4E1DA" : undefined }}>
                    <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: s.fg }}>{s.value}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ aspectRatio: "4 / 5", border: "1px solid #E4E1DA", overflow: "hidden" }}>
                  <img src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=700&auto=format&fit=crop" alt="herbal essence catalog shot" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ aspectRatio: "4 / 5", border: "1px solid #E4E1DA", overflow: "hidden" }}>
                  <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&auto=format&fit=crop" alt="royal gems product shot" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
              {GUARANTEES.map((g) => (
                <div key={g.n} style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 26, boxShadow: "0 12px 28px rgba(20,22,26,0.10)" }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>guarantee {g.n}</div>
                  <h3 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 6 }}>{g.name}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.55, marginTop: 8 }}>{g.line}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* talk to the studio */}
      <section style={{ borderBottom: "1px solid #E4E1DA", background: "#FAF9F6" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "80px 28px" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A", marginBottom: 16 }}>talk to the studio</div>
          <h2 style={{ fontFamily: SERIF, fontSize: "clamp(30px, 3.6vw, 52px)", lineHeight: 0.98, letterSpacing: "-0.02em", maxWidth: 720 }}>
            one conversation, then we build.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", border: "1px solid #E4E1DA", marginTop: 32, background: "#F1EFE9" }}>
            {CONTACT.map((c, k) => (
              <div key={c.label} style={{ padding: "24px 22px", borderRight: k < CONTACT.length - 1 ? "1px solid #E4E1DA" : undefined }}>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>{c.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 8 }}>
                  {c.href ? <a href={c.href} style={{ color: "#14161A", borderBottom: "1px solid #E4E1DA" }}>{c.value}</a> : c.value}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 32 }}>
            <Link href="/onboarding" style={{ background: "#24457A", color: "#FFFFFF", border: "1px solid #24457A", padding: "15px 26px", fontSize: 16, fontWeight: 700 }}>start your setup →</Link>
            <Link href="/templates" style={{ color: "#14161A", border: "1px solid #E4E1DA", padding: "15px 24px", fontSize: 16, fontWeight: 700 }}>see the layouts</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
