import { format, isToday, isYesterday, parseISO } from "date-fns";

/** 3938 -> "01:05:38" */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

/** ISO -> "07:08 PM" (local time) */
export function formatClock(iso: string): string {
  return format(new Date(iso), "hh:mm a");
}

/** "yyyy-MM-dd" -> "Today" | "Yesterday" | "Mon, Mar 17" */
export function formatDayLabel(day: string, now: Date = new Date()): string {
  const date = parseISO(day);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, now.getFullYear() === date.getFullYear() ? "EEE, MMM d" : "EEE, MMM d, yyyy");
}

/** ISO <-> the value format of <input type="datetime-local"> (local time). */
export function toInputValue(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}
export function fromInputValue(value: string): string {
  return new Date(value).toISOString();
}
