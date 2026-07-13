import Link from "next/link";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ListTodo } from "lucide-react";
import { db } from "@/lib/db";
import { todayUtc, toDateInput, fromDateInput } from "@/lib/dates";
import { isOverdue } from "@/lib/progress";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PlanFormButton } from "./_components/plan-form";
import { PlanItemRow, type PlanRowData } from "./_components/plan-item-row";

export const metadata = { title: "플래너" };
export const dynamic = "force-dynamic";

const WEEK_OPTS = { weekStartsOn: 1 as const };

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const params = await searchParams;
  const today = todayUtc();
  const view = params.view === "month" ? "month" : "week";
  const anchor = fromDateInput(params.date ?? "") ?? today;

  const rangeStart =
    view === "month"
      ? startOfWeek(startOfMonth(anchor), WEEK_OPTS)
      : startOfWeek(anchor, WEEK_OPTS);
  const rangeEnd =
    view === "month"
      ? endOfWeek(endOfMonth(anchor), WEEK_OPTS)
      : endOfWeek(anchor, WEEK_OPTS);

  const items = await db.planItem.findMany({
    where: { date: { gte: rangeStart, lte: rangeEnd } },
    orderBy: [{ date: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
  });

  const byDay = new Map<string, typeof items>();
  for (const item of items) {
    const key = toDateInput(item.date);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(item);
  }

  const prev = toDateInput(view === "month" ? addMonths(anchor, -1) : addWeeks(anchor, -1));
  const next = toDateInput(view === "month" ? addMonths(anchor, 1) : addWeeks(anchor, 1));
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  const toRow = (item: (typeof items)[number]): PlanRowData => ({
    id: item.id,
    title: item.title,
    kind: item.kind,
    date: toDateInput(item.date),
    priority: item.priority,
    progress: item.progress,
    notes: item.notes ?? "",
    done: item.done,
    isEvent: item.kind === "EVENT",
    seriesId: item.seriesId ?? "",
    overdue: isOverdue(item.date, item.done || item.kind === "EVENT", today),
  });

  const title =
    view === "month"
      ? format(anchor, "yyyy년 M월", { locale: ko })
      : `${format(rangeStart, "M월 d일", { locale: ko })} - ${format(rangeEnd, "M월 d일", { locale: ko })}`;

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link
            href={`/planner?view=${view}&date=${prev}`}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="이전"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <span className="min-w-36 text-center text-sm font-bold text-slate-800">{title}</span>
          <Link
            href={`/planner?view=${view}&date=${next}`}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="다음"
          >
            <ChevronRight className="size-4" />
          </Link>
          <Link
            href={`/planner?view=${view}`}
            className="ml-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:border-primary-300 hover:text-primary-600"
          >
            오늘
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
            {(["week", "month"] as const).map((v) => (
              <Link
                key={v}
                href={`/planner?view=${v}&date=${toDateInput(anchor)}`}
                className={cn(
                  "rounded-[10px] px-3 py-1.5 text-xs font-semibold transition",
                  view === v
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {v === "week" ? "주간" : "월간"}
              </Link>
            ))}
          </div>
          <PlanFormButton defaultDate={toDateInput(today)} />
        </div>
      </div>

      {view === "month" ? (
        <Card className="p-3 sm:p-4">
          <div className="grid grid-cols-7 border-b border-slate-100 pb-2 text-center text-[11px] font-semibold text-slate-400">
            {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = toDateInput(day);
              const dayItems = byDay.get(key) ?? [];
              const isToday = isSameDay(day, today);
              const inMonth = isSameMonth(day, anchor);
              return (
                <Link
                  key={key}
                  href={`/planner?view=week&date=${key}`}
                  className={cn(
                    "min-h-20 border-b border-r border-slate-50 p-1 transition last:border-r-0 hover:bg-primary-50/40 sm:min-h-24 sm:p-1.5",
                    !inMonth && "bg-slate-50/50"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-5.5 items-center justify-center rounded-full text-[11px] font-semibold",
                      isToday
                        ? "bg-primary-600 text-white"
                        : inMonth
                          ? "text-slate-600"
                          : "text-slate-300"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayItems.slice(0, 3).map((item) => (
                      <p
                        key={item.id}
                        className={cn(
                          "truncate rounded px-1 py-px text-[10px] font-medium leading-4",
                          item.kind === "EVENT"
                            ? "bg-accent-100 text-accent-700"
                            : item.done
                              ? "bg-slate-100 text-slate-400 line-through"
                              : "bg-primary-50 text-primary-700"
                        )}
                      >
                        {item.title}
                      </p>
                    ))}
                    {dayItems.length > 3 && (
                      <p className="px-1 text-[10px] text-slate-400">+{dayItems.length - 3}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {days.map((day) => {
            const key = toDateInput(day);
            const dayItems = byDay.get(key) ?? [];
            const isToday = isSameDay(day, today);
            return (
              <div key={key}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-bold",
                      isToday ? "text-primary-600" : "text-slate-500"
                    )}
                  >
                    {format(day, "M월 d일 (EEE)", { locale: ko })}
                  </span>
                  {isToday && (
                    <span className="rounded-full bg-primary-600 px-1.5 py-px text-[10px] font-bold text-white">
                      오늘
                    </span>
                  )}
                  <span className="text-[11px] text-slate-300">{dayItems.length}개</span>
                </div>
                {dayItems.length > 0 ? (
                  <div className="space-y-1.5">
                    {dayItems.map((item) => (
                      <PlanItemRow key={item.id} item={toRow(item)} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-150 border-slate-200/70 px-3 py-2 text-xs text-slate-300">
                    일정 없음
                  </div>
                )}
              </div>
            );
          })}
          {items.length === 0 && (
            <EmptyState
              icon={ListTodo}
              title="이번 주 일정이 없습니다"
              description="새 항목을 추가해 주간 계획을 세워보세요."
            />
          )}
        </div>
      )}
    </div>
  );
}
