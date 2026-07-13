import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  // Session auth is enforced by middleware.
  const [
    projects, tasks, milestones, researchLogs, ideas, papers, libraryItems,
    planItems, conditionLogs, habits, habitLogs, expenseItems,
    recurringExpenses, tripReports, proposalDocs,
  ] = await Promise.all([
    db.project.findMany(),
    db.task.findMany(),
    db.milestone.findMany(),
    db.researchLog.findMany(),
    db.idea.findMany(),
    db.paper.findMany(),
    db.libraryItem.findMany(),
    db.planItem.findMany(),
    db.conditionLog.findMany(),
    db.habit.findMany(),
    db.habitLog.findMany(),
    db.expenseItem.findMany(),
    db.recurringExpense.findMany(),
    db.tripReport.findMany(),
    db.proposalDoc.findMany(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 2,
    data: {
      projects, tasks, milestones, researchLogs, ideas, papers, libraryItems,
      planItems, conditionLogs, habits, habitLogs, expenseItems,
      recurringExpenses, tripReports, proposalDocs,
    },
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="researchos-export-${payload.exportedAt.slice(0, 10)}.json"`,
    },
  });
}
