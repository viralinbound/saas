"use client";

import { useMemo, useState } from "react";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SERIF = "'Instrument Serif', Georgia, serif";
const STUDIO_EMAIL = "hello@vilms.in";

const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const SLOTS = ["10:30 am", "12:00 pm", "3:00 pm", "5:30 pm"];
const INDUSTRIES = ["fashion", "food & bakery", "skincare", "grocery", "electronics", "jewellery", "something else"];

function nextDays(n: number) {
  const out: { label: string; dow: string; date: string; jsDate: Date }[] = [];
  const d = new Date();
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) continue; // skip Sunday
    out.push({
      dow: DOW[d.getDay()],
      date: `${d.getDate()} ${MON[d.getMonth()]}`,
      label: `${DOW[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`,
      jsDate: new Date(d),
    });
  }
  return out;
}

function slotToHM(slot: string): [number, number] {
  const m = slot.match(/(\d+):(\d+)\s*(am|pm)/i);
  if (!m) return [12, 0];
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toLowerCase() === "pm") h += 12;
  return [h, parseInt(m[2], 10)];
}

function icsFor(start: Date, ref: string, roomUrl: string): string {
  const end = new Date(start.getTime() + 20 * 60 * 1000);
  const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SuperShowroom//Demo//EN",
    "BEGIN:VEVENT",
    `UID:${ref}@supershowroom`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    "SUMMARY:SuperShowroom — 20-minute store demo",
    `DESCRIPTION:We open a real store on the call.\\nJoin: ${roomUrl}\\nRef: ${ref}`,
    `LOCATION:${roomUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

type Done = {
  ref: string;
  roomUrl: string;
  when: string;
  name: string;
  store: string;
  industry: string;
  emailed?: boolean;
};

export function BookDemoModal({ onClose }: { onClose: () => void }) {
  const days = useMemo(() => nextDays(5), []);
  const [dayIx, setDayIx] = useState(0);
  const [slotIx, setSlotIx] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [store, setStore] = useState("");
  const [email, setEmail] = useState("");
  const [indIx, setIndIx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  const ready = name.trim().length > 1 && phone.replace(/\D/g, "").length >= 10;

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        store,
        email: email.trim() || undefined,
        industry: INDUSTRIES[indIx],
        day: days[dayIx].label,
        slot: SLOTS[slotIx],
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not book that slot. Try again.");
      return;
    }
    setDone(data as Done);
  }

  function downloadIcs(d: Done) {
    const [h, m] = slotToHM(SLOTS[slotIx]);
    const start = new Date(days[dayIx].jsDate);
    start.setHours(h, m, 0, 0);
    const blob = new Blob([icsFor(start, d.ref, d.roomUrl)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supershowroom-demo-${d.ref}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function mailtoFor(d: Done) {
    const subject = `SuperShowroom demo — ${d.when} (${d.ref})`;
    const body = [
      `Booked: ${d.when}`,
      `Name: ${d.name}`,
      `Store: ${d.store}`,
      `Selling: ${d.industry}`,
      ``,
      `Video call link: ${d.roomUrl}`,
      `Booking ref: ${d.ref}`,
      ``,
      `On the call we open a real store on your domain, put three of your products up, place a test order, and price it out loud.`,
    ].join("\n");
    const to = email.trim() ? `${encodeURIComponent(email.trim())},${STUDIO_EMAIL}` : STUDIO_EMAIL;
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const sel = (on: boolean): React.CSSProperties => ({
    border: `1px solid ${on ? "#24457A" : "#E4E1DA"}`,
    background: on ? "#24457A" : "#FFFFFF",
    color: on ? "#FFFFFF" : "#14161A",
    cursor: "pointer",
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(20,22,26,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "100%", maxWidth: 900, maxHeight: "92vh", overflow: "auto", background: "#FAF9F6", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}
      >
        {/* left panel */}
        <div style={{ background: "#14161A", color: "#FAF9F6", padding: 34 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9FBBE0" }}>20 minutes, no deck</div>
          <div style={{ fontFamily: SERIF, fontSize: 34, lineHeight: 1.05, letterSpacing: "-0.02em", marginTop: 14 }}>we open a real store on the call.</div>
          <div style={{ marginTop: 26, borderTop: "1px solid rgba(250,249,246,0.2)" }}>
            {[
              "we open your storefront on a real domain while you watch",
              "three of your products go up, variants and all",
              "you place a test order and see the whatsapp alert land",
              "we price it out loud — no quote emailed later",
            ].map((line, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "26px 1fr", gap: 10, alignItems: "baseline", padding: "13px 0", borderBottom: "1px solid rgba(250,249,246,0.14)" }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: "#9FBBE0" }}>{`0${i + 1}`}</span>
                <span style={{ fontSize: 14, lineHeight: 1.45 }}>{line}</span>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 22, opacity: 0.72 }}>
            or whatsapp +91 84311 01466
          </div>
        </div>

        {/* right panel */}
        <div style={{ padding: 34, position: "relative" }}>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 20, right: 22, border: 0, background: "none", fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" }}
          >
            close ✕
          </button>

          {!done ? (
            <>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#24457A" }}>pick a slot</div>

              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {days.map((d, k) => (
                  <button key={k} onClick={() => setDayIx(k)} style={{ ...sel(k === dayIx), borderRadius: 0, padding: "10px 14px", textAlign: "center", minWidth: 64 }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75 }}>{d.dow}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>{d.date}</div>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {SLOTS.map((t, k) => (
                  <button key={t} onClick={() => setSlotIx(k)} style={{ ...sel(k === slotIx), borderRadius: 999, padding: "9px 15px", fontFamily: MONO, fontSize: 12 }}>
                    {t}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
                <Field label="your name" value={name} onChange={setName} placeholder="ananya rao" />
                <Field label="whatsapp number" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
                <Field label="store or brand name" value={store} onChange={setStore} placeholder="your label" />
                <Field label="email (optional — for the invite)" value={email} onChange={setEmail} placeholder="you@brand.in" />
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>what do you sell</div>
                  <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
                    {INDUSTRIES.map((n, k) => (
                      <button key={n} onClick={() => setIndIx(k)} style={{ ...sel(k === indIx), borderRadius: 999, padding: "8px 13px", fontSize: 13, fontWeight: 600 }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && <div style={{ marginTop: 14, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", padding: 10, fontSize: 13 }}>{error}</div>}

              <button
                onClick={submit}
                disabled={!ready || busy}
                style={{ marginTop: 24, width: "100%", border: 0, background: ready ? "#24457A" : "#E4E1DA", color: ready ? "#fff" : "#14161A", padding: 15, fontSize: 15, fontWeight: 700, cursor: ready ? "pointer" : "not-allowed" }}
              >
                {busy ? "booking…" : ready ? `confirm ${days[dayIx].label}, ${SLOTS[slotIx]} →` : "add your name and number"}
              </button>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em", marginTop: 12, opacity: 0.6 }}>
                no card, no contract · we call on the number above
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#2F6B4F" }}>confirmed ✦</div>
              <div style={{ fontFamily: SERIF, fontSize: 32, lineHeight: 1.05, letterSpacing: "-0.02em", marginTop: 14 }}>
                {done.name.split(" ")[0] || "you"}, you&apos;re on the calendar.
              </div>

              <div style={{ border: "1px solid #E4E1DA", background: "#FFFFFF", marginTop: 22 }}>
                {[
                  ["when", done.when],
                  ["who", done.name],
                  ["store", done.store],
                  ["selling", done.industry],
                  ["ref", done.ref],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "12px 16px", borderBottom: "1px solid #E4E1DA" }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.62 }}>{k}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, textAlign: "right", wordBreak: "break-word" }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>your video call link</div>
              <a href={done.roomUrl} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 6, fontFamily: MONO, fontSize: 13, color: "#24457A", wordBreak: "break-all" }}>
                {done.roomUrl}
              </a>

              {done.emailed && (
                <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em", color: "#2F6B4F" }}>
                  ✓ a confirmation and calendar invite are on their way to your inbox
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
                <a href={mailtoFor(done)} style={{ flex: "1 1 180px", textAlign: "center", background: "#24457A", color: "#fff", padding: 13, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                  {done.emailed ? "resend by email" : "email me the details"}
                </a>
                <button onClick={() => downloadIcs(done)} style={{ flex: "1 1 140px", border: "1px solid #E4E1DA", background: "#FFFFFF", padding: 13, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  add to calendar
                </button>
              </div>

              <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 16, opacity: 0.8 }}>
                Bring your product photos — we upload three of them live on the call. A WhatsApp confirmation goes to the number you gave.
              </p>

              <button onClick={onClose} style={{ marginTop: 18, width: "100%", border: 0, background: "#14161A", color: "#fff", padding: 13, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", marginTop: 6, border: "1px solid #E4E1DA", background: "#FFFFFF", padding: "12px 14px", fontSize: 15, color: "#14161A", outline: "none" }}
      />
    </div>
  );
}
