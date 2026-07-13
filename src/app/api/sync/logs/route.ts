import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashApiToken } from "@/lib/auth";
import { fromDateInput } from "@/lib/dates";

const reportSchema = z.object({
  fileName: z.string().min(1).max(300),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1).max(300),
  bodyMd: z.string().max(200_000),
  contentHash: z.string().max(128).optional(),
  projectId: z.string().max(64).optional(),
});

const bodySchema = z.object({
  reports: z.array(reportSchema).max(50),
});

export async function POST(req: NextRequest) {
  // Bearer token auth against hashed ApiToken records
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "missing token" }, { status: 401 });
  }
  const apiToken = await db.apiToken.findUnique({
    where: { tokenHash: hashApiToken(token) },
  });
  if (!apiToken) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = bodySchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", details: parsed.error.issues.slice(0, 5) },
      { status: 400 }
    );
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const report of parsed.data.reports) {
    const date = fromDateInput(report.date);
    if (!date) {
      errors.push(`${report.fileName}: invalid date`);
      continue;
    }
    try {
      const existing = await db.researchLog.findUnique({
        where: {
          source_sourceFile: { source: "sync", sourceFile: report.fileName },
        },
      });
      if (!existing) {
        await db.researchLog.create({
          data: {
            date,
            title: report.title,
            bodyMd: report.bodyMd,
            source: "sync",
            sourceFile: report.fileName,
            contentHash: report.contentHash ?? null,
            projectId: report.projectId ?? null,
          },
        });
        created++;
      } else if (
        report.contentHash &&
        existing.contentHash !== report.contentHash
      ) {
        await db.researchLog.update({
          where: { id: existing.id },
          data: {
            date,
            title: report.title,
            bodyMd: report.bodyMd,
            contentHash: report.contentHash,
          },
        });
        updated++;
      } else {
        skipped++;
      }
    } catch (e) {
      errors.push(`${report.fileName}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  await db.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() },
  });

  return NextResponse.json({ created, updated, skipped, errors });
}
