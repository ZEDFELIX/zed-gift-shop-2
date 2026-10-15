import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api";
import { setSetting, type SettingValue } from "@/lib/data/settings";
import { z } from "zod";

const schema = z.object({
 settings: z.record(z.string(), z.unknown()).refine((o) => Object.keys(o).length > 0, "Empty settings"),
});

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  let admin;
  try {
    admin = await requirePermission("settings.manage");
  } catch {
    return NextResponse.json({ error: "Only the store owner can change settings." }, { status: 403 });
  }

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