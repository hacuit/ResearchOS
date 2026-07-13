import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedVenues } from "@/lib/seed-data";

// Temporary bootstrap endpoint (session-protected by middleware).
// Non-destructive: only inserts default venues when none exist.
export const maxDuration = 60;

export async function POST() {
  const created = await seedVenues(db);
  return NextResponse.json({ ok: true, created });
}
