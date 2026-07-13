import { CheckCircle2, PieChart } from "lucide-react";
import { cn } from "@/lib/cn";

export type MonthHabitData = {
  id: string;
  name: string;
  icon: string;
  color: string;
  /** 1-indexed day → done */
  doneDays: Set<number>;
  /** days scheduled AND already elapsed this month */
  scheduledElapsed: number;
  /** done days among scheduled+elapsed (numerator of the % stat) */
  doneOnScheduled: number;
  doneCount: number;
  /** weekday (0=Sun) of the 1st, converted to Monday-first offset */
  leadingBlanks: number;
  daysInMonth: number;
  todayDay: number;
  /** 1-indexed day → scheduled */
  scheduled: (d: number) => boolean;
};

/** 참고 앱 스타일의 월간 달성 그리드 카드 한 장 */
function HabitMonthCard({ habit }: { habit: MonthHabitData }) {
  const pct =
    habit.scheduledElapsed > 0
      ? Math.min(100, Math.round((habit.doneOnScheduled / habit.scheduledElapsed) * 100))
      : 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
      <p className="mb-3 truncate text-center text-xs font-bold text-slate-700">
        {habit.icon && <span className="mr-1">{habit.icon}</span>}
        {habit.name}
      </p>
      <div className="mx-auto grid max-w-56 grid-cols-7 gap-1">
        {Array.from({ length: habit.leadingBlanks }).map((_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: habit.daysInMonth }, (_, i) => i + 1).map((d) => {
          const done = habit.doneDays.has(d);
          const future = d > habit.todayDay;
          const isScheduled = habit.scheduled(d);
          return (
            <span
              key={d}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-[10px] font-semibold tabular-nums",
                done
                  ? "text-white/95"
                  : future || !isScheduled
                    ? "bg-slate-50 text-slate-300"
                    : "bg-slate-100 text-slate-400"
              )}
              style={done ? { backgroundColor: habit.color } : undefined}
              title={`${d}일${done ? " 완료" : ""}`}
            >
              {d}
            </span>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 border-t border-slate-50 pt-2.5 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1">
          <PieChart className="size-3.5 text-slate-300" /> {pct}%
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="size-3.5 text-slate-300" /> {habit.doneCount}
        </span>
      </div>
    </div>
  );
}

export function HabitMonthGrids({ habits }: { habits: MonthHabitData[] }) {
  if (habits.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {habits.map((h) => (
        <HabitMonthCard key={h.id} habit={h} />
      ))}
    </div>
  );
}
