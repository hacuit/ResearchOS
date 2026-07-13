import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { todayUtc, toDateInput } from "@/lib/dates";
import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/cn";
import {
  ExpenseSection,
  type ExpenseRow,
  type RecurringRow,
} from "./_components/expense-section";
import { TripSection, type TripData } from "./_components/trip-section";
import { ProposalSection, type ProposalData } from "./_components/proposal-section";

export const metadata = { title: "문서" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "expenses", label: "연구비 영수증" },
  { key: "trips", label: "출장 보고서" },
  { key: "proposals", label: "제안서" },
] as const;

export default async function DocsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string }>;
}) {
  const params = await searchParams;
  const tab = TABS.some((t) => t.key === params.tab) ? params.tab! : "expenses";
  const today = todayUtc();

  // month param: yyyy-MM
  const m = /^(\d{4})-(\d{2})$/.exec(params.month ?? "");
  const year = m ? Number(m[1]) : today.getUTCFullYear();
  const month = m ? Number(m[2]) : today.getUTCMonth() + 1;
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));
  const prevMonth = `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, "0")}`;
  const nextMonth = `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      {/* Sub-tab nav */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/docs?tab=${t.key}`}
              className={cn(
                "rounded-[10px] px-3.5 py-1.5 text-xs font-semibold transition",
                tab === t.key
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {tab === "expenses" && (
          <div className="flex items-center gap-1">
            <Link
              href={`/docs?tab=expenses&month=${prevMonth}`}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="이전 달"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <span className="min-w-20 text-center text-sm font-bold tabular-nums text-slate-700">
              {year}.{String(month).padStart(2, "0")}
            </span>
            <Link
              href={`/docs?tab=expenses&month=${nextMonth}`}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="다음 달"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        )}
      </div>

      {tab === "expenses" && (
        <ExpensesTab year={year} month={month} monthStart={monthStart} monthEnd={monthEnd} />
      )}
      {tab === "trips" && <TripsTab />}
      {tab === "proposals" && <ProposalsTab today={today} />}
    </div>
  );
}

async function ExpensesTab({
  year,
  month,
  monthStart,
  monthEnd,
}: {
  year: number;
  month: number;
  monthStart: Date;
  monthEnd: Date;
}) {
  const [expenses, recurring] = await Promise.all([
    db.expenseItem.findMany({
      where: { date: { gte: monthStart, lt: monthEnd } },
      orderBy: { date: "asc" },
    }),
    db.recurringExpense.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const rows: ExpenseRow[] = expenses.map((e) => ({
    id: e.id,
    date: toDateInput(e.date),
    item: e.item,
    amount: e.amount,
    category: e.category ?? "",
    vendor: e.vendor ?? "",
    note: e.note ?? "",
    receiptFiled: e.receiptFiled,
    isRecurring: !!e.recurringId,
  }));

  const recurringRows: RecurringRow[] = recurring.map((r) => ({
    id: r.id,
    item: r.item,
    amount: r.amount,
    category: r.category ?? "",
    vendor: r.vendor ?? "",
    dayOfMonth: r.dayOfMonth,
    active: r.active,
  }));

  return (
    <ExpenseSection
      expenses={rows}
      recurring={recurringRows}
      year={year}
      month={month}
      monthLabel={`${year}년 ${month}월`}
    />
  );
}

async function TripsTab() {
  const trips = await db.tripReport.findMany({ orderBy: { startDate: "desc" } });
  const data: TripData[] = trips.map((t) => ({
    id: t.id,
    title: t.title,
    destination: t.destination,
    startDate: toDateInput(t.startDate),
    endDate: toDateInput(t.endDate),
    purpose: t.purpose,
    outcomesMd: t.outcomesMd ?? "",
    outcomesHtml: t.outcomesMd ? renderMarkdown(t.outcomesMd) : "",
    expenses: t.expenses,
  }));
  return <TripSection trips={data} />;
}

async function ProposalsTab({ today }: { today: Date }) {
  const proposals = await db.proposalDoc.findMany({
    orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
  });
  const data: ProposalData[] = proposals.map((p) => ({
    id: p.id,
    title: p.title,
    agency: p.agency ?? "",
    program: p.program ?? "",
    deadline: toDateInput(p.deadline),
    dday: p.deadline
      ? Math.round((p.deadline.getTime() - today.getTime()) / 86400000)
      : null,
    budget: p.budget ?? "",
    durationMonths: p.durationMonths,
    abstractMd: p.abstractMd ?? "",
    abstractHtml: p.abstractMd ? renderMarkdown(p.abstractMd) : "",
    status: p.status,
  }));
  return <ProposalSection proposals={data} />;
}
