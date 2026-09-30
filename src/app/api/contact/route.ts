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

 const html = `
 <h2>New message from ${d.name}</h2>
 <p><strong>Email:</strong> ${d.email}</p>
 <p><strong>Phone:</strong> ${d.phone || "-"}</p>
 <p><strong>Subject:</strong> ${d.subject}</p>
 <hr/>
 <p>${d.message.replace(/\n/g, "<br/>")}</p>
 `;

 await sendEmail({
 to: SITE.email,
 subject: `[ZED Contact] ${d.subject}`,
 html,
 replyTo: d.email,
 });

 return NextResponse.json({ ok: true });
}