import nodemailer from "nodemailer";

/**
 * Thin SMTP sender. Reads the same credentials you set in
 * Supabase Dashboard → Project Settings → Authentication → SMTP Settings.
 * If SMTP_HOST / SMTP_USER / SMTP_PASS are not set, `sendMail` is a no-op and
 * returns { sent: false } so callers can fall back to a client-side mailto.
 */

export type MailAttachment = { filename: string; content: string; contentType?: string };

let cached: nodemailer.Transporter | null | undefined;

function transporter(): nodemailer.Transporter | null {
  if (cached !== undefined) return cached;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    cached = null;
    return null;
  }
  const port = Number(process.env.SMTP_PORT || 587);
  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
    auth: { user, pass },
  });
  return cached;
}

export function mailerConfigured(): boolean {
  return transporter() !== null;
}

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: MailAttachment[];
}): Promise<{ sent: boolean; error?: string }> {
  const t = transporter();
  if (!t) return { sent: false, error: "SMTP not configured" };
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      attachments: opts.attachments,
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "send failed" };
  }
}
