import { format } from "date-fns";
import { HeartPulse, Moon } from "lucide-react";
import { db } from "@/lib/db";
import { todayUtc, toDateInput } from "@/lib/dates";
import { Card, CardTitle } from "@/components/ui/card";
import { TrendLine } from "@/components/charts/trend-line";
import { ConditionEntry } from "./_components/condition-entry";
import { HabitTracker, type HabitRowData } from "./_components/habit-tracker";
import { HabitMonthGrids, type MonthHabitData } from "./_components/habit-month-grid";

export const metadata = { title: "루틴" };
export const dynamic = "force-dynamic";

const DEFAULT_COLOR = "#93c5fd";

function addDaysUtc(date: Date, offset: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

export default async function RoutinePage() {
  const today = todayUtc();
  const trendStart = addDaysUtc(today, -13);
  const weekStart = addDaysUtc(today, -6);
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  const [todayLog, trendLogs, habits, habitLogs] = await Promise.all([
    db.conditionLog.findUnique({ where: { date: today } }),
    db.conditionLog.findMany({
      where: { date: { gte: trendStart, lte: today } },
      orderBy: { date: "asc" },
    }),
    db.habit.findMany({ orderBy: { sortOrder: "asc" } }),
    db.habitLog.findMany({
      where: { date: { gte: addDaysUtc(monthStart, -60), lte: today } },
    }),
  ]);

  // ----- condition trend data (14 days) -----
  const logByDate = new Map(trendLogs.map((l) => [toDateInput(l.date), l]));
  const trendData = Array.from({ length: 14 }, (_, i) => {
    const d = addDaysUtc(trendStart, i);
    const key = toDateInput(d);
    const log = logByDate.get(key);
    return {
      label: format(d, "M.d"),
      기분: log?.mood ?? null,
      에너지: log?.energy ?? null,
      수면: log?.sleepHours ?? null,
    };
  });

  // ----- habit tracker data (last 7 days) -----
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDaysUtc(weekStart, i);
    return {
      date: toDateInput(d),
      dow: d.getUTCDay(),
      label: format(d, "M.d"),
      isToday: i === 6,
    };
  });

  const doneSet = new Set(
    habitLogs.filter((l) => l.done).map((l) => `${l.habitId}:${toDateInput(l.date)}`)
  );

  const habitRows: HabitRowData[] = habits.map((habit) => {
    // streak: consecutive scheduled days (from today backwards) completed
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = addDaysUtc(today, -i);
      const scheduled =
        habit.daysOfWeek.length === 0 || habit.daysOfWeek.includes(d.getUTCDay());
      if (!scheduled) continue;
      if (doneSet.has(`${habit.id}:${toDateInput(d)}`)) streak++;
      else if (i === 0) continue; // today not done yet doesn't break the streak
      else break;
    }
    return {
      id: habit.id,
      name: habit.name,
      icon: habit.icon ?? "",
      color: habit.color ?? DEFAULT_COLOR,
      daysOfWeek: habit.daysOfWeek,
      active: habit.active,
      streak,
      doneByDay: days.map((d) => doneSet.has(`${habit.id}:${d.date}`)),
    };
  });

  // ----- monthly achievement grids -----
  const daysInMonth = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const todayDay = today.getUTCDate();
  // Monday-first offset of the 1st
  const leadingBlanks = (monthStart.getUTCDay() + 6) % 7;

  const monthHabits: MonthHabitData[] = habits
    .filter((h) => h.active)
    .map((habit) => {
      const scheduled = (d: number) => {
        if (habit.daysOfWeek.length === 0) return true;
        const dow = new Date(
          Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), d)
        ).getUTCDay();
        return habit.daysOfWeek.includes(dow);
      };
      const doneDays = new Set<number>();
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${habit.id}:${toDateInput(
          new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), d))
        )}`;
        if (doneSet.has(key)) doneDays.add(d);
      }
      let scheduledElapsed = 0;
      let doneOnScheduled = 0;
      for (let d = 1; d <= todayDay; d++) {
        if (!scheduled(d)) continue;
        scheduledElapsed++;
        if (doneDays.has(d)) doneOnScheduled++;
      }
      return {
        id: habit.id,
        name: habit.name,
        icon: habit.icon ?? "",
        color: habit.color ?? DEFAULT_COLOR,
        doneDays,
        scheduledElapsed,
        doneOnScheduled,
        doneCount: doneDays.size,
        leadingBlanks,
        daysInMonth,
        todayDay,
        scheduled,
      };
    });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <HeartPulse className="size-4 text-red-400" /> 오늘 컨디션
            </span>
          </CardTitle>
          <ConditionEntry
            date={toDateInput(today)}
            initial={{
              mood: todayLog?.mood ?? null,
              energy: todayLog?.energy ?? null,
              sleepHours: todayLog?.sleepHours ?? null,
              sleepQuality: todayLog?.sleepQuality ?? null,
              note: todayLog?.note ?? "",
            }}
          />
        </Card>

        <Card className="lg:col-span-3">
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <Moon className="size-4 text-accent-500" /> 컨디션 추이 (14일)
            </span>
          </CardTitle>
          <TrendLine
            data={trendData}
            series={[
              { key: "기분", label: "기분", color: "#4f46e5" },
              { key: "에너지", label: "에너지", color: "#8b5cf6" },
              { key: "수면", label: "수면(h)", color: "#c4b5fd" },
            ]}
            height={240}
          />
        </Card>
      </div>

      <Card>
        <CardTitle>루틴 트래커</CardTitle>
        <HabitTracker habits={habitRows} days={days} />
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-bold text-slate-900">
          {format(today, "yyyy년 M월")} 달성 현황
        </h2>
        <HabitMonthGrids habits={monthHabits} />
      </div>
    </div>
  );
}
