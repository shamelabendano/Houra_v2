import { format, isSameDay, parseISO, subDays } from "date-fns";

/** 3938 -> "01:05:38" */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

/** 44460 -> "12:21" (hours:minutes, for compact stat cards) */
export function formatHoursMinutes(totalSec: number): string {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

/** 3938 -> "1h 05m 38s" */
export function formatElapsedHms(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${Math.floor(s / 3600)}h ${pad(Math.floor((s % 3600) / 60))}m ${pad(s % 60)}s`;
}

/** 100 + "PHP" -> "₱100.00" */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(amount);
}

/** ISO -> "07:08 PM" (local time) */
export function formatClock(iso: string): string {
  return format(new Date(iso), "hh:mm a");
}

/** "yyyy-MM-dd" -> "Today" | "Yesterday" | "Mon, Mar 17" */
export function formatDayLabel(day: string, now: Date = new Date()): string {
  const date = parseISO(day);
  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, subDays(now, 1))) return "Yesterday";
  return format(date, now.getFullYear() === date.getFullYear() ? "EEE, MMM d" : "EEE, MMM d, yyyy");
}

/** ISO <-> the value format of <input type="datetime-local"> (local time). */
export function toInputValue(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}
export function fromInputValue(value: string): string {
  return new Date(value).toISOString();
}
