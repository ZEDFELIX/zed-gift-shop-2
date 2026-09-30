import { NextResponse } from "next/server";
import { getDeliveryOptions } from "@/lib/data/delivery";

export async function GET(req: Request) {
 const url = new URL(req.url);
 const county = url.searchParams.get("county")?.trim();
 if (!county) {
 return NextResponse.json({ error: "Missing county." }, { status: 400 });
 }
 const options = await getDeliveryOptions(county);
 return NextResponse.json({ options });
}