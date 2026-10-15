import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { SITE } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(req: Request) {
 const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
 const rl = await rateLimit(`contact:${ip}`, RATE_LIMITS.contact);
 if (!rl.ok) {
 return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
 }

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }

 const parsed = contactSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your message." }, { status: 400 });
 }
  const d = parsed.data;

  const esc = (v: string) =>
    v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const isQuote = Boolean(d.company?.trim() || d.quantity);
  const subject = isQuote ? `[Quote] ${d.company?.trim() || d.name} - ${d.subject}` : `[ZED Contact] ${d.subject}`;

  const html = `
  <h2>New ${isQuote ? "bulk quote request" : "message"} from ${esc(d.name)}</h2>
  <p><strong>Email:</strong> ${esc(d.email)}</p>
  <p><strong>Phone:</strong> ${esc(d.phone || "-")}</p>
  ${d.company?.trim() ? `<p><strong>Company:</strong> ${esc(d.company.trim())}</p>` : ""}
  ${d.quantity ? `<p><strong>Quantity:</strong> ${d.quantity}</p>` : ""}
  ${d.budget?.trim() ? `<p><strong>Budget:</strong> ${esc(d.budget.trim())}</p>` : ""}
  ${d.deadline?.trim() ? `<p><strong>Deadline:</strong> ${esc(d.deadline.trim())}</p>` : ""}
  <p><strong>Subject:</strong> ${esc(d.subject)}</p>
  <hr/>
  <p>${esc(d.message).replace(/\n/g, "<br/>")}</p>
  `;

  await sendEmail({
  to: SITE.email,
  subject,
  html,
  replyTo: d.email,
  });

 return NextResponse.json({ ok: true });
}