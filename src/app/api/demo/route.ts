import { NextResponse } from "next/server";
import { z } from "zod";
import { sendMail, mailerConfigured } from "@/lib/mailer";

/**
 * Demo-call booking.
 *
 * Generates a real, working, no-login video room (Jitsi Meet) and — when SMTP is
 * configured (SMTP_HOST/USER/PASS, e.g. copied from Supabase → Auth → SMTP
 * Settings) — emails the visitor and the studio the link + a calendar invite.
 * Without SMTP it still returns everything the client needs for its pre-filled
 * mailto + .ics fallback.
 *
 * To mint a real Zoom meeting instead of the Jitsi room, add ZOOM_ACCOUNT_ID /
 * ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET and create it where `roomUrl` is built.
 */

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  store: z.string().optional().default(""),
  industry: z.string().optional().default(""),
  day: z.string().min(2), // e.g. "tue, 1 sep"
  slot: z.string().min(2), // e.g. "12:00 pm"
  email: z.string().email().optional(),
});

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24) || "merchant";
}

/** Best-effort parse of "tue, 1 sep" + "12:00 pm" into a Date in the current year. */
function toStart(day: string, slot: string): Date {
  const MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const dm = day.match(/(\d{1,2})\s+([a-z]{3})/i);
  const tm = slot.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  const now = new Date();
  const d = new Date(now);
  if (dm) {
    const mon = MON.indexOf(dm[2].toLowerCase());
    d.setMonth(mon >= 0 ? mon : now.getMonth(), Number(dm[1]));
    if (d < now) d.setFullYear(now.getFullYear() + 1);
  }
  let h = 12, min = 0;
  if (tm) {
    h = Number(tm[1]) % 12;
    if (tm[3].toLowerCase() === "pm") h += 12;
    min = Number(tm[2]);
  }
  d.setHours(h, min, 0, 0);
  return d;
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

export async function POST(req: Request) {
  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Please add your name and a valid phone number." }, { status: 400 });
  }

  const token = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/-/g, "").slice(0, 12);
  const ref = `DEMO-${token.slice(0, 6).toUpperCase()}`;
  const roomUrl = `https://meet.jit.si/SuperShowroomDemo-${slug(data.store || data.name)}-${token.slice(0, 8)}`;
  const when = `${data.day} · ${data.slot} IST`;
  const store = data.store?.trim() || "to be named on the call";
  const industry = data.industry || "not specified";

  let emailed = false;
  if (mailerConfigured()) {
    const start = toStart(data.day, data.slot);
    const ics = icsFor(start, ref, roomUrl);
    const text = [
      `You're booked for a 20-minute SuperShowroom demo.`,
      ``,
      `When:    ${when}`,
      `Join:    ${roomUrl}`,
      `Ref:     ${ref}`,
      ``,
      `Name:    ${data.name.trim()}`,
      `Store:   ${store}`,
      `Selling: ${industry}`,
      `Phone:   ${data.phone}`,
      ``,
      `On the call we open a real store on your domain, put three of your products up, place a test order, and price it out loud. Bring your product photos.`,
      ``,
      `— SuperShowroom by Viral Inbound`,
    ].join("\n");
    const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#14161A">
      <p style="font-weight:700;font-size:18px;margin:0 0 12px">You're booked for a 20-minute SuperShowroom demo.</p>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 16px 4px 0;color:#64748B">When</td><td style="font-weight:700">${when}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#64748B">Join</td><td><a href="${roomUrl}">${roomUrl}</a></td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#64748B">Ref</td><td style="font-weight:700">${ref}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#64748B">Store</td><td>${store}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#64748B">Selling</td><td>${industry}</td></tr>
      </table>
      <p style="margin-top:16px">On the call we open a real store on your domain, put three of your products up, place a test order, and price it out loud. Bring your product photos.</p>
      <p style="color:#64748B;margin-top:16px">— SuperShowroom by Viral Inbound</p>
    </div>`;
    const attachments = [{ filename: `supershowroom-demo-${ref}.ics`, content: ics, contentType: "text/calendar" }];

    const to: string[] = [];
    if (data.email) to.push(data.email);
    const notify = process.env.DEMO_NOTIFY_EMAIL || process.env.SMTP_FROM;
    if (notify) to.push(notify);

    if (to.length) {
      const r = await sendMail({ to, subject: `SuperShowroom demo — ${when} (${ref})`, text, html, attachments });
      emailed = r.sent;
    }
  }

  return NextResponse.json({
    ok: true,
    ref,
    roomUrl,
    provider: "jitsi",
    when,
    name: data.name.trim(),
    store,
    industry,
    emailed,
  });
}
