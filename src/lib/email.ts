import "server-only";

import nodemailer from "nodemailer";
import { SITE } from "@/lib/constants";

type EmailData = {
 to: string | string[];
 subject: string;
 text?: string;
 html?: string;
 replyTo?: string;
};

const fromName = (process.env.EMAIL_FROM_NAME ?? SITE.name).trim();
const fromAddress = (process.env.EMAIL_FROM ?? `${SITE.name} <${SITE.email}>`).trim();

async function transport() {
 const provider = (process.env.EMAIL_PROVIDER ?? "smtp").toLowerCase();

 if (provider === "resend") {
 const apiKey = process.env.RESEND_API_KEY;
 if (!apiKey) throw new Error("RESEND_API_KEY is not set.");
 return {
 send: async (mail: EmailData) => {
 const res = await fetch("https://api.resend.com/emails", {
 method: "POST",
 headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
 body: JSON.stringify({
 from: fromAddress,
 to: Array.isArray(mail.to) ? mail.to : [mail.to],
 subject: mail.subject,
 text: mail.text,
 html: mail.html,
 ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
 }),
 });
 const data = (await res.json().catch(() => ({}))) as { id?: string };
 if (!res.ok || !data.id) throw new Error(`Resend request failed (${res.status}).`);
 return { ok: true, messageId: data.id };
 },
 };
 }

// Accept either the EMAIL_* or the SMTP_* names: deployments in the wild use
  // both, and reading only one silently fell back to localhost:1025.
  const host = process.env.EMAIL_HOST ?? process.env.SMTP_HOST;
  const port = Number(process.env.EMAIL_PORT ?? process.env.SMTP_PORT ?? 587);
  const secure = (process.env.EMAIL_SECURE ?? process.env.SMTP_SECURE ?? (port === 465 ? "true" : "false")) === "true";
  const user = process.env.EMAIL_USER ?? process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS ?? process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS;

  if (!host) throw new Error("Neither EMAIL_HOST nor SMTP_HOST is configured.");

  const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  ...(user ? { auth: { user, pass: pass ?? "" } } : {}),
  });

 return {
 send: async (mail: EmailData) => {
 const info = await transporter.sendMail({
 from: fromName ? `"${fromName}" <${SITE.email}>` : fromAddress,
 to: mail.to,
 subject: mail.subject,
 text: mail.text,
 html: mail.html,
 ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
 });
 return { ok: true, messageId: info.messageId };
 },
 };
}

export type SendResult = { ok: boolean; messageId?: string; error?: string };

/**
 * Email is best-effort for the order flow: a mail outage must not roll back a
 * paid order. But the failure is reported back to the caller so it can be
 * recorded against the notification rather than disappearing.
 */
export async function sendEmail(mail: EmailData): Promise<SendResult> {
  const enabled = (process.env.EMAIL_ENABLED ?? "true") === "true";
  if (!enabled) return { ok: false, error: "Email delivery is disabled (EMAIL_ENABLED=false)." };

  try {
    const t = await transport();
    return (await t.send(mail)) as SendResult;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[email] failed to send "${mail.subject}": ${error}`);
    return { ok: false, error };
  }
}

function layout(raw: { subject: string; text: string; html: string }) {
 return {
 html: `<!doctype html><html><body style="margin:0;background:#F7F3EA;font-family:Arial,sans-serif;color:#000000;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0F5C4D;padding:20px 28px;">
<div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:2px;">${SITE.name}</div>
</td></tr>
<tr><td style="padding:28px;">${raw.html}</td></tr>
<tr><td style="padding:20px 28px;background:#F7F3EA;color:#6B6B6B;font-size:12px;">
<p style="margin:0 0 6px;">${SITE.name} - ${SITE.phone} - ${SITE.email}</p>
<p style="margin:0;">Thank you for shopping with us.</p>
</td></tr>
</table></td></tr></table></body></html>`,
 };
}

export async function sendOrderConfirmation(input: {
 to: string;
 orderNumber: string;
 total: string;
 items: { name: string; qty: number; lineTotal: string }[];
 statusUrl: string;
}) {
 const rows = input.items
 .map(
 (i) => `<tr><td style="padding:6px 0;">${i.name} x ${i.qty}</td><td style="padding:6px 0;text-align:right;">${i.lineTotal}</td></tr>`,
 )
 .join("");
 const subject = `Order ${input.orderNumber} received - thanks for your order`;
 const text = `Hi, your order ${input.orderNumber} has been received. Total: ${input.total}. Track it: ${input.statusUrl}`;
 const html = `
 <h2 style="margin:0 0 12px;">Thanks for your order!</h2>
 <p style="margin:0 0 16px;">We have received order <strong>${input.orderNumber}</strong> and are busy preparing your gift.</p>
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;">${rows}</table>
 <p style="text-align:right;font-weight:bold;border-top:1px solid #eee;padding-top:12px;">Total: ${input.total}</p>
 <a href="${input.statusUrl}" style="display:inline-block;margin-top:16px;background:#0F5C4D;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Track your order</a>
 `;
 return sendEmail({ to: input.to, subject, text, html: layout({ subject, text, html }).html });
}

export async function sendOrderStatusUpdate(input: { to: string; orderNumber: string; status: string; statusUrl: string }) {
 const subject = `Order ${input.orderNumber}: ${input.status}`;
 const text = `Your order ${input.orderNumber} is now: ${input.status}. View: ${input.statusUrl}`;
 const html = `<p style="margin:0 0 12px;">Good news - your order <strong>${input.orderNumber}</strong> has a status update:</p>
 <p style="font-size:18px;font-weight:bold;color:#0F5C4D;">${input.status}</p>
 <a href="${input.statusUrl}" style="display:inline-block;margin-top:16px;background:#0F5C4D;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Track your order</a>`;
 return sendEmail({ to: input.to, subject, text, html: layout({ subject, text, html }).html });
}

export async function sendPasswordReset(input: { to: string; resetUrl: string }) {
 const subject = `Reset your ${SITE.name} password`;
 const text = `Reset your password here: ${input.resetUrl}. This link expires in 30 minutes.`;
 const html = `<p style="margin:0 0 12px;">We received a request to reset your password. Click below to choose a new one.</p>
 <a href="${input.resetUrl}" style="display:inline-block;margin:8px 0 12px;background:#0F5C4D;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset password</a>
 <p style="font-size:12px;color:#888;">This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>`;
 return sendEmail({ to: input.to, subject, text, html: layout({ subject, text, html }).html });
}

export async function sendAdminPasswordReset(input: { to: string; resetUrl: string }) {
 const subject = `Admin password change for ${SITE.name}`;
 const text = `A password change was requested for your ${SITE.name} admin account. Change it here: ${input.resetUrl}. This link expires in 30 minutes. If you did not request this, you can ignore this email.`;
 const html = `<p style="margin:0 0 12px;">A password change was requested for your <strong>${SITE.name}</strong> admin account.</p>
 <p style="margin:0 0 16px;">Use the secure link below to choose a new password.</p>
 <a href="${input.resetUrl}" style="display:inline-block;margin:8px 0 12px;background:#0F5C4D;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Change admin password</a>
 <p style="font-size:12px;color:#888;">This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`;
 return sendEmail({ to: input.to, subject, text, html: layout({ subject, text, html }).html });
}

export async function sendOccasionReminder(input: { to: string; personName: string; occasion: string; date: string; shopUrl: string }) {
 const subject = `Don't forget ${input.personName}'s ${input.occasion} (${input.date})`;
 const text = `${input.personName}'s ${input.occasion} is on ${input.date}. Find a gift: ${input.shopUrl}`;
 const html = `<p style="margin:0 0 12px;"><strong>${input.personName}</strong>'s <strong>${input.occasion}</strong> is on <strong>${input.date}</strong>.</p>
 <p style="margin:0 0 16px;">Make it special with a gift that says more.</p>
 <a href="${input.shopUrl}" style="display:inline-block;background:#0F5C4D;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Shop gifts</a>`;
 return sendEmail({ to: input.to, subject, text, html: layout({ subject, text, html }).html });
}