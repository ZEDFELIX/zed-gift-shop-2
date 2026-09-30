import { NextResponse } from "next/server";
import { z } from "zod";
import { removeCartItem, setSavedForLater, setItemPersonalization, setItemGiftWrap, setItemGiftMessage, updateCartItemQuantity, getCartForApi } from "@/lib/cart";

const paramsSchema = z.object({ id: z.string().min(1) });

const patchSchema = z.discriminatedUnion("action", [
 z.object({ action: z.literal("setQuantity"), quantity: z.number().int().min(1).max(99) }),
 z.object({ action: z.literal("save"), saved: z.boolean() }),
 z.object({
 action: z.literal("personalization"),
 personalization: z.record(z.string(), z.unknown()).nullable(),
 }),
 z.object({
 action: z.literal("giftWrap"),
 giftWrap: z.object({ id: z.string(), name: z.string(), price: z.number().int() }).nullable(),
 }),
 z.object({
 action: z.literal("giftMessage"),
 giftMessage: z
 .object({
 message: z.string().max(500),
 from: z.string().max(80).optional(),
 to: z.string().max(80).optional(),
 })
 .nullable(),
 }),
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = paramsSchema.parse(await params);
 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }

 const parsed = patchSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json(
 { error: parsed.error.issues[0]?.message ?? "Invalid request." },
 { status: 400 },
 );
 }

 type MutationResult = { ok: boolean; error?: string; cart?: unknown };
 let result: MutationResult = { ok: false };
 switch (parsed.data.action) {
 case "setQuantity":
 result = await updateCartItemQuantity(id, parsed.data.quantity);
 break;
 case "save":
 result = await setSavedForLater(id, parsed.data.saved);
 break;
 case "personalization":
 result = await setItemPersonalization(id, parsed.data.personalization);
 break;
 case "giftWrap":
 result = await setItemGiftWrap(id, parsed.data.giftWrap);
 break;
 case "giftMessage":
 result = await setItemGiftMessage(id, parsed.data.giftMessage);
 break;
 }

 if (!result.ok) {
 return NextResponse.json({ error: result.error ?? "Could not update cart." }, { status: 400 });
 }
 return NextResponse.json({ ok: true, cart: await getCartForApi() });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = paramsSchema.parse(await params);
 try {
 await removeCartItem(id);
 return NextResponse.json({ ok: true, cart: await getCartForApi() });
 } catch (err) {
 console.error("DELETE /api/cart/items/[id]", err);
 return NextResponse.json({ error: "Could not remove item." }, { status: 500 });
 }
}