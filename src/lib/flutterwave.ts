import "server-only";

const FLUTTERWAVE_ENV = process.env.FLUTTERWAVE_ENV ?? "sandbox";
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY ?? "";
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY ?? "";
const FLUTTERWAVE_ENCRYPTION_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY ?? "";
const FLUTTERWAVE_CALLBACK_URL = process.env.FLUTTERWAVE_CALLBACK_URL ?? "";

const BASE_URL = FLUTTERWAVE_ENV === "production"
 ? "https://api.flutterwave.com/v3"
 : "https://sandbox.flutterwave.co.ke/v3";

export function flutterwaveConfigured(): boolean {
 return Boolean(FLUTTERWAVE_SECRET_KEY);
}

export function flutterwaveConfigError(): string {
 if (!FLUTTERWAVE_SECRET_KEY) return "Flutterwave secret key is not configured.";
 return "";
}

export function flutterwaveWebhookConfigured(): boolean {
 return Boolean(FLUTTERWAVE_ENCRYPTION_KEY);
}

export function flutterwaveWebhookConfigError(): string {
 if (!FLUTTERWAVE_ENCRYPTION_KEY) return "Flutterwave encryption key is not configured.";
 return "";
}

export type FlutterwaveChargePayload = {
 tx_ref: string;
 amount: number;
 currency: string;
 payment_options: string;
 phone_number?: string;
 email: string;
 first_name: string;
 last_name: string;
 meta?: Record<string, string>;
};

export type FlutterwaveChargeResult = {
 ok: boolean;
 data?: {
 id: number;
 tx_ref: string;
 status: string;
 authorization_url: string;
 link: string;
 card_last4?: string;
 };
 error?: string;
};

export async function initiateFlutterwaveCharge(
 payload: FlutterwaveChargePayload
): Promise<FlutterwaveChargeResult> {
 if (!flutterwaveConfigured()) {
 return { ok: false, error: flutterwaveConfigError() || "Flutterwave is not configured." };
 }

 try {
 const res = await fetch(`${BASE_URL}/payments`, {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
 },
 body: JSON.stringify(payload),
 cache: "no-store",
 });

 const data = (await res.json().catch(() => ({}))) as {
 data?: {
 id: number;
 tx_ref: string;
 status: string;
 authorization_url: string;
 link: string;
 card_last4?: string;
 };
 message?: string;
 };

 if (!res.ok || !data.data) {
 return { ok: false, error: data.message ?? `Flutterwave request failed (${res.status}).` };
 }

 return { ok: true, data: data.data };
 } catch (err) {
 return { ok: false, error: err instanceof Error ? err.message : "Could not reach Flutterwave." };
 }
}

export async function verifyFlutterwaveTransaction(transactionId: string | number) {
 try {
 const res = await fetch(`${BASE_URL}/transactions/${encodeURIComponent(String(transactionId))}/verify`, {
 method: "GET",
 headers: {
 Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
 },
 cache: "no-store",
 });

 const data = (await res.json().catch(() => ({}))) as {
 data?: {
 id: number;
 tx_ref: string;
 status: string;
 amount: number;
 currency: string;
 payment_type: string;
 channel: string;
 ip: string;
 created_at: string;
 };
 status?: string;
 };

 if (!res.ok || !data.data) {
 return { ok: false, error: "Verification failed." };
 }

 return {
 ok: true,
 data: data.data,
 status: data.data.status === "successful" ? "SUCCESS" : data.data.status?.toUpperCase() ?? "PENDING",
 };
 } catch (err) {
 return { ok: false, error: err instanceof Error ? err.message : "Verification failed." };
 }
}
