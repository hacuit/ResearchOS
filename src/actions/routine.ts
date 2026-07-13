"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { str, strOrNull, dateOrNull, intOrNull, floatOrNull } from "@/lib/form";
import { fromDateInput } from "@/lib/dates";

function revalidateRoutine() {
  revalidatePath("/routine");
  revalidatePath("/");
}

function scale(v: number | null): number | null {
  return v === null ? null : Math.max(1, Math.min(5, v));
}

export async function saveCondition(fd: FormData) {
  const date = dateOrNull(fd, "date");
  if (!date) return;
  const data = {
    mood: scale(intOrNull(fd, "mood")),
    energy: scale(intOrNull(fd, "energy")),
    sleepHours: floatOrNull(fd, "sleepHours"),
    sleepQuality: scale(intOrNull(fd, "sleepQuality")),
    note: strOrNull(fd, "note"),
  };
  await db.conditionLog.upsert({
    where: { date },
    create: { date, ...data },
    update: data,
  });
  revalidateRoutine();
}

export async function createHabit(fd: FormData) {
  const name = str(fd, "name");
  if (!name) return;
  const daysOfWeek = fd
    .getAll("daysOfWeek")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  const max = await db.habit.aggregate({ _max: { sortOrder: true } });
  await db.habit.create({
    data: { name, daysOfWeek, sortOrder: (max._max.sortOrder ?? 0) + 1 },
  });
  revalidateRoutine();
}

export async function updateHabit(id: string, fd: FormData) {
  const name = str(fd, "name");
  if (!name) return;
  const daysOfWeek = fd
    .getAll("daysOfWeek")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  await db.habit.update({
    where: { id },
    data: { name, daysOfWeek, active: fd.get("active") === "on" },
  });
  revalidateRoutine();
}

export async function deleteHabit(id: string) {
  await db.habit.delete({ where: { id } });
  revalidateRoutine();
}

export async function toggleHabitLog(habitId: string, dateStr: string, done: boolean) {
  const date = fromDateInput(dateStr);
  if (!date) return;
  if (done) {
    await db.habitLog.upsert({
      where: { habitId_date: { habitId, date } },
      create: { habitId, date, done: true },
      update: { done: true },
    });
  } else {
    await db.habitLog.deleteMany({ where: { habitId, date } });
  }
  revalidateRoutine();
}
