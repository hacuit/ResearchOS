export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

/** Fetch with retry – handles Render free-tier cold-start 503s and CORS failures */
export async function fetchRetry(
  input: RequestInfo,
  init?: RequestInit,
  retries = 3,
  delayMs = 2000,
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(input, init);
      if (res.status === 503 && i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      return res;
    } catch {
      if (i >= retries - 1) throw new Error(`Network error after ${retries} retries: ${String(input)}`);
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw new Error("fetchRetry exhausted");
}
