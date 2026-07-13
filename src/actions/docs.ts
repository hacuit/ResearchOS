"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { str, strOrNull, dateOrNull, intOr, intOrNull, bool } from "@/lib/form";

function revalidateDocs() {
  revalidatePath("/docs");
  revalidatePath("/");
}

// ---------- Expenses ----------

export async function createExpense(fd: FormData) {
  const item = str(fd, "item");
  const date = dateOrNull(fd, "date");
  if (!item || !date) return;
  await db.expenseItem.create({
    data: {
      date,
      item,
      amount: intOr(fd, "amount", 0),
      category: strOrNull(fd, "category"),
      vendor: strOrNull(fd, "vendor"),
      note: strOrNull(fd, "note"),
      receiptFiled: bool(fd, "receiptFiled"),
    },
  });
  revalidateDocs();
}

export async function updateExpense(id: string, fd: FormData) {
  const item = str(fd, "item");
  const date = dateOrNull(fd, "date");
  if (!item || !date) return;
  await db.expenseItem.update({
    where: { id },
    data: {
      date,
      item,
      amount: intOr(fd, "amount", 0),
      category: strOrNull(fd, "category"),
      vendor: strOrNull(fd, "vendor"),
      note: strOrNull(fd, "note"),
      receiptFiled: bool(fd, "receiptFiled"),
    },
  });
  revalidateDocs();
}

export async function toggleReceipt(id: string, filed: boolean) {
  await db.expenseItem.update({ where: { id }, data: { receiptFiled: filed } });
  revalidateDocs();
}

export async function deleteExpense(id: string) {
  await db.expenseItem.delete({ where: { id } });
  revalidateDocs();
}

/**
 * Insert this month's instances of all active recurring expenses.
 * Idempotent: skips a recurring item if it already has an instance that month.
 */
export async function applyRecurring(year: number, month: number) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const [recurring, existing] = await Promise.all([
    db.recurringExpense.findMany({ where: { active: true } }),
    db.expenseItem.findMany({
      where: { date: { gte: monthStart, lt: monthEnd }, recurringId: { not: null } },
      select: { recurringId: true },
    }),
  ]);
  const existingIds = new Set(existing.map((e) => e.recurringId));

  const toCreate = recurring
    .filter((r) => !existingIds.has(r.id))
    .map((r) => ({
      date: new Date(Date.UTC(year, month - 1, Math.min(r.dayOfMonth, lastDay))),
      item: r.item,
      amount: r.amount,
      category: r.category,
      vendor: r.vendor,
      recurringId: r.id,
    }));

  if (toCreate.length > 0) {
    await db.expenseItem.createMany({ data: toCreate });
  }
  revalidateDocs();
  return toCreate.length;
}

export async function createRecurring(fd: FormData) {
  const item = str(fd, "item");
  if (!item) return;
  await db.recurringExpense.create({
    data: {
      item,
      amount: intOr(fd, "amount", 0),
      category: strOrNull(fd, "category"),
      vendor: strOrNull(fd, "vendor"),
      dayOfMonth: Math.max(1, Math.min(31, intOr(fd, "dayOfMonth", 1))),
    },
  });
  revalidateDocs();
}

export async function toggleRecurring(id: string, active: boolean) {
  await db.recurringExpense.update({ where: { id }, data: { active } });
  revalidateDocs();
}

export async function deleteRecurring(id: string) {
  await db.recurringExpense.delete({ where: { id } });
  revalidateDocs();
}

// ---------- Trip reports ----------

export async function createTrip(fd: FormData) {
  const title = str(fd, "title");
  const startDate = dateOrNull(fd, "startDate");
  const endDate = dateOrNull(fd, "endDate");
  if (!title || !startDate || !endDate) return;
  await db.tripReport.create({
    data: {
      title,
      destination: str(fd, "destination"),
      startDate,
      endDate,
      purpose: str(fd, "purpose"),
      outcomesMd: strOrNull(fd, "outcomesMd"),
      expenses: intOrNull(fd, "expenses"),
    },
  });
  revalidateDocs();
}

export async function updateTrip(id: string, fd: FormData) {
  const title = str(fd, "title");
  const startDate = dateOrNull(fd, "startDate");
  const endDate = dateOrNull(fd, "endDate");
  if (!title || !startDate || !endDate) return;
  await db.tripReport.update({
    where: { id },
    data: {
      title,
      destination: str(fd, "destination"),
      startDate,
      endDate,
      purpose: str(fd, "purpose"),
      outcomesMd: strOrNull(fd, "outcomesMd"),
      expenses: intOrNull(fd, "expenses"),
    },
  });
  revalidateDocs();
}

export async function deleteTrip(id: string) {
  await db.tripReport.delete({ where: { id } });
  revalidateDocs();
}

// ---------- Proposals ----------

const PROPOSAL_STATUSES = ["draft", "submitted", "accepted", "rejected"];

export async function createProposal(fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  const status = str(fd, "status");
  await db.proposalDoc.create({
    data: {
      title,
      agency: strOrNull(fd, "agency"),
      program: strOrNull(fd, "program"),
      deadline: dateOrNull(fd, "deadline"),
      budget: strOrNull(fd, "budget"),
      durationMonths: intOrNull(fd, "durationMonths"),
      abstractMd: strOrNull(fd, "abstractMd"),
      status: PROPOSAL_STATUSES.includes(status) ? status : "draft",
    },
  });
  revalidateDocs();
}

export async function updateProposal(id: string, fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  const status = str(fd, "status");
  await db.proposalDoc.update({
    where: { id },
    data: {
      title,
      agency: strOrNull(fd, "agency"),
      program: strOrNull(fd, "program"),
      deadline: dateOrNull(fd, "deadline"),
      budget: strOrNull(fd, "budget"),
      durationMonths: intOrNull(fd, "durationMonths"),
      abstractMd: strOrNull(fd, "abstractMd"),
      status: PROPOSAL_STATUSES.includes(status) ? status : "draft",
    },
  });
  revalidateDocs();
}

export async function deleteProposal(id: string) {
  await db.proposalDoc.delete({ where: { id } });
  revalidateDocs();
}
