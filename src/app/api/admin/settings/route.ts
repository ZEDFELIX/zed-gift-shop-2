import { NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { setSetting, type SettingValue } from "@/lib/data/settings";
import { z } from "zod";

const schema = z.object({
 settings: z.record(z.string(), z.unknown()).refine((o) => Object.keys(o).length > 0, "Empty settings"),
});

export const runtime = "nodejs";

export async function PATCH(req: Request) {
 try {
 await requireAdmin();
 } catch {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }
 const admin = await getCurrentUser();

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
 const parsed = schema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the settings." }, { status: 400 });
 }

 for (const [key, value] of Object.entries(parsed.data.settings)) {
 await setSetting(key, value as SettingValue, admin?.email);
 }

 return NextResponse.json({ ok: true });
}