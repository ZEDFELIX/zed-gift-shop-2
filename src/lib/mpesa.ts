import "server-only";

import { SITE } from "@/lib/constants";

const MPESA_ENV = process.env.MPESA_ENV ?? "sandbox";
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY ?? "";
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET ?? "";
const MPESA_PASSKEY = process.env.MPESA_PASSKEY ?? "";
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE ?? "";
const MPESA_BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORTCODE ?? MPESA_SHORTCODE;
const MPESA_TRANSACTION_TYPE = process.env.MPESA_TRANSACTION_TYPE ?? "CustomerPayBillOnline";
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL ?? "";
const MPESA_WEBHOOK_SECRET = process.env.MPESA_WEBHOOK_SECRET ?? "";

const BASE_URL =
 MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

export function mpesaConfigured(): boolean {
 return Boolean(
  MPESA_CONSUMER_KEY &&
  MPESA_CONSUMER_SECRET &&
  MPESA_PASSKEY &&
  MPESA_SHORTCODE &&
  MPESA_CALLBACK_URL,
);
}

export function mpesaConfigError(): string {
 if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) return "M-PESA consumer credentials are not configured.";
 if (!MPESA_PASSKEY) return "M-PESA passkey is not configured.";
 if (!MPESA_SHORTCODE) return "M-PESA shortcode is not configured.";
 if (!MPESA_CALLBACK_URL) return "M-PESA callback URL is not configured.";
 return "";
}

class MpesaError extends Error {
 code: string;
 constructor(code: string, message: string) {
 super(message);
 this.code = code;
 }
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function base64encode(value: string): Promise<string> {
 return Buffer.from(value).toString("base64");
}

async function getAccessToken(): Promise<string> {
 if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;
 if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
 throw new MpesaError("NOT_CONFIGURED", mpesaConfigError());
 }
 const auth = await base64encode(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`);
 const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
 method: "GET",
 headers: { Authorization: `Basic ${auth}` },
 cache: "no-store",
 });
 const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
 if (!res.ok || !data.access_token) {
 throw new MpesaError("TOKEN_FAILED", `M-PESA token request failed (${res.status}).`);
 }
 cachedToken = {
 token: data.access_token,
 expiresAt: Date.now() + ((data.expires_in ?? 3300) - 300) * 1000,
 };
 return cachedToken.token;
}

function mpesaTimestamp(): string {
 const now = new Date();
 const pad = (n: number) => String(n).padStart(2, "0");
 return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export type StkPushResult = {
 ok: boolean;
 checkoutRequestId?: string;
 merchantRequestId?: string;
 responseCode?: string;
 responseDescription?: string;
 customerMessage?: string;
 error?: string;
};

export async function stkPush(input: {
 phone: string; // 254XXXXXXXXX
 amount: number; // whole KES
 accountReference: string; // order number
 transactionDesc?: string;
}): Promise<StkPushResult> {
 if (!mpesaConfigured()) {
 return { ok: false, error: mpesaConfigError() || "M-PESA is not configured." };
 }
 const timestamp = mpesaTimestamp();
 const digest = await base64encode(
  `${MPESA_BUSINESS_SHORTCODE}${MPESA_PASSKEY}${timestamp}`,
 );
 const body = {
 BusinessShortCode: MPESA_BUSINESS_SHORTCODE,
 Password: digest,
 Timestamp: timestamp,
 TransactionType: MPESA_TRANSACTION_TYPE,
 Amount: Math.round(input.amount),
 PartyA: input.phone,
 PartyB: MPESA_SHORTCODE,
 PhoneNumber: input.phone,
 CallBackURL: MPESA_CALLBACK_URL,
 AccountReference: input.accountReference.slice(0, 12),
 TransactionDesc: (input.transactionDesc ?? `${SITE.name} order`).slice(0, 13),
 };

 try {
 const token = await getAccessToken();
 const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
 method: "POST",
 headers: {
 Authorization: `Bearer ${token}`,
 "Content-Type": "application/json",
 },
 body: JSON.stringify(body),
 cache: "no-store",
 });
 const data = (await res.json().catch(() => ({}))) as {
 CheckoutRequestID?: string;
 MerchantRequestID?: string;
 ResponseCode?: string;
 ResponseDescription?: string;
 CustomerMessage?: string;
 errorCode?: string;
 errorMessage?: string;
 };
 if (!res.ok) {
 return { ok: false, error: data.errorMessage ?? `M-PESA request failed (${res.status}).` };
 }
 if (data.ResponseCode && data.ResponseCode !== "0") {
 return { ok: false, error: data.CustomerMessage ?? data.ResponseDescription ?? "M-PESA rejected the request." };
 }
 return {
 ok: true,
 checkoutRequestId: data.CheckoutRequestID,
 merchantRequestId: data.MerchantRequestID,
 responseCode: data.ResponseCode,
 responseDescription: data.ResponseDescription,
 customerMessage: data.CustomerMessage,
 };
 } catch (err) {
 return {
 ok: false,
 error: err instanceof MpesaError ? err.message : "Could not reach M-PESA right now. Please try again.",
 };
 }
}

export type StkQueryResult = {
  ok: boolean;
  resultCode?: string;
  resultDescription?: string;
  amount?: number;
  mpesaReceipt?: string;
  transactionDate?: Date;
  phone?: string;
  error?: string;
};

/**
 * Authoritative status lookup against Daraja. The STK callback body is a
 * notification only, so payment state must be decided from this response.
 */
export async function queryStkStatus(input: { checkoutRequestId: string; phone?: string }): Promise<StkQueryResult> {
  if (!mpesaConfigured()) return { ok: false, error: "M-PESA is not configured." };
  const timestamp = mpesaTimestamp();
  const password = await base64encode(`${MPESA_BUSINESS_SHORTCODE}${MPESA_PASSKEY}${timestamp}`);
  const body = {
    BusinessShortCode: MPESA_BUSINESS_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: input.checkoutRequestId,
  };
  try {
    const token = await getAccessToken();
    const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      ResultCode?: string | number;
      ResultDesc?: string;
      ResponseCode?: string;
      CallbackMetadata?: { Item?: { Name: string; Value?: string | number }[] };
    };
    if (!res.ok) return { ok: false, error: `M-PESA status query failed (${res.status}).` };

    const meta = Object.fromEntries(
      (data.CallbackMetadata?.Item ?? []).map((i) => [i.Name, i.Value]),
    ) as Record<string, string | number | undefined>;

    return {
      ok: String(data.ResultCode ?? data.ResponseCode ?? "") === "0",
      resultCode: String(data.ResultCode ?? data.ResponseCode ?? ""),
      resultDescription: data.ResultDesc,
      amount: meta.Amount != null ? Number(meta.Amount) : undefined,
      mpesaReceipt: meta.MpesaReceiptNumber != null ? String(meta.MpesaReceiptNumber) : undefined,
      transactionDate: meta.TransactionDate != null ? parseMpesaDate(meta.TransactionDate) : undefined,
      phone: meta.PhoneNumber != null ? String(meta.PhoneNumber) : undefined,
    };
  } catch (err) {
    return { ok: false, error: err instanceof MpesaError ? err.message : "Could not reach M-PESA right now." };
  }
}

function parseMpesaDate(raw: string | number | undefined): Date {
  // Daraja sends TransactionDate as YYYYMMDDHHMMSS, not a unix timestamp.
  const s = String(raw ?? "").trim();
  if (/^\d{14}$/.test(s)) {
    const dt = new Date(
      Number(s.slice(0, 4)),
      Number(s.slice(4, 6)) - 1,
      Number(s.slice(6, 8)),
      Number(s.slice(8, 10)),
      Number(s.slice(10, 12)),
      Number(s.slice(12, 14)),
    );
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  const epoch = Number(s);
  if (s && !Number.isNaN(epoch)) {
    const dt = new Date(epoch * 1000);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return new Date();
}

export function webhookSecretMatches(value: string | null | undefined): boolean {
 if (!MPESA_WEBHOOK_SECRET) return true;
 return value === MPESA_WEBHOOK_SECRET;
}

export { MpesaError };