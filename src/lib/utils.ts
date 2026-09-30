import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
 return clsx(inputs);
}

export function formatKES(amount: number): string {
  return `KShs${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(Math.round(amount))}`;
}

export function formatKESShort(amount: number): string {
  if (amount >= 1_000_000) return `KShs ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KShs ${(amount / 1_000).toFixed(1)}K`;
  return `KShs ${amount}`;
}

export function formatDate(date: Date | string): string {
 const d = typeof date === "string" ? new Date(date) : date;
 return new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export function formatDateTime(date: Date | string): string {
 const d = typeof date === "string" ? new Date(date) : date;
 return new Intl.DateTimeFormat("en-KE", {
 day: "numeric", month: "short", year: "numeric",
 hour: "2-digit", minute: "2-digit",
 }).format(d);
}

export function discountPercent(price: number, compareAt: number | null | undefined): number | null {
 if (!compareAt || compareAt <= price) return null;
 return Math.round(((compareAt - price) / compareAt) * 100);
}

export function slugify(value: string): string {
 return value
 .toLowerCase()
 .trim()
 .replace(/[^\w\s-]/g, "")
 .replace(/[\s_-]+/g, "-")
 .replace(/^-+|-+$/g, "");
}

export function generateOrderNumber(): string {
 const stamp = Date.now().toString(36).toUpperCase().slice(-5);
 const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
 return `ZED-${stamp}${rand}`;
}

export function maskPhone(value: string): string {
 const digits = value.replace(/\D/g, "");
 if (digits.length < 4) return value;
 return `+${digits.slice(0, digits.length - 4)}${"-".repeat(Math.min(4, digits.length))}`;
}

export function formatPhoneIntl(value: string): string {
 const digits = value.replace(/\D/g, "");
 if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1);
 if (digits.startsWith("254") && digits.length === 12) return digits;
 if (digits.startsWith("7") && digits.length === 9) return "254" + digits;
 return digits;
}

export function utcNow(): Date {
 return new Date();
}

export function isToday(date: Date | string): boolean {
 const d = typeof date === "string" ? new Date(date) : date;
 const now = new Date();
 return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function validateEmail(email: string): boolean {
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateKenyanPhone(phone: string): boolean {
 const digits = phone.replace(/\D/g, "");
 return /^(?:254|0)?(7|1)[0-9]{8}$/.test(digits);
}

export function relativeTime(date: Date | string): string {
 const d = typeof date === "string" ? new Date(date) : date;
 const diff = Date.now() - d.getTime();
 const mins = Math.floor(diff / 60000);
 if (mins < 1) return "just now";
 if (mins < 60) return `${mins}m ago`;
 const hrs = Math.floor(mins / 60);
 if (hrs < 24) return `${hrs}h ago`;
 const days = Math.floor(hrs / 24);
 if (days < 30) return `${days}d ago`;
 return formatDate(d);
}

export async function sleep(ms: number) {
 return new Promise((r) => setTimeout(r, ms));
}