import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type DocOrderItem = {
  name: string;
  sku: string | null;
  price: number;
  quantity: number;
  giftWrapPrice: number;
};

export type DocPayment = {
  provider: string;
  status: string;
  amount: number;
  mpesaReceipt: string | null;
  transactionCode: string | null;
  txRef: string | null;
  bankReference: string | null;
  completedAt: Date | null;
  transactionDate: Date | null;
  createdAt: Date;
};

export type DocOrder = {
  orderNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  building: string | null;
  apartment: string | null;
  town: string;
  county: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode: string | null;
  orderStatus: string;
  paymentStatus: string;
  createdAt: Date;
  items: DocOrderItem[];
  payments: DocPayment[];
};

export type DocBusiness = {
  name: string;
  phone: string;
  email: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
};

export function kes(amount: number): string {
  return `KES ${Math.round(amount).toLocaleString("en-KE")}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 0.898, g: 0.224, b: 0.498 };
  const n = parseInt(m[1], 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

function dateStr(d: Date): string {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

type Ctx = {
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  primary: { r: number; g: number; b: number };
  ink: { r: number; g: number; b: number };
  grey: { r: number; g: number; b: number };
  page: PDFPage;
  y: number;
};

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.y = PAGE_H - 56;
}

function ensure(ctx: Ctx, needed: number) {
  if (ctx.y - needed < MARGIN) newPage(ctx);
}

function text(ctx: Ctx, str: string, x: number, size: number, opts?: { bold?: boolean; color?: { r: number; g: number; b: number }; align?: "left" | "right"; maxWidth?: number }) {
  const font = opts?.bold ? ctx.bold : ctx.font;
  const color = opts?.color ? rgb(opts.color.r, opts.color.g, opts.color.b) : rgb(ctx.ink.r, ctx.ink.g, ctx.ink.b);
  let s = str;
  if (opts?.maxWidth) {
    while (s.length > 4 && font.widthOfTextAtSize(s, size) > opts.maxWidth) s = s.slice(0, -2);
    if (s !== str) s = `${s.trim()}…`;
  }
  const w = font.widthOfTextAtSize(s, size);
  const dx = opts?.align === "right" ? x - w : x;
  ctx.page.drawText(s, { x: dx, y: ctx.y, size, font, color });
}

function rule(ctx: Ctx) {
  ctx.y -= 6;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 1,
    color: rgb(0.9, 0.88, 0.9),
  });
  ctx.y -= 14;
}

function header(ctx: Ctx, biz: DocBusiness, kind: "INVOICE" | "RECEIPT", docNo: string, orderNo: string, issued: Date) {
  text(ctx, biz.name.toUpperCase(), MARGIN, 20, { bold: true, color: ctx.primary, maxWidth: PAGE_W - MARGIN * 2 - 130 });
  text(ctx, kind === "INVOICE" ? "TAX INVOICE" : "PAYMENT RECEIPT", PAGE_W - MARGIN, 15, { bold: true, align: "right" });
  ctx.y -= 18;
  text(ctx, `${biz.phone} | ${biz.email}`, MARGIN, 9, { color: ctx.grey, maxWidth: 340 });
  text(ctx, docNo, PAGE_W - MARGIN, 10, { bold: true, align: "right" });
  ctx.y -= 13;
  text(ctx, biz.address, MARGIN, 9, { color: ctx.grey, maxWidth: 340 });
  text(ctx, `Order ${orderNo} | Issued ${dateStr(issued)}`, PAGE_W - MARGIN, 9, { align: "right", color: ctx.grey });
  ctx.y -= 6;
  rule(ctx);
}

function billTo(ctx: Ctx, order: DocOrder) {
  text(ctx, "BILL TO", MARGIN, 9, { bold: true, color: ctx.grey });
  ctx.y -= 14;
  text(ctx, order.name, MARGIN, 12, { bold: true, maxWidth: 300 });
  ctx.y -= 15;
  const lines = [
    [order.address, order.building ? `, ${order.building}` : "", order.apartment ? `, ${order.apartment}` : ""].join(""),
    `${order.town}, ${order.county}`,
    order.phone,
    order.email,
  ];
  for (const line of lines) {
    if (!line.trim()) continue;
    text(ctx, line, MARGIN, 10, { color: ctx.grey, maxWidth: PAGE_W - MARGIN * 2 });
    ctx.y -= 13;
  }
  ctx.y -= 8;
}

function itemsTable(ctx: Ctx, order: DocOrder) {
  const colQty = PAGE_W - MARGIN - 170;
  const colUnit = PAGE_W - MARGIN - 95;
  const colAmt = PAGE_W - MARGIN;
  text(ctx, "ITEM", MARGIN, 9, { bold: true, color: ctx.grey });
  text(ctx, "QTY", colQty, 9, { bold: true, color: ctx.grey, align: "right" });
  text(ctx, "UNIT", colUnit, 9, { bold: true, color: ctx.grey, align: "right" });
  text(ctx, "AMOUNT", colAmt, 9, { bold: true, color: ctx.grey, align: "right" });
  ctx.y -= 6;
  rule(ctx);
  for (const item of order.items) {
    ensure(ctx, 30);
    const lineTotal = (item.price + item.giftWrapPrice) * item.quantity;
    const label = item.sku ? `${item.name} (${item.sku})` : item.name;
    text(ctx, label, MARGIN, 10, { bold: true, maxWidth: colQty - MARGIN - 12 });
    text(ctx, String(item.quantity), colQty, 10, { align: "right" });
    text(ctx, kes(item.price + item.giftWrapPrice), colUnit, 10, { align: "right" });
    text(ctx, kes(lineTotal), colAmt, 10, { bold: true, align: "right" });
    ctx.y -= 15;
  }
  ctx.y -= 4;
}

function totals(ctx: Ctx, order: DocOrder) {
  const labelX = PAGE_W - MARGIN - 170;
  const valX = PAGE_W - MARGIN;
  const row = (label: string, value: string, bold = false) => {
    ensure(ctx, 20);
    text(ctx, label, labelX, 10, { bold, color: bold ? ctx.ink : ctx.grey });
    text(ctx, value, valX, 10, { bold, align: "right" });
    ctx.y -= 15;
  };
  row("Subtotal", kes(order.subtotal));
  if (order.discount > 0) row(`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, `-${kes(order.discount)}`);
  row("Delivery", order.deliveryFee > 0 ? kes(order.deliveryFee) : "—");
  ctx.y -= 2;
  ensure(ctx, 30);
  ctx.page.drawRectangle({
    x: labelX - 12,
    y: ctx.y - 8,
    width: 182,
    height: 26,
    color: rgb(ctx.primary.r, ctx.primary.g, ctx.primary.b),
  });
  text(ctx, "TOTAL", labelX, 11, { bold: true, color: { r: 1, g: 1, b: 1 } });
  const totalStr = kes(order.total);
  const w = ctx.bold.widthOfTextAtSize(totalStr, 11);
  text(ctx, totalStr, valX, 11, { bold: true, color: { r: 1, g: 1, b: 1 } });
  void w;
  ctx.y -= 26;
}

function footer(ctx: Ctx, lines: string[]) {
  ctx.y -= 6;
  rule(ctx);
  for (const line of lines) {
    text(ctx, line, MARGIN, 9, { color: ctx.grey, maxWidth: PAGE_W - MARGIN * 2 });
    ctx.y -= 13;
  }
}

async function setup(biz: DocBusiness) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const primary = hexToRgb(biz.primaryColor);
  const secondary = hexToRgb(biz.secondaryColor);
  const ctx: Ctx = {
    doc,
    font,
    bold,
    primary,
    ink: { r: 0.03, g: 0.07, b: 0.12 },
    grey: { r: 0.35, g: 0.38, b: 0.42 },
    page: doc.addPage([PAGE_W, PAGE_H]),
    y: PAGE_H - 56,
  };
  void secondary;
  return ctx;
}

export function invoiceNumber(orderNumber: string): string {
  return `INV-${orderNumber}`;
}

export function receiptNumber(orderNumber: string): string {
  return `RCP-${orderNumber}`;
}

export async function buildInvoicePdf(order: DocOrder, biz: DocBusiness): Promise<Uint8Array> {
  const ctx = await setup(biz);
  header(ctx, biz, "INVOICE", invoiceNumber(order.orderNumber), order.orderNumber, order.createdAt);
  billTo(ctx, order);
  itemsTable(ctx, order);
  totals(ctx, order);
  const paidTotal = amountPaid(order);
  if (order.payments.length > 0) {
    paymentHistory(ctx, order.payments);
    ensure(ctx, 40);
    text(ctx, "Amount paid", PAGE_W - MARGIN - 170, 10, { color: ctx.grey });
    text(ctx, kes(paidTotal), PAGE_W - MARGIN, 10, { bold: true, align: "right" });
    ctx.y -= 15;
    ensure(ctx, 20);
    text(ctx, "Balance due", PAGE_W - MARGIN - 170, 10, { color: ctx.grey });
    text(ctx, order.total - paidTotal > 0 ? kes(order.total - paidTotal) : "Cleared", PAGE_W - MARGIN, 10, { bold: true, align: "right" });
    ctx.y -= 15;
  }
  footer(ctx, [
    `Payment status: ${order.paymentStatus === "SUCCESSFUL" ? "PAID" : "PENDING — pay via M-PESA to confirm this order."}`,
    "Thank you for shopping with us. For help, reply with your order number on WhatsApp or email.",
  ]);
  return ctx.doc.save();
}

export function paidPayments(order: DocOrder): DocPayment[] {
  return order.payments.filter((p) => p.status === "SUCCESSFUL");
}

export function amountPaid(order: DocOrder): number {
  return paidPayments(order).reduce((sum, p) => sum + p.amount, 0);
}

export function paymentLabel(provider: string): string {
  if (provider === "FLUTTERWAVE") return "Card (Flutterwave)";
  if (provider === "COD") return "Cash on delivery";
  if (provider === "BANK_TRANSFER") return "Bank transfer";
  return "M-PESA";
}

export function paymentDate(p: DocPayment): Date {
  return new Date(p.completedAt ?? p.transactionDate ?? p.createdAt);
}

export function paymentReference(p: DocPayment): string {
  return p.mpesaReceipt ?? p.transactionCode ?? p.txRef ?? p.bankReference ?? "—";
}

function paymentHistory(ctx: Ctx, payments: DocPayment[]) {
  if (payments.length === 0) return;
  ensure(ctx, 40);
  text(ctx, "PAYMENT HISTORY", MARGIN, 9, { bold: true, color: ctx.grey });
  ctx.y -= 14;
  const sorted = [...payments].sort(
    (a, b) => paymentDate(a).getTime() - paymentDate(b).getTime(),
  );
  for (const p of sorted) {
    ensure(ctx, 32);
    text(ctx, `${dateStr(paymentDate(p))}  ·  ${paymentLabel(p.provider)}  ·  ${kes(p.amount)}  ·  ${p.status}`, MARGIN, 10, { maxWidth: PAGE_W - MARGIN * 2 });
    ctx.y -= 14;
    const ref = paymentReference(p);
    if (ref !== "—") {
      text(ctx, `Ref: ${ref}`, MARGIN + 12, 9, { color: ctx.grey, maxWidth: PAGE_W - MARGIN * 2 - 12 });
      ctx.y -= 12;
    }
  }
  ctx.y -= 4;
}

export async function buildReceiptPdf(order: DocOrder, biz: DocBusiness): Promise<Uint8Array> {
  const paid = paidPayments(order);
  const paidTotal = amountPaid(order);
  const latest = paid[paid.length - 1];
  const paidAt = latest?.completedAt ?? latest?.transactionDate ?? order.createdAt;
  const balance = Math.max(0, order.total - paidTotal);

  const ctx = await setup(biz);
  header(ctx, biz, "RECEIPT", receiptNumber(order.orderNumber), order.orderNumber, new Date(paidAt));
  billTo(ctx, order);

  ensure(ctx, 60);
  text(ctx, "PAYMENT DETAILS", MARGIN, 9, { bold: true, color: ctx.grey });
  ctx.y -= 14;
  const rows: Array<[string, string]> = [
    ["Amount paid", kes(paidTotal)],
    ["Payment method", latest ? paymentLabel(latest.provider) : "—"],
    ["Reference", latest ? paymentReference(latest) : "—"],
    ["Date paid", dateStr(new Date(paidAt))],
    ["Order total", kes(order.total)],
    ["Balance due", balance > 0 ? kes(balance) : "Cleared"],
  ];
  for (const [label, value] of rows) {
    ensure(ctx, 20);
    text(ctx, label, MARGIN, 10, { color: ctx.grey });
    text(ctx, value, PAGE_W - MARGIN, 10, { bold: true, align: "right" });
    ctx.y -= 15;
  }

  paymentHistory(ctx, order.payments);

  footer(ctx, [
    `Linked invoice: ${invoiceNumber(order.orderNumber)}.`,
    "This receipt confirms a verified payment. Thank you for shopping with us.",
  ]);
  return ctx.doc.save();
}
