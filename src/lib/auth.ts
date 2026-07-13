import { SignJWT, jwtVerify } from "jose";
import { createHash, timingSafeEqual, randomBytes } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "ros_session";
const SESSION_DAYS = 30;

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.OWNER_PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ sub: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secretKey());
    return true;
  } catch {
    return false;
  }
}

export async function getSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

// ----- API tokens (sync script) -----

export function generateApiToken(): { token: string; hash: string } {
  const token = `ros_${randomBytes(24).toString("hex")}`;
  return { token, hash: hashApiToken(token) };
}

export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
