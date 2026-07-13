import { format } from "date-fns";
import { ko } from "date-fns/locale";

/** Format a Date as yyyy-MM-dd (for <input type="date"> and API payloads). */
export function toDateInput(date: Date | null | undefined): string {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

/** Parse a yyyy-MM-dd string into a UTC-midnight Date (matches @db.Date storage). */
export function fromDateInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/** Today as a UTC-midnight Date, comparable with @db.Date columns. */
export function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function formatDateKo(date: Date | null | undefined): string {
  if (!date) return "-";
  return format(date, "yyyy.MM.dd (EEE)", { locale: ko });
}

export function formatDateShort(date: Date | null | undefined): string {
  if (!date) return "-";
  return format(date, "MM.dd");
}

export function formatMonthKo(date: Date): string {
  return format(date, "yyyy년 M월", { locale: ko });
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}
