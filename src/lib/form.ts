import { fromDateInput } from "./dates";

/** FormData accessors shared by server actions. */

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function strOrNull(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

export function dateOrNull(fd: FormData, key: string): Date | null {
  return fromDateInput(str(fd, key));
}

export function intOr(fd: FormData, key: string, fallback: number): number {
  const v = Number.parseInt(str(fd, key), 10);
  return Number.isFinite(v) ? v : fallback;
}

export function intOrNull(fd: FormData, key: string): number | null {
  const v = Number.parseInt(str(fd, key), 10);
  return Number.isFinite(v) ? v : null;
}

export function floatOrNull(fd: FormData, key: string): number | null {
  const v = Number.parseFloat(str(fd, key));
  return Number.isFinite(v) ? v : null;
}

export function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on" || fd.get(key) === "true";
}

/** "a, b, c" -> ["a","b","c"] */
export function tags(fd: FormData, key: string): string[] {
  return str(fd, key)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
