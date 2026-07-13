"use server";

import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";
import type { PlanKind, Priority, RecurrenceFreq } from "@prisma/client";
import { db } from "@/lib/db";
import { str, strOrNull, dateOrNull, intOr, clampPct } from "@/lib/form";

const KINDS: PlanKind[] = ["TODO", "EVENT"];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const FREQS: RecurrenceFreq[] = ["NONE", "DAILY", "WEEKLY", "MONTHLY"];
const MAX_INSTANCES = 62;

function revalidatePlanner() {
  revalidatePath("/planner");
  revalidatePath("/");
}

function addByFreq(date: Date, freq: RecurrenceFreq): Date {
  const next = new Date(date);
  if (freq === "DAILY") next.setUTCDate(next.getUTCDate() + 1);
  else if (freq === "WEEKLY") next.setUTCDate(next.getUTCDate() + 7);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

export async function createPlanItem(fd: FormData) {
  const title = str(fd, "title");
  const date = dateOrNull(fd, "date");
  if (!title || !date) return;

  const kind = KINDS.includes(str(fd, "kind") as PlanKind)
    ? (str(fd, "kind") as PlanKind)
    : "TODO";
  const priority = PRIORITIES.includes(str(fd, "priority") as Priority)
    ? (str(fd, "priority") as Priority)
    : "MEDIUM";
  const recurrence = FREQS.includes(str(fd, "recurrence") as RecurrenceFreq)
    ? (str(fd, "recurrence") as RecurrenceFreq)
    : "NONE";
  const recurrenceUntil = dateOrNull(fd, "recurrenceUntil");
  const notes = strOrNull(fd, "notes");

  const base = { title, kind, priority, notes };

  if (recurrence !== "NONE" && recurrenceUntil && recurrenceUntil > date) {
    // Materialize the series as concrete instances sharing a seriesId.
    const seriesId = createId();
    const dates: Date[] = [];
    let cursor = new Date(date);
    while (cursor <= recurrenceUntil && dates.length < MAX_INSTANCES) {
      dates.push(new Date(cursor));
      cursor = addByFreq(cursor, recurrence);
    }
    await db.planItem.createMany({
      data: dates.map((d) => ({
        ...base,
        date: d,
        recurrence,
        recurrenceUntil,
        seriesId,
      })),
    });
  } else {
    await db.planItem.create({ data: { ...base, date } });
  }
  revalidatePlanner();
}

export async function updatePlanItem(id: string, fd: FormData) {
  const title = str(fd, "title");
  const date = dateOrNull(fd, "date");
  if (!title || !date) return;
  await db.planItem.update({
    where: { id },
    data: {
      title,
      date,
      kind: KINDS.includes(str(fd, "kind") as PlanKind)
        ? (str(fd, "kind") as PlanKind)
        : "TODO",
      priority: PRIORITIES.includes(str(fd, "priority") as Priority)
        ? (str(fd, "priority") as Priority)
        : "MEDIUM",
      progress: clampPct(intOr(fd, "progress", 0)),
      notes: strOrNull(fd, "notes"),
    },
  });
  revalidatePlanner();
}

export async function togglePlanDone(id: string, done: boolean) {
  await db.planItem.update({
    where: { id },
    data: { done, progress: done ? 100 : undefined },
  });
  revalidatePlanner();
}

export async function deletePlanItem(id: string) {
  await db.planItem.delete({ where: { id } });
  revalidatePlanner();
}

/** Delete every instance of a recurring series. */
export async function deletePlanSeries(seriesId: string) {
  await db.planItem.deleteMany({ where: { seriesId } });
  revalidatePlanner();
}
