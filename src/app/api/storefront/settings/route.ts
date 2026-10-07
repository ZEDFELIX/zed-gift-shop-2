import { NextResponse } from "next/server";
import { getSetting } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export async function GET() {
 const whatsappNumber = await getSetting("whatsappNumber");
 return NextResponse.json({
  whatsappNumber: typeof whatsappNumber === "string" ? whatsappNumber : "254711436169",
 });
}
